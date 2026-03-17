import os
import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset, random_split
from tqdm import tqdm

# Import shared constants and utilities
from common import (
    PARAMS_FILE, 
    SCORES_FILE, 
    CHECKPOINTS_DIR, 
    ALL_AXES, 
    ensure_dirs
)

class DirectionMapper(nn.Module):
    """
    Small MLP that maps a scalar semantic score to a 100-dim FLAME parameter vector.
    Architecture: Linear(1, 256) → ReLU → Linear(256, 256) → ReLU → Linear(256, 100)
    """
    def __init__(self, input_dim=1, hidden_dim=256, output_dim=100):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )
    
    def forward(self, x):
        return self.net(x)

def get_principal_directions(scores, params):
    """
    Compute the principal direction for each axis in the parameter space.
    direction_i = pinv(scores[:, i:i+1]) @ params  (1 × 100 vector)
    """
    # scores: (N, 4), params: (N, 100)
    directions = []
    for i in range(4):
        x = scores[:, i:i+1] # (N, 1)
        # pinv(x) for (N, 1) is (x.T @ x)^-1 @ x.T
        denom = np.sum(x**2)
        if denom < 1e-8:
            w = np.zeros((1, 100))
        else:
            w = (x.T @ params) / denom # (1, 100)
        directions.append(w)
    return np.concatenate(directions, axis=0) # (4, 100)

def train_axis(axis_idx, axis_name, scores_np, params_np, all_directions, args, device):
    """
    Train a single mapper for one semantic axis.
    """
    x = scores_np[:, axis_idx:axis_idx+1]
    y = params_np
    
    # Dataset setup
    dataset = TensorDataset(torch.from_numpy(x).float(), torch.from_numpy(y).float())
    
    # 80/20 train/val split (deterministic seed=42)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(
        dataset, [train_size, val_size], 
        generator=torch.Generator().manual_seed(42)
    )
    
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)
    
    # Identify indices and directions for disentanglement penalty
    other_indices = [i for i in range(4) if i != axis_idx]
    other_axes_names = [ALL_AXES[i][0] for i in other_indices]
    other_directions = torch.from_numpy(all_directions[other_indices]).float().to(device) # (3, 100)
    
    model = DirectionMapper().to(device)
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    criterion = nn.MSELoss()
    
    best_val_loss = float('inf')
    patience_counter = 0
    
    print(f"\n>>> Training mapper for axis: {axis_name} ({axis_idx})")
    
    pbar = tqdm(range(args.epochs), desc=axis_name)
    for epoch in pbar:
        # λ schedule: start at 0.1, increase to 1.0 over first 200 epochs
        if epoch < 200:
            lmbda = 0.1 + (1.0 - 0.1) * (epoch / 200)
        else:
            lmbda = 1.0
            
        model.train()
        train_recon_total = 0
        train_disent_total = 0
        train_disent_axes_total = torch.zeros(3).to(device)
        
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            
            optimizer.zero_grad()
            pred = model(batch_x)
            
            # L2 reconstruction loss
            recon_loss = criterion(pred, batch_y)
            
            # Disentanglement penalty: ||predicted_params @ other_directions.T||²
            # proj: (B, 3)
            proj = pred @ other_directions.T
            disent_axes = torch.mean(proj**2, dim=0) # (3,)
            disent_loss = torch.sum(disent_axes)
            
            loss = recon_loss + lmbda * disent_loss
            loss.backward()
            optimizer.step()
            
            train_recon_total += recon_loss.item() * batch_x.size(0)
            train_disent_total += disent_loss.item() * batch_x.size(0)
            train_disent_axes_total += disent_axes * batch_x.size(0)
            
        train_recon_avg = train_recon_total / len(train_dataset)
        train_disent_avg = train_disent_total / len(train_dataset)
        train_disent_axes_avg = train_disent_axes_total / len(train_dataset)
        train_total_avg = train_recon_avg + lmbda * train_disent_avg
        
        # Validation
        model.eval()
        val_recon_total = 0
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                pred = model(batch_x)
                recon_loss = criterion(pred, batch_y)
                val_recon_total += recon_loss.item() * batch_x.size(0)
        val_recon_avg = val_recon_total / len(val_dataset)
        
        pbar.set_postfix({
            'val_L2': f"{val_recon_avg:.6f}",
            'disent': f"{train_disent_avg:.6f}"
        })
        
        # Log to stdout as requested every 10 epochs or on early stopping/start/end
        # To avoid flooding stdout too much, we could print every epoch but the user asked for a log to stdout.
        # Tqdm post-fixes are good for interactive, but let's follow the requirement.
        disent_log = ", ".join([f"{name}={train_disent_axes_avg[i]:.6f}" for i, name in enumerate(other_axes_names)])
        if epoch % 10 == 0 or epoch == args.epochs - 1:
            print(f"Epoch {epoch}: train_loss={train_total_avg:.6f}, val_loss={val_recon_avg:.6f}, disent_loss=[{disent_log}]")

        # Early stopping on validation loss
        if val_recon_avg < best_val_loss:
            best_val_loss = val_recon_avg
            patience_counter = 0
            # Save checkpoint
            save_path = os.path.join(CHECKPOINTS_DIR, f"{axis_name}.pt")
            torch.save(model.state_dict(), save_path)
        else:
            patience_counter += 1
            if patience_counter >= 50:
                print(f"Early stopping at epoch {epoch} for {axis_name}")
                break

    return model

def main():
    parser = argparse.ArgumentParser(description="Train semantic mappers from CLIP scores to FLAME parameters.")
    parser.add_argument("--epochs", type=int, default=500, help="Number of epochs to train.")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate.")
    parser.add_argument("--batch-size", type=int, default=256, help="Batch size.")
    args = parser.parse_args()

    ensure_dirs()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load data
    if not os.path.exists(PARAMS_FILE) or not os.path.exists(SCORES_FILE):
        print(f"Error: Required data files not found ({PARAMS_FILE}, {SCORES_FILE}). Ensure stage 1 & 2 are complete.")
        return

    params_data = np.load(PARAMS_FILE)
    scores_data = np.load(SCORES_FILE)
    
    # beta: (10000, 100), psi: (10000, 100)
    beta = params_data['beta']
    psi = params_data['psi']
    # scores: (10000, 4) - age, build, valence, aperture
    scores = scores_data['scores']

    # Pre-compute principal directions in both beta and psi spaces for disentanglement
    beta_directions = get_principal_directions(scores, beta)
    psi_directions = get_principal_directions(scores, psi)

    # Train each axis
    for i, (axis_name, space, pos, neg) in enumerate(ALL_AXES):
        # Determine target parameter space
        if space == 'shape':
            target_params = beta
            target_directions = beta_directions
        else:
            target_params = psi
            target_directions = psi_directions
            
        train_axis(i, axis_name, scores, target_params, target_directions, args, device)

    print("\nTraining complete. All mappers saved to", CHECKPOINTS_DIR)

if __name__ == "__main__":
    main()
