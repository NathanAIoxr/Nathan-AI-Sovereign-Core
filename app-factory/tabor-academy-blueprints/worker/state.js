import { sha256, rowHash } from "../shared/merkle.js";

const allowedKeys = ["id","state","version"];
const answer = (body,status=200) => Response.json(body,{status,headers:{"Cache-Control":"no-store"}});

export const stateCommandKey = (id,version,state) =>
  sha256(JSON.stringify(["TaborAcademy:state-command:v1",id,version,state]));

export async function recordStateCommand(db,{key,id,version,state}) {
  const append = db.prepare(`INSERT INTO blueprint_integrity_commands (key,lesson_id,expected_version,state)
    SELECT ?,?,?,? FROM blueprint_integrity
    WHERE lesson_id=? AND version=? AND state<>? AND state<>-1 AND (?<>-1 OR state=0)
    ON CONFLICT(key) DO NOTHING`).bind(key,id,version,state,id,version,state,state);
  const read = db.prepare("SELECT lesson_id AS id,expected_version+1 AS version,state FROM blueprint_integrity_commands WHERE key=?").bind(key);
  const [,result] = await db.batch([append,read]);
  return result.results[0] ?? null;
}

async function permitted(request,env) {
  const supplied = request.headers.get("Authorization") ?? "";
  const secret = env.CONDUCTOR_KEY ?? env.EDITOR_KEY;
  if (typeof secret !== "string" || secret.length < 32 || supplied.length > 266 ||
      request.headers.get("Sec-Fetch-Site")==="cross-site") return false;
  const [a,b] = await Promise.all([sha256(supplied),sha256("Bearer "+secret)]);
  let difference = 0;
  for(let i=0;i<a.length;i++) difference |= a.charCodeAt(i)^b.charCodeAt(i);
  return difference===0;
}

export async function stateCommand(request,env) {
  if (request.method!=="PUT" || !await permitted(request,env)) return answer({error:"Not found."},404);
  const reader = request.body?.getReader();
  if (!reader) return answer({error:"Missing command."},400);
  const decoder = new TextDecoder();
  let raw = "";
  let length = 0;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    length += chunk.value.length;
    if (length>256) { await reader.cancel(); return answer({error:"Command is too large."},413); }
    raw += decoder.decode(chunk.value,{stream:true});
  }
  raw += decoder.decode();
  let payload;
  try { payload = JSON.parse(raw); } catch { return answer({error:"Invalid command."},400); }
  if (!payload || typeof payload!=="object" || Array.isArray(payload) ||
      Object.keys(payload).length!==3 || !allowedKeys.every(k=>Object.hasOwn(payload,k))) {
    return answer({error:"Expected id, version and state."},400);
  }
  const {id,version,state} = payload;
  if (!Number.isSafeInteger(id) || id<1 || !Number.isSafeInteger(version) || version<1 ||
      ![-1,0,1].includes(state)) return answer({error:"Invalid lesson, version or state."},400);
  const key = await stateCommandKey(id,version,state);
  if (key!==request.headers.get("Idempotency-Key")) return answer({error:"Invalid idempotency key."},400);
  const prior = await env.DB.prepare("SELECT lesson_id AS id,expected_version+1 AS version,state FROM blueprint_integrity_commands WHERE key=?").bind(key).first();
  if (prior) return answer(prior);
  if (state===1) {
    const row = await env.DB.prepare("SELECT * FROM blueprint_lessons_v7 WHERE id=?").bind(id).first();
    if (!row || row.row_sha256!==await rowHash(row)) return answer({error:"Invalid lesson integrity."},409);
  }
  const receipt = await recordStateCommand(env.DB,{id,version,state,key});
  return receipt ? answer(receipt) : answer({error:"Academy version or state changed."},409);
}
