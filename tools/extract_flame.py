#!/usr/bin/env python3
"""
Extract FLAME 2023 Open model data to binary arrays for web consumption.

FLAME 2023 Open packs shape and expression into a single 'shapedirs' matrix:
  shapedirs shape = (N_VERTICES, 3, 400)
  First 300 = shape identity components
  Last 100 = expression components (per supr_expression_metadata)

We extract:
  public/data/flame_template.bin   — float32 [N_VERTICES * 3]
  public/data/flame_faces.bin      — uint32  [N_FACES * 3]
  public/data/flame_shapedirs.bin  — float32 [N_SHAPE * N_VERTICES * 3]  (contiguous by component)
  public/data/flame_exprdirs.bin   — float32 [N_EXPR * N_VERTICES * 3]   (contiguous by component)
  public/data/flame_weights.bin    — float32 [N_VERTICES * N_JOINTS]     (LBS skinning weights)
  public/data/flame_posedirs.bin   — float32 [N_VERTICES * 3 * (N_JOINTS-1)*9] (pose correctives)
  public/data/flame_kintree.json   — [2][N_JOINTS] parent-child joint tree
  public/data/flame_J_regressor.bin — float32 [N_JOINTS * N_VERTICES]    (joint regressor, dense)
  public/data/flame_meta.json      — dimensions metadata

Truncated to N_SHAPE=100, N_EXPR=100.

Requires: numpy, scipy (for pickle compatibility)

Usage: python tools/extract_flame.py path/to/flame2023_Open.pkl
"""

import sys
import os
import pickle
import json
import types

# Mock chumpy — not needed for loading but pickle expects the module
try:
    import chumpy
except ImportError:
    mock_chumpy = types.ModuleType("chumpy")
    class Ch(object):
        def __getstate__(self): return self.__dict__
        def __setstate__(self, state): self.__dict__.update(state)
    mock_chumpy.Ch = Ch
    sys.modules["chumpy"] = mock_chumpy
    sys.modules["chumpy.ch"] = mock_chumpy

import numpy as np

N_SHAPE_TRUNCATE = 100
N_EXPR_TRUNCATE = 100


