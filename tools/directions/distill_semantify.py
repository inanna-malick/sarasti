#!/usr/bin/env python3
"""
Distill Semantify pretrained mappers into semantic direction LUTs.

For each of our 4 axes (age, build, valence, aperture):
  1. Encode positive/negative text prompts with CLIP ViT-B/32
  2. At 20 points t=linspace(-3, 3, 20):
     - Interpolate CLIP embedding: lerp(neg_emb, pos_emb, (t+3)/6)
     - Compute cosine similarity against Semantify's descriptor vocabulary
     - Forward through Semantify C2M mapper → 10 FLAME params
     - Pad to 100 dims
  3. Save as JSON lookup table

Also computes identity offset basis (nullspace of shape direction matrix).

Requires: torch, clip, numpy
Semantify repo at: /home/inanna/dev/Semantify
"""

import os
import sys
import json
import numpy as np
import torch
import torch.nn as nn
import clip

# ─── Paths ─────────────────────────────────────────────

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SEMANTIFY_ROOT = '/home/inanna/dev/Semantify'
ASSETS_DIR = os.path.join(REPO_ROOT, 'assets', 'directions')

# ─── Semantify C2M Architecture ───────────────────────
# Reproduced from semantify/train/mapper_module.py to avoid
# importing the full Semantify package with all its deps.

class C2M(nn.Module):
    def __init__(self, num_stats, hidden_size, out_features, num_hiddens=0):
        super().__init__()
        if isinstance(hidden_size, int):
            hidden_size = [hidden_size]
        layers = []
        layers.extend([nn.Linear(num_stats, hidden_size[0]), nn.ReLU()])
        if num_hiddens > 0:
            for i in range(num_hiddens):
                layers.extend([nn.Linear(hidden_size[i], hidden_size[i + 1]), nn.ReLU()])
        self.fc_layers = nn.Sequential(*layers)
        self.out_layer = nn.Linear(hidden_size[-1], out_features)

    def forward(self, x):
        return self.out_layer(self.fc_layers(x))


# ─── Axis Definitions ─────────────────────────────────
# Caricatured prompts — vivid, medium-probability descriptors
# that give CLIP strong signal for fine features.

AXES = {
    'age': {
        'space': 'shape',
        'mapper': 'flame_shape',
        'negative': "a strikingly young baby-smooth face with plump cheeks",
        'positive': "a deeply weathered elderly face with heavy wrinkles and sunken eyes",
    },
    'build': {
        'space': 'shape',
        'mapper': 'flame_shape',
        'negative': "an extremely gaunt hollow-cheeked emaciated face with sharp bones showing",
        'positive': "an extremely heavy round fleshy face with full puffy cheeks and double chin",
    },
    'valence': {
        'space': 'expression',
        'mapper': 'flame_expression',
        'negative': "a face twisted in anguish and distress with furrowed brow and grimace",
        'positive': "a face beaming with genuine relief and happiness with relaxed warm smile",
    },
    'aperture': {
        'space': 'expression',
        'mapper': 'flame_expression',
        'negative': "a face with eyes squeezed tightly shut and jaw clenched hard in pain",
        'positive': "a face with eyes blown wide open and jaw dropped in stunned shock",
    },
}

# Semantify descriptor vocabularies (from their trained mappers)
SHAPE_DESCRIPTORS = ["fat", "long neck", "ears sticking-out", "big forehead", "small chin"]
EXPR_DESCRIPTORS = ["smiling", "open mouth", "serious"]

# Semantify checkpoint paths
CKPT_PATHS = {
    'flame_shape': os.path.join(SEMANTIFY_ROOT, 'semantify/models_ckpts/flame/shape/flame_shape.ckpt'),
    'flame_expression': os.path.join(SEMANTIFY_ROOT, 'semantify/models_ckpts/flame/expression/flame_expression.ckpt'),
}

# ─── Loader ───────────────────────────────────────────

