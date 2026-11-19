const NO_CACHE = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; style-src 'unsafe-inline'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

const escape = (value) => String(value).replace(/[&<>"']/g, (char) =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]
);
const validId = (value) => /^[a-z0-9][a-z0-9-]{0,95}$/.test(value);
const json = (data, status = 200) => Response.json(data, {status, headers: NO_CACHE});
const text = (body, status) => new Response(body, {status, headers: NO_CACHE});

function page(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>body{font:1rem system-ui;margin:3rem auto;padding:0 1rem;max-width:45rem;color:#192e30;background:#f4faf8}a{color:#14635d}li{padding:.35rem 0;overflow-wrap:anywhere}header{border-bottom:2px solid #8db9b1}main{padding-top:1rem}</style><header><p>Nathan AI</p><h1>${escape(title)}</h1></header><main>${body}</main></html>`, {
    status, headers: {...NO_CACHE,"Content-Type":"text/html; charset=utf-8"}
  });
}

function decode(value) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw Error("Malformed token");
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));
}

export async function authorize(request, env, fetchKeys = fetch) {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt || jwt.length > 16000 || !env.ACCESS_AUDIENCE || !env.ACCESS_ISSUER) return false;
  try {
    const issuer = new URL(env.ACCESS_ISSUER);
    if (issuer.protocol !== "https:" || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer.host) || issuer.origin !== env.ACCESS_ISSUER) return false;
    const parts = jwt.split(".");
    if (parts.length !== 3) return false;
    const [encodedHeader, encodedClaims, encodedSignature] = parts;
    const decoder = new TextDecoder();
    const header = JSON.parse(decoder.decode(decode(encodedHeader)));
    const claims = JSON.parse(decoder.decode(decode(encodedClaims)));
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== "RS256" || typeof header.kid !== "string" || claims.iss !== issuer.origin) return false;
    if (!Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUDIENCE) || !claims.sub || !claims.email) return false;
    if (!Number.isFinite(claims.exp) || claims.exp <= now || (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now))) return false;
    const response = await fetchKeys(new URL("/cdn-cgi/access/certs", issuer), {redirect: "error", signal: AbortSignal.timeout(5000)});
    if (!response.ok) return false;
    const {keys} = await response.json();
    const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"}, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decode(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`));
  } catch {
    return false;
  }
}

function holding(base) {
  return page("Holding Vault", `<p>This project is in staging.</p><p><a href="${base}/preview">Owner preview</a></p>`, 200);
}

async function projectRow(env, id) {
  return await env.DB.prepare("SELECT workspace_id, project_name, project_kind, domain, domain_status, launch_status, public_url FROM zones_registry WHERE workspace_id=?").bind(id).first();
}

async function handle(request, env) {
  const base = env.MOUNT_PATH === "/holding-vault" ? "/holding-vault" : "";
  const {pathname, searchParams} = new URL(request.url);
  if (!["GET","HEAD"].includes(request.method)) {
    return new Response("Method not allowed", {status:405,headers:{...NO_CACHE,Allow:"GET, HEAD"}});
  }
  if (pathname === "/health") return json({service:"tabor-holding-vault",status:"ok",launch:env.LAUNCH_STATUS === "LIVE" ? "enabled" : "holding"});
  if (pathname === "/") return holding(base);

  const publicMatch = /^\/holding\/([^/]+)\/?$/.exec(pathname);
  if (publicMatch && validId(publicMatch[1])) {
    if (env.LAUNCH_STATUS === "LIVE") {
      const record = await projectRow(env, publicMatch[1]);
      if (record?.launch_status === "LIVE" && record.domain_status === "active") {
        const target = new URL(record.public_url);
        if (target.protocol === "https:" && target.hostname === record.domain && !target.username && !target.password && !target.port) {
          return new Response(null,{status:302,headers:{...NO_CACHE,Location:target.href}});
        }
      }
    }
    return holding(base);
  }

  if (pathname !== "/preview" && !pathname.startsWith("/preview/")) return text("Page not found",404);
  if (!await authorize(request, env)) return text("Owner authorization required",401);

  if (pathname === "/preview" || pathname === "/preview/") {
    const after = searchParams.get("after") ?? "";
    if (after && !validId(after)) return text("Invalid cursor",400);
    const {results} = await env.DB.prepare("SELECT workspace_id, project_name, project_kind FROM zones_registry WHERE workspace_id>? ORDER BY workspace_id LIMIT 41").bind(after).all();
    const rows = results.slice(0,40);
    const items = rows.map((row) => '<li><a href="' + base + '/preview/' + escape(row.workspace_id) + '">' + escape(row.project_name) + '</a> · ' + escape(row.project_kind) + '</li>').join("");
    const next = results.length > 40 ? '<p><a href="' + base + '/preview?after=' + encodeURIComponent(rows.at(-1).workspace_id) + '">Next page</a></p>' : "";
    return page("Project staging registry", `<ul>${items}</ul>${next}`);
  }

  const match = /^\/preview\/([^/]+)(?:\/assets\/(.+))?\/?$/.exec(pathname);
  if (!match || !validId(match[1])) return text("Project not found",404);
  const record = await projectRow(env, match[1]);
  if (!record) return text("Project not found",404);
  if (!match[2]) {
    return page(record.project_name,`<p><a href="${base}/preview">Project registry</a></p><dl><dt>Project</dt><dd>${escape(record.project_kind)}</dd><dt>Release</dt><dd>${escape(record.launch_status)}</dd><dt>Domain</dt><dd>${escape(record.domain ?? "Awaiting assignment")}</dd><dt>Zone state</dt><dd>${escape(record.domain_status)}</dd></dl>`);
  }

  const segments = match[2].split("/");
  if (segments.some((segment) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(segment))) return text("Asset not found",404);
  const object = await env.VAULT.get(`${record.workspace_id}/${segments.join("/")}`);
  if (!object) return text("Asset not found",404);
  return new Response(object.body, {headers:{...NO_CACHE,"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename="${segments.at(-1)}"`}});
}

export default {
  async fetch(request, env) {
    let response;
    try {
      response = await handle(request, env);
    } catch {
      response = text("Holding vault temporarily unavailable",503);
    }
    return request.method === "HEAD" ? new Response(null, {status:response.status,headers:response.headers}) : response;
  }
};
