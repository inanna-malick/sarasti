#!/usr/bin/env python3
"""
Stage 4: Sample Trained Mappers into Lookup Tables.
Loads .pt checkpoints and exports .json direction tables for the TypeScript runtime.
Also computes the identity nullspace basis for shape deformation.
"""

import os
import json
import argparse
import numpy as np
import torch
import torch.nn as nn
from tqdm import tqdm

from common import (
    ASSETS_DIR, CHECKPOINTS_DIR, ALL_AXES, N_SHAPE, N_EXPR, ensure_dirs
)

# ─── MLP Architecture ───────────────────────────────────

class DirectionMapper(nn.Module):
    def __init__(self, output_dim=100):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(1, 256), nn.ReLU(),
            nn.Linear(256, 256), nn.ReLU(),
            nn.Linear(256, output_dim),
        )

    def forward(self, x):
        return self.net(x)

# ─── Sampling ──────────────────────────────────────────

def sample_mapper(axis_name, space, n_points=20):
    """Load checkpoint and sample points across the t-range."""
    ckpt_path = os.path.join(CHECKPOINTS_DIR, f"{axis_name}.pt")
    if not os.path.exists(ckpt_path):
        print(f"Warning: Checkpoint not found at {ckpt_path}")
        return None

    model = DirectionMapper(output_dim=100)
    model.load_state_dict(torch.load(ckpt_path, map_location='cpu'))
    model.eval()

    t_values = np.linspace(-3.0, 3.0, n_points)
    points = []

    with torch.no_grad():
        for t in t_values:
            t_tensor = torch.tensor([[t]], dtype=torch.float32)
            params = model(t_tensor).squeeze().numpy().tolist()
            points.append({
                "t": float(t),
                "params": params
            })

    return {
        "axis": axis_name,
        "space": space,
        "dims": 100,
        "points": points
    }

def compute_identity_basis(tables):
    """
    Compute 10 orthogonal basis vectors for the nullspace of {age, build}.
    Ensures that identity variations don't leak into semantic axes.
    """
    age_table = next((t for t in tables if t['axis'] == 'age'), None)
    build_table = next((t for t in tables if t['axis'] == 'build'), None)

    if not age_table or not build_table:
        print("Warning: Missing age or build tables. Cannot compute identity basis.")
        return None

    def get_direction(table):
        # Direction vector = params at t=1 - params at t=0
        # Find closest t to 1 and 0
        p1 = min(table['points'], key=lambda p: abs(p['t'] - 1.0))
        p0 = min(table['points'], key=lambda p: abs(p['t'] - 0.0))
        return np.array(p1['params']) - np.array(p0['params'])

    v_age = get_direction(age_table)
    v_build = get_direction(build_table)

    # Stack into 2x100 matrix
    A = np.stack([v_age, v_build])  # (2, 100)

    # SVD: A = U S V^T
    # The rows of V^T (columns of V) corresponding to zero singular values are the nullspace.
    # In practice, we take all vectors in V starting from index 2.
    _, _, Vh = np.linalg.svd(A, full_matrices=True)
    
    # Vh is (100, 100). The first 2 rows are the row space (approx).
    # The remaining 98 rows are the nullspace.
    nullspace = Vh[2:]  # (98, 100)
    
    # Pick first 10
    basis_vectors = nullspace[:10].tolist()

    return {
        "dims": 100,
        "n_basis": 10,
        "vectors": basis_vectors
    }

# ─── Main ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--n-points', type=int, default=20)
    args = parser.parse_args()

    ensure_dirs()
    print(f"Sampling mappers to {ASSETS_DIR}...")

    all_tables = []
    for axis, space, _, _ in tqdm(ALL_AXES, desc="Sampling axes"):
        table = sample_mapper(axis, space, args.n_points)
        if table:
            output_path = os.path.join(ASSETS_DIR, f"{axis}.json")
            with open(output_path, 'w') as f:
                json.dump(table, f, indent=2)
            all_tables.append(table)

    # Identity basis
    basis = compute_identity_basis(all_tables)
    if basis:
        basis_path = os.path.join(ASSETS_DIR, "identity_basis.json")
        with open(basis_path, 'w') as f:
            json.dump(basis, f, indent=2)
        print(f"Saved identity basis to {basis_path}")

if __name__ == "__main__":
    main()
