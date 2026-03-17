/**
 * Contract tests for loadFlameModel().
 *
 * These define what the loader Dev must implement:
 * - Fetch binary files and flame_meta.json
 * - Parse into FlameModel with correct typed arrays
 * - Validate dimensions match metadata
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadFlameModel } from './loader';
import { mockModelToFiles, MOCK_N_VERTICES, MOCK_N_FACES } from '../../../test-utils/flame-fixtures';
import { N_SHAPE, N_EXPR } from '../../constants';

// Mock fetch to serve our fixture files
function setupMockFetch() {
  const files = mockModelToFiles();

  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
    const filename = urlStr.split('/').pop()!;
    const buffer = files.get(filename);

    if (!buffer) {
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }

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

describe('loadFlameModel', () => {
  beforeEach(() => {
    setupMockFetch();
  });

  it('loads model with correct dimensions', async () => {
    const model = await loadFlameModel('/data/');

    expect(model.n_vertices).toBe(MOCK_N_VERTICES);
    expect(model.n_faces).toBe(MOCK_N_FACES);
    expect(model.n_shape).toBe(N_SHAPE);
    expect(model.n_expr).toBe(N_EXPR);
  });

  it('template has correct length', async () => {
    const model = await loadFlameModel('/data/');
    expect(model.template.length).toBe(MOCK_N_VERTICES * 3);
    expect(model.template).toBeInstanceOf(Float32Array);
  });

  it('faces has correct length', async () => {
    const model = await loadFlameModel('/data/');
    expect(model.faces.length).toBe(MOCK_N_FACES * 3);
    expect(model.faces).toBeInstanceOf(Uint32Array);
  });

  it('shapedirs has correct length', async () => {
    const model = await loadFlameModel('/data/');
    expect(model.shapedirs.length).toBe(MOCK_N_VERTICES * 3 * N_SHAPE);
    expect(model.shapedirs).toBeInstanceOf(Float32Array);
  });

  it('exprdirs has correct length', async () => {
    const model = await loadFlameModel('/data/');
    expect(model.exprdirs.length).toBe(MOCK_N_VERTICES * 3 * N_EXPR);
    expect(model.exprdirs).toBeInstanceOf(Float32Array);
  });

  it('fetches all expected files', async () => {
    await loadFlameModel('/data/');

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const urls = calls.map((c: unknown[]) => {
      const url = c[0];
      return typeof url === 'string' ? url : '';
    });

    expect(urls).toContainEqual(expect.stringContaining('flame_meta.json'));
    expect(urls).toContainEqual(expect.stringContaining('flame_template.bin'));
    expect(urls).toContainEqual(expect.stringContaining('flame_faces.bin'));
    expect(urls).toContainEqual(expect.stringContaining('flame_shapedirs.bin'));
    expect(urls).toContainEqual(expect.stringContaining('flame_exprdirs.bin'));
  });

  it('throws a clear error if kintreeTable is null', async () => {
    // Modify fetch mock for this test only
    const originalFetch = global.fetch;
    try {
      global.fetch = vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
        if (urlStr.includes('flame_kintree.json')) {
          return new Response('null', {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return (originalFetch as any)(url);
      }) as unknown as typeof fetch;

      await expect(loadFlameModel('/data/')).rejects.toThrow(/Invalid kintree data/i);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