def load_semantify_mapper(ckpt_path):
    """Load a Semantify C2M mapper from a PL checkpoint."""
    ckpt = torch.load(ckpt_path, map_location='cpu', weights_only=False)
    hp = ckpt['hyper_parameters']

    model = C2M(
        num_stats=hp['num_stats'],
        hidden_size=hp['hidden_size'],
        out_features=hp['out_features'],
        num_hiddens=hp['num_hiddens'],
    )

    # PL state_dict has 'model.' prefix
    state = {}
    for k, v in ckpt['state_dict'].items():
        if k.startswith('model.'):
            state[k[len('model.'):]] = v
        else:
            state[k] = v
    model.load_state_dict(state)
    model.eval()
    return model


def encode_descriptors(descriptors, clip_model, device):
    """Encode a list of text descriptors with CLIP, return (N, D) normalized features."""
    # Semantify uses "a person with {descriptor}" template for face descriptors
    prompts = [f"a person with {d}" for d in descriptors]
    tokens = clip.tokenize(prompts).to(device)
    with torch.no_grad():
        feats = clip_model.encode_text(tokens)
        feats = feats / feats.norm(dim=-1, keepdim=True)
    return feats.float()


def distill_axis(axis_name, axis_cfg, clip_model, clip_preprocess, mappers, desc_features, device, n_points=20):
    """
    Distill one semantic axis into a LUT.

    Strategy: work in descriptor-similarity space with amplification.
    CLIP text-text cosine sims live in a narrow range (~0.72-0.90), so
    the raw delta between pos/neg prompts is only ~0.05. The Semantify
    mapper was trained on image-descriptor sims with much wider range.
    We amplify the delta direction in sim-space so the mapper sees
    meaningful input variation across our t-range.
    """
    mapper_name = axis_cfg['mapper']
    mapper = mappers[mapper_name]
    desc_feats = desc_features[mapper_name]  # (N_desc, clip_dim)

    # Encode positive and negative prompts
    neg_tok = clip.tokenize([axis_cfg['negative']]).to(device)
    pos_tok = clip.tokenize([axis_cfg['positive']]).to(device)
    with torch.no_grad():
        neg_emb = clip_model.encode_text(neg_tok).float()
        neg_emb = neg_emb / neg_emb.norm(dim=-1, keepdim=True)
        pos_emb = clip_model.encode_text(pos_tok).float()
        pos_emb = pos_emb / pos_emb.norm(dim=-1, keepdim=True)

    # Compute descriptor similarities at the two poles
    sim_neg = (neg_emb @ desc_feats.T).squeeze()  # (N_desc,)
    sim_pos = (pos_emb @ desc_feats.T).squeeze()  # (N_desc,)
    sim_mid = (sim_neg + sim_pos) / 2.0
    sim_delta = sim_pos - sim_neg  # direction in sim-space

    # Amplification: scale delta so that t=±3 produces ~±0.3 swing
    # (Semantify was trained on sims that vary by ~0.3-0.5 across faces)
    raw_range = sim_delta.abs().max().item()
    if raw_range > 1e-6:
        gain = 0.3 / raw_range  # target ±0.3 at t=±3
    else:
        gain = 1.0

    print(f"  sim_delta: [{', '.join(f'{v:+.4f}' for v in sim_delta.cpu().numpy())}]")
    print(f"  raw_range: {raw_range:.4f}, gain: {gain:.1f}x")

    t_values = np.linspace(-3.0, 3.0, n_points)
    points = []

    for t in t_values:
        # Sweep in sim-space: midpoint + t/3 * gain * delta
        # t/3 normalizes so t=±3 maps to ±1 * gain * delta
        sims = sim_mid + (t / 3.0) * gain * sim_delta
        sims = sims.unsqueeze(0)  # (1, N_desc)

        # Forward through Semantify mapper
        with torch.no_grad():
            params_10 = mapper(sims).squeeze()  # (10,)

        # Pad to 100 dims
        params_100 = np.zeros(100, dtype=np.float32)
        params_100[:10] = params_10.cpu().numpy()

        points.append({
            "t": float(t),
            "params": params_100.tolist(),
        })

    return {
        "axis": axis_name,
        "space": axis_cfg['space'],
        "dims": 100,
        "points": points,
    }


