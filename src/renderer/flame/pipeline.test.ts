/**
 * Integration test: loader → deformer end-to-end pipeline.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFlamePipeline } from './pipeline';
import { mockModelToFiles, MOCK_N_VERTICES, makeMockFlameModel } from '../../../test-utils/flame-fixtures';
import { N_SHAPE, N_EXPR } from '../../constants';
import { zeroPose } from '../../types';

function setupMockFetch() {
  const files = mockModelToFiles();
  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
    const filename = urlStr.split('/').pop()!;
    const buffer = files.get(filename);
    if (!buffer) return new Response(null, { status: 404 });
    if (filename.endsWith('.json')) {
      return new Response(new TextDecoder().decode(new Uint8Array(buffer)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(buffer, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }) as unknown as typeof fetch;
}

describe('FlamePipeline (loader → deformer)', () => {
  beforeEach(() => setupMockFetch());

  it('loads model and deforms with zero params → template', async () => {
    const pipeline = await createFlamePipeline('/data/');
    const params = {
      shape: new Float32Array(N_SHAPE),
      expression: new Float32Array(N_EXPR),
      pose: zeroPose(),
    };

    const result = pipeline.deformFace(params);
    const template = makeMockFlameModel().template;

    expect(result.vertices.length).toBe(MOCK_N_VERTICES * 3);
    for (let i = 0; i < template.length; i++) {
      expect(result.vertices[i]).toBeCloseTo(template[i], 5);
    }
  });

  it('deforms with non-zero params → different from template', async () => {
    const pipeline = await createFlamePipeline('/data/');
    const params = {
      shape: new Float32Array(N_SHAPE),
      expression: new Float32Array(N_EXPR),
      pose: zeroPose(),
    };
    params.shape[0] = 2.0;
    params.expression[0] = 1.5;

    const result = pipeline.deformFace(params);
    const template = makeMockFlameModel().template;

    let totalDiff = 0;
    for (let i = 0; i < template.length; i++) {
      totalDiff += Math.abs(result.vertices[i] - template[i]);
    }
    expect(totalDiff).toBeGreaterThan(0.1);
  });

  it('multiple deformations are independent (no state leak)', async () => {
    const pipeline = await createFlamePipeline('/data/');

    const params1 = { shape: new Float32Array(N_SHAPE), expression: new Float32Array(N_EXPR), pose: zeroPose() };
    params1.shape[0] = 1.0;

    const params2 = { shape: new Float32Array(N_SHAPE), expression: new Float32Array(N_EXPR), pose: zeroPose() };

    const r1 = pipeline.deformFace(params1);
    const r2 = pipeline.deformFace(params2);

    // r2 with zero params should match template, unaffected by r1
    const template = makeMockFlameModel().template;
    for (let i = 0; i < template.length; i++) {
      expect(r2.vertices[i]).toBeCloseTo(template[i], 5);
    }
  });

  it('exposes loaded model for mesh construction', async () => {
    const pipeline = await createFlamePipeline('/data/');
    expect(pipeline.model.n_vertices).toBe(MOCK_N_VERTICES);
    expect(pipeline.model.faces.length).toBe(4 * 3);
  });
});
