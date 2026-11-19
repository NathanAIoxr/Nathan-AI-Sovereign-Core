import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const plan = JSON.parse(await readFile(new URL("./plan.json", import.meta.url), "utf8"));
const probe = await readFile(new URL("./probe.py", import.meta.url), "utf8");
const classes = ["ComputeContainer", "HighCapacityContainer"];
const workerName = "tabor-database-compute-control";

export function deployment(databases) {
  if (!Array.isArray(databases) || databases.length === 0 ||
      new Set(databases.map(db => db.name)).size !== databases.length ||
      new Set(databases.map(db => db.uuid)).size !== databases.length ||
      databases.some(db => !db.name || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(db.uuid))) {
    throw new Error("Provide unique D1 names and UUIDs from the intended account");
  }
  const d1 = Object.fromEntries(databases.map((db, i) => [db.name, "DB_" + String(i + 1).padStart(3, "0")]));
  const apps = plan.containerPools.map((pool, i) => ({
    name: pool.name,
    scheduling_policy: "default",
    instances: 0,
    max_instances: databases.length * pool.replicasPerDatabase,
    configuration: {
      image: "docker.io/library/python:3.13-slim",
      instance_type: pool.size,
      entrypoint: ["python", "-u", "-c"],
      command: [probe],
    },
    durable_objects: { script_name: workerName, class_name: classes[i] },
  }));
  const worker = {
    main_module: "worker.mjs",
    compatibility_date: "2026-11-18",
    bindings: [
      ...databases.map(db => ({ type: "d1", name: d1[db.name], id: db.uuid })),
      { type: "json", name: "DATABASES", json: d1 },
      ...["COMPUTE", "HIGHER"].map((name, i) => ({ type: "durable_object_namespace", name, class_name: classes[i] })),
    ],
    containers: apps.map(app => ({ name: app.name, class_name: app.durable_objects.class_name })),
  };
  return { workerName, worker, initialMigration: { new_tag: "v1", steps: [{ new_sqlite_classes: classes }] }, apps };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = JSON.parse(await readFile(process.argv[2], "utf8"));
  console.log(JSON.stringify(deployment(input.databases ?? input.result ?? input), null, 2));
}