def to_np(x):
    """Convert chumpy or other array-like objects to numpy array."""
    if hasattr(x, 'r'):
        return x.r
    return np.array(x)


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/extract_flame.py <path-to-flame-model.pkl>")
        sys.exit(1)

    pkl_path = sys.argv[1]
    output_dir = "public/data"
    os.makedirs(output_dir, exist_ok=True)

    print(f"Loading FLAME model from {pkl_path}...")
    with open(pkl_path, 'rb') as f:
        data = pickle.load(f, encoding='latin1')

    # 1. Template vertices: (N_VERTICES, 3) → flatten to [v0x, v0y, v0z, v1x, ...]
    v_template = to_np(data['v_template']).astype(np.float32).flatten()
    n_vertices = len(v_template) // 3

    # 2. Face indices: (N_FACES, 3) → flatten
    faces = to_np(data['f']).astype(np.uint32).flatten()
    n_faces = len(faces) // 3

    # 3. Split shapedirs into shape + expression
    # Raw: (N_VERTICES, 3, N_TOTAL) where N_TOTAL = 400
    # First 300 = shape, last 100 = expression (per supr_expression_metadata)
    all_dirs = to_np(data['shapedirs'])  # (5023, 3, 400)
    n_total = all_dirs.shape[2]

    meta_info = data.get('supr_expression_metadata', {})
    n_expr_in_model = meta_info.get('n_expr', 100)
    n_shape_in_model = n_total - n_expr_in_model

    print(f"  Model has {n_shape_in_model} shape + {n_expr_in_model} expression = {n_total} total components")

    # Shape: first n_shape_in_model components, truncate to N_SHAPE_TRUNCATE
    shape_raw = all_dirs[:, :, :n_shape_in_model]  # (V, 3, 300)
    n_shape = min(N_SHAPE_TRUNCATE, shape_raw.shape[2])
    # Transpose to (N_SHAPE, V, 3) so renderer reads contiguously per component
    shapedirs = np.transpose(shape_raw[:, :, :n_shape], (2, 0, 1)).astype(np.float32)
    # Flatten: [c0_v0_x, c0_v0_y, c0_v0_z, c0_v1_x, ..., c1_v0_x, ...]
    shapedirs_flat = shapedirs.flatten()

    # Expression: last n_expr_in_model components, truncate to N_EXPR_TRUNCATE
    expr_raw = all_dirs[:, :, n_shape_in_model:]  # (V, 3, 100)
    n_expr = min(N_EXPR_TRUNCATE, expr_raw.shape[2])
    exprdirs = np.transpose(expr_raw[:, :, :n_expr], (2, 0, 1)).astype(np.float32)
    exprdirs_flat = exprdirs.flatten()

    # 4. Extract LBS / pose arrays
    # Skinning weights: (N_VERTICES, N_JOINTS) — how much each joint influences each vertex
    weights = to_np(data['weights']).astype(np.float32)  # (5023, 5)
    n_joints = weights.shape[1]
    weights_flat = weights.flatten()  # row-major: [v0_j0, v0_j1, ..., v1_j0, ...]

    # Pose-dependent corrective blendshapes: (N_VERTICES, 3, (N_JOINTS-1)*9)
    # These correct for linear blend skinning artifacts
    posedirs_raw = to_np(data['posedirs']).astype(np.float32)  # (5023, 3, 36)
    n_pose_features = posedirs_raw.shape[2]  # (N_JOINTS-1)*9 = 36
    # Transpose to (N_POSE_FEATURES, N_VERTICES, 3) for component-contiguous access
    posedirs_pose = np.transpose(posedirs_raw, (2, 0, 1)).astype(np.float32)
    posedirs_flat = posedirs_pose.flatten()

    # Joint regressor: sparse (N_JOINTS, N_VERTICES) → dense
    # Maps vertex positions to joint locations: J = J_regressor @ V
    J_regressor = to_np(data['J_regressor'])
    if hasattr(J_regressor, 'toarray'):
        J_regressor = J_regressor.toarray()  # scipy sparse → dense
    J_regressor = J_regressor.astype(np.float32)  # (5, 5023)
    J_regressor_flat = J_regressor.flatten()

    # Kinematic tree: (2, N_JOINTS) — parent-child relationships
    kintree_table = to_np(data['kintree_table']).astype(int).tolist()  # [[parents...], [children...]]

    print(f"  Joints:     {n_joints}")
    print(f"  Pose features: {n_pose_features} ({n_joints-1} joints × 9)")
    print(f"  J_regressor: {J_regressor.shape}")
    print(f"  Kintree:    {kintree_table}")

    # 5. Write binary files
    files = {
        "template": "flame_template.bin",
        "faces": "flame_faces.bin",
        "shapedirs": "flame_shapedirs.bin",
        "exprdirs": "flame_exprdirs.bin",
        "weights": "flame_weights.bin",
        "posedirs": "flame_posedirs.bin",
        "J_regressor": "flame_J_regressor.bin",
    }

    v_template.tofile(os.path.join(output_dir, files["template"]))
    faces.tofile(os.path.join(output_dir, files["faces"]))
    shapedirs_flat.tofile(os.path.join(output_dir, files["shapedirs"]))
    exprdirs_flat.tofile(os.path.join(output_dir, files["exprdirs"]))
    weights_flat.tofile(os.path.join(output_dir, files["weights"]))
    posedirs_flat.tofile(os.path.join(output_dir, files["posedirs"]))
    J_regressor_flat.tofile(os.path.join(output_dir, files["J_regressor"]))

    # Kintree is small — write as JSON
    with open(os.path.join(output_dir, "flame_kintree.json"), 'w') as f:
        json.dump(kintree_table, f)

    # 6. Write metadata
    meta = {
        "n_vertices": int(n_vertices),
        "n_faces": int(n_faces),
        "n_shape": int(n_shape),
        "n_expr": int(n_expr),
        "n_joints": int(n_joints),
        "n_pose_features": int(n_pose_features),
        "files": files,
    }

    with open(os.path.join(output_dir, "flame_meta.json"), 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"\nExtracted FLAME data to {output_dir}/")
    print(f"  Vertices:   {n_vertices}")
    print(f"  Faces:      {n_faces}")
    print(f"  Shape:      {n_shape} components (of {n_shape_in_model})")
    print(f"  Expression: {n_expr} components (of {n_expr_in_model})")
    print(f"  Joints:     {n_joints}")
    print(f"  Pose dirs:  {n_pose_features} features")

    # File sizes
    for name, fname in files.items():
        path = os.path.join(output_dir, fname)
        size_mb = os.path.getsize(path) / (1024 * 1024)
        print(f"  {fname}: {size_mb:.1f} MB")


if __name__ == '__main__':
    main()
