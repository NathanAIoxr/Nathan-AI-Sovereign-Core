import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "../src/index.js";

const token = "unit-test-secret";
const auth = {authorization:"Bearer " + token};
const request = (path, config) => new Request("https://worker.test" + path,config);

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0001_initial.sql",import.meta.url),"utf8"));
  const operation = (sql, args = []) => ({
    bind: (...values) => operation(sql,values),
    run: async () => ({meta:{changes:db.prepare(sql).run(...args).changes}}),
    all: async () => ({results:db.prepare(sql).all(...args)}),
    first: async (column) => {
      const row = db.prepare(sql).get(...args);
      return column ? row?.[column] ?? null : row ?? null;
    },
    sql,args
  });
  return {prepare:operation,batch:async statements => {
    db.exec("BEGIN");
    try {
      const results = statements.map(({sql,args}) => sql.startsWith("SELECT")
        ? {results:db.prepare(sql).all(...args)}
        : {meta:{changes:db.prepare(sql).run(...args).changes}});
      db.exec("COMMIT");
      return results;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }};
}

test("serves the project by name and verifies D1 on the health route",async () => {
  const env = {DB:database()};
  assert.match(await (await worker.fetch(request("/"),env)).text(),/<h1>TABORBOY<\/h1>/);
  assert.equal((await (await worker.fetch(request("/api/profile"),env)).json()).entity,"TABORBOY");
  assert.deepEqual(await (await worker.fetch(request("/health"),env)).json(),{entity:"TABORBOY",status:"ONLINE",last_verified_at:null});
});

test("rejects owner routes without a token and hides unlisted sources",async () => {
  assert.equal((await worker.fetch(request("/ops/status"),{SOVEREIGN_TOKEN:token})).status,401);
  assert.equal((await worker.fetch(request("/sources/unlisted",{headers:auth}),{SOVEREIGN_TOKEN:token})).status,404);
  assert.equal((await worker.fetch(request("/ops/status",{headers:{authorization:"Bearer undefined"}}),{})).status,401);
});

test("commits once, accepts retries and rejects conflicting or invalid inputs",async () => {
  const env = {DB:database(),SOVEREIGN_TOKEN:token};
  const input = {"identity_blank":"I AM TABOR","mode":"I_AM","motion_vector":{"x":1,"y":2,"z":3}};
  const send = (body,key="tests-only-key") => worker.fetch(request("/skimmer-traverse",{
    method:"POST",headers:{...auth,"content-type":"application/json","idempotency-key":key},body:JSON.stringify(body)
  }),env);
  assert.equal((await send(input)).status,201);
  assert.equal((await send(input)).status,200);
  assert.equal((await send({...input,identity_blank:"I AM BECOMING"})).status,409);
  assert.equal((await send(input,"bad")).status,400);
  assert.equal((await send({...input,mode:"invalid"})).status,400);
});

test("fails a scheduled attempt when an expected R2 source is missing", async () => {
  const env = {ASSETS:{get:async () => null}};
  await assert.rejects(worker.scheduled({},env), /Source verification failed/);
});
