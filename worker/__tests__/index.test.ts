import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker, { Env } from '../index';

describe('Worker Fetch Handler', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      ASSETS: {
        fetch: vi.fn(),
      } as unknown as Fetcher,
    };
  });

  it('serves static content for normal requests', async () => {
    const request = new Request('https://example.com/some-page');
    const mockResponse = new Response('Static content');
    (mockEnv.ASSETS.fetch as any).mockResolvedValue(mockResponse);

    const response = await (worker.fetch as any)(request, mockEnv);

    expect(mockEnv.ASSETS.fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(mockResponse);
  });

  it('performs SPA fallback to index.html for 404s on non-file paths', async () => {
    const request = new Request('https://example.com/route/without/extension');
    const mock404 = new Response('Not Found', { status: 404 });
    const mockIndex = new Response('Index HTML');

    (mockEnv.ASSETS.fetch as any)
      .mockResolvedValueOnce(mock404)
      .mockResolvedValueOnce(mockIndex);

    const response = await (worker.fetch as any)(request, mockEnv);

    expect(mockEnv.ASSETS.fetch).toHaveBeenCalledTimes(2);
    expect(response).toBe(mockIndex);

    const secondCallRequest = (mockEnv.ASSETS.fetch as any).mock.calls[1][0];
    expect(secondCallRequest.url).toContain('/index.html');
  });

  it('does NOT fallback to index.html for 404s on actual file paths', async () => {
    const request = new Request('https://example.com/missing-image.png');
    const mock404 = new Response('Not Found', { status: 404 });

    (mockEnv.ASSETS.fetch as any).mockResolvedValue(mock404);

    const response = await (worker.fetch as any)(request, mockEnv);

    expect(mockEnv.ASSETS.fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
  });
});
