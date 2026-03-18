"""
CMA-ES optimizer for FLAME binding parameters.

Optimizes all 11 parameters jointly using Covariance Matrix Adaptation
Evolution Strategy. Unlike the grouped Nelder-Mead approach, this discovers
parameter correlations (e.g. small iris + high expression intensity).

Usage: nix-shell --run "source tools/refine/.venv/bin/activate && python tools/refine/refine_cmaes.py"
"""

import json
import os
import sys
import time
import cma
import numpy as np

from objective import evaluate
from ipc import RenderBridge
from scorer import QualityScorer

# All 11 parameters, jointly. Wider bounds than grouped optimizer.
PARAMS = [
    # name,                  default,  lo,    hi
    ("irisRadius",             0.08,   0.04,  0.45),
    ("pupilRadius",            0.106,  0.02,  0.20),
    ("maxJaw",                 0.20,   0.02,  0.60),
    ("expressionIntensity",   14.52,   2.0,   30.0),
    ("semantifyExprIntensity",13.41,   2.0,   25.0),
    ("maxNeckPitch",           0.25,   0.02,  0.60),
    ("maxNeckYaw",             0.30,   0.02,  0.60),
    ("maxEyeHorizontal",      0.35,   0.05,  0.70),
    ("maxEyeVertical",        0.2625,  0.05,  0.60),
    ("deviationSteepness",     4.0,    0.5,  12.0),
    ("velocitySteepness",      3.0,    0.5,  10.0),
]

KEYS     = [p[0] for p in PARAMS]
DEFAULTS = np.array([p[1] for p in PARAMS])
LOWER    = np.array([p[2] for p in PARAMS])
UPPER    = np.array([p[3] for p in PARAMS])


def x_to_overrides(x: np.ndarray) -> dict:
    """Clamp to bounds and convert to override dict."""
    clamped = np.clip(x, LOWER, UPPER)
    return {k: float(v) for k, v in zip(KEYS, clamped)}


def main():
    bridge = RenderBridge()
    scorer = QualityScorer()

    eval_count = 0
    best_score = float('inf')
    best_overrides = {}
    start_time = time.time()

    def objective(x):
        nonlocal eval_count, best_score, best_overrides
        overrides = x_to_overrides(x)
        score = evaluate(overrides, bridge, scorer)
        eval_count += 1

        if score < best_score:
            best_score = score
            best_overrides = overrides
            elapsed = time.time() - start_time
            print(f"  [{eval_count:4d}] new best: {-score:.4f}  ({elapsed:.0f}s)")

        if eval_count % 50 == 0:
            elapsed = time.time() - start_time
            print(f"  [{eval_count:4d}] current best: {-best_score:.4f}  ({elapsed:.0f}s)")

        return score

    # CMA-ES config
    # sigma0: initial step size, ~1/4 of the normalized range
    # We work in the original parameter space and let CMA-ES handle scaling
    # via the bounds. sigma0 is set relative to the range of each parameter.
    ranges = UPPER - LOWER
    sigma0 = float(np.mean(ranges) * 0.3)

    opts = cma.CMAOptions()
    opts['bounds'] = [LOWER.tolist(), UPPER.tolist()]
    opts['maxfevals'] = 1500       # ~1500 evals ≈ 6000 renders ≈ ~75 min
    opts['tolx'] = 1e-4
    opts['tolfun'] = 1e-4
    opts['popsize'] = 14           # default for 11D is ~13, round up
    opts['verbose'] = 1
    opts['verb_disp'] = 50

    print(f"Starting CMA-ES optimization of {len(KEYS)} parameters jointly")
    print(f"Population size: {opts['popsize']}, max evals: {opts['maxfevals']}")
    print(f"sigma0: {sigma0:.2f}")
    print(f"Bounds widened 2-3x vs grouped optimizer\n")

    es = cma.CMAEvolutionStrategy(DEFAULTS.tolist(), sigma0, opts)

    while not es.stop():
        solutions = es.ask()
        fitnesses = [objective(np.array(x)) for x in solutions]
        es.tell(solutions, fitnesses)
        es.disp()

    es.result_pretty()

    if hasattr(bridge, 'close'):
        bridge.close()

    # Save results
    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)

    # Save full CMA-ES result
    best_x = np.clip(es.result.xbest, LOWER, UPPER)
    final_overrides = {k: float(v) for k, v in zip(KEYS, best_x)}

    output_path = os.path.join(output_dir, "optimal_config_result.json")
    with open(output_path, "w") as f:
        json.dump(final_overrides, f, indent=2)

    # Also save metadata
    meta_path = os.path.join(output_dir, "cmaes_meta.json")
    elapsed = time.time() - start_time
    with open(meta_path, "w") as f:
        json.dump({
            "best_score": float(-es.result.fbest),
            "eval_count": eval_count,
            "elapsed_seconds": elapsed,
            "params": final_overrides,
            "defaults": {k: float(v) for k, v in zip(KEYS, DEFAULTS)},
        }, f, indent=2)

    print(f"\nOptimization complete ({eval_count} evals, {elapsed:.0f}s)")
    print(f"Best score: {-es.result.fbest:.4f}")
    print(f"\nOptimal parameters:")
    for k, v in final_overrides.items():
        default = float(DEFAULTS[KEYS.index(k)])
        delta = v - default
        print(f"  {k:30s} = {v:.4f}  (default {default:.4f}, delta {delta:+.4f})")
    print(f"\nSaved to {output_path}")


if __name__ == "__main__":
    main()
