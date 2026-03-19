import { describe, it, expect } from 'vitest';
import { computeChordActivations, resolveShapeChords } from '../../chords';
import { N_SHAPE } from '../../../constants';
import { makeTickerFrame } from '../../../../test-utils/fixtures';

describe('Shape resolution (chord-based)', () => {
  function resolveShape(frameOverrides: Parameters<typeof makeTickerFrame>[0]) {
    const frame = makeTickerFrame(frameOverrides);
    const activations = computeChordActivations(frame);
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
    const actA = computeChordActivations(frame);
    const actB = computeChordActivations(frame);
    const a = resolveShapeChords(actA);
    const b = resolveShapeChords(actB);
    for (let i = 0; i < N_SHAPE; i++) {
      expect(a.shape[i]).toBe(b.shape[i]);
    }
  });

  it('momentum drives dominance axis (β3, β2, β0, β4, β7, β18, β23)', () => {
    const rising = resolveShape({ momentum: 2.0 });
    const falling = resolveShape({ momentum: -2.0 });

    // β3 (jaw width) should be positive for chad, negative for soyboi
    expect(rising.shape[3]).toBeGreaterThan(0);
    expect(falling.shape[3]).toBeLessThan(0);
    // Mid-frequency components should also differ
    expect(rising.shape[18]).not.toBe(falling.shape[18]);
  });

  it('|1-beta| drives stature axis (β1, β6, β5, β8, β32)', () => {
    const rebel = resolveShape({ beta: 2.5, deviation: 0.5 }); // far from herd, positive dev → heavy
    const conformist = resolveShape({ beta: 1.0 }); // with herd

    // β1 (face length) should be higher for rebel (stature active)
    expect(Math.abs(rebel.shape[1])).toBeGreaterThan(Math.abs(conformist.shape[1]));
  });

  it('shape values stay within reasonable bounds (±10)', () => {
    const results = [
      resolveShape({ momentum: 3, beta: 3 }),
      resolveShape({ momentum: -3, beta: -1 }),
    ];
    for (const { shape } of results) {
      for (let i = 0; i < N_SHAPE; i++) {
        expect(Math.abs(shape[i])).toBeLessThan(10);
      }
    }
  });

  it('β3 is clamped to prevent jaw collapse', () => {
    // Extreme negative dominance
    const { shape } = resolveShape({ momentum: -10 });
    expect(shape[3]).toBeGreaterThanOrEqual(-4.0);
  });

  it('dominance drives identity pose', () => {
    const chad = resolveShape({ momentum: 2.0 });
    const soyboi = resolveShape({ momentum: -2.0 });

    // Chad = head thrown back (positive pitch), soyboi = chin tucked (negative)
    expect(chad.pose.pitch).toBeGreaterThan(soyboi.pose.pitch);
  });
});
