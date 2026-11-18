import { OBJECT_LIMIT, PlatformError, bytes, sha256 } from "../protocol.mjs";
const objectKey=(project,id)=>project+"/"+id;
const lifetime=48*60*60*1000;
export async function upload(env,request,project) {
  if (!env.ARTIFACTS) throw new PlatformError("Scoped object storage is awaiting activation.",503);
  const db=env.BOX_1_LEDGER;
  const data=await bytes(request,OBJECT_LIMIT);
  if (!data.length) throw new PlatformError("Object must be nonempty.");
  const now=Date.now(), id=crypto.randomUUID(), digest=await sha256(data);
  const row=await db.prepare(`INSERT INTO platform_objects (id,project,sha256,bytes,created,expires)
    SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM platform_objects WHERE project=? AND expires>?)<16
    RETURNING id`).bind(id,project,digest,data.length,now,now+lifetime,project,now).first();
  if (!row) throw new PlatformError("Project object quota reached.",429);
  try { await env.ARTIFACTS.put(objectKey(project,id),data); }
  catch {
    await db.prepare("DELETE FROM platform_objects WHERE project=? AND id=?").bind(project,id).run();
    throw new PlatformError("Object storage unavailable.",503);
  }
  return {id,sha256:digest,bytes:data.length,expires:now+lifetime};
}
export async function purgeObjects(env,now=Date.now()) {
  if (!env.ARTIFACTS) return;
  const db=env.BOX_1_LEDGER;
  const {results}=await db.prepare("SELECT id,project FROM platform_objects WHERE expires<=? ORDER BY expires LIMIT 20").bind(now).all();
  for (const item of results) {
    await env.ARTIFACTS.delete(objectKey(item.project,item.id));
    await db.prepare("DELETE FROM platform_objects WHERE project=? AND id=?").bind(item.project,item.id).run();
  }
}
