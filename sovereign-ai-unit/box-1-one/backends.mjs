import { MAX_ATTEMPTS, MODEL, PlatformError, sha256, ident, hex, bytes } from "../protocol.mjs";
const managed = { id:"workers-ai-bge", runtime:"workers-ai", deviceCount:null, deviceType:"Cloudflare managed inference",
  memoryMiB:null, precision:null, interconnect:null, region:"provider-managed", slots:2, chunk:4, priceMicro:12,
  rateBasis:"Upper-bound estimate per input using 512 input tokens, rounded up. Provider invoice unavailable.",
  kinds:["embedding","batch-embedding"], models:[MODEL], priceUsdPerMillionInputTokens:0.0202 };
const cpu = { id:"workers-cpu", runtime:"webcrypto", deviceCount:null, deviceType:"Cloudflare Worker CPU",
  memoryMiB:null, precision:"SHA-256", interconnect:null, region:"provider-managed", slots:3, chunk:1,
  priceMicro:0, rateBasis:"No incremental platform charge booked for this operation. Worker overhead excluded.", kinds:["sha256"] };

export function backends(env) {
  const active = [cpu];
  if (env.AI) active.push(managed);
  let configured = [];
  try { configured = JSON.parse(env.GPU_BACKENDS_JSON ?? "[]"); } catch {}
  for (const pool of Array.isArray(configured) ? configured.slice(0,2) : []) {
    if (!pool || !["GPU_POOL_A","GPU_POOL_B"].includes(pool.binding) || !env[pool.binding] || !ident.test(pool.id ?? "")
      || active.some(x => x.id === pool.id || x.binding === pool.binding) || !ident.test(pool.region ?? "")
      || !["owned","rented","cluster"].includes(pool.ownership)
      || !Number.isSafeInteger(pool.deviceCount) || pool.deviceCount < 1
      || !Number.isSafeInteger(pool.slots) || pool.slots < 1 || pool.slots > pool.deviceCount
      || !Number.isSafeInteger(pool.priceMicro) || pool.priceMicro <= 0 || pool.priceMicro > 1000000
      || !Number.isSafeInteger(pool.memoryMiB) || pool.memoryMiB < 1
      || !Number.isSafeInteger(pool.interconnectGbps) || pool.interconnectGbps < 1
      || !["FP32","BF16","FP16","FP8","INT8","INT4"].includes(pool.precision)
      || typeof pool.deviceType !== "string" || !pool.deviceType.trim() || pool.deviceType.length > 80
      || !Array.isArray(pool.kinds) || !pool.kinds.length
      || pool.kinds.some(kind => !["embedding","batch-embedding","training"].includes(kind))
      || !Array.isArray(pool.models) || pool.models.some(model => typeof model !== "string" || model.length > 128)
      || !Array.isArray(pool.recipes) || pool.recipes.some(recipe => typeof recipe !== "string" || !ident.test(recipe))) continue;
    active.push({ ...pool, runtime:"authorized-service", chunk:4, rateBasis:"Configured upper-bound price per slice input in USD micros." });
  }
  return active;
}

export const totalFor = job => job.work.texts?.length ?? job.work.stages ?? 1;
export function compatible(pool, job) {
  return pool.kinds.includes(job.kind) && (!job.region || job.region === pool.region)
    && (!job.work.model || pool.models?.includes(job.work.model))
    && (job.kind !== "training" || (pool.ownership === "cluster" && pool.deviceCount >= job.work.gpuCount
      && pool.interconnectGbps >= job.work.minInterconnectGbps && pool.recipes?.includes(job.work.recipe)));
}

export function estimate(job,pools) {
  const candidates = pools.filter(pool => compatible(pool,job));
  if (!candidates.length) throw new PlatformError("No configured backend matches this workload.",503);
  const affordable = candidates.filter(pool => MAX_ATTEMPTS * totalFor(job) * pool.priceMicro <= job.budgetMicro);
  if (!affordable.length) throw new PlatformError("Job budget is below the retry-inclusive reservation.",402);
  return { reserve:Math.max(...affordable.map(pool => MAX_ATTEMPTS * totalFor(job) * pool.priceMicro)),
    allowed:affordable.map(pool => pool.id) };
}

export async function execute(pool, job, row, env, objectBytes) {
  const started = Date.now();
  const offset = row.progress;
  const texts = job.work.texts?.slice(offset,offset+pool.chunk);
  let result;
  if (pool.runtime === "workers-ai") {
    const reply = await env.AI.run(MODEL, {text:texts});
    result = { vectors:reply?.data };
  } else if (pool.runtime === "webcrypto") {
    result = { sha256:await sha256(objectBytes), bytes:objectBytes.byteLength };
  } else {
    const payload = JSON.stringify({id:row.id, project:row.project, kind:job.kind, offset, texts, work:job.work,
      checkpoint:job.kind==="training"?JSON.parse(row.checkpoint??"null"):null});
    const headers = {"idempotency-key":row.id+"-"+offset};
    let body=payload;
    if (job.kind==="training" && offset===0) {
      if (await sha256(objectBytes)!==job.work.objectSha256) throw new Error("Dataset hash mismatch");
      body=new FormData();
      body.set("job",payload);
      body.set("dataset",new Blob([objectBytes]),"dataset");
    } else {
      headers["content-type"]="application/json";
    }
    const response = await env[pool.binding].fetch("https://authorized-pool/v1/slice", {
      method:"POST",headers,body,signal:AbortSignal.timeout(45000)
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Backend unavailable");
    result = JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(await bytes(response,150000)));
  }
  if (texts) {
    const vectors = result?.vectors;
    if (!Array.isArray(vectors) || vectors.length !== texts.length || vectors.some(v => !Array.isArray(v) || v.length !== 384
      || v.some(x => typeof x!=="number" || !Number.isFinite(x) || Math.abs(x) > 100) || !v.some(x=>x!==0))) throw new Error("Embedding quality check failed");
    return { data:vectors, completed:texts.length, ms:Date.now()-started, quality:"384 finite dimensions and nonzero vector per input" };
  }
  if (job.kind === "sha256" && result.sha256 === job.work.objectSha256) {
    return { data:result, completed:1, ms:Date.now()-started, quality:"SHA-256 matches the uploaded input" };
  }
  if (job.kind === "training" && result && hex.test(result.checkpointSha256 ?? "") && hex.test(result.artifactSha256 ?? "")
    && result.evaluationSha256 === job.work.evaluationSha256 && Number.isFinite(result.heldOutQuality)
    && result.heldOutQuality >= 0 && result.heldOutQuality <= 1
    && (offset+1 < row.total || result.heldOutQuality >= job.work.targetQuality)) {
    return { data:{checkpointSha256:result.checkpointSha256,artifactSha256:result.artifactSha256,
      heldOutQuality:result.heldOutQuality,evaluationSha256:result.evaluationSha256}, completed:1,
      ms:Date.now()-started, quality:"Authenticated backend checkpoint and held-out quality attestation" };
  }
  throw new Error("Result did not meet acceptance criteria");
}
