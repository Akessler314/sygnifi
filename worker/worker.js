/**
 * Sygnifi — Cloudflare Worker API Proxy
 *
 * Sits between the browser and api.anthropic.com so the API key
 * never touches the client. Deploy this to Cloudflare Workers and
 * set the ANTHROPIC_API_KEY environment variable (secret).
 *
 * Steps:
 *   1. Install Wrangler: npm install -g wrangler
 *   2. Login:            wrangler login
 *   3. Add your key:     wrangler secret put ANTHROPIC_API_KEY
 *   4. Deploy:           wrangler deploy
 *   5. Copy the Worker URL into index.html as PROXY_URL
 */

export default {
  async fetch(request, env) {

    // ── CORS pre-flight ──────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // ── Only accept POST ─────────────────────────────────────────
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // ── Parse body from client ───────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    // ── Forward to Anthropic ─────────────────────────────────────
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    // ── Return response to browser ───────────────────────────────
    const data = await anthropicResponse.json();

    return new Response(JSON.stringify(data), {
      status: anthropicResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
