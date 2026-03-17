/**
 * Cloudflare Worker entry point for The Tidal Scream.
 *
 * Responsibilities:
 * 1. Serve static Vite build (index.html, JS, CSS, assets) from ASSETS
 * 2. GET /api/data → serve market-data.json from KV (falls back to static file)
 * 3. Cron trigger (daily) → fetch latest market data, append to KV dataset
 * 4. SPA routing: serve index.html for non-API, non-asset requests
 */

export interface Env {
  ASSETS: Fetcher;
  MARKET_DATA: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. API routes
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/data' && request.method === 'GET') {
        return handleDataRequest(env);
      }
      
      // Handle CORS preflight for API
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      return new Response('Not Found', { status: 404 });
    }

    // 2. Fetch from Assets
    let response = await env.ASSETS.fetch(request);

    // 3. SPA Fallback: if 404 and doesn't look like a static asset file
    // (no extension in the last path segment), serve index.html
    const isAssetFile = url.pathname.split('/').pop()?.includes('.');
    if (response.status === 404 && !isAssetFile) {
      const indexRequest = new Request(new URL('/index.html', request.url));
      response = await env.ASSETS.fetch(indexRequest);
    }

    return response;
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    // Daily cron: placeholder for future data refresh
    console.log('Cron triggered — data refresh not yet implemented');
  },
};

async function handleDataRequest(env: Env): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Try KV first (freshest data)
  try {
    const kvData = await env.MARKET_DATA.get('market-data', 'text');
    if (kvData) {
      return new Response(kvData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          ...corsHeaders,
        },
      });
    }
  } catch (e) {
    console.error('KV read failed:', e);
  }

  // Fall back to redirecting to static file
  return new Response(null, {
    status: 307,
    headers: { 
      'Location': '/data/market-data.json',
      ...corsHeaders
    },
  });
}
