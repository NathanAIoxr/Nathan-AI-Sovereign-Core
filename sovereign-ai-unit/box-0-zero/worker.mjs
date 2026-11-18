import legacy from "../legacy/gatekeeper.mjs";
import { PLATFORM, PlatformError, bodyJson, headers, json, receipt, validateJob } from "../protocol.mjs";
import { authenticate, projectKeys } from "./auth.mjs";
import { dashboard, dashboardScript, dashboardStyle } from "./dashboard.mjs";
const publicPaths = new Set(["/platform/status","/platform/benchmarks"]);

async function gateway(request,env) {
  const url=new URL(request.url);
  const path=url.pathname, method=request.method;
  if (method==="GET" && path==="/platform") return new Response(dashboard,{headers:{...headers,"content-type":"text/html;charset=utf-8",
    "content-security-policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});
  if (method==="GET" && path==="/platform.js") return new Response(dashboardScript,{headers:{...headers,"content-type":"text/javascript;charset=utf-8"}});
  if (method==="GET" && path==="/platform.css") return new Response(dashboardStyle,{headers:{...headers,"content-type":"text/css;charset=utf-8"}});
  const target="https://box-one"+path;
  if (method==="GET" && publicPaths.has(path)) {
    const upstream=await env.BOX_ONE.fetch(target);
    const body=await upstream.json();
    return json({ ...body, ...(path==="/platform/status"?{projectCredentialsConfigured:[...projectKeys(env).keys()].some(key=>key!=="release-benchmark"),legacyAuthenticationConfigured:Boolean(env.SOVEREIGN_KEY)}:{}),
      receipt:receipt(upstream.ok?"accepted":"deferred","public-status")},upstream.status);
  }
  const valid = (path==="/platform/jobs" && ["GET","POST"].includes(method)) ||
    (path==="/platform/status" || path==="/platform/objects") && method==="POST" ||
    (/^\/platform\/jobs\/[0-9a-f-]{36}(\/artifact)?$/.test(path) && ["GET","DELETE"].includes(method));
  if (!valid) throw new PlatformError("Unknown platform route or method.",404);
  const config=projectKeys(env);
  if (!config.size) throw new PlatformError("Project credentials must be configured.",503);
  const principal=await authenticate(request,config);
  if (!principal) throw new PlatformError("Invalid project credentials.",401);
  const limit=await env.COMPUTE_LIMIT.limit({key:"platform-"+principal.project});
  if (!limit.success) throw new PlatformError("Project request rate exceeded.",429);
  const forwarded={ "x-platform-project":principal.project,"x-platform-daily-micro":String(principal.dailyMicro),
    "x-platform-max-active":String(principal.maxActive) };
  let body;
  if (method==="POST" && path==="/platform/jobs") {
    const key=request.headers.get("idempotency-key")??"";
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key)) throw new PlatformError("Idempotency-Key must contain 1–80 letters, digits, underscores or hyphens.");
    const input = await bodyJson(request,24576);
    const normalized = validateJob(input);
    if (principal.project==="release-benchmark" && (!normalized.benchmark || !["embedding","batch-embedding"].includes(normalized.kind))) {
      throw new PlatformError("Release credential is restricted to benchmark embeddings.",403);
    }
    body=JSON.stringify(input);
    forwarded["content-type"]="application/json";
    forwarded["idempotency-key"]=key;
  } else if (method==="POST" && path==="/platform/objects") {
    if (principal.project==="release-benchmark") throw new PlatformError("The release credential cannot upload objects.",403);
    body=request.body;
  }
  return env.BOX_ONE.fetch(target,{method,headers:forwarded,body});
}
export default {
  async fetch(request,env,ctx) {
    if (!/^\/platform(?:\/|\.|$)/.test(new URL(request.url).pathname)) return legacy.fetch(request,env,ctx);
    try { return await gateway(request,env); }
    catch (error) {
      const status=error instanceof PlatformError?error.status:503;
      return json({platform:PLATFORM,receipt:receipt([429,503].includes(status)?"deferred":"rejected",
        error instanceof PlatformError?error.message:"Gateway unavailable.")},status,status===429?{"Retry-After":"60"}:{});
    }
  },
  scheduled:legacy.scheduled
};
