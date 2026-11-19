import html from "./index.html";

export default {
  fetch(request) {
    const {pathname} = new URL(request.url);
    if (pathname !== "/" && pathname !== "/index.html") return new Response("Not found", {status:404});
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {status:405, headers:{Allow:"GET, HEAD"}});
    }
    return new Response(request.method === "HEAD" ? null : html, {
      headers:{
        "Content-Type":"text/html; charset=utf-8",
        "X-Content-Type-Options":"nosniff",
        "Cache-Control":"public, max-age=300",
        "Content-Security-Policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      }
    });
  }
};
