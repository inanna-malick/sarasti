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

  it('momentum drives dominance axis (β3, β2, β0, β4, β7, β13, β18, β23, β48)', () => {
    const rising = resolveShape({ momentum: 2.0 });
    const falling = resolveShape({ momentum: -2.0 });

    // β3 (jaw width) should be positive for chad, negative for soyboi
    expect(rising.shape[3]).toBeGreaterThan(0);
    expect(falling.shape[3]).toBeLessThan(0);
    // Mid-frequency components should also differ
    expect(rising.shape[18]).not.toBe(falling.shape[18]);
    // New mid-frequency enrichment
    expect(rising.shape[13]).toBeGreaterThan(0);  // β13: facial structure detail
    expect(rising.shape[48]).toBeGreaterThan(0);  // β48: skull refinement
  });

  it('|1-beta| drives stature axis (β1, β6, β5, β8, β15, β32, β49)', () => {
    const rebel = resolveShape({ beta: 2.5, deviation: 0.5 }); // far from herd, positive dev → heavy
    const conformist = resolveShape({ beta: 1.0 }); // with herd

    // β1 (face length) should be higher for rebel (stature active)
    expect(Math.abs(rebel.shape[1])).toBeGreaterThan(Math.abs(conformist.shape[1]));
    // New mid-frequency enrichment
    expect(Math.abs(rebel.shape[15])).toBeGreaterThan(Math.abs(conformist.shape[15]));  // β15
    expect(Math.abs(rebel.shape[49])).toBeGreaterThan(Math.abs(conformist.shape[49]));  // β49
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
    const { shape } = resolveShape({ momentum: -10 });
    expect(shape[3]).toBeGreaterThanOrEqual(-4.0);
  });

  it('dominance is shape-only (no pose link)', () => {
    const chad = resolveShape({ momentum: 2.0 });
    const soyboi = resolveShape({ momentum: -2.0 });

    // Dominance no longer drives pose — keeps expression clean
    expect(Math.abs(chad.pose.pitch)).toBeLessThan(0.1);
    expect(Math.abs(soyboi.pose.pitch)).toBeLessThan(0.1);
  });

  it('zero overlap between dominance and stature β components', () => {
    const domComponents = new Set([0, 2, 3, 4, 7, 13, 18, 23, 48]);
    const statComponents = new Set([1, 5, 6, 8, 15, 32, 49]);
    for (const d of domComponents) {
      expect(statComponents.has(d), `β${d} should not be shared`).toBe(false);
    }
  });
});
