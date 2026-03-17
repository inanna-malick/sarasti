/**
 * Cloudflare Worker entry point for The Tidal Scream.
 *
 * Responsibilities:
 * 1. Serve static Vite build (index.html, JS, CSS, assets) from __STATIC_CONTENT
 * 2. GET /api/data → serve market-data.json from KV (falls back to static file)
 * 3. Cron trigger (daily) → fetch latest market data, append to KV dataset
 *
 * The static site is a single-page React app. All routes that don't match
 * /api/* or a static file should serve index.html (SPA fallback).
 *
 * KV namespace: MARKET_DATA — stores the full market-history JSON.
 * When KV has data, /api/data serves it (fresher). When KV is empty,
 * falls back to the static market-data.json baked into the build.
 *
 * Environment bindings (wrangler.toml):
 *   - __STATIC_CONTENT: Sites binding (auto-configured by wrangler for Pages-style)
 *   - MARKET_DATA: KV namespace binding
 */

export interface Env {
  __STATIC_CONTENT: Fetcher;
  MARKET_DATA: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API route: serve market data from KV (fall back to static)
    if (url.pathname === '/api/data') {
      return handleDataRequest(env);
    }

    // All other requests: serve static content
    return env.__STATIC_CONTENT.fetch(request);
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    // Daily cron: placeholder for future data refresh
    // Will fetch latest market data and update KV
    console.log('Cron triggered — data refresh not yet implemented');
  },
};

async function handleDataRequest(env: Env): Promise<Response> {
  // Try KV first (freshest data)
  try {
    const kvData = await env.MARKET_DATA.get('market-data', 'text');
    if (kvData) {
      return new Response(kvData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (e) {
    console.error('KV read failed:', e);
  }

  // Fall back to static file
  const staticUrl = new URL('/data/market-data.json', 'https://placeholder');
  const staticRequest = new Request(staticUrl.toString());
  return new Response(null, {
    status: 307,
    headers: { Location: '/data/market-data.json' },
  });
}
