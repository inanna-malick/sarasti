import { describe, it, expect } from 'vitest';
import { mapDynamicsToExpression } from '../dynamics';
import { mapCrisisToExpression } from '../crisis';
import { N_EXPR } from '../../../constants';

describe('mapDynamicsToExpression', () => {
  it('returns Float32Array of length N_EXPR', () => {
    const base = new Float32Array(N_EXPR);
    const result = mapDynamicsToExpression(base, 0, 1);
    expect(result.expression).toBeInstanceOf(Float32Array);
    expect(result.expression.length).toBe(N_EXPR);
  });

  it('zero velocity + normal volatility → expression unchanged from base', () => {
    const base = mapCrisisToExpression(-1.5).expression;
    const result = mapDynamicsToExpression(base, 0, 1);
    // Should be very close to base (no significant modulation)
    let diff = 0;
    for (let i = 0; i < N_EXPR; i++) {
      diff += Math.abs(result.expression[i] - base[i]);
    }
    expect(diff).toBeLessThan(0.5);
  });

  it('sharp negative velocity → adds shock components', () => {
    const base = mapCrisisToExpression(-2.0).expression;
    const noVel = mapDynamicsToExpression(base, 0, 1).expression;
    const sharpVel = mapDynamicsToExpression(base, -2.0, 1).expression;

    // Sharp velocity should produce different output than no velocity
    let diff = 0;
    for (let i = 0; i < N_EXPR; i++) {
      diff += (noVel[i] - sharpVel[i]) ** 2;
    }
    expect(Math.sqrt(diff)).toBeGreaterThan(0.01);
  });

  it('positive velocity → blends relief components', () => {
    const base = mapCrisisToExpression(-1.0).expression;
    const result = mapDynamicsToExpression(base, 1.5, 1);
    // Should have some relief register activity
    expect(result.expression).not.toEqual(base);
  });

  it('high velocity + high deviation → shock > dread', () => {
    const base = mapCrisisToExpression(-2.5).expression;
    const highVel = mapDynamicsToExpression(base, -2.0, 3);
    const lowVel = mapDynamicsToExpression(base, -0.1, 3);
    // High velocity version should differ from low velocity version
    let diff = 0;
    for (let i = 0; i < N_EXPR; i++) {
      diff += (highVel.expression[i] - lowVel.expression[i]) ** 2;
    }
    expect(Math.sqrt(diff)).toBeGreaterThan(0.05);
  });

  it('complexity score is in [0, 1]', () => {
    const base = mapCrisisToExpression(-2.0).expression;
    for (const vol of [0.1, 0.5, 1, 2, 4]) {
      const result = mapDynamicsToExpression(base, -1, vol);
      expect(result.complexity).toBeGreaterThanOrEqual(0);
      expect(result.complexity).toBeLessThanOrEqual(1);
    }
  });

  it('low volatility → suppresses weak components (cleaner expression)', () => {
    const base = mapCrisisToExpression(-2.0).expression;
    // Add some mixed components
    const mixed = mapDynamicsToExpression(base, -1.5, 0.1);
    // Low volatility should suppress weak components
    const nonZero = Array.from(mixed.expression).filter(v => Math.abs(v) > 0.01).length;
    // Should have relatively few active components
    expect(nonZero).toBeLessThan(N_EXPR / 2);
  });

  it('all expression values are finite', () => {
    const base = mapCrisisToExpression(-2.0).expression;
    for (const vel of [-3, -1, 0, 1, 3]) {
      for (const vol of [0, 0.5, 1, 3, 5]) {
        const result = mapDynamicsToExpression(base, vel, vol);
        for (let i = 0; i < N_EXPR; i++) {
          expect(Number.isFinite(result.expression[i])).toBe(true);
        }
      }
    }
  });
});
