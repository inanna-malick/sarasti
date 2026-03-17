#!/usr/bin/env python3
"""
Stage 1: Render Corpus
Generates random FLAME parameters and renders from 3 viewpoints.
Uses numba-JIT software rasterizer — no OpenGL/pyrender needed.
"""

import os
import argparse
import json
import numpy as np
from numba import njit, prange
from tqdm import tqdm
from PIL import Image

from common import (
    load_flame_model,
    deform_flame,
    ensure_dirs,
    RENDERS_DIR,
    PARAMS_FILE,
    ASSETS_DIR,
    ALL_AXES,
    N_SHAPE,
    N_EXPR,
    SIGMA_CLAMP
)


def generate_params(n_samples):
    beta = np.random.randn(n_samples, N_SHAPE).astype(np.float32)
    beta = np.clip(beta, -SIGMA_CLAMP, SIGMA_CLAMP)
    psi = np.random.randn(n_samples, N_EXPR).astype(np.float32)
    psi = np.clip(psi, -SIGMA_CLAMP, SIGMA_CLAMP)
    return beta, psi


def generate_hybrid_params(n_variants=500):
    """
    Hybrid mode: Load Semantify 10-dim tables, extend to 100-dim with random variance-decaying tails.
    4 axes * 20 t-points * n_variants variants.
    """
    n_axes = len(ALL_AXES)
    n_t = 20
    total_samples = n_axes * n_t * n_variants

    beta = np.zeros((total_samples, N_SHAPE), dtype=np.float32)
    psi = np.zeros((total_samples, N_EXPR), dtype=np.float32)
    axis_labels = np.zeros(total_samples, dtype=np.int32)
    t_values = np.zeros(total_samples, dtype=np.float32)

    # sigma(i) = 1.0 / sqrt(i-9) for i in [10, 99]
    indices = np.arange(10, 100)
    sigmas = 1.0 / np.sqrt(indices - 9)

    sample_idx = 0
    for axis_idx, (axis_name, space, _, _) in enumerate(ALL_AXES):
        path = os.path.join(ASSETS_DIR, f"{axis_name}.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Hybrid mode requires existing Semantify tables: {path}")
        
        with open(path, 'r') as f:
            table = json.load(f)
        
        points = table['points']
        if len(points) != n_t:
            print(f"Warning: {axis_name} has {len(points)} points, expected {n_t}")

        for p in points:
            t = float(p['t'])
            # Lock dims 0-9 to Semantify values
            semantify_params = np.array(p['params'][:10], dtype=np.float32)

            for _ in range(n_variants):
                # Randomized dims 10-99 with variance-decaying envelope
                noise = np.random.randn(90).astype(np.float32) * sigmas
                noise = np.clip(noise, -SIGMA_CLAMP, SIGMA_CLAMP)

                full_params = np.zeros(100, dtype=np.float32)
                full_params[:10] = semantify_params
                full_params[10:] = noise

                if space == 'shape':
                    beta[sample_idx] = full_params
                else:
                    psi[sample_idx] = full_params
                
                axis_labels[sample_idx] = axis_idx
                t_values[sample_idx] = t
                sample_idx += 1
    
    return beta, psi, axis_labels, t_values


def compute_normals(vertices, faces):
    v0, v1, v2 = vertices[faces[:, 0]], vertices[faces[:, 1]], vertices[faces[:, 2]]
    fn = np.cross(v1 - v0, v2 - v0)
    norms = np.linalg.norm(fn, axis=1, keepdims=True)
    norms[norms < 1e-10] = 1
    fn /= norms
    vn = np.zeros_like(vertices)
    for i in range(3):
        np.add.at(vn, faces[:, i], fn)
    norms = np.linalg.norm(vn, axis=1, keepdims=True)
    norms[norms < 1e-10] = 1
    vn /= norms
    return vn


def rotation_y(angle_deg):
    a = np.radians(angle_deg)
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], dtype=np.float32)


