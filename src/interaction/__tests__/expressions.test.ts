import { describe, it, expect } from 'vitest';
import { describeExpression } from '../detail';

describe('interaction/detail.tsx:describeExpression', () => {
  it('stable - near baseline (0.01)', () => {
    expect(describeExpression(0.01, 0, 1)).toBe('Stable — near baseline.');
  });

  it('minor deviation - below baseline (-0.05)', () => {
    expect(describeExpression(-0.05, 0, 1)).toBe('Minor Deviation — 5% below baseline.');
  });

  it('significant drawdown - well below baseline (-0.15)', () => {
    expect(describeExpression(-0.15, 0, 1)).toBe('Significant Drawdown — 15% below baseline.');
  });

  it('minor positive - above baseline (0.05)', () => {
    expect(describeExpression(0.05, 0, 1)).toBe('Minor Positive — 5% above baseline.');
  });

  it('positive surge - well above baseline (0.15)', () => {
    expect(describeExpression(0.15, 0, 1)).toBe('Positive Surge — 15% above baseline.');
  });

  it('stable + rapid decline', () => {
    expect(describeExpression(0.01, -0.2, 1)).toContain('Rapid decline indicates market pressure.');
  });

  it('stable + momentum', () => {
    expect(describeExpression(0.01, 0.2, 1)).toContain('Positive momentum indicates recovery.');
  });

  it('stable + elevated volatility', () => {
    expect(describeExpression(0.01, 0, 2)).toContain('Elevated volatility detected.');
  });

  it('significant drawdown + rapid decline + elevated volatility', () => {
    const res = describeExpression(-0.15, -0.2, 2);
    expect(res).toContain('Significant Drawdown');
    expect(res).toContain('Rapid decline');
    expect(res).toContain('Elevated volatility');
  });

  it('positive surge + momentum + elevated volatility', () => {
    const res = describeExpression(0.15, 0.2, 2);
    expect(res).toContain('Positive Surge');
    expect(res).toContain('Positive momentum');
    expect(res).toContain('Elevated volatility');
  });

  it('stable - very near zero', () => {
    expect(describeExpression(0.001, 0, 1)).toBe('Stable — near baseline.');
  });

  it('edge case: deviation exactly 0.02', () => {
    // 0.02 < 0.02 is false, so it should be 'Minor Positive'
    expect(describeExpression(0.02, 0, 1)).toBe('Minor Positive — 2% above baseline.');
  });

  it('edge case: deviation exactly -0.1', () => {
    // -0.1 < -0.1 is false, so it should be 'Minor Deviation'
    expect(describeExpression(-0.1, 0, 1)).toBe('Minor Deviation — 10% below baseline.');
  });

  it('edge case: velocity exactly 0.1', () => {
    // Math.abs(0.1) > 0.1 is false
    expect(describeExpression(0.01, 0.1, 1)).not.toContain('Positive momentum');
  });

  it('edge case: volatility exactly 1', () => {
    // 1 > 1 is false
    expect(describeExpression(0.01, 0, 1)).not.toContain('Elevated volatility');
  });
});
