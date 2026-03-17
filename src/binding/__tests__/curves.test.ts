import { describe, it, expect } from 'vitest';
import { applyCurve, applySymmetricCurve } from '../curves';
import type { ResponseCurve } from '../types';

const LINEAR_CURVE: ResponseCurve = {
  type: 'linear',
  input_min: 0,
  input_max: 1,
  output_min: 0,
  output_max: 10,
  steepness: 1,
};

const SIGMOID_CURVE: ResponseCurve = {
  type: 'sigmoid',
  input_min: -3,
  input_max: 3,
  output_min: 0,
  output_max: 1,
  steepness: 10,
};

const EXP_CURVE: ResponseCurve = {
  type: 'exponential',
  input_min: 0,
  input_max: 1,
  output_min: 0,
  output_max: 1,
  steepness: 3,
};

describe('applyCurve', () => {
  it('linear: maps input range to output range', () => {
    expect(applyCurve(LINEAR_CURVE, 0)).toBeCloseTo(0);
    expect(applyCurve(LINEAR_CURVE, 0.5)).toBeCloseTo(5);
    expect(applyCurve(LINEAR_CURVE, 1)).toBeCloseTo(10);
  });

  it('linear: clamps input outside range', () => {
    expect(applyCurve(LINEAR_CURVE, -1)).toBeCloseTo(0);
    expect(applyCurve(LINEAR_CURVE, 2)).toBeCloseTo(10);
  });

  it('sigmoid: near-zero at input_min, near-one at input_max', () => {
    const atMin = applyCurve(SIGMOID_CURVE, -3);
    const atMax = applyCurve(SIGMOID_CURVE, 3);
    expect(atMin).toBeLessThan(0.05);
    expect(atMax).toBeGreaterThan(0.95);
  });

  it('sigmoid: midpoint is near 0.5', () => {
    const atMid = applyCurve(SIGMOID_CURVE, 0);
    expect(atMid).toBeCloseTo(0.5, 1);
  });

  it('exponential: slow start, fast finish', () => {
    const atQuarter = applyCurve(EXP_CURVE, 0.25);
    const atHalf = applyCurve(EXP_CURVE, 0.5);
    const atThreeQuarter = applyCurve(EXP_CURVE, 0.75);
    // Exponential: concave up — progress at 0.25 should be less than linear (0.25)
    expect(atQuarter).toBeLessThan(0.25);
    // Monotonically increasing
    expect(atQuarter).toBeLessThan(atHalf);
    expect(atHalf).toBeLessThan(atThreeQuarter);
    // Endpoints
    expect(applyCurve(EXP_CURVE, 0)).toBeCloseTo(0);
    expect(applyCurve(EXP_CURVE, 1)).toBeCloseTo(1);
  });

  it('handles zero-range input gracefully', () => {
    const zeroCurve: ResponseCurve = { ...LINEAR_CURVE, input_min: 5, input_max: 5 };
    expect(applyCurve(zeroCurve, 5)).toBe(0); // output_min
  });
});

describe('applySymmetricCurve', () => {
  const SYM_CURVE: ResponseCurve = {
    type: 'linear',
    input_min: -3,
    input_max: 3,
    output_min: -1,
    output_max: 1,
    steepness: 1,
  };

  it('zero input → zero output', () => {
    expect(applySymmetricCurve(SYM_CURVE, 0)).toBeCloseTo(0);
  });

  it('preserves sign', () => {
    const pos = applySymmetricCurve(SYM_CURVE, 1.5);
    const neg = applySymmetricCurve(SYM_CURVE, -1.5);
    expect(pos).toBeGreaterThan(0);
    expect(neg).toBeLessThan(0);
    expect(Math.abs(pos)).toBeCloseTo(Math.abs(neg));
  });
});
