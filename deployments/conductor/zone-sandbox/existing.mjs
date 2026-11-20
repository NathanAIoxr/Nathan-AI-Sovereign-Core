import { projectNamespace } from "./reconcile.mjs";

export async function verifyExistingZone(request, project, app = false) {
  const name = projectNamespace(project);
  const script = "/workers/dispatch/namespaces/" + name + "/scripts/" + name;
  const { result: bindings } = await request("GET", script + "/bindings");
  const get = (name, type) => bindings.find(b => b.name === name && b.type === type);
  const db = get("ZONE_DB", "d1")?.id;
  const kv = get("ZONE_CONFIG", "kv_namespace")?.namespace_id;
  const state = get("ZONE_STATE", "durable_object_namespace")?.namespace_id;
  const bucketName = app ? "zone-" + project + "-r2" : name;
  const queueName = app ? "zone-" + project + "-q" : name;
  if (get("PROJECT_ID", "plain_text")?.text !== project ||
      get("STAGING_ALIAS", "plain_text")?.text !== project + ".test" ||
      get("ZONE_ASSETS", "r2_bucket")?.bucket_name !== bucketName ||
      get("ZONE_JOBS", "queue")?.queue_name !== queueName ||
      !/^[\da-f-]{36}$/.test(db ?? "") || !/^[\da-f]{32}$/.test(kv ?? "") ||
      !/^[\da-f]{32}$/.test(state ?? "")) {
    throw new Error("Existing holding Worker bindings failed verification");
  }
  const bucket = "/r2/buckets/" + bucketName;
  const identity = app
    ? "SELECT project_id FROM staged_app WHERE project_id = ? AND launch_status = 'HOLDING'"
    : "SELECT project_id FROM zones_registry WHERE project_id = ?";
  const [manifest, managed, custom] = await Promise.all([
    request("POST", "/d1/database/" + db + "/query", {
      body: { sql: identity, params: [project] }
    }),
    request("GET", bucket + "/domains/managed"),
    request("GET", bucket + "/domains/custom")
  ]);
  if (manifest.result?.[0]?.results?.[0]?.project_id !== project ||
      managed.result?.enabled !== false || !Array.isArray(custom.result?.domains) ||
      custom.result.domains.length) {
    throw new Error("Existing holding Worker database or bucket failed verification");
  }
  return { project, branch: "zone/" + project, phase: "REHEARSAL", worker: name, namespace: name };
}
