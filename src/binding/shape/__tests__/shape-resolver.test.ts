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

  it('momentum drives chad axis (mass + jaw + eyes)', () => {
    const rising = resolveShape({ momentum: 2.0 });
    const falling = resolveShape({ momentum: -2.0 });

    // β0 (thick↔elfin) should be positive for chad, negative for soyboi
    expect(rising.shape[0]).toBeGreaterThan(0);
    expect(falling.shape[0]).toBeLessThan(0);
    // β16 (defined jaw↔soft)
    expect(rising.shape[16]).toBeGreaterThan(0);
    expect(falling.shape[16]).toBeLessThan(0);
    // β19 (inverted: jutting chin at negative)
    expect(rising.shape[19]).toBeLessThan(0);
    expect(falling.shape[19]).toBeGreaterThan(0);
    // β7 (intent eyes)
    expect(rising.shape[7]).toBeGreaterThan(0);
    expect(falling.shape[7]).toBeLessThan(0);
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

  it('chad is shape-only (no pose link)', () => {
    const chad = resolveShape({ momentum: 2.0 });
    const soyboi = resolveShape({ momentum: -2.0 });

    expect(Math.abs(chad.pose.pitch)).toBeLessThan(0.1);
    expect(Math.abs(soyboi.pose.pitch)).toBeLessThan(0.1);
  });
});
