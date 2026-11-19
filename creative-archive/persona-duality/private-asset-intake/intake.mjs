import { createHash } from "node:crypto";
import { NODES } from "../registry.mjs";

export const CHARACTER_IDS = Object.freeze(["buddy", "hunny", "hidden-kingdom"]);
export const ALLOWED_KINDS = Object.freeze(["original_artwork", "character_sheet", "story_notes", "audio", "video", "source_transcript"]);
export const ALLOWED_STATES = Object.freeze(["unverified", "owner_verified", "rights_reviewed"]);
export const MAX_BYTES = 500 * 1024 * 1024;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
export function validateAssetRecord(record) {
  const errors = [];
  if (!isPlainObject(record)) return { ok:false, errors:["Record must be an object"] };
  const allowed = new Set(["id","character_id","kind","sha256","bytes","media_type","rights","source_class","verification","storage","notes"]);
  for (const key of Object.keys(record)) if (!allowed.has(key)) errors.push("Unexpected field: "+key);
  if (typeof record.id !== "string" || !/^asset-[a-z0-9-]{3,64}$/.test(record.id)) errors.push("Invalid asset id");
  if (!CHARACTER_IDS.includes(record.character_id) || !NODES.some(n=>n.id===record.character_id)) errors.push("Unknown character");
  if (!ALLOWED_KINDS.includes(record.kind)) errors.push("Invalid kind");
  if (typeof record.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(record.sha256)) errors.push("Expected lowercase SHA-256");
  if (!Number.isSafeInteger(record.bytes) || record.bytes < 1 || record.bytes > MAX_BYTES) errors.push("Invalid size");
  if (typeof record.media_type !== "string" || !/^(image\/(png|jpeg|webp)|application\/pdf|text\/plain|audio\/(mpeg|wav)|video\/mp4)$/.test(record.media_type)) errors.push("Unsupported media type");
  if (!["creator_original","licensed","third_party_reference","unresolved"].includes(record.rights)) errors.push("Rights must be explicit");
  if (!["user_supplied","repository_metadata","unverified_reference"].includes(record.source_class)) errors.push("Source class must be explicit");
  if (!ALLOWED_STATES.includes(record.verification)) errors.push("Verification state required");
  if (!isPlainObject(record.storage) || record.storage.visibility !== "private" || record.storage.public_url !== undefined ||
      typeof record.storage.vault_key !== "string" || !/^vault:[a-z0-9/_-]{3,120}$/.test(record.storage.vault_key)) errors.push("Private vault key required; no public URLs");
  if (record.notes !== undefined && (typeof record.notes !== "string" || record.notes.length > 500)) errors.push("Notes must be short text");
  return {ok:errors.length===0,errors};
}
export function buildPrivateManifest(records) {
  if (!Array.isArray(records)) throw new TypeError("Records must be an array");
  const seen = new Set();
  const assets = [];
  for (const item of records) {
    const result=validateAssetRecord(item);
    if (!result.ok) throw new Error(result.errors.join("; "));
    if (seen.has(item.id)) throw new Error("Duplicate asset id");
    seen.add(item.id);
    assets.push({...item,storage:{visibility:"private",vault_key:item.storage.vault_key}});
  }
  return {schema:"tabor-persona-private-assets/v1",public_export:false,asset_count:assets.length,assets};
}
export function hashAsset(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("Expected bytes");
  return createHash("sha256").update(bytes).digest("hex");
}
export function publicInventorySummary(manifest) {
  if (!isPlainObject(manifest) || manifest.schema!=="tabor-persona-private-assets/v1" || !Array.isArray(manifest.assets)) throw new TypeError("Invalid manifest");
  const counts=Object.fromEntries(CHARACTER_IDS.map(id=>[id,0]));
  for(const item of manifest.assets){
    if(!validateAssetRecord(item).ok) throw new Error("Invalid asset in manifest");
    counts[item.character_id]++;
  }
  return {schema:"tabor-persona-private-assets-summary/v1",asset_count:manifest.assets.length,counts,contains_original_bytes:false,contains_storage_locations:false,rights_status:"unverified_until_owner_review"};
}
