/**
 * Cloudflare Pages Function — proxies any /jpl/<path>?<query> request to
 *   https://ssd-api.jpl.nasa.gov/<path>?<query>
 * adding CORS headers and a 24-hour edge cache.
 *
 * JPL's Small-Body Database API ships no CORS headers, so the browser
 * can't fetch it directly. This Function (running on the Workers runtime)
 * re-emits the response with `Access-Control-Allow-Origin: *`.
 *
 * Replaces the old local server.py JPL proxy entirely.
 */

const JPL_HOST = 'https://ssd-api.jpl.nasa.gov';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== 'GET') {
    return jsonError(405, 'method not allowed');
  }

  // The `[[path]]` catch-all dynamic segment exposes either a string or an
  // array of segments — normalize to a single path string.
  const segments = Array.isArray(params.path)
    ? params.path.join('/')
    : (params.path || '');
  const upstream = `${JPL_HOST}/${segments}${new URL(request.url).search}`;

  // Retry transient network failures; let real HTTP errors from JPL pass
  // through unchanged.
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(upstream, {
        headers: { 'User-Agent': 'solar-comet-tracker/1.0' },
        // Cloudflare-specific: cache any successful response at the edge
        // so repeat fetches of the same query never re-hit JPL.
        cf: { cacheTtl: 86400, cacheEverything: true },
      });

      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
      headers.set('Cache-Control', 'public, max-age=86400');

      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    } catch (err) {
      lastErr = err;
      // Brief linear backoff before the next attempt (400ms, 800ms).
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
  }

  return jsonError(
    502,
    `proxy failed after 3 attempts: ${lastErr?.message || String(lastErr)}`
  );
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