def slerp(v0, v1, alpha):
    """Spherical linear interpolation between two unit vectors."""
    dot = torch.clamp(torch.dot(v0, v1), -1.0, 1.0)
    omega = torch.acos(dot)
    if omega.abs() < 1e-6:
        return (1 - alpha) * v0 + alpha * v1
    sin_omega = torch.sin(omega)
    return (torch.sin((1 - alpha) * omega) / sin_omega) * v0 + (torch.sin(alpha * omega) / sin_omega) * v1


def compute_identity_basis(tables):
    """
    Compute 10 orthonormal basis vectors in the nullspace of {age, build} directions.
    These let us vary face identity without leaking into semantic axes.
    """
    age_table = next((t for t in tables if t['axis'] == 'age'), None)
    build_table = next((t for t in tables if t['axis'] == 'build'), None)

    if not age_table or not build_table:
        print("Warning: Missing age or build tables for identity basis.")
        return None

    def get_direction(table):
        p_pos = min(table['points'], key=lambda p: abs(p['t'] - 1.5))
        p_neg = min(table['points'], key=lambda p: abs(p['t'] - (-1.5)))
        return np.array(p_pos['params']) - np.array(p_neg['params'])

    v_age = get_direction(age_table)
    v_build = get_direction(build_table)

    A = np.stack([v_age, v_build])  # (2, 100)
    _, _, Vh = np.linalg.svd(A, full_matrices=True)
    nullspace = Vh[2:]  # (98, 100)

    # Pick first 10 nullspace vectors (highest residual variance)
    basis_vectors = nullspace[:10].tolist()

    return {
        "dims": 100,
        "n_basis": 10,
        "vectors": basis_vectors,
    }


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    os.makedirs(ASSETS_DIR, exist_ok=True)

    # Load CLIP
    print("Loading CLIP ViT-B/32...")
    clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)

    # Load Semantify mappers
    print("Loading Semantify mappers...")
    mappers = {}
    for name, path in CKPT_PATHS.items():
        mappers[name] = load_semantify_mapper(path).to(device)
        print(f"  {name}: loaded from {path}")

    # Encode descriptor vocabularies
    print("Encoding descriptor vocabularies...")
    desc_features = {
        'flame_shape': encode_descriptors(SHAPE_DESCRIPTORS, clip_model, device),
        'flame_expression': encode_descriptors(EXPR_DESCRIPTORS, clip_model, device),
    }

    # Distill each axis
    all_tables = []
    for axis_name, axis_cfg in AXES.items():
        print(f"\nDistilling axis: {axis_name} ({axis_cfg['space']})")
        print(f"  neg: {axis_cfg['negative']}")
        print(f"  pos: {axis_cfg['positive']}")
        table = distill_axis(
            axis_name, axis_cfg, clip_model, clip_preprocess,
            mappers, desc_features, device
        )
        all_tables.append(table)

        # Save
        out_path = os.path.join(ASSETS_DIR, f"{axis_name}.json")
        with open(out_path, 'w') as f:
            json.dump(table, f, indent=2)
        print(f"  → {out_path}")

        # Print summary: param magnitudes at extremes
        p_neg = table['points'][0]['params'][:10]
        p_pos = table['points'][-1]['params'][:10]
        print(f"  t=-3 first 10: [{', '.join(f'{v:+.3f}' for v in p_neg)}]")
        print(f"  t=+3 first 10: [{', '.join(f'{v:+.3f}' for v in p_pos)}]")

    # Identity basis
    print("\nComputing identity basis...")
    basis = compute_identity_basis(all_tables)
    if basis:
        basis_path = os.path.join(ASSETS_DIR, "identity_basis.json")
        with open(basis_path, 'w') as f:
            json.dump(basis, f, indent=2)
        print(f"  → {basis_path}")

    print("\nDone. Semantify distillation complete.")


if __name__ == "__main__":
    main()
