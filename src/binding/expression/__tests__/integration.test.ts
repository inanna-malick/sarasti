import { describe, it, expect } from 'vitest';
import { mapCrisisToExpression } from '../crisis';
import { mapDynamicsToExpression } from '../dynamics';
import { N_EXPR } from '../../../constants';
import { makeTickerFrame } from '../../../../test-utils/fixtures';

describe('expression pipeline integration', () => {
  it('full pipeline: crisis → dynamics for calm frame', () => {
    const frame = makeTickerFrame({ deviation: 0, velocity: 0, volatility: 1 });
    const crisis = mapCrisisToExpression(frame.deviation);
    const dynamics = mapDynamicsToExpression(
      crisis.expression,
      frame.velocity,
      frame.volatility,
    );
    // Calm: all near zero
    const maxAbs = Math.max(...Array.from(dynamics.expression).map(Math.abs));
    expect(maxAbs).toBeLessThan(0.1);
  });

  it('full pipeline: crisis → dynamics for crisis frame', () => {
    const frame = makeTickerFrame({ deviation: -2.5, velocity: -1.5, volatility: 3.5 });
    const crisis = mapCrisisToExpression(frame.deviation);
    const dynamics = mapDynamicsToExpression(
      crisis.expression,
      frame.velocity,
      frame.volatility,
    );
    // Crisis: significant expression
    const maxAbs = Math.max(...Array.from(dynamics.expression).map(Math.abs));
    expect(maxAbs).toBeGreaterThan(0.3);
  });

  it('progression: 10 frames from calm to crisis', () => {
    const intensities: number[] = [];
    for (let i = 0; i < 10; i++) {
      const t = i / 9; // 0 → 1
      const frame = makeTickerFrame({
        deviation: -t * 3,
        velocity: -t * 2,
        volatility: 1 + t * 3,
      });
      const crisis = mapCrisisToExpression(frame.deviation);
      const dynamics = mapDynamicsToExpression(
        crisis.expression,
        frame.velocity,
        frame.volatility,
      );
      const l2 = Math.sqrt(
        Array.from(dynamics.expression).reduce((sum, v) => sum + v * v, 0),
      );
      intensities.push(l2);
    }
    // Overall trend should be increasing
    expect(intensities[9]).toBeGreaterThan(intensities[0]);
    // First frame should be near zero
    expect(intensities[0]).toBeLessThan(0.1);
    // Last frame should be significant
    expect(intensities[9]).toBeGreaterThan(0.3);
  });

  it('different velocity patterns produce distinguishable expressions', () => {
    const deviation = -2.0;
    const crisis = mapCrisisToExpression(deviation);

    // Scenario A: sharp drop (high negative velocity)
    const sharpDrop = mapDynamicsToExpression(crisis.expression, -2.5, 2.0);
    // Scenario B: slow grind (mild negative velocity)
    const slowGrind = mapDynamicsToExpression(crisis.expression, -0.2, 1.0);
    // Scenario C: bouncing back (positive velocity)
    const bounce = mapDynamicsToExpression(crisis.expression, 1.5, 2.0);

    // All three should be different
    const dist = (a: Float32Array, b: Float32Array) =>
      Math.sqrt(Array.from(a).reduce((s, v, i) => s + (v - b[i]) ** 2, 0));

    expect(dist(sharpDrop.expression, slowGrind.expression)).toBeGreaterThan(0.05);
    expect(dist(sharpDrop.expression, bounce.expression)).toBeGreaterThan(0.05);
    expect(dist(slowGrind.expression, bounce.expression)).toBeGreaterThan(0.05);
  });
});
