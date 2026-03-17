#!/usr/bin/env python3
"""
Extract per-vertex albedo data from AlbedoMM PCA model for FLAME.
"""

import os
import json
import numpy as np

def bilinear_sample(img, uv):
    """
    img: (H, W, C) array
    uv: (u, v) coordinates in [0, 1]
    Returns (C,) sampled color.
    """
    h, w, c = img.shape
    u, v = uv
    
    # x is column, y is row. v=0 is at bottom (row h-1), v=1 is at top (row 0).
    x = u * (w - 1)
    y = (1.0 - v) * (h - 1)
    
    x0 = int(np.floor(x))
    x1 = min(x0 + 1, w - 1)
    y0 = int(np.floor(y))
    y1 = min(y0 + 1, h - 1)
    
    dx = x - x0
    dy = y - y0
    
    # Bilinear interpolation
    val = (img[y0, x0] * (1 - dx) * (1 - dy) +
           img[y0, x1] * dx * (1 - dy) +
           img[y1, x0] * (1 - dx) * dy +
           img[y1, x1] * dx * dy)
    
    return val

def main():
    npz_path = 'albedoModel2020_FLAME_albedoPart.npz'
    faces_path = 'public/data/flame_faces.bin'
    output_dir = 'public/data'
    
    print(f"Loading {npz_path}...")
    data = np.load(npz_path)
    mu = data['MU']  # (512, 512, 3)
    pc = data['PC']  # (512, 512, 3, 145)
    vt = data['vt']  # (5118, 2)
    ft = data['ft']  # (9976, 3)
    
    print(f"Loading {faces_path}...")
    # Load mesh face indices (uint32, flat array of 9976 * 3 entries)
    faces = np.fromfile(faces_path, dtype=np.uint32).reshape(-1, 3)
    n_faces = faces.shape[0]
    
    if n_faces != ft.shape[0]:
        print(f"Warning: face count mismatch. Mesh faces: {n_faces}, UV faces: {ft.shape[0]}")
    
    # Build vertex -> UV mapping
    # 5023 vertices in FLAME
    n_vertices = 5023
    v_to_uv = np.zeros((n_vertices, 2))
    v_seen = np.zeros(n_vertices, dtype=bool)
    
    for f in range(n_faces):
        for i in range(3):
            v_idx = faces[f, i]
            uv_idx = ft[f, i]
            if v_idx < n_vertices:
                if not v_seen[v_idx]:
                    v_to_uv[v_idx] = vt[uv_idx]
                    v_seen[v_idx] = True
    
    print(f"Mapped UVs for {np.sum(v_seen)} vertices out of {n_vertices}")
    
    # Sample MU at each vertex
    print("Sampling mean albedo (MU)...")
    mean_colors = np.zeros((n_vertices, 3), dtype=np.float32)
    for v in range(n_vertices):
        if v_seen[v]:
            mean_colors[v] = bilinear_sample(mu, v_to_uv[v]).astype(np.float32)
    
    # Sample first 10 PC components at each vertex
    n_components = 10
    print(f"Sampling first {n_components} PCA components...")
    basis_colors = np.zeros((n_components, n_vertices, 3), dtype=np.float32)
    
    for c in range(n_components):
        print(f"  Component {c}...")
        pc_c = pc[:, :, :, c] # (512, 512, 3)
        for v in range(n_vertices):
            if v_seen[v]:
                basis_colors[c, v] = bilinear_sample(pc_c, v_to_uv[v]).astype(np.float32)
    
    # Save flame_albedo_mean.bin
    mean_bin_path = os.path.join(output_dir, 'flame_albedo_mean.bin')
    mean_colors.tofile(mean_bin_path)
    
    # Save flame_albedo_basis.bin
    basis_bin_path = os.path.join(output_dir, 'flame_albedo_basis.bin')
    basis_colors.tofile(basis_bin_path)
    
    # Update flame_meta.json
    meta_path = os.path.join(output_dir, 'flame_meta.json')
    with open(meta_path, 'r') as f:
        meta = json.load(f)
    
    meta['n_albedo_components'] = n_components
    meta['files']['albedo_mean'] = 'flame_albedo_mean.bin'
    meta['files']['albedo_basis'] = 'flame_albedo_basis.bin'
    
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)
    
    # Print sanity checks
    print("\nSanity Checks:")
    print(f"  Mean color range: {np.min(mean_colors):.4f} to {np.max(mean_colors):.4f}")
    
    for c in range(n_components):
        mag = np.linalg.norm(basis_colors[c], axis=1)
        print(f"  Component {c} magnitude: mean={np.mean(mag):.6f}, max={np.max(mag):.6f}")
    
    print(f"\nFiles saved to {output_dir}/")
    print(f"  {mean_bin_path}: {os.path.getsize(mean_bin_path)} bytes")
    print(f"  {basis_bin_path}: {os.path.getsize(basis_bin_path)} bytes")
    print(f"  {meta_path} updated.")

if __name__ == '__main__':
    main()
