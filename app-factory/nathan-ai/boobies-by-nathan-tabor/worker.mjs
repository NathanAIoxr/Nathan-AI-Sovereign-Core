const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/source.md", ["source.md", "text/plain; charset=utf-8"]],
  ["/artwork/gold-outlines.webp", ["artwork/gold-outlines.webp", "image/webp"]],
  ["/artwork/arcade-cartridge.webp", ["artwork/arcade-cartridge.webp", "image/webp"]],
  ["/artwork/full-project.webp", ["artwork/full-project.webp", "image/webp"]],
  ["/artwork/burlesque-playbill.webp", ["artwork/burlesque-playbill.webp", "image/webp"]],
]);

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const file = publicFiles.get(new URL(request.url).pathname);
    if (!file) return new Response("Not found", { status: 404 });

    const [path, contentType] = file;
    const root = "https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
    const revision = env.GITHUB_REVISION;
    const source = `${root}/${revision}/app-factory/nathan-ai/boobies-by-nathan-tabor/public/${path}`;
    let upstream;
    try {
      upstream = await fetch(source, { cf: { cacheEverything: true, cacheTtlByStatus: { "200-299": 86400, "400-599": 0 } } });
    } catch {
      return new Response("Project files are temporarily unavailable", { status: 502 });
    }
    if (!upstream.ok) return new Response("Project files are temporarily unavailable", { status: 502 });

    return new Response(request.method === "HEAD" ? null : upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
