#!/usr/bin/env python3
"""
Compute FLAME bilateral mirror map and expression reflection matrix.

For each vertex, finds its bilateral partner (nearest to X-reflected position).
Then computes the reflection matrix R in expression PCA space:
  R[i,j] = how much of mirrored component i projects onto component j

The symmetrization matrix S = (I + R) / 2 maps any expression vector
to its bilateral symmetric version.

Outputs:
  - Mirror map analysis (which vertices pair)
  - Expression reflection matrix R (100x100)
  - Per-component symmetry scores (how symmetric each ψ_k is)
  - Identified asymmetric pairs

Usage: python tools/compute_mirror.py flame2023_Open.pkl
"""

import sys
import os
import pickle
import types
import json

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
from scipy.spatial import cKDTree


def to_np(x):
    if hasattr(x, 'r'):
        return x.r
    return np.array(x)


def compute_mirror_map(vertices):
    """
    For each vertex at (x, y, z), find the nearest vertex to (-x, y, z).
    Returns mirror_map: array of length N where mirror_map[i] = mirror partner of vertex i.
    """
    n = len(vertices)
    # Reflect across YZ plane (negate X)
    reflected = vertices.copy()
    reflected[:, 0] = -reflected[:, 0]

    tree = cKDTree(vertices)
    distances, indices = tree.query(reflected)

    print(f"  Mirror map: max distance = {distances.max():.6f}, mean = {distances.mean():.6f}")
    print(f"  Vertices with mirror distance > 0.001: {np.sum(distances > 0.001)}")
    print(f"  Self-mirrors (midline vertices): {np.sum(indices == np.arange(n))}")

    return indices, distances


def compute_reflection_matrix(exprdirs, mirror_map, n_vertices):
    """
    Compute the reflection matrix R in expression PCA coefficient space.

    For each expression basis vector E_k (shape: V×3 vertex displacements),
    its mirror is: mirror(E_k)[v] = (-E_k_x[mirror[v]], E_k_y[mirror[v]], E_k_z[mirror[v]])

    Then R[i,j] = <mirror(E_i), E_j> / ||E_j||^2
    (projection of mirrored component i onto component j)

    Since PCA components are orthonormal, R[i,j] = <mirror(E_i), E_j>.
    """
    n_expr = exprdirs.shape[0]
    # exprdirs shape: (n_expr, n_vertices, 3)

    # Compute mirrored versions of each expression component
    mirrored = np.zeros_like(exprdirs)
    for k in range(n_expr):
        # For each vertex v, the mirrored displacement at v comes from mirror_map[v]
        # with X component negated
        mirrored[k, :, 0] = -exprdirs[k, mirror_map, 0]  # negate X
        mirrored[k, :, 1] = exprdirs[k, mirror_map, 1]
        mirrored[k, :, 2] = exprdirs[k, mirror_map, 2]

    # Flatten to (n_expr, n_vertices*3) for dot products
    E_flat = exprdirs.reshape(n_expr, -1)  # (100, V*3)
    M_flat = mirrored.reshape(n_expr, -1)  # (100, V*3)

    # Compute norms for normalization
    norms = np.linalg.norm(E_flat, axis=1)  # (100,)

    # R[i,j] = <mirror(E_i), E_j> / (||E_i|| * ||E_j||)
    # But PCA components should be orthonormal in vertex space,
    # so we just need the inner products
    R = np.zeros((n_expr, n_expr))
    for i in range(n_expr):
        for j in range(n_expr):
            R[i, j] = np.dot(M_flat[i], E_flat[j]) / (norms[i] * norms[j] + 1e-10)

    return R


