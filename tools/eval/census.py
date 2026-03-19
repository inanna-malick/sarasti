#!/usr/bin/env python3
"""Generate render configs for the FLAME component census.

Usage:
  python3 tools/eval/census.py > tools/eval/data/census-configs.json
  nix-shell --run "npx tsx tools/eval/render.ts tools/eval/data/census-configs.json"

Then spawn_worker agents to read the PNGs and write bestiary entries.
"""

import json
import os

RENDERS_DIR = "tools/eval/data/renders/census"

def census_configs(multiangle=False):
    """Generate render configs for ψ0-ψ29 and β0-β29.

    multiangle=True: render all values × {front, left34, closeup} instead of front-only.
    """
    configs = []
    cameras = ["front", "left34", "closeup"] if multiangle else ["front"]

    for prefix, param_prefix, count in [("psi", "psi", 30), ("beta", "beta", 30)]:
        for i in range(count):
            comp = f"{param_prefix}{i}"

            # Full sweep × all cameras
            for val in [-3.0, -1.5, 0.0, 1.5, 3.0]:
                val_str = f"{val:+.1f}"
                for camera in cameras:
                    params = {"mode": "raw", comp: str(val)}
                    if camera != "front":
                        params["camera"] = camera
                    configs.append({
                        "params": params,
                        "output": f"{RENDERS_DIR}/{prefix}/{comp}_{val_str}_{camera}.png",
                    })

            # Symmetry check: +2.0 × left34 and right34 (always included)
            if not multiangle:
                for camera in ["left34", "right34"]:
                    configs.append({
                        "params": {"mode": "raw", comp: "2.0", "camera": camera},
                        "output": f"{RENDERS_DIR}/{prefix}/{comp}_+2.0_{camera}.png",
                    })

    return configs

def main():
    import sys
    multiangle = "--multiangle" in sys.argv
    configs = census_configs(multiangle=multiangle)
    os.makedirs(os.path.dirname("tools/eval/data/census-configs.json"), exist_ok=True)
    print(json.dumps(configs, indent=2))

if __name__ == "__main__":
    main()
