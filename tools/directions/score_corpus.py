#!/usr/bin/env python3
"""
Score the rendered corpus against CLIP semantic directions.

This is the second stage of the semantic directions ML pipeline.
It loads 30,000 renders, computes CLIP scores for 4 axes (8 descriptors),
averages views, and saves the results.
"""

import os
import argparse
import numpy as np
import torch
import clip
from PIL import Image
from tqdm import tqdm
from common import RENDERS_DIR, SCORES_FILE, ALL_AXES, ensure_dirs

def main():
    parser = argparse.ArgumentParser(description="Score FLAME renders using CLIP.")
    parser.add_argument("--batch-size", type=int, default=64, help="Batch size for CLIP inference.")
    args = parser.parse_args()

    ensure_dirs()

    if not os.path.exists(RENDERS_DIR):
        print(f"Error: Renders directory not found at {RENDERS_DIR}")
        print("Expected path:", RENDERS_DIR)
        return

    # 1. Load CLIP model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading CLIP model (ViT-L/14) on {device}...")
    model, preprocess = clip.load("ViT-L/14", device=device)

    # 2. Prepare text descriptors
    # ALL_AXES: (axis_name, space, positive_text, negative_text)
    axis_names = [a[0] for a in ALL_AXES]
    pos_prompts = [a[2] for a in ALL_AXES]
    neg_prompts = [a[3] for a in ALL_AXES]
    
    print(f"Axes: {', '.join(axis_names)}")
    
    all_prompts = pos_prompts + neg_prompts
    text_tokens = clip.tokenize(all_prompts).to(device)
    
    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        text_features /= text_features.norm(dim=-1, keepdim=True)
    
    # 3. List and group renders
    # Expecting 30,000 files: sample_{i:05d}_view_{v}.png
    # Standard alphabetical sort works for zero-padded names
    all_files = sorted([f for f in os.listdir(RENDERS_DIR) if f.lower().endswith('.png')])
    
    if not all_files:
        print(f"Error: No PNG files found in {RENDERS_DIR}")
        return
    
    n_renders = len(all_files)
    if n_renders % 3 != 0:
        print(f"Warning: Number of files ({n_renders}) is not a multiple of 3. Truncating.")
    
    n_samples = n_renders // 3
    print(f"Found {n_renders} renders ({n_samples} samples).")

    # 4. Batch processing
    n_axes = len(axis_names)
    all_raw_scores = np.zeros((n_renders, n_axes), dtype=np.float32)
    
    for i in tqdm(range(0, n_renders, args.batch_size), desc="Scoring"):
        batch_files = all_files[i : i + args.batch_size]
        images = []
        for f in batch_files:
            img_path = os.path.join(RENDERS_DIR, f)
            images.append(preprocess(Image.open(img_path)))
        
        image_input = torch.stack(images).to(device)
        
        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
            # Cosine similarity (batch_size, 8)
            similarities = image_features @ text_features.T
            
            # Score = pos_sim - neg_sim
            # pos_prompts are [0, 1, 2, 3], neg_prompts are [4, 5, 6, 7]
            pos_sims = similarities[:, :n_axes]
            neg_sims = similarities[:, n_axes:]
            batch_scores = pos_sims - neg_sims
            
            all_raw_scores[i : i + len(batch_files)] = batch_scores.cpu().numpy()

    # 5. Aggregate views
    # Reshape to (n_samples, 3, n_axes) and average over view axis (axis=1)
    # Assumes sorted files group: [s0v0, s0v1, s0v2, s1v0, s1v1, s1v2, ...]
    final_scores = all_raw_scores[:n_samples * 3].reshape(n_samples, 3, n_axes).mean(axis=1)

    # 6. Normalize (z-score)
    print("Normalizing scores (z-score)...")
    means = final_scores.mean(axis=0)
    stds = final_scores.std(axis=0)
    # Avoid division by zero
    stds[stds < 1e-8] = 1.0
    final_scores = (final_scores - means) / stds

    # 7. Save
    print(f"Saving scores to {SCORES_FILE}...")
    np.savez(SCORES_FILE, scores=final_scores.astype(np.float32), axis_names=axis_names)
    print("Done.")

if __name__ == "__main__":
    main()