def analyze_symmetry(R, n_show=20):
    """Analyze the reflection matrix to find symmetric/asymmetric components and pairs."""
    n = R.shape[0]

    print(f"\n{'='*60}")
    print("PER-COMPONENT SYMMETRY ANALYSIS")
    print(f"{'='*60}")
    print(f"R[i,i] = self-reflection score: +1 = perfectly symmetric, -1 = perfectly antisymmetric, 0 = orthogonal to mirror")
    print()

    # Diagonal: how much each component maps to itself under reflection
    self_scores = np.diag(R)
    for i in range(min(n_show, n)):
        sym_label = "SYM" if self_scores[i] > 0.9 else ("ANTI" if self_scores[i] < -0.9 else ("ASYM" if abs(self_scores[i]) < 0.5 else "~sym"))
        print(f"  ψ{i:2d}: self-reflection = {self_scores[i]:+.4f}  [{sym_label}]")

    # Find pairs: for asymmetric components, which other component captures their mirror?
    print(f"\n{'='*60}")
    print("ASYMMETRIC COMPONENT PAIRS")
    print(f"{'='*60}")
    print("For components where |R[i,i]| < 0.9, showing their primary mirror partner:")
    print()

    for i in range(min(n_show, n)):
        if abs(self_scores[i]) >= 0.9:
            continue
        # Find the component j ≠ i with largest |R[i,j]|
        row = R[i].copy()
        row[i] = 0  # exclude self
        j = np.argmax(np.abs(row))
        print(f"  ψ{i:2d} ↔ ψ{j:2d}: R[{i},{j}] = {R[i,j]:+.4f}, R[{i},{i}] = {R[i,i]:+.4f}")
        # Show the full reflection decomposition for this component
        top_3 = np.argsort(-np.abs(row))[:3]
        decomp = ", ".join(f"ψ{k}×{R[i,k]:+.3f}" for k in top_3 if abs(R[i,k]) > 0.01)
        print(f"         mirror(ψ{i}) ≈ ψ{i}×{R[i,i]:+.3f} + {decomp}")

    # Symmetrization matrix
    S = (np.eye(n) + R) / 2
    print(f"\n{'='*60}")
    print("SYMMETRIZATION RECIPES")
    print(f"{'='*60}")
    print("To symmetrize ψ_k, use: ψ_sym = S @ ψ where S = (I + R) / 2")
    print("For specific components:")
    print()

    for i in range(min(n_show, n)):
        if abs(self_scores[i]) >= 0.9:
            # Already symmetric — S[i,:] ≈ e_i
            print(f"  ψ{i:2d}: already symmetric (R[i,i]={self_scores[i]:+.3f}), use as-is")
        else:
            row = S[i]
            significant = [(j, row[j]) for j in range(n) if abs(row[j]) > 0.01]
            significant.sort(key=lambda x: -abs(x[1]))
            recipe = " + ".join(f"ψ{j}×{w:.3f}" for j, w in significant[:5])
            print(f"  ψ{i:2d}: sym(ψ{i}) = {recipe}")

    return self_scores


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/compute_mirror.py <path-to-flame-model.pkl>")
        sys.exit(1)

    pkl_path = sys.argv[1]
    output_dir = "public/data"

    print(f"Loading FLAME model from {pkl_path}...")
    with open(pkl_path, 'rb') as f:
        data = pickle.load(f, encoding='latin1')

    # Get template vertices
    v_template = to_np(data['v_template']).astype(np.float64)  # (5023, 3)
    n_vertices = v_template.shape[0]
    print(f"  Vertices: {n_vertices}")

    # Compute mirror map
    print("\nComputing vertex mirror map...")
    mirror_map, mirror_distances = compute_mirror_map(v_template)

    # Get expression directions
    all_dirs = to_np(data['shapedirs'])  # (5023, 3, 400)
    meta_info = data.get('supr_expression_metadata', {})
    n_expr_in_model = meta_info.get('n_expr', 100)
    n_shape_in_model = all_dirs.shape[2] - n_expr_in_model

    exprdirs = np.transpose(all_dirs[:, :, n_shape_in_model:n_shape_in_model+100], (2, 0, 1)).astype(np.float64)
    # exprdirs: (100, 5023, 3)
    print(f"  Expression components: {exprdirs.shape[0]}")

    # Compute reflection matrix
    print("\nComputing expression reflection matrix...")
    R = compute_reflection_matrix(exprdirs, mirror_map, n_vertices)

    # Analyze
    self_scores = analyze_symmetry(R, n_show=20)

    # Save reflection matrix
    R_path = os.path.join(output_dir, "flame_expr_reflection.bin")
    R.astype(np.float32).tofile(R_path)
    print(f"\n  Saved reflection matrix R to {R_path} ({R.shape})")

    # Save symmetrization matrix S = (I + R) / 2
    S = ((np.eye(100) + R) / 2).astype(np.float32)
    S_path = os.path.join(output_dir, "flame_expr_symmetrize.bin")
    S.tofile(S_path)
    print(f"  Saved symmetrization matrix S to {S_path} ({S.shape})")

    # Also do shape components
    print("\n\nComputing SHAPE reflection matrix...")
    shapedirs = np.transpose(all_dirs[:, :, :min(100, n_shape_in_model)], (2, 0, 1)).astype(np.float64)
    R_shape = compute_reflection_matrix(shapedirs, mirror_map, n_vertices)
    shape_self = np.diag(R_shape)
    print(f"\nShape component self-reflection scores (first 20):")
    for i in range(20):
        sym_label = "SYM" if shape_self[i] > 0.9 else ("ANTI" if shape_self[i] < -0.9 else "ASYM")
        print(f"  β{i:2d}: self-reflection = {shape_self[i]:+.4f}  [{sym_label}]")


if __name__ == '__main__':
    main()
