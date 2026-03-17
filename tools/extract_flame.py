#!/usr/bin/env python3
"""
Extract FLAME 2023 model data to binary arrays for web consumption.

Reads FLAME pickle files, truncates to N_SHAPE=100 shape and N_EXPR=50
expression components, outputs:
  public/data/flame_template.bin   — float32 [N_VERTICES * 3]
  public/data/flame_faces.bin      — uint32  [N_FACES * 3]
  public/data/flame_shapedirs.bin  — float32 [N_VERTICES * 3 * N_SHAPE]
  public/data/flame_exprdirs.bin   — float32 [N_VERTICES * 3 * N_EXPR]
  public/data/flame_meta.json      — dimensions metadata

Requires: numpy, chumpy (for FLAME pickle format)

Usage: python tools/extract_flame.py path/to/flame2023.pkl
"""

import sys
import os
import pickle
import json
import numpy as np

# Try to handle chumpy if present or mock it if missing
try:
    import chumpy
except ImportError:
    import types
    mock_chumpy = types.ModuleType("chumpy")
    sys.modules["chumpy"] = mock_chumpy
    # Mock commonly used chumpy classes to allow pickle.load to proceed
    class Ch(object):
        def __getstate__(self): return self.__dict__
        def __setstate__(self, state): self.__dict__.update(state)
    mock_chumpy.Ch = Ch

def to_np(x):
    """Convert chumpy or other array-like objects to numpy array."""
    if hasattr(x, 'r'):  # chumpy object
        return x.r
    return np.array(x)

def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/extract_flame.py <path-to-flame-model.pkl>")
        sys.exit(1)

    pkl_path = sys.argv[1]
    output_dir = "public/data"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Loading FLAME model from {pkl_path}...")
    try:
        with open(pkl_path, 'rb') as f:
            # encoding='latin1' is critical for Python 2 pickles / chumpy
            data = pickle.load(f, encoding='latin1')
    except Exception as e:
        print(f"Error loading pickle: {e}")
        print("Note: FLAME pickles often require 'chumpy' to be installed.")
        sys.exit(1)

    # 1. Extract template vertices
    v_template = to_np(data['v_template']).astype(np.float32)
    n_vertices = v_template.shape[0]

    # 2. Extract face indices
    faces = to_np(data['f']).astype(np.uint32)
    n_faces = faces.shape[0]

    # 3. Extract and truncate shape basis
    # Input shapedirs: (N_VERTICES, 3, N_SHAPE_TOTAL)
    shapedirs = to_np(data['shapedirs'])
    # Transpose to (N_SHAPE_TOTAL, N_VERTICES, 3) for the renderer's layout
    # Renderer expects: [c0_v0_x, c0_v0_y, c0_v0_z, ..., c1_v0_x, ...]
    shapedirs = np.transpose(shapedirs, (2, 0, 1))
    # Truncate to first 100 components
    shapedirs = shapedirs[:100].astype(np.float32)
    n_shape = shapedirs.shape[0]

    # 4. Extract and truncate expression basis
    if 'expression_dirs' in data:
        exprdirs = to_np(data['expression_dirs'])
    elif 'posedirs' in data:
        # Some versions use posedirs for expressions/blendshapes
        exprdirs = to_np(data['posedirs'])
    else:
        print("Error: Could not find 'expression_dirs' or 'posedirs' in model.")
        sys.exit(1)
        
    # Transpose to (N_EXPR_TOTAL, N_VERTICES, 3)
    exprdirs = np.transpose(exprdirs, (2, 0, 1))
    # Truncate to first 50 components
    exprdirs = exprdirs[:50].astype(np.float32)
    n_expr = exprdirs.shape[0]

    # Prepare filenames
    files = {
        "template": "flame_template.bin",
        "faces": "flame_faces.bin",
        "shapedirs": "flame_shapedirs.bin",
        "exprdirs": "flame_exprdirs.bin"
    }

    # Save binary files
    v_template.tofile(os.path.join(output_dir, files["template"]))
    faces.tofile(os.path.join(output_dir, files["faces"]))
    shapedirs.tofile(os.path.join(output_dir, files["shapedirs"]))
    exprdirs.tofile(os.path.join(output_dir, files["exprdirs"]))

    # 5. Save metadata
    meta = {
        "n_vertices": int(n_vertices),
        "n_faces": int(n_faces),
        "n_shape": int(n_shape),
        "n_expr": int(n_expr),
        "files": files
    }

    with open(os.path.join(output_dir, "flame_meta.json"), 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"Successfully extracted FLAME data to {output_dir}/")
    print(f"  Vertices: {n_vertices}")
    print(f"  Faces:    {n_faces}")
    print(f"  Shape:    {n_shape} components")
    print(f"  Expr:     {n_expr} components")

if __name__ == '__main__':
    main()
