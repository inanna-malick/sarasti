#!/usr/bin/env python3
"""
Stage 1: Render Corpus
Generates random FLAME parameters and renders them from 3 viewpoints.
"""

import os
import argparse
import numpy as np
from tqdm import tqdm
from PIL import Image

# Rendering imports
import trimesh
import pyrender

# Set offscreen rendering platform
os.environ['PYOPENGL_PLATFORM'] = 'egl'

from common import (
    load_flame_model,
    deform_flame,
    ensure_dirs,
    RENDERS_DIR,
    PARAMS_FILE,
    N_SHAPE,
    N_EXPR,
    SIGMA_CLAMP
)

def generate_params(n_samples):
    """
    Generate random FLAME parameter sets.
    beta ~ N(0, 1) for each of 100 shape components, clamped to [-3, 3]
    psi ~ N(0, 1) for each of 100 expression components, clamped to [-3, 3]
    """
    beta = np.random.randn(n_samples, N_SHAPE).astype(np.float32)
    beta = np.clip(beta, -SIGMA_CLAMP, SIGMA_CLAMP)

    psi = np.random.randn(n_samples, N_EXPR).astype(np.float32)
    psi = np.clip(psi, -SIGMA_CLAMP, SIGMA_CLAMP)

    return beta, psi

def create_renderer(width=224, height=224):
    """Initialize pyrender offscreen renderer and scene basics."""
    renderer = pyrender.OffscreenRenderer(width, height)
    
    # Scene with grey background
    scene = pyrender.Scene(bg_color=[0.2, 0.2, 0.2])
    
    # Camera
    # FLAME head is ~20cm tall. 0.4m away should fit it.
    camera = pyrender.PerspectiveCamera(yfov=np.pi / 6.0)
    camera_pose = np.eye(4)
    camera_pose[:3, 3] = [0, 0.02, 0.4] # Slightly up to center the face better
    
    scene.add(camera, pose=camera_pose)
    
    # Light
    light = pyrender.DirectionalLight(color=[1.0, 1.0, 1.0], intensity=1.0)
    scene.add(light, pose=camera_pose) # Light follows camera
    
    # Ambient light for softer shadows
    ambient = pyrender.AmbientLight(color=[1.0, 1.0, 1.0], intensity=0.3)
    scene.add(ambient)
    
    return renderer, scene, camera

def render_batch(renderer, scene, model, beta_batch, psi_batch, start_idx):
    """Render a batch of samples from 3 viewpoints."""
    faces = model['faces']
    
    # View angles in degrees
    views = {
        'front': 0,
        'left': 30,
        'right': -30
    }
    
    # Mesh material
    material = pyrender.MetallicRoughnessMaterial(
        baseColorFactor=[0.5, 0.5, 0.5, 1.0],
        metallicFactor=0.0,
        roughnessFactor=0.8
    )
    
    for i in range(len(beta_batch)):
        sample_idx = start_idx + i
        vertices = deform_flame(model, beta_batch[i], psi_batch[i])
        
        # Create trimesh
        mesh_base = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
        
        for view_name, angle in views.items():
            # Rotation matrix for the mesh
            rot_y = trimesh.transformations.rotation_matrix(
                np.radians(angle), [0, 1, 0]
            )
            mesh_rotated = mesh_base.copy().apply_transform(rot_y)
            
            # Create pyrender mesh
            py_mesh = pyrender.Mesh.from_trimesh(mesh_rotated, material=material)
            
            # Add to scene
            mesh_node = scene.add(py_mesh)
            
            # Render
            color, _ = renderer.render(scene)
            
            # Remove from scene for next render
            scene.remove_node(mesh_node)
            
            # Save
            img = Image.fromarray(color)
            img.save(os.path.join(RENDERS_DIR, f"{sample_idx:05d}_{view_name}.png"))

def main():
    parser = argparse.ArgumentParser(description="Render FLAME corpus")
    parser.add_argument("--n-samples", type=int, default=10000, help="Number of samples to generate")
    parser.add_argument("--batch-size", type=int, default=100, help="Batch size for rendering")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    np.random.seed(args.seed)
    ensure_dirs()

    print(f"Loading FLAME model...")
    model = load_flame_model()

    print(f"Generating {args.n_samples} parameter sets...")
    beta, psi = generate_params(args.n_samples)

    print(f"Initializing renderer...")
    renderer, scene, camera = create_renderer()

    print(f"Rendering {args.n_samples} samples (3 viewpoints each)...")
    n_batches = (args.n_samples + args.batch_size - 1) // args.batch_size
    
    for b in tqdm(range(n_batches)):
        start = b * args.batch_size
        end = min(start + args.batch_size, args.n_samples)
        
        render_batch(
            renderer, scene,
            model, beta[start:end], psi[start:end], start
        )

    print(f"Saving parameters to {PARAMS_FILE}...")
    np.savez(PARAMS_FILE, beta=beta, psi=psi)
    
    print("Done.")

if __name__ == "__main__":
    main()
