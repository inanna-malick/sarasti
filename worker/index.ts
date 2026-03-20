/**
 * Cloudflare Worker entry point for the Hormuz Crisis Monitor.
 *
 * Serves static Vite build from ASSETS with SPA routing.
 */

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Fetch from Assets
    let response = await env.ASSETS.fetch(request);

    // SPA Fallback: if 404 and doesn't look like a static asset file,
    // serve index.html
    const isAssetFile = url.pathname.split('/').pop()?.includes('.');
    let isSpaFallback = false;
    if (response.status === 404 && !isAssetFile) {
      const indexRequest = new Request(new URL('/index.html', request.url));
      response = await env.ASSETS.fetch(indexRequest);
      isSpaFallback = true;
    }

    const newHeaders = new Headers(response.headers);

    if (url.pathname === '/' || url.pathname.endsWith('.html') || isSpaFallback) {
      newHeaders.set('Cache-Control', 'no-cache');
    } else if (url.pathname.startsWith('/assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
      newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.pathname.startsWith('/data/') && (url.pathname.endsWith('.json') || url.pathname.endsWith('.bin'))) {
      newHeaders.set('Cache-Control', 'public, max-age=60');
    } else {
      newHeaders.set('Cache-Control', 'public, max-age=300');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
