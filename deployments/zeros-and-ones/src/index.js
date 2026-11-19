const mountPath = "/tabor-sites/zeros-and-ones";
const sourceUrl = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/deployments/zeros-and-ones";

const healthQuery = `
  SELECT EXISTS (
    SELECT 1 FROM route_registry WHERE method = 'GET' AND path = '/health'
  ) AS route_ready,
  EXISTS (
    SELECT 1 FROM lookup_values WHERE namespace = 'system' AND code = 'schema_version'
  ) AS schema_ready
`;

function home(healthPath) {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zeros and Ones · Nathan AI</title>
<style>
  :root{color-scheme:light dark}
  body{max-width:38rem;margin:clamp(3rem,12vw,8rem) auto;padding:0 1.25rem;font:1rem/1.65 system-ui,sans-serif}
  h1{font-size:clamp(2.8rem,12vw,5rem);line-height:1;margin:.3rem 0 1.8rem}
  p{margin:1rem 0}
  a{color:LinkText}
</style>
<main>
  <p>Nathan AI</p>
  <h1>Zeros and Ones</h1>
  <p><strong>1 − 1 = 0</strong> · Clear ambiguity, broken paths, and missing tables.</p>
  <p><strong>1 + 1 = 2</strong> · Apply the D1 schema, deploy the Worker, and verify the running commit.</p>
  <p><a href="${healthPath}">Live health and release SHA</a> · <a href="${sourceUrl}">GitHub source</a></p>
</main>
</html>`;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const mounted = pathname === mountPath || pathname.startsWith(mountPath + "/");
    const path = (mounted ? pathname.slice(mountPath.length) : pathname) || "/";
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
    if (path !== "/" && path !== "/health") {
      return Response.json({ error: "not_found" }, { status: 404, headers });
    }

    const head = request.method === "HEAD";
    if (request.method !== "GET" && !head) {
      return Response.json(
        { error: "method_not_allowed" },
        { status: 405, headers: { ...headers, Allow: "GET, HEAD" } },
      );
    }
    if (path === "/") {
      return new Response(head ? null : home(mounted ? mountPath + "/health" : "/health"), {
        headers: {
          ...headers,
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
        },
      });
    }

    let ready = false;
    try {
      const row = await env.DB.prepare(healthQuery).first();
      ready = row?.route_ready === 1 && row?.schema_ready === 1;
    } catch (error) {
      console.error("D1 health query failed", error.message);
    }
    const status = ready ? 200 : 503;
    if (head) {
      return new Response(null, {
        status,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    return Response.json(
      { status: ready ? "ok" : "unavailable", release: env.RELEASE_SHA ?? "local" },
      { status, headers },
    );
  },
};
