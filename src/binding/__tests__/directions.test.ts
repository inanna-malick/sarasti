import { describe, it, expect, beforeAll } from 'vitest';
import {
  interpolateLUT,
  computeIdentityOffset,
  resolveDirections,
  _hashToScalars,
  type DirectionTable,
  type IdentityBasis,
} from '../directions';

// ─── Test Fixtures ────────────────────────────────────

function makeLinearTable(axis: string, space: 'shape' | 'expression', dims = 100): DirectionTable {
  const points = [];
  for (let i = 0; i < 20; i++) {
    const t = -3 + (6 / 19) * i;
    const params = new Array(dims).fill(0);
    // Component 0 scales linearly with t
    params[0] = t;
    // Component 1 scales quadratically (captures nonlinearity)
    params[1] = t * t / 9; // normalized to [0, 1] at ±3
    points.push({ t, params });
  }
  return { axis, space, dims, points };
}

function makeIdentityBasis(dims = 100, n_basis = 10): IdentityBasis {
  // Orthonormal basis vectors in components 10-19
  const vectors: number[][] = [];
  for (let b = 0; b < n_basis; b++) {
    const v = new Array(dims).fill(0);
    v[10 + b] = 1.0; // unit vector in component 10+b
    vectors.push(v);
  }
  return { dims, n_basis, vectors };
}

// ─── interpolateLUT ───────────────────────────────────

describe('interpolateLUT', () => {
  const table = makeLinearTable('age', 'shape');

  it('returns zero vector for empty table', () => {
    const empty: DirectionTable = { axis: 'test', space: 'shape', dims: 5, points: [] };
    const result = interpolateLUT(empty, 0);
    expect(result.length).toBe(5);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0]);
  });

  it('clamps below min to first point', () => {
    const result = interpolateLUT(table, -10);
    expect(result[0]).toBeCloseTo(-3, 4);
  });

  it('clamps above max to last point', () => {
    const result = interpolateLUT(table, 10);
    expect(result[0]).toBeCloseTo(3, 4);
  });

  it('returns exact point when t matches a sample', () => {
    const result = interpolateLUT(table, -3);
    expect(result[0]).toBeCloseTo(-3, 4);
    expect(result[1]).toBeCloseTo(1, 4); // (-3)^2/9 = 1
  });

  it('interpolates linearly between samples', () => {
    // Midpoint between first two samples
    const t0 = table.points[0].t;
    const t1 = table.points[1].t;
    const tMid = (t0 + t1) / 2;
    const result = interpolateLUT(table, tMid);

    const expected0 = (table.points[0].params[0] + table.points[1].params[0]) / 2;
    expect(result[0]).toBeCloseTo(expected0, 4);
  });

  it('interpolates at t=0 correctly', () => {
    const result = interpolateLUT(table, 0);
    // Component 0 should be ~0 (linear)
    expect(Math.abs(result[0])).toBeLessThan(0.2);
    // Component 1 should be ~0 (quadratic, minimum at 0)
    expect(Math.abs(result[1])).toBeLessThan(0.1);
  });

  it('produces correct dims', () => {
    const result = interpolateLUT(table, 1.5);
    expect(result.length).toBe(100);
    expect(result).toBeInstanceOf(Float32Array);
  });
});

// ─── hashToScalars ────────────────────────────────────

describe('hashToScalars', () => {
  it('returns correct count', () => {
    const s = _hashToScalars('BRT', 10);
    expect(s.length).toBe(10);
  });

  it('values are in [-0.5, 0.5]', () => {
    const s = _hashToScalars('SPY', 10);
    for (const v of s) {
      expect(v).toBeGreaterThanOrEqual(-0.5);
      expect(v).toBeLessThanOrEqual(0.5);
    }
  });

  it('is deterministic', () => {
    const a = _hashToScalars('BRT', 10);
    const b = _hashToScalars('BRT', 10);
    expect(a).toEqual(b);
  });

  it('different IDs produce different scalars', () => {
    const a = _hashToScalars('BRT', 10);
    const b = _hashToScalars('SPY', 10);
    // At least some should differ
    const diffs = a.filter((v, i) => Math.abs(v - b[i]) > 0.01);
    expect(diffs.length).toBeGreaterThan(0);
  });
});

// ─── computeIdentityOffset ────────────────────────────

describe('computeIdentityOffset', () => {
  const basis = makeIdentityBasis();

  it('returns correct dims', () => {
    const offset = computeIdentityOffset(basis, 'BRT');
    expect(offset.length).toBe(100);
    expect(offset).toBeInstanceOf(Float32Array);
  });

  it('offset is in nullspace components only', () => {
    const offset = computeIdentityOffset(basis, 'BRT');
    // Components 0-9 should be zero (not in basis)
    for (let i = 0; i < 10; i++) {
      expect(offset[i]).toBe(0);
    }
    // Components 20-99 should also be zero
    for (let i = 20; i < 100; i++) {
      expect(offset[i]).toBe(0);
    }
    // Components 10-19 should have non-zero values
    let hasNonZero = false;
    for (let i = 10; i < 20; i++) {
      if (Math.abs(offset[i]) > 0.01) hasNonZero = true;
    }
    expect(hasNonZero).toBe(true);
  });

  it('different tickers produce different offsets', () => {
    const a = computeIdentityOffset(basis, 'BRT');
    const b = computeIdentityOffset(basis, 'SPY');

    let diffSum = 0;
    for (let i = 0; i < 100; i++) {
      diffSum += Math.abs(a[i] - b[i]);
    }
    expect(diffSum).toBeGreaterThan(0.1);
  });

  it('is deterministic', () => {
    const a = computeIdentityOffset(basis, 'VIX');
    const b = computeIdentityOffset(basis, 'VIX');
    for (let i = 0; i < 100; i++) {
      expect(a[i]).toBe(b[i]);
    }
  });
});

// ─── Orthogonality ────────────────────────────────────

describe('identity offset orthogonality', () => {
  it('identity offset is orthogonal to shape direction primaries', () => {
    // If age direction is along component 0 and build along component 2,
    // identity offset should have zero contribution there
    const basis = makeIdentityBasis();
    const offset = computeIdentityOffset(basis, 'TEST_TICKER');

    // Age primary = component 0, build primary = component 2
    expect(offset[0]).toBe(0);
    expect(offset[2]).toBe(0);
  });
});

// ─── resolveDirections (integration, without loaded tables) ──

describe('resolveDirections', () => {
  it('returns zero vectors when tables not loaded', () => {
    const result = resolveDirections(
      { age: 0, build: 0, valence: 0, aperture: 0 },
      'TEST',
    );
    expect(result.shape.length).toBe(100);
    expect(result.expression.length).toBe(100);
    // All zeros when no tables loaded
    for (let i = 0; i < 100; i++) {
      expect(result.shape[i]).toBe(0);
      expect(result.expression[i]).toBe(0);
    }
  });
});
