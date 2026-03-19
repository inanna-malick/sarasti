import { describe, it, expect } from 'vitest';
import { EXPR_AXES, SHAPE_AXES, applyMapping, EXPR_AXIS_NAMES, SHAPE_AXIS_NAMES } from './axes';
import { N_SHAPE, N_EXPR } from '../constants';

describe('EXPR_AXES', () => {
  it('has tension and mood axes', () => {
    expect(EXPR_AXIS_NAMES).toEqual(['tension', 'mood']);
  });

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

  it('tension uses new ψ4, ψ5 components', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.tension, 1.0);
    expect(target[5]).toBeCloseTo(0.8);   // ψ5: upper lip raiser
    expect(target[4]).toBeCloseTo(-0.5);  // ψ4: lip unpucker
  });

  it('mood uses ψ5 (bilateral smile driver) and ψ9 (cheek puff)', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.mood, 1.0);
    expect(target[5]).toBeCloseTo(4.0);   // ψ5: upper lip lift (primary smile, cranked)
    expect(target[9]).toBeCloseTo(5.0);   // ψ9: cheek puff (ecstatic grin)
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

  it('dominance includes new mid-frequency β13, β48', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.dominance, 1.0);
    expect(target[13]).toBeCloseTo(2.5);  // β13: facial structure detail
    expect(target[48]).toBeCloseTo(2.5);  // β48: skull refinement
  });

  it('predator drives eye-region β4, β5, β7, β15', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.predator, 1.0);
    expect(target[15]).toBeCloseTo(-2.5);  // β15: eye distance (negative = close-set)
    expect(target[7]).toBeCloseTo(2.0);    // β7: orbital tilt (positive = sharp)
    expect(target[5]).toBeCloseTo(1.5);    // β5: nasal bridge
    expect(target[4]).toBeCloseTo(1.5);    // β4: brow ridge
  });
});

describe('applyMapping', () => {
  it('adds weighted values to target', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.tension, 2.0);
    // Tension: [[2, 2.5], [0, 1.0], [8, 1.5], [7, -1.5], [5, 0.8], [4, -0.5]]
    expect(target[2]).toBeCloseTo(5.0);
    expect(target[0]).toBeCloseTo(2.0);
    expect(target[8]).toBeCloseTo(3.0);
    expect(target[7]).toBeCloseTo(-3.0);
    // Unused indices should be 0
    expect(target[1]).toBe(0);
    expect(target[3]).toBe(0);
  });

  it('stacks when called multiple times', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.tension, 1.0);
    applyMapping(target, EXPR_AXES.mood, 1.0);
    // ψ0: tension 1.0 + mood 0.3 = 1.3
    expect(target[0]).toBeCloseTo(1.3);
  });

  it('handles negative values', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.dominance, -2.0);
    // β3: 3.0 × -2.0 = -6.0
    expect(target[3]).toBeCloseTo(-6.0);
  });
});
