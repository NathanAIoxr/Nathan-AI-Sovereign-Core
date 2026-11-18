import { ident, hex, sha256 } from "../protocol.mjs";

function matches(a,b) {
  if (!hex.test(b??"")) return false;
  if (typeof crypto.subtle.timingSafeEqual === "function") return crypto.subtle.timingSafeEqual(new TextEncoder().encode(a),new TextEncoder().encode(b));
  let diff=0;
  for(let i=0;i<64;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
export function projectKeys(env, now=Date.now()) {
  let raw={};
  try { raw=JSON.parse(env.JOB_PROJECT_KEYS??"{}"); } catch {}
  const config = new Map();
  for (const [name,value] of Object.entries(raw??{}).slice(0,64)) {
    if (!ident.test(name) || name==="release-benchmark" || !hex.test(value?.sha256??"")
      || !Number.isSafeInteger(value.dailyMicro) || value.dailyMicro<0 || value.dailyMicro>1e9
      || !Number.isSafeInteger(value.maxActive) || value.maxActive<1 || value.maxActive>64) continue;
    config.set(name,value);
  }
  if (hex.test(env.RELEASE_PROBE_HASH??"") && now < Number(env.RELEASE_PROBE_UNTIL)) {
    config.set("release-benchmark",{sha256:env.RELEASE_PROBE_HASH,dailyMicro:10000,maxActive:8});
  }
  return config;
}
export async function authenticate(request,config) {
  const m=/^Bearer ([A-Za-z0-9._~-]{32,256})$/.exec(request.headers.get("authorization")??"");
  const project=request.headers.get("x-sovereign-project")??"";
  const settings=config.get(project);
  if (!m || !settings || !matches(await sha256(m[1]),settings.sha256)) return null;
  return {project,dailyMicro:settings.dailyMicro,maxActive:settings.maxActive};
}
