import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker, { Env } from '../index';

describe('Worker Fetch Handler', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      ASSETS: {
        fetch: vi.fn(),
      } as unknown as Fetcher,
      MARKET_DATA: {
        get: vi.fn(),
      } as unknown as KVNamespace,
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
      .mockResolvedValueOnce(mock404) // First try for the route
      .mockResolvedValueOnce(mockIndex); // Second try for index.html

    const response = await (worker.fetch as any)(request, mockEnv);

    expect(mockEnv.ASSETS.fetch).toHaveBeenCalledTimes(2);
    expect(response).toBe(mockIndex);
    
    // Check second call was for index.html
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

  it('/api/data returns KV data when available', async () => {
    const request = new Request('https://example.com/api/data');
    const mockKVData = JSON.stringify({ market: 'is good' });
    (mockEnv.MARKET_DATA.get as any).mockResolvedValue(mockKVData);

    const response = await (worker.fetch as any)(request, mockEnv);

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe(mockKVData);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('/api/data redirects to static fallback when KV is empty', async () => {
    const request = new Request('https://example.com/api/data');
    (mockEnv.MARKET_DATA.get as any).mockResolvedValue(null);

    const response = await (worker.fetch as any)(request, mockEnv);

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe('/data/market-data.json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('/api/data returns CORS preflight response', async () => {
    const request = new Request('https://example.com/api/data', {
      method: 'OPTIONS',
    });

    const response = await (worker.fetch as any)(request, mockEnv);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});

describe('Worker Scheduled Handler', () => {
  it('runs without throwing', async () => {
    const mockEnv = {} as Env;
    const mockEvent = {
      scheduledTime: Date.now(),
      cron: '0 6 * * *',
      waitUntil: vi.fn(),
    } as any;

    await expect(worker.scheduled!(mockEvent, mockEnv)).resolves.not.toThrow();
  });
});
