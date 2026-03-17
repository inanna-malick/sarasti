/**
 * Cloudflare Worker entry point for The Tidal Scream.
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
    if (response.status === 404 && !isAssetFile) {
      const indexRequest = new Request(new URL('/index.html', request.url));
      response = await env.ASSETS.fetch(indexRequest);
    }

    return response;
  },
};
