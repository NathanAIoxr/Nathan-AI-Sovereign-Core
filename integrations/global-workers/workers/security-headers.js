// MIT · source: https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/security-headers.mdx
// License and copyright notices: ../licenses/cloudflare-docs.txt
// Adapted from the Cloudflare Workers security headers example (MIT).
export default {
  async fetch() {
    const DEFAULT_SECURITY_HEADERS = {
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-origin",
    };
    const response = new Response("Cloudflare security header profile", {headers:{"content-type":"text/plain"}});
    const newHeaders = new Headers(response.headers);
    Object.entries(DEFAULT_SECURITY_HEADERS).forEach(([name, value]) => newHeaders.set(name, value));
    for (const name of ["Public-Key-Pins", "X-Powered-By", "X-AspNet-Version"]) newHeaders.delete(name);
    return new Response(response.body, { status: response.status, headers: newHeaders });
  },
};
