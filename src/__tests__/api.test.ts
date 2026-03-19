/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SarastiBuilder } from '../api';
import type { FaceRenderer, FaceDatum } from '../types';
import { N_SHAPE, N_EXPR } from '../constants';

// Mock renderer
function createMockRenderer(): FaceRenderer {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    setInstances: vi.fn(),
    highlightInstance: vi.fn(),
    getInstanceAtScreenPos: vi.fn().mockReturnValue(null),
    setCameraTarget: vi.fn(),
    dispose: vi.fn(),
  };
}

// Test data
interface TestDatum extends FaceDatum {
  score: number;
  risk: number;
}

const testData: TestDatum[] = [
  { id: 'a', score: 0.8, risk: 0.3 },
  { id: 'b', score: -0.2, risk: 0.9 },
  { id: 'c', score: 0.5, risk: 0.1 },
];

describe('SarastiBuilder', () => {
  it('chainable API returns this', () => {
    const builder = new SarastiBuilder<TestDatum>(document.createElement('div'));
    const result = builder
      .data(testData)
      .axes({ mood: d => d.score })
      .layout({ cols: 3 });
    expect(result).toBe(builder);
  });

  it('resolveDatum produces valid FaceParams', () => {
    const builder = new SarastiBuilder<TestDatum>(document.createElement('div'));
    builder.data(testData).axes({
      mood: d => d.score,
      tension: d => d.risk,
    });

    // Access private method via any for testing
    const params = (builder as any).resolveDatum(testData[0]);
    expect(params.expression.length).toBe(N_EXPR);
    expect(params.shape.length).toBe(N_SHAPE);
    // mood accessor returns 0.8, should produce nonzero ψ9 (cheek puff)
    expect(params.expression[9]).not.toBe(0); // ψ9 driven by mood
  });

  it('different data produces different expressions', () => {
    const builder = new SarastiBuilder<TestDatum>(document.createElement('div'));
    builder.data(testData).axes({ mood: d => d.score });

    const paramsA = (builder as any).resolveDatum(testData[0]); // score 0.8
    const paramsB = (builder as any).resolveDatum(testData[1]); // score -0.2

    // Different scores should produce different mood values
    expect(paramsA.expression[9]).not.toBeCloseTo(paramsB.expression[9]);
  });

  it('dispose prevents further renders', async () => {
    const builder = new SarastiBuilder<TestDatum>(document.createElement('div'));
    builder.dispose();
    await expect(builder.render()).rejects.toThrow('disposed');
  });

  it('axes with no accessors produces near-zero expression', () => {
    const builder = new SarastiBuilder<TestDatum>(document.createElement('div'));
    builder.data(testData).axes({});

    const params = (builder as any).resolveDatum(testData[0]);
    // No axes set, so expression should be all zeros
    for (let i = 0; i < 10; i++) {
      expect(params.expression[i]).toBe(0);
    }
  });
});
