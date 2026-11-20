export const namespace = "nathan-tabor-sandbox";

export function validateProjects(projects) {
  if (!Array.isArray(projects) || !projects.length || projects.length > 64 ||
      new Set(projects).size !== projects.length ||
      projects.some(id => typeof id !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || id.length > 52)) {
    throw new Error("Invalid Zone project registry");
  }
}

async function list(request, path, field, key, name) {
  for (let page = 1; ; page++) {
    const { result, result_info: info } = await request("GET", path, {
      query: { per_page: 100, page, ...(key === "uuid" ? { name } : {}) }
    });
    const existing = result.find(row => row[field] === name);
    if (existing) return existing;
    if (page >= (info?.total_pages ?? Math.ceil((info?.total_count ?? result.length) / 100))) return null;
  }
}

async function ensure(request, path, field, key, name) {
  const find = () => list(request, path, field, key, name);
  let row = await find();
  if (!row) {
    try {
      ({ result: row } = await request("POST", path, { body: { [field]: name } }));
    } catch (error) {
      row = await find();
      if (!row) throw error;
    }
  }
  if (row[field] !== name || typeof row[key] !== "string" || !/^[\da-f-]{32,36}$/.test(row[key])) {
    throw new Error("Unexpected resource identity at " + path);
  }
  return row[key];
}

async function missing(request, path) {
  try {
    return (await request("GET", path)).result;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

function bindingValue(binding) {
  return binding.id ?? binding.namespace_id ?? binding.bucket_name ??
    binding.queue_name ?? binding.queue_id ?? binding.text;
}

export async function reconcileZone(request, project, release, worker) {
  validateProjects([project]);
  if (!/^[a-f0-9]{64}$/.test(release ?? "")) throw new Error("Invalid Worker digest");
  const name = "zone-" + project;

  // ALIEN accepts a declared project and resolves its own staging resource names.
  const bucket = "/r2/buckets/" + name + "-r2";
  if (!await missing(request, bucket)) {
    try {
      await request("POST", "/r2/buckets", { body: { name: name + "-r2" } });
    } catch (error) {
      if (!await missing(request, bucket)) throw error;
    }
  }
  const [managed, custom] = await Promise.all([
    request("GET", bucket + "/domains/managed"),
    request("GET", bucket + "/domains/custom")
  ]);
  if (managed.result?.enabled !== false || !Array.isArray(custom.result?.domains) ||
      custom.result.domains.length) {
    throw new Error("The staging bucket must have private ingress");
  }
  const [db, kv, queue] = await Promise.all([
    ensure(request, "/d1/database", "name", "uuid", name + "-db"),
    ensure(request, "/storage/kv/namespaces", "title", "id", name + "-kv"),
    ensure(request, "/queues", "queue_name", "queue_id", name + "-q")
  ]);

  // EMIT builds the staging envelope. Project migrations and seed data can follow here.
  const query = async (sql, params = []) => {
    const { result } = await request("POST", "/d1/database/" + db + "/query", { body: { sql, params } });
    if (result?.[0]?.success !== true) throw new Error("D1 verification failed");
    return result[0].results;
  };
  const [manifestTable] = await query(
    "SELECT name FROM sqlite_schema WHERE type='table' AND name='zone_manifest'"
  );
  if (!manifestTable) {
    await query("CREATE TABLE IF NOT EXISTS zone_manifest (project TEXT PRIMARY KEY, phase TEXT NOT NULL CHECK(phase='REHEARSAL'))");
    await query("INSERT INTO zone_manifest(project, phase) VALUES (?, 'REHEARSAL') ON CONFLICT DO NOTHING", [project]);
  } else if ((await query("SELECT project FROM zone_manifest LIMIT 1")).length === 0) {
    await query("INSERT INTO zone_manifest(project, phase) VALUES (?, 'REHEARSAL') ON CONFLICT DO NOTHING", [project]);
  }
  const bindings = [
    { type: "d1", name: "DB", id: db },
    { type: "r2_bucket", name: "ARTIFACTS", bucket_name: name + "-r2" },
    { type: "kv_namespace", name: "CONFIG", namespace_id: kv },
    { type: "queue", name: "EVENTS", queue_id: queue, queue_name: name + "-q" },
    { type: "plain_text", name: "ZONE_PROJECT", text: project },
    { type: "plain_text", name: "ZONE_RELEASE", text: release }
  ];
  const script = "/workers/dispatch/namespaces/" + namespace + "/scripts/" + name;
  const checkBindings = actual => Array.isArray(actual) && actual.length === bindings.length &&
    bindings.every(expected => actual.some(binding => binding.name === expected.name &&
      binding.type === expected.type && (bindingValue(binding) === bindingValue(expected) ||
        expected.type === "queue" && binding.queue_id === queue)));
  const installed = await missing(request, script + "/bindings");
  if (installed && !installed.some(binding => binding.name === "ZONE_PROJECT" &&
      binding.type === "plain_text" && binding.text === project)) {
    throw new Error("Existing Worker identity differs from the staging project");
  }
  const needsUpload = !checkBindings(installed);
  if (needsUpload) {
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify({
      main_module: "worker.mjs", compatibility_date: "2026-11-19", bindings
    })], { type: "application/json" }));
    form.append("worker.mjs", new Blob([worker], { type: "application/javascript+module" }), "worker.mjs");
    await request("PUT", script, { body: form });
  }

  // NEILA verifies isolation and records a rehearsal receipt. Launch is a separate human command.
  let verifiedBindings = installed;
  if (needsUpload) {
    for (const delay of [0, 1000, 2000, 4000, 8000]) {
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      verifiedBindings = await missing(request, script + "/bindings");
      if (checkBindings(verifiedBindings)) break;
    }
  }
  const rows = await query("SELECT project, phase FROM zone_manifest ORDER BY project LIMIT 2");
  if (rows.length !== 1 || rows[0].project !== project || rows[0].phase !== "REHEARSAL" ||
      !checkBindings(verifiedBindings)) {
    throw new Error("Zone identity or binding mismatch");
  }
  return {
    project, branch: "zone/" + project, phase: "REHEARSAL", worker: name,
    namespace, database: name + "-db", bucket: name + "-r2", kv: name + "-kv",
    queue: name + "-q", release
  };
}
