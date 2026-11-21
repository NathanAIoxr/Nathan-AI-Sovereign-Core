// This module is an operator-run Worker. Its only public release counterpart is src/worker.mjs.
import editions from "../data/editions.json" with { type: "json" };
import { editionBatch } from "./seeds.mjs";
import { bodyKey } from "../src/model.mjs";
import { sha256 } from "../src/integrity.mjs";

async function readBounded(response, expected) {
  if (!response.ok || !response.body) throw new Error("Source download failed");
  const bytes = new Uint8Array(expected);
  let used = 0;
  const stream = response.body.getReader();
  try {
    for (;;) {
      const next = await stream.read();
      if (next.done) break;
      if (used + next.value.length > expected) throw new Error("Source size exceeds manifest");
      bytes.set(next.value,used);
      used += next.value.length;
    }
  } finally {
    await stream.cancel();
  }
  if (used !== expected) throw new Error("Source size disagrees with manifest");
  return bytes;
}

export async function captureEdition(env, edition) {
  const key = bodyKey(edition.sha256);
  const previous = await env.ARCHIVE_DB.prepare("SELECT sha256 FROM archive_editions WHERE work_id=? AND edition_id=?").bind(edition.work,edition.id).first();
  if (previous && previous.sha256 !== edition.sha256) throw new Error("Edition already points to different bytes");
  const existing = await env.ARCHIVE_BLOB.get(key);
  if (existing) {
    if (existing.size !== edition.bytes || existing.customMetadata?.sha256 !== edition.sha256 ||
        await sha256(await existing.arrayBuffer()) !== edition.sha256) throw new Error("Stored bytes disagree with manifest");
  } else {
    const source = new URL(edition.url);
    if (source.hostname !== "raw.githubusercontent.com" || !/^\/GITenberg\/[^/]+\/[a-f0-9]{40}\/[0-9-]+\.txt$/.test(source.pathname)) {
      throw new Error("Edition requires a pinned source");
    }
    const response = await fetch(source,{redirect:"manual"});
    const bytes = await readBounded(response,edition.bytes);
    if (await sha256(bytes) !== edition.sha256) throw new Error("Source digest disagrees with manifest");
    await env.ARCHIVE_BLOB.put(key,bytes,{sha256:edition.sha256,customMetadata:{sha256:edition.sha256}});
  }
  const batch = editionBatch(edition,new Date().toISOString());
  await env.ARCHIVE_DB.batch(batch.map(({sql,params})=>env.ARCHIVE_DB.prepare(sql).bind(...params)));
  const stored = await env.ARCHIVE_DB.prepare("SELECT sha256 FROM archive_editions WHERE work_id=? AND edition_id=?").bind(edition.work,edition.id).first();
  if (stored?.sha256 !== edition.sha256) throw new Error("Edition publication conflict");
  return {id:edition.id,bytes:edition.bytes,sha256:edition.sha256};
}

async function authenticated(request, env) {
  if (!env.CAPTURE_KEY || env.CAPTURE_KEY.length < 32) return false;
  const supplied = request.headers.get("authorization");
  if (!supplied?.startsWith("Bearer ") || supplied.length > 200) return false;
  const encoded = new TextEncoder();
  const key = await crypto.subtle.importKey("raw",encoded.encode(env.CAPTURE_KEY),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
  const message = encoded.encode("library-of-tabor-capture");
  const candidate = await crypto.subtle.importKey("raw",encoded.encode(supplied.slice(7)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature = await crypto.subtle.sign("HMAC",candidate,message);
  return crypto.subtle.verify("HMAC",key,signature,message);
}

export default {
  async fetch(request,env) {
    const path = new URL(request.url).pathname;
    const edition = editions.find(e=>path==="/capture/"+e.id);
    if (request.method !== "POST" || !edition || !await authenticated(request,env)) return new Response(null,{status:404});
    try {
      return Response.json(await captureEdition(env,edition));
    } catch (error) {
      return Response.json({error:error.message},{status:503});
    }
  }
};
