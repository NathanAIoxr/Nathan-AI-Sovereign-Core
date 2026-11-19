const base = "/gateway-monroe-redstone";

export function createResearchRouter(documents) {
  const pages = new Map([
    [base + "/", ["text/html", documents.html]],
    [base + "/research.md", ["text/markdown", documents.research]],
    [base + "/101-source-index.md", ["text/markdown", documents.index]],
    [base + "/provided-transcript.txt", ["text/plain", documents.transcript]],
  ]);

  return function serveResearch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path !== base && !path.startsWith(base + "/")) return undefined;

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    if (path === base) {
      url.pathname += "/";
      return Response.redirect(url, 308);
    }

    const page = pages.get(path);
    if (!page) return new Response(null, { status: 404 });

    const [type, body] = page;
    return new Response(request.method === "HEAD" ? null : body, {
      headers: {
        "content-type": type + "; charset=utf-8",
        "cache-control": "public, max-age=120",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      },
    });
  };
}
