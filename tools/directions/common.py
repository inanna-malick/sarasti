"""
Shared utilities for the semantic directions pipeline.

All pipeline stages share:
- FLAME model loading (from the zip or extracted binaries)
- Path conventions
- CLIP descriptor definitions
"""

import os
import sys
import pickle
import types
import zipfile
import numpy as np

# ─── Paths ─────────────────────────────────────────────

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FLAME_ZIP = os.path.join(REPO_ROOT, 'FLAME2023Open.zip')
ASSETS_DIR = os.path.join(REPO_ROOT, 'assets', 'directions')
DATA_DIR = os.path.join(REPO_ROOT, 'tools', 'directions', 'data')

# Pipeline intermediate outputs
RENDERS_DIR = os.path.join(DATA_DIR, 'renders')
PARAMS_FILE = os.path.join(DATA_DIR, 'params.npz')
SCORES_FILE = os.path.join(DATA_DIR, 'scores.npz')
CHECKPOINTS_DIR = os.path.join(DATA_DIR, 'checkpoints')

# ─── FLAME Constants ───────────────────────────────────

N_SHAPE = 100
N_EXPR = 100
N_TOTAL_SHAPE = 300  # FLAME 2023 packs 300 shape + 100 expr into shapedirs
SIGMA_CLAMP = 3.0

# ─── CLIP Descriptors ─────────────────────────────────

DESCRIPTORS = {
    'shape': {
        'age': (
            "a very young smooth face",
            "a very old weathered face",
        ),
        'build': (
            "a very thin gaunt emaciated face",
            "a very heavy full fleshy face",
        ),
    },
    'expression': {
        'valence': (
            "a face showing anguish and distress",
            "a face showing relief and calm happiness",
        ),
        'aperture': (
            "a face with eyes squeezed shut and jaw clamped tight in pain",
            "a face with eyes wide open and jaw dropped in shock",
        ),
    },
}

# Flat list for iteration: [(axis_name, space, positive_text, negative_text), ...]
ALL_AXES = []
for space, axes in DESCRIPTORS.items():
    for axis, (neg, pos) in axes.items():
        ALL_AXES.append((axis, space, pos, neg))

# ─── FLAME Loader ──────────────────────────────────────

def load_flame_model():
    """
    Load FLAME 2023 Open model from zip file.
    Returns dict with keys: v_template, shapedirs, faces
    shapedirs shape: (N_VERTICES, 3, 400) — first 300 = shape, last 100 = expression
    """
    # Mock chumpy for pickle compatibility
    chumpy = types.ModuleType('chumpy')
    chumpy.array = lambda x, *a, **k: np.array(x)
    class _Ch:
        def __init__(self, *a, **k): pass
    chumpy.Ch = _Ch
    sys.modules['chumpy'] = chumpy
    sys.modules['chumpy.ch'] = chumpy

    # Find the pkl inside the zip
    with zipfile.ZipFile(FLAME_ZIP, 'r') as zf:
        pkl_names = [n for n in zf.namelist() if n.endswith('.pkl')]
        if not pkl_names:
            raise RuntimeError(f"No .pkl found in {FLAME_ZIP}")
        with zf.open(pkl_names[0]) as f:
            model = pickle.load(f, encoding='latin1')

    v_template = np.array(model['v_template'], dtype=np.float32)  # (N_VERTS, 3)
    shapedirs_raw = np.array(model['shapedirs'], dtype=np.float32)  # (N_VERTS, 3, 400)
    faces = np.array(model['f'], dtype=np.int32)  # (N_FACES, 3)

    # Split into shape and expression directions
    shape_dirs = shapedirs_raw[:, :, :N_TOTAL_SHAPE]  # (V, 3, 300) — take first 100
    expr_dirs = shapedirs_raw[:, :, N_TOTAL_SHAPE:]    # (V, 3, 100)

    # Truncate shape to N_SHAPE
    shape_dirs = shape_dirs[:, :, :N_SHAPE]  # (V, 3, 100)

    return {
        'v_template': v_template,
        'shapedirs': shape_dirs,      # (V, 3, 100)
        'exprdirs': expr_dirs,         # (V, 3, 100)
        'faces': faces,
    }


def deform_flame(model, beta=None, psi=None):
    """
    Apply FLAME deformation: V = template + shapedirs @ beta + exprdirs @ psi
    Returns vertices array (N_VERTS, 3).
    """
    v = model['v_template'].copy()

    if beta is not None:
        # shapedirs: (V, 3, N_SHAPE), beta: (N_SHAPE,)
        v += np.einsum('vdc,c->vd', model['shapedirs'], beta)

    if psi is not None:
        # exprdirs: (V, 3, N_EXPR), psi: (N_EXPR,)
        v += np.einsum('vdc,c->vd', model['exprdirs'], psi)

    return v


def ensure_dirs():
    """Create all pipeline output directories."""
    for d in [ASSETS_DIR, DATA_DIR, RENDERS_DIR, CHECKPOINTS_DIR]:
        os.makedirs(d, exist_ok=True)
