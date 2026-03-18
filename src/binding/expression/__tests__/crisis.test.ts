import { describe, it, expect } from 'vitest';
import { mapCrisisToExpression } from '../crisis';
import { N_EXPR } from '../../../constants';
import { DEFAULT_BINDING_CONFIG } from '../../config';

describe('mapCrisisToExpression', () => {
  it('zero deviation → neutral register, near-zero expression', () => {
    const result = mapCrisisToExpression(0);
    expect(result.register).toBe('neutral');
    expect(result.intensity).toBe(0);
    const maxAbs = Math.max(...Array.from(result.expression).map(Math.abs));
    expect(maxAbs).toBe(0);
  });

  it('returns Float32Array of length N_EXPR', () => {
    const result = mapCrisisToExpression(-1.5);
    expect(result.expression).toBeInstanceOf(Float32Array);
    expect(result.expression.length).toBe(N_EXPR);
  });

  it('negative deviation → distress register', () => {
    const result = mapCrisisToExpression(-2.0);
    expect(result.register).toBe('distress');
    expect(result.intensity).toBeGreaterThan(0.5);
  });

  it('positive deviation → shock register', () => {
    const result = mapCrisisToExpression(2.0);
    expect(result.register).toBe('shock');
    expect(result.intensity).toBeGreaterThan(0.5);
  });

  it('intensity increases monotonically with |deviation|', () => {
    const intensities = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map(
      d => mapCrisisToExpression(-d).intensity,
    );
    for (let i = 1; i < intensities.length; i++) {
      expect(intensities[i]).toBeGreaterThanOrEqual(intensities[i - 1]);
    }
  });

  it('large deviation → strong expression (intensity > 0.6)', () => {
    // With CMA-ES optimized steepness (1.18), sigmoid is gentler —
    // ±3.0 still produces strong but not near-max output
    const neg = mapCrisisToExpression(-3.0);
    const pos = mapCrisisToExpression(3.0);
    expect(neg.intensity).toBeGreaterThan(0.6);
    expect(pos.intensity).toBeGreaterThan(0.6);
  });

  it('expression is symmetric in magnitude for ±deviation', () => {
    const neg = mapCrisisToExpression(-2.0);
    const pos = mapCrisisToExpression(2.0);
    expect(Math.abs(neg.intensity - pos.intensity)).toBeLessThan(0.05);
  });

  it('only sets components at allocated register indices', () => {
    const result = mapCrisisToExpression(-2.5);
    const { distress } = DEFAULT_BINDING_CONFIG.expression;
    const allocatedIndices = new Set(distress.indices);

    for (let i = 0; i < N_EXPR; i++) {
      if (!allocatedIndices.has(i)) {
        expect(result.expression[i]).toBe(0);
      }
    }
  });

  it('all expression values are finite', () => {
    for (const dev of [-5, -3, -1, 0, 0.5, 1, 3, 5]) {
      const result = mapCrisisToExpression(dev);
      for (let i = 0; i < N_EXPR; i++) {
        expect(Number.isFinite(result.expression[i])).toBe(true);
      }
    }
  });
});
