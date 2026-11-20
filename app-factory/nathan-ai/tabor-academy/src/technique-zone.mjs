export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    const head = request.method === "HEAD";
    const headers = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
    if (!head && request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
    if (pathname !== "/" && pathname !== "/healthz") return new Response(head ? null : "Not found", { status: 404, headers });
    const manifest = JSON.parse(env.TECHNIQUE);
    return new Response(head ? null : JSON.stringify({ ...manifest, state: "development" }), {
      headers: { ...headers, "content-type": "application/json; charset=utf-8" },
    });
  },
};
