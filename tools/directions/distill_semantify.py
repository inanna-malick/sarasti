#!/usr/bin/env python3
"""
Distill Semantify pretrained mappers into semantic direction LUTs.

For each of our 4 axes (age, build, valence, aperture):
  1. Encode multiple keyframe prompts (5-7 per axis) with CLIP ViT-B/32
  2. At 20 points t=linspace(-3, 3, 20):
     - Find bracketing keyframes, lerp their descriptor sims
     - Amplify relative to midpoint (gain targets ±0.3 swing at t=±3)
     - Forward through Semantify C2M mapper → 10 FLAME params
     - Pad to 100 dims
  3. Save as JSON lookup table

Multi-keyframe prompts with hyperbolic extremes give the Semantify mapper
richer nonlinear coverage across each axis, pushing into parameter ranges
that realistic-face training never touches.

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
# Multi-keyframe prompts with hyperbolic extremes.
# Each axis has (t_score, prompt) keyframes independently CLIP-encoded,
# giving the Semantify mapper richer nonlinear coverage.

AXES = {
    'age': {
        'space': 'shape',
        'mapper': 'flame_shape',
        'prompts': [
            (-3.0, "a strikingly young baby-smooth face with plump cheeks"),
            (-1.5, "a youthful face in their twenties, smooth skin, soft jaw"),
            ( 0.0, "a middle-aged face, some lines around eyes and mouth"),
            ( 1.5, "a face showing clear signs of aging, wrinkles, sagging skin"),
            ( 3.0, "a deeply weathered elderly face with heavy wrinkles and sunken eyes"),
        ],
    },
    'build': {
        'space': 'shape',
        'mapper': 'flame_shape',
        'prompts': [
            (-3.0, "an extremely gaunt hollow-cheeked emaciated face with sharp bones showing"),
            (-1.5, "a thin face with visible cheekbones and lean jaw"),
            ( 0.0, "an average face, neither thin nor heavy"),
            ( 1.5, "a full round face with soft cheeks and wide jaw"),
            ( 3.0, "an extremely heavy round fleshy face with full puffy cheeks and double chin"),
        ],
    },
    'valence': {
        'space': 'expression',
        'mapper': 'flame_expression',
        'prompts': [
            (-3.0, "the most distressed terrified horrified face imaginable — absolute panic, every muscle screaming"),
            (-2.0, "a face contorted in fear and anguish, brow deeply furrowed, teeth clenched in dread"),
            (-1.0, "a face showing clear worry and unease, slight frown, tense jaw"),
            ( 0.0, "a perfectly neutral expressionless face"),
            ( 1.0, "a face showing mild contentment, hint of a warm smile"),
            ( 2.0, "a face beaming with genuine happiness, broad relaxed smile, bright eyes"),
            ( 3.0, "a face flooded with pure overwhelming relief and ecstatic joy, every muscle released in bliss"),
        ],
    },
    'aperture': {
        'space': 'expression',
        'mapper': 'flame_expression',
        'prompts': [
            (-3.0, "mouth pressed as tightly shut as humanly possible, jaw locked, eyes narrowed to slits in grim furious determination"),
            (-2.0, "a face with eyes squeezed shut and jaw clenched hard in pain"),
            (-1.0, "a face with slightly narrowed eyes and closed mouth, tense but controlled"),
            ( 0.0, "a relaxed neutral face, mouth gently closed, eyes at rest"),
            ( 1.0, "a face with eyes slightly widened and lips parted in mild surprise"),
            ( 2.0, "a face with eyes wide open and mouth dropped open in shock"),
            ( 3.0, "mouth hanging as wide open as possible in total speechless shock, eyes stretched to the absolute limit"),
        ],
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
    Distill one semantic axis into a LUT using multi-keyframe interpolation.

    Strategy:
    1. Encode ALL keyframe prompts independently with CLIP
    2. Compute descriptor sims for each keyframe → array of sim vectors keyed by t
    3. For each LUT t-value: find bracketing keyframes, lerp their sim vectors
    4. Amplify relative to midpoint, forward through Semantify mapper
    """
    mapper_name = axis_cfg['mapper']
    mapper = mappers[mapper_name]
    desc_feats = desc_features[mapper_name]  # (N_desc, clip_dim)
    keyframes = axis_cfg['prompts']  # list of (t_score, prompt)

    # Encode all keyframe prompts and compute their descriptor sims
    kf_t_values = []
    kf_sims = []
    for t_score, prompt in keyframes:
        tok = clip.tokenize([prompt]).to(device)
        with torch.no_grad():
            emb = clip_model.encode_text(tok).float()
            emb = emb / emb.norm(dim=-1, keepdim=True)
        sim = (emb @ desc_feats.T).squeeze()  # (N_desc,)
        kf_t_values.append(t_score)
        kf_sims.append(sim)
        print(f"  kf t={t_score:+.1f}: sims=[{', '.join(f'{v:.4f}' for v in sim.cpu().numpy())}]")

    # Find midpoint sim (t=0 keyframe or interpolated)
    sim_mid = None
    for i, t in enumerate(kf_t_values):
        if abs(t) < 1e-6:
            sim_mid = kf_sims[i]
            break
    if sim_mid is None:
        # Interpolate to t=0 between bracketing keyframes
        for i in range(len(kf_t_values) - 1):
            if kf_t_values[i] <= 0 <= kf_t_values[i + 1]:
                alpha = (0 - kf_t_values[i]) / (kf_t_values[i + 1] - kf_t_values[i])
                sim_mid = (1 - alpha) * kf_sims[i] + alpha * kf_sims[i + 1]
                break
        if sim_mid is None:
            sim_mid = kf_sims[len(kf_sims) // 2]

    # Compute max excursion across all keyframes relative to midpoint
    max_excursion = 0.0
    for sim in kf_sims:
        excursion = (sim - sim_mid).abs().max().item()
        max_excursion = max(max_excursion, excursion)

    # Gain: target ±0.3 swing at the extremes
    if max_excursion > 1e-6:
        gain = 0.3 / max_excursion
    else:
        gain = 1.0

    print(f"  max_excursion: {max_excursion:.4f}, gain: {gain:.1f}x")

    t_values = np.linspace(-3.0, 3.0, n_points)
    points = []

    for t in t_values:
        # Find bracketing keyframes
        if t <= kf_t_values[0]:
            raw_sims = kf_sims[0]
        elif t >= kf_t_values[-1]:
            raw_sims = kf_sims[-1]
        else:
            for i in range(len(kf_t_values) - 1):
                if kf_t_values[i] <= t <= kf_t_values[i + 1]:
                    alpha = (t - kf_t_values[i]) / (kf_t_values[i + 1] - kf_t_values[i])
                    raw_sims = (1 - alpha) * kf_sims[i] + alpha * kf_sims[i + 1]
                    break

        # Apply gain amplification relative to midpoint
        sims = sim_mid + gain * (raw_sims - sim_mid)
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
        print(f"  {len(axis_cfg['prompts'])} keyframe prompts")
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
