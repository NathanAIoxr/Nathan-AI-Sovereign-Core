import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { nodeTemplate } from "./runtime.mjs";

const base = "/api/node-template";
const operator = "/cheironomer/operator/node-template";
const sample = { source: "backend", node: "owned-ai", event_id: "event-1",
  operation: "provenance", outcome: "verified", evidence: "b".repeat(64) };
function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0005_node_template.sql", import.meta.url), "utf8"));
  db.exec(`CREATE TABLE nathan_backends (id TEXT PRIMARY KEY, enabled INTEGER);
    INSERT INTO nathan_backends VALUES ('owned-ai',1),('disabled-ai',0);
    CREATE TABLE owned_runtime_registry (record_key TEXT PRIMARY KEY,state TEXT);
    CREATE TABLE fleet_entry (id INTEGER PRIMARY KEY,source_state TEXT);
    CREATE TABLE supernode_registry (logical_address INTEGER PRIMARY KEY);
    CREATE TABLE tabor_compute_fleet (node_id TEXT PRIMARY KEY,verification_state TEXT);
    CREATE TABLE tabor_infrastructure_nodes (node_id TEXT PRIMARY KEY,operational_status TEXT);
    CREATE TABLE nathan_rotational_agents (id TEXT PRIMARY KEY,state TEXT);
    CREATE TABLE supercomputer_registry (id TEXT PRIMARY KEY,status TEXT);`);
  const objects = new Map();
  const fixture = { db, writeFailure: false };
  const binding = { prepare(sql) {
    const statement = db.prepare(sql);
    function bind(...args) {
      return {
        first: async () => statement.get(...args),
        all: async () => ({ results: statement.all(...args) }),
        run: async () => {
          if (fixture.writeFailure) throw Error("D1 daily write limit exceeded");
          return { meta: { changes: statement.run(...args).changes } };
        },
      };
    }
    return { bind, ...bind() };
  } };
  const env = { NODE_FLEET_READ: binding, NODE_CORE_READ: binding, NODE_COMPUTE_READ: binding, LEDGER: binding,
    NODE_TEMPLATE_SIGNING_KEY: "test-key-".repeat(8),
    AUDIT: {
      async put(key,value,{onlyIf}) {
        assert.equal(onlyIf.etagDoesNotMatch,"*");
        if (objects.has(key)) return null;
        objects.set(key,value);
        return {key};
      },
      async head(key) { return objects.has(key) ? {key} : null; },
      async get(key) {
        const value = objects.get(key);
        return value ? { size: value.length, json: async () => JSON.parse(value) } : null;
      },
    },
  };
  fixture.call = async (path, input, { asOperator = false, token } = {}) => {
    const request = new Request("https://example.invalid" + path, input === undefined ? {} : {
      method: "POST", body: JSON.stringify(input), headers: {
        "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}),
      },
    });
    return nodeTemplate.route(request,env,path,{ operator: async () => asOperator, limitedBody: async request =>
      new Uint8Array(await request.arrayBuffer()) });
  };
  return fixture;
}

test("loads all eight live schema contracts and excludes non-template routes", async () => {
  const {call} = setup();
  const health = await call(base + "/health");
  assert.equal(health.status,200);
  assert.equal((await health.json()).registrySources.length,8);
  assert.equal(Object.keys((await (await call(base + "/contract")).json()).loops).length,6);
  assert.equal(await call("/api/health"),null);
});

test("issues a scoped credential to an eligible node and rejects anonymous or cross-node requests", async () => {
  const {call} = setup();
  const node = { source: sample.source, node: sample.node };
  assert.equal((await call(operator+"/credential",node)).status,401);
  assert.equal((await call(operator+"/credential",{...node,node:"disabled-ai"},{asOperator:true})).status,422);
  const {bearer} = await (await call(operator+"/credential",node,{asOperator:true})).json();
  assert.equal((await call(base+"/receipts",sample)).status,401);
  assert.equal((await call(base+"/receipts",{...sample,node:"disabled-ai"},{token:bearer})).status,401);
  assert.equal((await call(base+"/receipts",sample,{token:bearer})).status,201);
});

test("ledger entries are append-only and exact retries reuse the receipt", async () => {
  const {call,db} = setup();
  const submit = input => call(operator+"/receipts",input,{asOperator:true});
  assert.equal((await submit({...sample, command:"unexpected"})).status,400);
  const a = await submit(sample);
  const b = await submit(sample);
  const c = await submit({...sample,outcome:"discarded"});
  assert.equal(a.status,201);
  assert.equal(b.status,200);
  assert.equal(c.status,409);
  assert.equal((await a.json()).digest,(await b.json()).digest);
  assert.throws(() => db.exec("UPDATE node_template_receipts SET outcome = 'discarded'"), /append-only/);
});

test("stores a bounded pending receipt on write pressure and replays it after recovery", async () => {
  const fixture = setup();
  const {call} = fixture;
  fixture.writeFailure = true;
  const submit = () => call(operator+"/receipts",sample,{asOperator:true});
  const pending = await submit();
  assert.equal(pending.status,202);
  const {key} = await pending.json();
  assert.equal((await (await submit()).json()).key,key);
  assert.equal((await call(operator+"/replay",{key},{asOperator:true})).status,503);
  fixture.writeFailure = false;
  assert.equal((await call(operator+"/replay",{key},{asOperator:true})).status,201);
  assert.equal((await call(operator+"/replay",{key},{asOperator:true})).status,200);
});
