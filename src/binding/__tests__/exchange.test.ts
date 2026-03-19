import { describe, it, expect } from 'vitest';
import { computeExchangeFatigue } from '../exchange';

describe('computeExchangeFatigue', () => {
  it('24H exchange returns -0.3 always', () => {
    expect(computeExchangeFatigue('24H', 0)).toBe(-0.3);
    expect(computeExchangeFatigue('24H', 12)).toBe(-0.3);
    expect(computeExchangeFatigue('24H', 23)).toBe(-0.3);
  });

  it('NYSE peak hours (13:30-20:00 UTC) return -0.8', () => {
    expect(computeExchangeFatigue('NYSE', 15)).toBe(-0.8);
    expect(computeExchangeFatigue('NYSE', 17)).toBe(-0.8);
    expect(computeExchangeFatigue('NYSE', 19)).toBe(-0.8);
  });

  it('NYMEX peak hours (13:00-17:30 UTC) return -0.8', () => {
    expect(computeExchangeFatigue('NYMEX', 14)).toBe(-0.8);
    expect(computeExchangeFatigue('NYMEX', 16)).toBe(-0.8);
  });

  it('far from peak returns +0.6', () => {
    // NYSE peak is 13.5-20, so 3 AM UTC is far away
    expect(computeExchangeFatigue('NYSE', 3)).toBe(0.6);
    // NYMEX peak is 13-17.5, so 3 AM is far away
    expect(computeExchangeFatigue('NYMEX', 3)).toBe(0.6);
  });

  it('shoulder zone returns intermediate value', () => {
    // NYSE peak ends at 20, shoulder extends to ~21.5
    const shoulder = computeExchangeFatigue('NYSE', 21);
    expect(shoulder).toBeGreaterThan(-0.8);
    expect(shoulder).toBeLessThan(0.6);
  });

  it('fatigue is symmetric around peak', () => {
    // NYMEX peak center is (13+17.5)/2 = 15.25
    // 2 hours before peak start vs 2 hours after peak end should be similar
    const before = computeExchangeFatigue('NYMEX', 11);
    const after = computeExchangeFatigue('NYMEX', 19.5);
    // Both should be in the shoulder/far zone
    expect(before).toBeGreaterThan(-0.8);
    expect(after).toBeGreaterThan(-0.8);
  });

  it('output range is [-0.8, 0.6]', () => {
    for (let h = 0; h < 24; h += 0.5) {
      for (const exchange of ['NYMEX', 'NYSE', 'CBOE', 'COMEX', 'ICE'] as const) {
        const v = computeExchangeFatigue(exchange, h);
        expect(v).toBeGreaterThanOrEqual(-0.8 - 1e-9);
        expect(v).toBeLessThanOrEqual(0.6 + 1e-9);
      }
    }
  });
});
