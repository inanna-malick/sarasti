import { describe, it, expect } from 'vitest';
import { createExpressionResolver } from '../resolve';
import { makeTickerFrame } from '../../../test-utils/fixtures';
import { N_EXPR } from '../../constants';
import { DEFAULT_BINDING_CONFIG } from '../config';

describe('Expression Axis Mapping', () => {
  const resolver = createExpressionResolver(DEFAULT_BINDING_CONFIG);

  it('deviation drives joy axis', () => {
    const frame = makeTickerFrame({ deviation: 0.5 });
    const expr = resolver.resolve(frame);
    // ψ0 is joy index
    expect(Math.abs(expr[0])).toBeGreaterThan(0);
  });

  it('velocity drives surprise axis', () => {
    const frame = makeTickerFrame({ velocity: 2.0 });
    const expr = resolver.resolve(frame);
    // ψ2 is surprise index
    expect(Math.abs(expr[2])).toBeGreaterThan(0);
  });

  it('volatility drives tension axis', () => {
    const frame = makeTickerFrame({ volatility: 2.0 });
    const expr = resolver.resolve(frame);
    // ψ4 is tension index
    expect(Math.abs(expr[4])).toBeGreaterThan(0);
  });

  it('drawdown drives anguish axis', () => {
    const frame = makeTickerFrame({ drawdown: -0.5 });
    const expr = resolver.resolve(frame);
    // ψ3 is anguish index
    expect(Math.abs(expr[3])).toBeGreaterThan(0);
  });

  it('expressions use correct array lengths', () => {
    const expr = resolver.resolve(makeTickerFrame());
    expect(expr.length).toBe(N_EXPR);
  });
});
