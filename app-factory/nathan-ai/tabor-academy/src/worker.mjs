const page = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"theme-color\" content=\"#10140f\">\n<meta name=\"description\" content=\"Tabor Academy by Nathan Tabor. Coming soon.\">\n<title>Tabor Academy by Nathan Tabor</title>\n<style>\n:root { color-scheme: dark; font-family: system-ui, sans-serif; background: #10140f; color: #f9f3e4; }\n* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: clamp(1rem, 5vw, 5rem); background: radial-gradient(ellipse at 78% 14%, #2a361f, transparent 59%), #10140f; }\nmain { width: min(100%, 76rem); border: 1px solid #778360; padding: clamp(1.2rem, 6vw, 6rem); overflow-wrap: break-word; }\nh1 { margin: 0; font-family: Georgia, serif; font-size: clamp(2.45rem, 10vw, 9rem); font-weight: 400; line-height: .91; letter-spacing: -.055em; }\nh1 span { display: block; }\n.announcement { margin: clamp(2rem, 6vw, 5rem) 0 0; border-top: 1px solid #778360; padding-top: 1.4rem; }\n.status { margin: 0 0 .55rem; font-size: clamp(.85rem, 2vw, 1.15rem); font-weight: 700; letter-spacing: .15em; color: #e6cf87; }\n.timing { margin: 0; font-size: clamp(1rem, 3.1vw, 2.2rem); font-weight: 620; }\n.byline { margin: 2rem 0 0; font-size: .85rem; font-weight: 650; letter-spacing: .15em; }\n</style>\n</head>\n<body>\n<main>\n<h1><span>TABOR</span> <span>ACADEMY</span></h1>\n<div class=\"announcement\">\n<p class=\"status\">COMING SOON</p>\n<p class=\"timing\">LIKE IN THE NEXT FIVE MINUTES</p>\n</div>\n<p class=\"byline\">BY NATHAN TABOR</p>\n</main>\n</body>\n</html>";

export default {
  fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const { pathname } = new URL(request.url);
    const head = request.method === "HEAD";
    const headers = {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    };
    if (pathname === "/healthz") {
      return new Response(head ? null : JSON.stringify({ service: "tabor-academy", status: "ok" }), {
        headers: { ...headers, "content-type": "application/json; charset=utf-8" },
      });
    }
    if (pathname !== "/") {
      return new Response(head ? null : "Not found", { status: 404, headers });
    }
    return new Response(head ? null : page, {
      headers: {
        ...headers,
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      },
    });
  },
};
