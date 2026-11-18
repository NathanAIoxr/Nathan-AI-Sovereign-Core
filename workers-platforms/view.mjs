export const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

export const headers = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer"
};

export function json(data, status = 200) {
  return Response.json(data, { status, headers });
}

export function page(title, content) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title>
<style>
:root{color-scheme:dark;font:16px/1.6 system-ui,sans-serif;--ink:#f1f6ff;--soft:#b6c6db;--accent:#88efda;--line:#30475d}
*{box-sizing:border-box}body{margin:0;background:#0c1722;color:var(--ink)}main{max-width:76rem;padding:clamp(1.3rem,5vw,4.5rem);margin:auto}
a{color:var(--accent);text-underline-offset:.27em}h1,h2{line-height:1.05;color:var(--ink)}h1{font-size:clamp(2.3rem,6vw,5rem);max-width:14em;letter-spacing:-.045em;margin:.5em 0 .3em}
p{color:var(--soft);max-width:55rem}nav{padding:1rem 0;border-bottom:1px solid var(--line)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem;margin-top:2rem}
article{border:1px solid var(--line);background:#112233;border-radius:.65rem;padding:1.2rem}article h2{font-size:1.35rem;margin:.4rem 0}.detail{color:var(--soft)}li{margin:.55rem 0}
input,select,button{font:inherit;padding:.4rem .7rem;border:1px solid var(--line);border-radius:.3rem}button{background:var(--accent);color:#102421;font-weight:700;cursor:pointer}
</style><main><nav><a href="/">Nathan Tabor Hyper Supercomputer Federation</a></nav>
${content}</main></html>`, { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
}

export function links(items) {
  return `<ul>${items.map(({ label, url }) => `<li><a href="${escape(url)}">${escape(label)}</a></li>`).join("")}</ul>`;
}
