const collection = "The Nathan Tabor Trinity of the Nutcracker";
const tagline = "Will make you scream OH MY GOD LORD JESUS CHRIST";
const approvalLine = "Approved by Humanity and the KJV. Bible";
const museum = "https://museotaranto.cultura.gov.it/en/objects-on-display/nutcracker-in-bronze-and-gold-foil/";
const verse = "https://www.biblegateway.com/passage/?search=Proverbs%205%3A19&version=KJV";
const publicIngress = "https://unified-operations-cockpit.nathantaboract.workers.dev";
const publicBase = "/18-plus/bronze-hands/";
const securityHeaders = {
  "Cache-Control": "private, no-store",
  "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow"
};

function escapeHtml(value) {
  const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (character) => replacements[character]);
}

function page(title, bodyClass, content, revision) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./site.css?v=${revision}">
</head>
<body class="${bodyClass}">
  ${content}
</body>
</html>`;
}

function gate(revision, declined = false) {
  const panel = declined
    ? `<h1>Adults only</h1>
       <p>You must be 18 or older to view this collection.</p>
       <a class="button secondary" href="./">Return to age check</a>`
    : `<h1>Are you 18 or older?</h1>
       <p>This collection contains adult language and product concepts.</p>
       <form method="post" action="./age">
         <button class="button primary" type="submit" name="answer" value="yes">Yes, I’m 18 or older</button>
         <button class="button secondary" type="submit" name="answer" value="no">No, take me back</button>
       </form>`;
  return page("18+ Only · The Bedroom", "age-page", `
    <main class="gate">
      <div class="gate-panel">
        <div class="age-mark" aria-label="18 and older">18+</div>
        ${panel}
      </div>
    </main>`, revision);
}

function productPage(product, others, revision) {
  const details = product.details.map(([term, description]) =>
    `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(description)}</dd></div>`).join("");
  const othersList = others.map(({ name, worker }) =>
    `<li><a href="${publicIngress}${publicBase}${worker}/">${escapeHtml(name)} <span aria-hidden="true">↗</span></a></li>`).join("");
  const scripture = product.scripture
    ? `<blockquote><p>“Let her breasts satisfy thee at all times.”</p><cite><a href="${verse}">Proverbs 5:19 · KJV</a></cite></blockquote>`
    : "";
  return page(product.name, `product-page ${product.theme}`, `
    <a class="skip-link" href="#main">Skip to product</a>
    <header class="site-header">
      <span class="collection-title">${collection}</span>
      <nav aria-label="Page"><a href="#design">Design</a><a href="#collection">Collection</a></nav>
      <form action="./leave" method="post"><button class="leave" type="submit">Exit 18+ area</button></form>
    </header>
    <main id="main">
      <section class="hero" aria-labelledby="product">
        <div class="hero-copy">
          <p class="eyebrow">The Bedroom <span aria-hidden="true">·</span> 18+ Only</p>
          <h1 id="product">${escapeHtml(product.name)}</h1>
          <p class="attribution">${escapeHtml(product.attribution)}</p>
          <p class="description">${escapeHtml(product.description)}</p>
          <a class="button primary" href="#design">Explore the design <span aria-hidden="true">↓</span></a>
        </div>
        <aside class="material-summary" aria-label="Product concept status">
          <p class="eyebrow">Product concept</p>
          <p class="material-title">Matte silicone</p>
          <p class="material-color"><span aria-hidden="true"></span>${escapeHtml(product.color)}</p>
          <a href="#material-study">View the material and packaging study <span aria-hidden="true">↓</span></a>
        </aside>
      </section>
      <section class="design" id="design" aria-labelledby="design-heading">
        <div>
          <h2 id="design-heading">The design</h2>
          <dl class="design-details">${details}</dl>
          <p class="source"><a href="${museum}">Original bronze hands at the National Archaeological Museum of Taranto ↗</a></p>
        </div>
        <figure class="material-study" id="material-study">
          <img src="./silicone-material-study.webp?v=${revision}" width="1296" height="864" loading="lazy" alt="Three silicone sample tiles and packaging labeled Solomon, Cleopatra, and Virgin Mary">
          <figcaption>Silicone color and packaging study. Product artwork is pending.</figcaption>
        </figure>
      </section>
      ${scripture}
      <section class="collection" id="collection" aria-labelledby="collection-heading">
        <div>
          <p class="eyebrow">The Bedroom</p>
          <h2 id="collection-heading">The rest of the collection</h2>
          <ul>${othersList}</ul>
        </div>
        <div class="brand-copy">
          <p>${tagline}</p>
          <p class="approval">“${approvalLine}”</p>
        </div>
      </section>
    </main>`, revision);
}

export function createSite({ product, others, css, materialStudy, serif, revision }) {
  const ageCookie = `__Host-bronze-hands-18-${product.theme}`;
  const mount = `${publicBase}${product.worker}`;
  const confirmed = productPage(product, others, revision);
  const entry = gate(revision);
  const declined = gate(revision, true);
  const resources = {
    "/site.css": [css, "text/css; charset=utf-8"],
    "/instrument-serif.woff2": [serif, "font/woff2"],
    "/robots.txt": ["User-agent: *\nDisallow: /\n", "text/plain; charset=utf-8"]
  };
  const html = (body, status = 200) => new Response(body, {
    status,
    headers: { ...securityHeaders, "Content-Type": "text/html; charset=utf-8" }
  });
  const redirect = (location, maxAge) => new Response(null, {
    status: 303,
    headers: {
      ...securityHeaders,
      Location: location,
      "Set-Cookie": `${ageCookie}=${maxAge ? "yes" : ""}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`
    }
  });

  return {
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === mount && (request.method === "GET" || request.method === "HEAD")) {
        return new Response(null, { status: 308, headers: { ...securityHeaders, Location: mount + "/" } });
      }
      const base = url.pathname.startsWith(mount + "/") ? mount : "";
      const pathname = url.pathname.slice(base.length);

      if (request.method === "POST" && (pathname === "/age" || pathname === "/leave")) {
        if (request.headers.get("Origin") !== url.origin) return html("Forbidden", 403);
        if (pathname === "/leave") return redirect(base + "/", 0);
        if (!request.headers.get("Content-Type")?.startsWith("application/x-www-form-urlencoded")) {
          return html("Unsupported form type", 415);
        }
        const form = new URLSearchParams(await request.text());
        if (form.get("answer") === "yes") return redirect(base + "/", 43_200);
        if (form.get("answer") === "no") return redirect(base + "/declined", 0);
        return html("Please choose an age response.", 400);
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(null, { status: 405, headers: { ...securityHeaders, Allow: "GET, HEAD, POST" } });
      }

      const confirmedAge = (request.headers.get("Cookie") ?? "").split(";")
        .some((cookie) => cookie.trim() === `${ageCookie}=yes`);
      let response;
      if (pathname === "/silicone-material-study.webp") {
        response = confirmedAge ? new Response(materialStudy, {
          headers: { ...securityHeaders, "Content-Type": "image/webp" }
        }) : html("Page not found", 404);
      } else if (Object.hasOwn(resources, pathname)) {
        const [body, contentType] = resources[pathname];
        response = new Response(body, {
          headers: { ...securityHeaders, "Content-Type": contentType, "Cache-Control": "public, max-age=3600" }
        });
      } else if (pathname === "/health") {
        response = new Response("ok", { headers: securityHeaders });
      } else if (pathname === "/declined") {
        response = html(declined);
      } else if (pathname === "/") {
        response = html(confirmedAge ? confirmed : entry);
      } else {
        response = html("Page not found", 404);
      }

      return request.method === "HEAD" ? new Response(null, response) : response;
    }
  };
}
