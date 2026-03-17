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

def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/extract_flame.py <path-to-flame-model.pkl>")
        sys.exit(1)
    print(f"Stub — implementation in renderer/flame/extract worktree")
    sys.exit(1)

if __name__ == '__main__':
    main()