@njit(cache=True)
def _rasterize_core(sx, sy, sz, shade, faces, width, height):
    """Numba-JIT rasterizer core. Processes all triangles with z-buffer."""
    img = np.full((height, width, 3), 51, dtype=np.uint8)
    zbuf = np.full((height, width), -1e30)

    n_faces = faces.shape[0]
    for fi in range(n_faces):
        i0, i1, i2 = faces[fi, 0], faces[fi, 1], faces[fi, 2]
        x0, y0, z0, s0 = sx[i0], sy[i0], sz[i0], shade[i0]
        x1, y1, z1, s1 = sx[i1], sy[i1], sz[i1], shade[i1]
        x2, y2, z2, s2 = sx[i2], sy[i2], sz[i2], shade[i2]

        # Bounding box
        min_x = max(0, int(min(x0, x1, x2)))
        max_x = min(width - 1, int(max(x0, x1, x2)))
        min_y = max(0, int(min(y0, y1, y2)))
        max_y = min(height - 1, int(max(y0, y1, y2)))

        if min_x > max_x or min_y > max_y:
            continue

        det = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(det) < 1e-10:
            continue
        inv_det = 1.0 / det

        for py in range(min_y, max_y + 1):
            for px in range(min_x, max_x + 1):
                w0 = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) * inv_det
                w1 = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) * inv_det
                w2 = 1.0 - w0 - w1

                if w0 >= 0 and w1 >= 0 and w2 >= 0:
                    z = w0 * z0 + w1 * z1 + w2 * z2
                    if z > zbuf[py, px]:
                        zbuf[py, px] = z
                        s = w0 * s0 + w1 * s1 + w2 * s2
                        val = min(255, max(0, int(s * 200 + 30)))
                        img[py, px, 0] = val
                        img[py, px, 1] = val
                        img[py, px, 2] = val

    return img


def rasterize(vertices, faces, normals, width=224, height=224):
    cx, cy = np.mean(vertices[:, 0]), np.mean(vertices[:, 1])
    scale = min(width, height) / 0.28

    sx = ((vertices[:, 0] - cx) * scale + width / 2).astype(np.float64)
    sy = (-(vertices[:, 1] - cy) * scale + height / 2).astype(np.float64)
    sz = vertices[:, 2].astype(np.float64)

    light_dir = np.array([-0.3, 0.5, 0.8], dtype=np.float32)
    light_dir /= np.linalg.norm(light_dir)
    diffuse = np.clip(normals @ light_dir, 0, 1)
    shade = np.clip(diffuse + 0.25, 0, 1).astype(np.float64)

    return _rasterize_core(sx, sy, sz, shade, faces, width, height)


def render_sample(model, beta, psi, views, width=224, height=224):
    vertices = deform_flame(model, beta, psi)
    faces = model['faces']
    images = {}
    for view_name, angle in views.items():
        v_rot = vertices @ rotation_y(angle).T
        normals = compute_normals(v_rot, faces)
        images[view_name] = rasterize(v_rot, faces, normals, width, height)
    return images


def main():
    parser = argparse.ArgumentParser(description="Render FLAME corpus")
    parser.add_argument("--n-samples", type=int, default=10000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--mode", type=str, default="default", choices=["default", "hybrid"])
    parser.add_argument("--n-variants", type=int, default=500, help="Variants per axis-point in hybrid mode")
    args = parser.parse_args()

    np.random.seed(args.seed)
    ensure_dirs()

    print("Loading FLAME model...")
    model = load_flame_model()

    is_hybrid = args.mode == 'hybrid'
    if is_hybrid:
        print(f"Hybrid mode enabled. Generating parameters from {len(ALL_AXES)} Semantify axes...")
        beta, psi, axis_labels, t_values = generate_hybrid_params(n_variants=args.n_variants)
        n_samples = beta.shape[0]
        params_path = os.path.join(os.path.dirname(PARAMS_FILE), "hybrid_params.npz")
        hybrid_renders_dir = os.path.join(os.path.dirname(RENDERS_DIR), "hybrid_renders")
        os.makedirs(hybrid_renders_dir, exist_ok=True)
        renders_dir = hybrid_renders_dir
    else:
        n_samples = args.n_samples
        print(f"Generating {n_samples} random parameter sets...")
        beta, psi = generate_params(n_samples)
        params_path = PARAMS_FILE
        renders_dir = RENDERS_DIR

    views = {'front': 0, 'left': 30, 'right': -30}

    # JIT warmup
    import time
    print("JIT compiling rasterizer (first render is slow)...")
    t0 = time.time()
    _ = render_sample(model, beta[0], psi[0], views)
    print(f"JIT warmup: {time.time() - t0:.1f}s")

    t0 = time.time()
    _ = render_sample(model, beta[1], psi[1], views)
    dt = time.time() - t0
    print(f"Per sample after JIT: {dt:.3f}s. Estimated total: {dt * n_samples / 60:.0f} min")

    print(f"Rendering {n_samples} samples (3 viewpoints each)...")
    for i in tqdm(range(n_samples)):
        images = render_sample(model, beta[i], psi[i], views)
        for view_name, img in images.items():
            Image.fromarray(img).save(
                os.path.join(renders_dir, f"{i:05d}_{view_name}.png")
            )

    print(f"Saving parameters to {params_path}...")
    if is_hybrid:
        np.savez(params_path, beta=beta, psi=psi, axis_labels=axis_labels, t_values=t_values)
    else:
        np.savez(params_path, beta=beta, psi=psi)
    print("Done.")


if __name__ == "__main__":
    main()
