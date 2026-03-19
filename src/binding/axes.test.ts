import { describe, it, expect } from 'vitest';
import { EXPR_AXES, SHAPE_AXES, applyMapping, EXPR_AXIS_NAMES, SHAPE_AXIS_NAMES } from './axes';
import { N_SHAPE, N_EXPR } from '../constants';

describe('EXPR_AXES', () => {
  it('has 4 expression axes', () => {
    expect(EXPR_AXIS_NAMES).toEqual(['alarm', 'mood', 'fatigue']);
  });

  it('all indices are within ψ0-ψ49', () => {
    for (const axis of EXPR_AXIS_NAMES) {
      for (const [idx] of EXPR_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(50);
      }
    }
  });
});

describe('SHAPE_AXES', () => {
  it('has dominance axis', () => {
    expect(SHAPE_AXIS_NAMES).toEqual(['dominance']);
  });

  it('all indices are within β0-β49', () => {
    for (const axis of SHAPE_AXIS_NAMES) {
      for (const [idx] of SHAPE_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(50);
      }
    }
  });

});

describe('applyMapping', () => {
  it('adds weighted values to target', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.alarm, 2.0);
    expect(target[8]).toBeCloseTo(4.0);  // ψ8: 2.0 × 2.0
    expect(target[6]).toBeCloseTo(-3.0); // ψ6: -1.5 × 2.0
    expect(target[2]).toBeCloseTo(2.0);  // ψ2: 1.0 × 2.0
  });

  it('stacks when called multiple times', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.alarm, 1.0);
    applyMapping(target, EXPR_AXES.mood, 1.0);
    // ψ8: alarm 2.0 + mood 0 = 2.0 (only alarm uses ψ8)
    expect(target[8]).toBeCloseTo(2.0);
  });

  it('handles negative values', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.dominance, -2.0);
    expect(target[0]).toBeCloseTo(-5.0);  // β0: 2.5 × -2.0
  });
});
