import { endpoint, readJson, readBytes, RequestError } from "./shared.mjs";

const allowedFamilies = new Set(["DM Sans", "Inter", "Roboto", "Source Sans 3", "Work Sans"]);
export default endpoint(97, async (request, url) => {
  if (request.method !== "POST" || url.pathname !== "/inline") return;
  const { html, family } = await readJson(request, 64 * 1024);
  if (typeof html !== "string" || html.length > 30_000 || !allowedFamilies.has(family)) throw new RequestError("invalid_html_or_font_family");
  if (!/<\/head\s*>/i.test(html)) throw new RequestError("head_required");
  const upstream = new URL("https://fonts.googleapis.com/css2");
  upstream.search = new URLSearchParams({ family, display: "swap" });
  const reply = await fetch(upstream, {
    redirect: "manual", signal: AbortSignal.timeout(5000),
    headers: { "user-agent": "Mozilla/5.0", accept: "text/css" },
    cf: { cacheEverything: true, cacheTtlByStatus: { "200": 3600, "400-599": 0 } },
  });
  if (!reply.ok || !reply.headers.get("content-type")?.includes("text/css")) throw new RequestError("font_unavailable", 502);
  const css = new TextDecoder().decode(await readBytes(reply, 32 * 1024));
  if (css.includes("<")) throw new RequestError("unexpected_css", 502);
  const result = html.replace(/<\/head\s*>/i, tag => `<style>${css}</style>${tag}`);
  return new Response(result, { headers: {
    "content-type": "text/html; charset=utf-8", "content-disposition": "attachment; filename=fonts-inlined.html",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; font-src https://fonts.gstatic.com; sandbox",
    "x-content-type-options": "nosniff", "cache-control": "no-store",
  } });
});
