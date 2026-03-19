import { describe, it, expect } from 'vitest';
import { EXPR_AXES, SHAPE_AXES, applyMapping, EXPR_AXIS_NAMES, SHAPE_AXIS_NAMES } from './axes';
import { N_SHAPE, N_EXPR } from '../constants';

describe('EXPR_AXES', () => {
  it('all indices are within ψ0-ψ9', () => {
    for (const axis of EXPR_AXIS_NAMES) {
      for (const [idx] of EXPR_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(10);
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

  it('all indices are within β0-β49 (safe range per FLAME analysis)', () => {
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
    // Alarm: [[0, 1.0], [2, 2.0], [8, 1.5]]
    expect(target[0]).toBeCloseTo(2.0);
    expect(target[2]).toBeCloseTo(4.0);
    expect(target[8]).toBeCloseTo(3.0);
    // All other indices should be 0
    expect(target[1]).toBe(0);
    expect(target[3]).toBe(0);
  });

  it('stacks when called multiple times', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.alarm, 1.0);
    applyMapping(target, EXPR_AXES.arousal, 1.0);
    // ψ2: alarm 2.0 + arousal 3.0 = 5.0
    expect(target[2]).toBeCloseTo(5.0);
  });

  it('handles negative values', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.dominance, -2.0);
    // β3: 3.0 × -2.0 = -6.0
    expect(target[3]).toBeCloseTo(-6.0);
  });
});
