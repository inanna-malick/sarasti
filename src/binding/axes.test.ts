import { describe, it, expect } from 'vitest';
import { EXPR_AXES, SHAPE_AXES, applyMapping, EXPR_AXIS_NAMES, SHAPE_AXIS_NAMES } from './axes';
import { N_SHAPE, N_EXPR } from '../constants';

describe('EXPR_AXES', () => {
  it('uses only symmetric components (no ψ1 or ψ9)', () => {
    const banned = new Set([1, 9]);
    for (const axis of EXPR_AXIS_NAMES) {
      for (const [idx] of EXPR_AXES[axis]) {
        expect(banned.has(idx), `${axis} uses banned ψ${idx}`).toBe(false);
      }
    }
  });

  it('all indices are within ψ0-ψ9', () => {
    for (const axis of EXPR_AXIS_NAMES) {
      for (const [idx] of EXPR_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(10);
      }
    }
  });

  it('weights produce values within ±7 at slider extreme 3', () => {
    for (const axis of EXPR_AXIS_NAMES) {
      const target = new Float32Array(N_EXPR);
      applyMapping(target, EXPR_AXES[axis], 3);
      for (let i = 0; i < N_EXPR; i++) {
        expect(Math.abs(target[i]), `${axis} ψ${i} = ${target[i]}`).toBeLessThanOrEqual(7.5);
      }
    }
  });
});

describe('SHAPE_AXES', () => {
  it('has zero component overlap between axes', () => {
    const used = new Map<number, string>();
    for (const axis of SHAPE_AXIS_NAMES) {
      for (const [idx] of SHAPE_AXES[axis]) {
        expect(used.has(idx), `β${idx} used by both ${used.get(idx)} and ${axis}`).toBe(false);
        used.set(idx, axis);
      }
    }
  });

  it('all indices are within β0-β10', () => {
    for (const axis of SHAPE_AXIS_NAMES) {
      for (const [idx] of SHAPE_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe('applyMapping', () => {
  it('adds weighted values to target', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.joy, 2.0);
    // Joy: [[0, 2.0], [5, -1.5], [7, -0.7]]
    expect(target[0]).toBeCloseTo(4.0);
    expect(target[5]).toBeCloseTo(-3.0);
    expect(target[7]).toBeCloseTo(-1.4);
    // All other indices should be 0
    expect(target[1]).toBe(0);
    expect(target[2]).toBe(0);
  });

  it('stacks when called multiple times', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.joy, 1.0);
    applyMapping(target, EXPR_AXES.surprise, 1.0);
    // ψ0: joy 2.0 + surprise 1.5 = 3.5
    expect(target[0]).toBeCloseTo(3.5);
  });

  it('handles negative values', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.stature, -2.0);
    // β0: 2.5 × -2.0 = -5.0
    expect(target[0]).toBeCloseTo(-5.0);
  });
});
