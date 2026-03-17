#!/usr/bin/env python3
"""
Generate placeholder direction lookup tables for development/testing.

Shape tables (age, build): each point's params vector has a single dominant
component that scales linearly with t. This gives visually distinguishable
but untuned shape variation.

Expression tables (valence, aperture): same pattern in expression space.

Identity basis: 10 random orthonormal vectors in the nullspace of the
shape directions (approximated as components not used by age/build).

Output: assets/directions/{age,build,valence,aperture,identity_basis}.json
"""

import json
import math
import os
import numpy as np

DIMS = 100
N_POINTS = 20
T_MIN = -3.0
T_MAX = 3.0

def make_direction_table(axis: str, space: str, primary_idx: int, secondary_indices: list[int]) -> dict:
    """Create a direction table where primary_idx scales with t and secondaries add texture."""
    ts = np.linspace(T_MIN, T_MAX, N_POINTS)
    points = []
    for t in ts:
        params = [0.0] * DIMS
        # Primary component scales linearly
        params[primary_idx] = float(t)
        # Secondary components add nonlinear texture
        for i, idx in enumerate(secondary_indices):
            params[idx] = float(t * 0.3 * math.sin((i + 1) * t * 0.5))
        points.append({"t": round(float(t), 6), "params": [round(p, 6) for p in params]})

    return {
        "axis": axis,
        "space": space,
        "dims": DIMS,
        "points": points,
    }


def make_identity_basis(age_primary: int, build_primary: int) -> dict:
    """Create identity basis vectors orthogonal to age and build primary directions."""
    rng = np.random.default_rng(42)

    # Start with random vectors
    raw = rng.standard_normal((10, DIMS))

    # Zero out the components used by age and build (crude orthogonalization)
    raw[:, age_primary] = 0.0
    raw[:, build_primary] = 0.0

    # Gram-Schmidt orthonormalize
    basis = []
    for i in range(10):
        v = raw[i].copy()
        for b in basis:
            v -= np.dot(v, b) * b
        norm = np.linalg.norm(v)
        if norm > 1e-8:
            v /= norm
        basis.append(v)

    return {
        "dims": DIMS,
        "n_basis": 10,
        "vectors": [[round(float(x), 6) for x in vec] for vec in basis],
    }


def main():
    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'directions')
    os.makedirs(out_dir, exist_ok=True)

    # Shape axes
    AGE_PRIMARY = 0     # β0: face width (proxy for age)
    BUILD_PRIMARY = 2   # β2: jaw shape (proxy for build)

    tables = {
        'age': make_direction_table('age', 'shape', AGE_PRIMARY, [1, 3, 5]),
        'build': make_direction_table('build', 'shape', BUILD_PRIMARY, [4, 6, 8]),
        'valence': make_direction_table('valence', 'expression', 1, [0, 4, 9]),
        'aperture': make_direction_table('aperture', 'expression', 0, [2, 4, 5]),
    }

    for name, table in tables.items():
        path = os.path.join(out_dir, f'{name}.json')
        with open(path, 'w') as f:
            json.dump(table, f, separators=(',', ':'))
        print(f'  wrote {path} ({os.path.getsize(path)} bytes)')

    identity = make_identity_basis(AGE_PRIMARY, BUILD_PRIMARY)
    path = os.path.join(out_dir, 'identity_basis.json')
    with open(path, 'w') as f:
        json.dump(identity, f, separators=(',', ':'))
    print(f'  wrote {path} ({os.path.getsize(path)} bytes)')

    print('Done — placeholder direction tables generated.')


if __name__ == '__main__':
    main()
