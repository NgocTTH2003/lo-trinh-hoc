import { onRequestPost } from '../functions/api/[fn].js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/api\/([^/]+)\/?$/);
    if (m) {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return onRequestPost({ request, env, params: { fn: decodeURIComponent(m[1]) } });
    }
    return env.ASSETS.fetch(request);
  },
};
