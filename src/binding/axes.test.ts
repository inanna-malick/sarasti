import { describe, it, expect } from 'vitest';
import { EXPR_AXES, SHAPE_AXES, applyMapping, EXPR_AXIS_NAMES, SHAPE_AXIS_NAMES } from './axes';
import { N_SHAPE, N_EXPR } from '../constants';

describe('EXPR_AXES', () => {
  it('has tension and mood axes', () => {
    expect(EXPR_AXIS_NAMES).toEqual(['tension', 'mood']);
  });

  it('all indices are within ψ0-ψ49 (safe symmetric range)', () => {
    for (const axis of EXPR_AXIS_NAMES) {
      for (const [idx] of EXPR_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(50);
      }
    }
  });

  it('weights produce values within ±21 at slider extreme 3', () => {
    for (const axis of EXPR_AXIS_NAMES) {
      const target = new Float32Array(N_EXPR);
      applyMapping(target, EXPR_AXES[axis], 3);
      for (let i = 0; i < N_EXPR; i++) {
        expect(Math.abs(target[i]), `${axis} ψ${i} = ${target[i]}`).toBeLessThanOrEqual(21.5);
      }
    }
  });

  it('mood uses ψ0 (smile) + ψ9 (smile) + ψ11+ψ12 (knowing smirk) + ψ7 (happy)', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.mood, 1.0);
    expect(target[0]).toBeCloseTo(1.5);   // ψ0: frown-smile
    expect(target[9]).toBeCloseTo(2.0);   // ψ9: smile
    expect(target[11]).toBeCloseTo(2.0);  // ψ11: left mouth corner
    expect(target[12]).toBeCloseTo(2.0);  // ψ12: right mouth corner
    expect(target[1]).toBeCloseTo(1.0);   // ψ1: overall smile shape (low weight)
    expect(target[7]).toBeCloseTo(1.5);   // ψ7: happy eyes
  });

  it('tension uses ψ7 (wide eyes) + ψ2 (angry mouth) + ψ3 (brow furrow)', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.tension, 1.0);
    expect(target[7]).toBeCloseTo(-2.0);  // ψ7: wide eyes (negative = disappointed→happy inverted)
    expect(target[2]).toBeCloseTo(2.0);   // ψ2: open angry mouth
    expect(target[3]).toBeCloseTo(1.5);   // ψ3: brow furrow
    expect(target[5]).toBeCloseTo(1.5);   // ψ5: sneer
    expect(target[8]).toBeCloseTo(1.5);   // ψ8: shocked
  });
});

describe('SHAPE_AXES', () => {
  it('has single chad axis', () => {
    expect(SHAPE_AXIS_NAMES).toEqual(['chad']);
  });

  it('all indices are within β0-β49 (safe range per FLAME analysis)', () => {
    for (const axis of SHAPE_AXIS_NAMES) {
      for (const [idx] of SHAPE_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(50);
      }
    }
  });

  it('chad drives mass (β0 thick), jaw (β16 defined), chin (β19 jutting inverted)', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.chad, 1.0);
    expect(target[0]).toBeCloseTo(4.0);    // β0: thick
    expect(target[16]).toBeCloseTo(3.0);   // β16: defined jaw
    expect(target[19]).toBeCloseTo(-3.0);  // β19: jutting chin (inverted)
  });

  it('chad drives predator eyes (β7 intent, β8 closely spaced inverted)', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.chad, 1.0);
    expect(target[7]).toBeCloseTo(2.0);    // β7: intent recessed eyes
    expect(target[8]).toBeCloseTo(-2.0);   // β8: closely spaced (inverted)
  });

  it('chad drives stature (β1 tall, β2 elongated, β5 portly, β6 thicc, β9 big skull)', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.chad, 1.0);
    expect(target[1]).toBeCloseTo(3.0);    // β1: tall
    expect(target[2]).toBeCloseTo(3.0);    // β2: elongated
    expect(target[5]).toBeCloseTo(2.5);    // β5: portly
    expect(target[6]).toBeCloseTo(3.5);    // β6: thicc
    expect(target[9]).toBeCloseTo(2.5);    // β9: big skull
  });
});

describe('applyMapping', () => {
  it('adds weighted values to target', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.tension, 2.0);
    // Tension: [[7, -2.0], [2, 2.0], [3, 1.5], [5, 1.5], [8, 1.5], [11, 0.6], [12, 0.6]]
    expect(target[7]).toBeCloseTo(-4.0);
    expect(target[2]).toBeCloseTo(4.0);
    expect(target[3]).toBeCloseTo(3.0);
    // Unused indices should be 0
    expect(target[4]).toBe(0);
    expect(target[6]).toBe(0);
  });

  it('stacks when called multiple times', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.tension, 1.0);
    applyMapping(target, EXPR_AXES.mood, 1.0);
    // ψ7: tension -2.0 + mood 1.5 = -0.5
    expect(target[7]).toBeCloseTo(-0.5);
    // ψ11: tension 0.6 + mood 2.0 = 2.6
    expect(target[11]).toBeCloseTo(2.6);
  });

  it('handles negative values', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.chad, -2.0);
    // β0: 2.5 × -2.0 = -5.0
    expect(target[0]).toBeCloseTo(-5.0);
  });
});
