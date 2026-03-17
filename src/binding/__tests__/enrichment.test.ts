import { describe, it, expect } from 'vitest';
import { createExpressionResolver } from '../resolve';
import { makeTickerFrame } from '../../../test-utils/fixtures';
import { N_EXPR } from '../../constants';
import { DEFAULT_BINDING_CONFIG } from '../config';

describe('Expression Enrichment', () => {
  const resolver = createExpressionResolver(DEFAULT_BINDING_CONFIG);

  it('volume_anomaly > 1 activates alertness register', () => {
    const frame = makeTickerFrame({ 
      deviation: 0, 
      volume_anomaly: 2.0 // Surge
    });
    const expr = resolver.resolve(frame);

    // ψ9, ψ16-19 are alertness indices
    const alertnessIndices = [9, 16, 17, 18, 19];
    for (const idx of alertnessIndices) {
      expect(expr[idx]).toBeGreaterThan(0);
    }
  });

  it('volume_anomaly < 1 activates exhaustion register', () => {
    const frame = makeTickerFrame({ 
      deviation: 0, 
      volume_anomaly: 0.0 // Collapse
    });
    const expr = resolver.resolve(frame);

    // ψ9, ψ16-19 should be negative for exhaustion
    const exhaustionIndices = [9, 16, 17, 18, 19];
    for (const idx of exhaustionIndices) {
      expect(expr[idx]).toBeLessThan(0);
    }
  });

  it('corr_breakdown produces visible tier 3 expression components', () => {
    const frame = makeTickerFrame({ 
      deviation: 0, 
      corr_breakdown: 1.0 
    });
    const expr = resolver.resolve(frame);

    // ψ21-25 are corr_breakdown indices
    for (let i = 21; i <= 25; i++) {
      expect(Math.abs(expr[i])).toBeGreaterThan(0.1);
    }
  });

  it('term_slope produces visible tier 3 expression components', () => {
    const frame = makeTickerFrame({ 
      deviation: 0, 
      term_slope: 0.5 
    });
    const expr = resolver.resolve(frame);

    // ψ26-30 are term_structure indices
    for (let i = 26; i <= 30; i++) {
      expect(Math.abs(expr[i])).toBeGreaterThan(0.1);
    }
  });

  it('cross_contagion produces visible tier 3 expression components', () => {
    const frame = makeTickerFrame({ 
      deviation: 0, 
      cross_contagion: 1.0 
    });
    const expr = resolver.resolve(frame);

    // ψ31-35 are contagion indices
    for (let i = 31; i <= 35; i++) {
      expect(Math.abs(expr[i])).toBeGreaterThan(0.1);
    }
  });

  it('high_low_ratio produces visible tier 3 expression components', () => {
    const frame = makeTickerFrame({ 
      deviation: 0, 
      high_low_ratio: 0.05 
    });
    const expr = resolver.resolve(frame);

    // ψ36-40 are strain indices
    for (let i = 36; i <= 40; i++) {
      expect(Math.abs(expr[i])).toBeGreaterThan(0.1);
    }
  });

  it('Sarasti residuals are correctly injected into ψ41-100', () => {
    const residuals = new Array(60).fill(0).map((_, i) => (i + 1) / 100);
    const frame = makeTickerFrame({ 
      deviation: 0, 
      expr_residuals: residuals
    });
    const expr = resolver.resolve(frame);

    const tiers = DEFAULT_BINDING_CONFIG.tier_intensities || [1, 0.5, 0.2, 0.1];
    const sarastiScale = tiers[3];

    for (let i = 0; i < 60; i++) {
      expect(expr[40 + i]).toBeCloseTo(residuals[i] * sarastiScale, 5);
    }
  });

  it('enriched expressions use more non-zero ψ dimensions than before', () => {
    const baseFrame = makeTickerFrame({ deviation: -0.5 });
    const enrichedFrame = makeTickerFrame({ 
      deviation: -0.5,
      volume_anomaly: 1.5,
      corr_breakdown: 0.5,
      term_slope: 0.2,
      cross_contagion: 0.3,
      high_low_ratio: 0.02
    });

    const baseExpr = resolver.resolve(baseFrame);
    const enrichedExpr = resolver.resolve(enrichedFrame);

    const baseNonZero = Array.from(baseExpr).filter(v => Math.abs(v) > 0.001).length;
    const enrichedNonZero = Array.from(enrichedExpr).filter(v => Math.abs(v) > 0.001).length;

    expect(enrichedNonZero).toBeGreaterThan(baseNonZero);
  });
});
