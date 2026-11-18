export const PLATFORM = "NATHAN AI — NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER";
export const MODEL = "@cf/baai/bge-small-en-v1.5";
export const MAX_ATTEMPTS = 3;
export const OBJECT_LIMIT = 8 * 1024 * 1024;
export const encoder = new TextEncoder();
export const ident = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const hex = /^[a-f0-9]{64}$/;
export const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export const headers = { "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff", "Referrer-Policy":"no-referrer" };
export const json = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...headers, ...extra } });
export const receipt = (decision, reason, requestId = crypto.randomUUID()) => ({
  box:0, equation:"1 - 1 = 0", requestId, decision, reason, timestamp:new Date().toISOString()
});
export class PlatformError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export async function sha256(input) {
  const digest = await crypto.subtle.digest("SHA-256", typeof input === "string" ? encoder.encode(input) : input);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,"0")).join("");
}
export async function bytes(request, limit) {
  const size = Number(request.headers.get("content-length"));
  if (size > limit) throw new PlatformError("Body exceeds the size limit.",413);
  if (!request.body) throw new PlatformError("Request body required.");
  const reader = request.body.getReader();
  const chunks = [];
  let n = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      n += value.byteLength;
      if (n > limit) {
        await reader.cancel();
        throw new PlatformError("Body exceeds the size limit.",413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const all = new Uint8Array(n);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk,offset); offset += chunk.length; }
  return all;
}
export async function bodyJson(request, limit = 16384) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new PlatformError("Expected application/json.",415);
  }
  const input = await bytes(request,limit);
  try { return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(input)); }
  catch { throw new PlatformError("Invalid JSON."); }
}

function number(value, label, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new PlatformError("Invalid " + label + ".");
  return value;
}
export function validateJob(raw) {
  if (!raw || !["embedding","batch-embedding","sha256","training"].includes(raw.kind)) throw new PlatformError("Unsupported workload.");
  const kind = raw.kind;
  const budgetMicro = number(raw.budgetMicro,"budgetMicro",0,1000000000);
  const deadlineSeconds = number(raw.deadlineSeconds ?? 900,"deadlineSeconds",10,86400);
  const delaySeconds = number(raw.delaySeconds ?? 0,"delaySeconds",0,300);
  if (delaySeconds >= deadlineSeconds) throw new PlatformError("Delay must be shorter than deadline.");
  const retentionSeconds = number(raw.retentionSeconds ?? 86400,"retentionSeconds",60,604800);
  const region = raw.region ?? null;
  if (region !== null && (typeof region !== "string" || !ident.test(region))) throw new PlatformError("Invalid region.");
  const benchmark = raw.benchmark === true;
  let work;
  if (kind === "embedding" || kind === "batch-embedding") {
    const texts = raw.texts;
    if (!Array.isArray(texts) || texts.length < 1 || texts.length > (kind === "embedding" ? 8 : 48)
      || texts.some(value => typeof value !== "string" || !value.trim() || encoder.encode(value).length > 400)) {
      throw new PlatformError("Supply 1–8 texts for embedding or 1–48 for batch-embedding, up to 400 UTF-8 bytes each.");
    }
    work = { texts, model: MODEL };
  } else {
    if (typeof raw.objectId !== "string" || !uuid.test(raw.objectId) || !hex.test(raw.objectSha256 ?? "")) {
      throw new PlatformError("Supply a scoped uploaded object ID and SHA-256.");
    }
    work = { objectId:raw.objectId, objectSha256:raw.objectSha256 };
    if (kind === "training") {
      if (typeof raw.recipe !== "string" || !ident.test(raw.recipe)
        || typeof raw.targetQuality !== "number" || !Number.isFinite(raw.targetQuality) || raw.targetQuality < 0 || raw.targetQuality > 1
        || !hex.test(raw.evaluationSha256 ?? "") || !hex.test(raw.modelSha256 ?? "")) {
        throw new PlatformError("Training requires a registered recipe, model and evaluation SHA-256, and quality target from 0 to 1.");
      }
      work = { ...work, recipe:raw.recipe, targetQuality:raw.targetQuality, modelSha256:raw.modelSha256, evaluationSha256:raw.evaluationSha256,
        stages:number(raw.stages ?? 5,"training stages",1,20), gpuCount:number(raw.gpuCount ?? 2,"GPU count",1,64),
        minInterconnectGbps:number(raw.minInterconnectGbps ?? 100,"interconnect Gbps",1,3200) };
    }
  }
  return {kind,work,budgetMicro,deadlineSeconds,delaySeconds,retentionSeconds,region,benchmark};
}
