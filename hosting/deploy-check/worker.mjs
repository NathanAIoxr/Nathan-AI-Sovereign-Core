const home = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<meta name=\"robots\" content=\"noindex\">\n<title>Nathan AI · Deployment Check</title>\n<style>\n:root{color-scheme:dark;font:16px/1.6 system-ui,sans-serif;background:#0e1821;color:#f3ede2}\nbody{margin:0;min-height:92vh;display:grid;place-items:center;padding:1.25rem;box-sizing:border-box}\nmain{width:min(100%,38rem);box-sizing:border-box;border:1px solid #465763;border-radius:1rem;background:#162630;padding:clamp(1.3rem,6vw,3rem)}\np{margin:0;color:#bac7ce}h1{font-size:clamp(2rem,6vw,3.25rem);line-height:1.08;margin:.2em 0 .45em;letter-spacing:-.045em}\n.status{color:#f0ce91;font-weight:650}a{color:#f0ce91;text-underline-offset:.22em}footer{margin-top:1.6rem}\n</style>\n</head>\n<body><main><p class=\"status\">Nathan AI</p><h1>Deployment check</h1>\n<p>This test page confirms that the host can serve the Nathan AI starter. It uses sample content.</p>\n<footer><a href=\"https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/hosting/nathan-ai-deployment-check/hosting/deploy-check\">View the source on GitHub</a></footer></main></body>\n</html>\n";
const baseHeaders = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex'
};
export default {
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { ...baseHeaders, allow: 'GET, HEAD' } });
    }
    const route = new URL(request.url).pathname;
    const response = (body, contentType, status = 200) => new Response(request.method === 'HEAD' ? null : body, {
      status, headers: { ...baseHeaders, 'content-type': contentType }
    });
    if (route === '/') return response(home, 'text/html; charset=utf-8');
    if (route === '/api/health') return response(JSON.stringify({ ok: true, service: 'nathan-ai-deployment-check' }), 'application/json; charset=utf-8');
    return response('Not found', 'text/plain; charset=utf-8', 404);
  }
};
