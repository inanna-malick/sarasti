import { describe, it, expect } from 'vitest';
import { computeCircumplex, resolveShapeChords } from '../../chords';
import { N_SHAPE } from '../../../constants';
import { makeTickerFrame } from '../../../../test-utils/fixtures';

describe('Shape resolution (circumplex stature)', () => {
  function resolveShape(frameOverrides: Parameters<typeof makeTickerFrame>[0]) {
    const frame = makeTickerFrame(frameOverrides);
    const activations = computeCircumplex(frame);
    return resolveShapeChords(activations);
  }

  it('resolves neutral frame to valid shape vector', () => {
    const { shape } = resolveShape({});
    expect(shape.length).toBe(N_SHAPE);
    for (let i = 0; i < N_SHAPE; i++) {
      expect(Number.isFinite(shape[i])).toBe(true);
    }
  });

  it('deterministic: same frame → same shape', () => {
    const frame = makeTickerFrame({ momentum: 1.5, beta: 0.5 });
    const actA = computeCircumplex(frame);
    const actB = computeCircumplex(frame);
    const a = resolveShapeChords(actA);
    const b = resolveShapeChords(actB);
    for (let i = 0; i < N_SHAPE; i++) {
      expect(a.shape[i]).toBe(b.shape[i]);
    }
  });

  it('stature drives titan shape (jaw width + bone structure)', () => {
    const titan = resolveShape({ momentum: 2.0, mean_reversion_z: 2.0 });
    const sprite = resolveShape({ momentum: -2.0, mean_reversion_z: -2.0 });

    // β0 (neck thickness) should be positive for titan, negative for sprite
    expect(titan.shape[0]).toBeGreaterThan(0);
    expect(sprite.shape[0]).toBeLessThan(0);
    // β3 (jaw width)
    expect(titan.shape[3]).toBeGreaterThan(0);
    expect(sprite.shape[3]).toBeLessThan(0);
    // β7 (mid-face width)
    expect(titan.shape[7]).toBeGreaterThan(0);
    expect(sprite.shape[7]).toBeLessThan(0);
  });

  it('shape values stay within reasonable bounds (±10)', () => {
    const results = [
      resolveShape({ momentum: 3, mean_reversion_z: 3 }),
      resolveShape({ momentum: -3, mean_reversion_z: -3 }),
    ];
    for (const { shape } of results) {
      for (let i = 0; i < N_SHAPE; i++) {
        expect(Math.abs(shape[i])).toBeLessThan(10);
      }
    }
  });

  it('skinAge is always 0 (dropped)', () => {
    const { skinAge } = resolveShape({ momentum: 2.0 });
    expect(skinAge).toBe(0);
  });
});
