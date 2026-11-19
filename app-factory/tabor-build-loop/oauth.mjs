import { digest, reply, readText } from "./queue.mjs";

const client = "tabor-chatgpt";
const scope = "tabor.build";
const tokenTtl = 604800;
const callback = /^https:\/\/chatgpt\.com\/(?:connector_platform_oauth_redirect|connector\/oauth\/[A-Za-z0-9_-]{6,100})$/;
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
const random = () => b64url(crypto.getRandomValues(new Uint8Array(36)));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);

async function equals(secret, value) {
  if (!secret || !value || value.length > 256) return false;
  const [a,b] = await Promise.all([digest(secret),digest(value)]);
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return different === 0;
}

export async function authenticate(request, env) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  if (await equals(env.LOOP_OWNER_TOKEN, token)) return true;
  if (!/^[\w-]{48}$/.test(token)) return false;
  return Boolean(await env.DB.prepare("SELECT 1 FROM oauth_tokens WHERE digest=? AND expires>?")
    .bind(await digest(token),Date.now()).first());
}
export function challenge(origin) {
  return reply({ error:"invalid_token" },401,{ "www-authenticate":
    'Bearer resource_metadata="' + origin + '/.well-known/oauth-protected-resource/mcp", scope="' + scope + '"' });
}

function authorization(values) {
  const args = Object.fromEntries(values);
  if (args.client_id !== client || args.response_type !== "code" || !callback.test(args.redirect_uri || "") ||
      args.code_challenge_method !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(args.code_challenge || "") ||
      (args.scope && args.scope !== scope) || (args.state && args.state.length > 2048)) return null;
  return args;
}
function page(a) {
  const fields = ["client_id","response_type","redirect_uri","code_challenge","code_challenge_method","scope","state"];
  return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tabor Build Loop</title><main><h1>Connect Tabor Build Loop</h1><p>Authorize ChatGPT to queue or read builds for this Worker.</p><form method="post" action="/oauth/authorize">'+
    fields.map(name=>'<input type="hidden" name="'+name+'" value="'+esc(a[name]??"")+'">').join("")+
    '<label>Worker owner passphrase <input type="password" name="owner" required autocomplete="current-password"></label> <button>Authorize</button></form></main></html>',{
      headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","referrer-policy":"no-referrer",
        "content-security-policy":"default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"},
    });
}
export async function oauth(request, env) {
  const url = new URL(request.url);
  const path = url.pathname, origin = url.origin;
  if (request.method === "GET" && ["/.well-known/oauth-protected-resource","/.well-known/oauth-protected-resource/mcp"].includes(path)) {
    return reply({resource:origin+"/mcp",authorization_servers:[origin],scopes_supported:[scope],bearer_methods_supported:["header"]});
  }
  if (path === "/.well-known/oauth-authorization-server" && request.method === "GET") {
    return reply({issuer:origin,authorization_endpoint:origin+"/oauth/authorize",token_endpoint:origin+"/oauth/token",
      registration_endpoint:origin+"/oauth/register",scopes_supported:[scope],code_challenge_methods_supported:["S256"],
      response_types_supported:["code"],grant_types_supported:["authorization_code"],token_endpoint_auth_methods_supported:["none"]});
  }
  if (path === "/oauth/register" && request.method === "POST") {
    const row = JSON.parse(await readText(request,8192));
    if (!Array.isArray(row.redirect_uris) || row.redirect_uris.length === 0 || row.redirect_uris.length > 2 ||
        row.redirect_uris.some(uri=>typeof uri!=="string" || !callback.test(uri))) return reply({error:"invalid_redirect_uri"},400);
    return reply({client_id:client,redirect_uris:row.redirect_uris,grant_types:["authorization_code"],
      response_types:["code"],token_endpoint_auth_method:"none",scope},201);
  }
  if (path === "/oauth/authorize" && request.method === "GET") {
    const args = authorization(url.searchParams);
    return args ? page(args) : reply({error:"invalid_request"},400);
  }
  if (path === "/oauth/authorize" && request.method === "POST") {
    const body = new URLSearchParams(await readText(request,8192));
    const args = authorization(body);
    if (!args || request.headers.get("origin") !== origin) return reply({error:"invalid_request"},400);
    if (!await equals(env.LOOP_OWNER_TOKEN,body.get("owner"))) return reply({error:"access_denied"},403);
    const code = random();
    await env.DB.prepare("INSERT INTO oauth_codes(digest,client_id,redirect_uri,challenge,expires) VALUES(?,?,?,?,?)")
      .bind(await digest(code),client,args.redirect_uri,args.code_challenge,Date.now()+300000).run();
    const redirect = new URL(args.redirect_uri);
    redirect.searchParams.set("code",code);
    if (args.state) redirect.searchParams.set("state",args.state);
    return new Response(null,{status:303,headers:{location:redirect.href,"cache-control":"no-store","referrer-policy":"no-referrer"}});
  }
  if (path === "/oauth/token" && request.method === "POST") {
    const body = new URLSearchParams(await readText(request,8192));
    const code = body.get("code"), verifier = body.get("code_verifier");
    const resource = body.get("resource");
    if (body.get("grant_type") !== "authorization_code" || body.get("client_id") !== client ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier || "") || !/^[\w-]{48}$/.test(code || "") ||
        (resource && resource !== origin+"/mcp")) return reply({error:"invalid_request"},400);
    const pkce = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(verifier))));
    const deleted = await env.DB.prepare(`DELETE FROM oauth_codes WHERE digest=? AND client_id=? AND redirect_uri=?
      AND challenge=? AND expires>? RETURNING digest`).bind(await digest(code),client,body.get("redirect_uri"),pkce,Date.now()).first();
    if (!deleted) return reply({error:"invalid_grant"},400);
    const access = random();
    await env.DB.prepare("INSERT INTO oauth_tokens(digest,client_id,expires) VALUES(?,?,?)")
      .bind(await digest(access),client,Date.now()+1000*tokenTtl).run();
    return reply({access_token:access,token_type:"Bearer",expires_in:tokenTtl,scope});
  }
  return null;
}
