import { describe, it, expect } from 'vitest';
import { describeExpression } from '../detail';

describe('interaction/detail.tsx:describeExpression', () => {
  it('calm - near baseline (0.01)', () => {
    expect(describeExpression(0.01, 0, 1)).toBe('Calm — near baseline.');
  });

  it('mild concern - below baseline (-0.05)', () => {
    expect(describeExpression(-0.05, 0, 1)).toBe('Mild concern — 5% below baseline.');
  });

  it('distress - well below baseline (-0.15)', () => {
    expect(describeExpression(-0.15, 0, 1)).toBe('Distress — 15% below baseline.');
  });

  it('slight positive - above baseline (0.05)', () => {
    expect(describeExpression(0.05, 0, 1)).toBe('Slight positive — 5% above baseline.');
  });

  it('shock/surge - well above baseline (0.15)', () => {
    expect(describeExpression(0.15, 0, 1)).toBe('Shock/surge — 15% above baseline.');
  });

  it('calm + sharp drop', () => {
    expect(describeExpression(0.01, -0.2, 1)).toContain('Sharp drop amplifies fear.');
  });

  it('calm + rally', () => {
    expect(describeExpression(0.01, 0.2, 1)).toContain('Rally shifts toward relief.');
  });

  it('calm + high volatility', () => {
    expect(describeExpression(0.01, 0, 2)).toContain('High volatility — expression is conflicted.');
  });

  it('distress + sharp drop + high volatility', () => {
    const res = describeExpression(-0.15, -0.2, 2);
    expect(res).toContain('Distress');
    expect(res).toContain('Sharp drop');
    expect(res).toContain('High volatility');
  });

  it('shock + rally + high volatility', () => {
    const res = describeExpression(0.15, 0.2, 2);
    expect(res).toContain('Shock');
    expect(res).toContain('Rally');
    expect(res).toContain('High volatility');
  });

  it('calm - very near zero', () => {
    expect(describeExpression(0.001, 0, 1)).toBe('Calm — near baseline.');
  });

  it('edge case: deviation exactly 0.02', () => {
    // 0.02 < 0.02 is false, so it should be 'Slight positive'
    expect(describeExpression(0.02, 0, 1)).toBe('Slight positive — 2% above baseline.');
  });

  it('edge case: deviation exactly -0.1', () => {
    // -0.1 < -0.1 is false, so it should be 'Mild concern'
    expect(describeExpression(-0.1, 0, 1)).toBe('Mild concern — 10% below baseline.');
  });

  it('edge case: velocity exactly 0.1', () => {
    // Math.abs(0.1) > 0.1 is false
    expect(describeExpression(0.01, 0.1, 1)).not.toContain('Rally');
  });

  it('edge case: volatility exactly 1', () => {
    // 1 > 1 is false
    expect(describeExpression(0.01, 0, 1)).not.toContain('High volatility');
  });
});
