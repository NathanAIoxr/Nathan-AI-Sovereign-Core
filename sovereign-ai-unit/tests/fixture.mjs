import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import box1 from "../box-1-one/worker.mjs";
import { sha256 } from "../protocol.mjs";

export function database() {
  const sqlite=new DatabaseSync(":memory:");
  sqlite.exec("CREATE TABLE sovereign_ledger(request_id TEXT PRIMARY KEY, axiom TEXT DEFAULT '1 + 1 = 2', input_hash TEXT, output_hash TEXT, output_payload TEXT, model TEXT, created_at INTEGER, will_wheel_way_receipt TEXT); CREATE TABLE compute_leases(request_id TEXT PRIMARY KEY, lease_token TEXT, expires_at INTEGER);");
  sqlite.exec(readFileSync(new URL("../migrations/0002_jobs.sql",import.meta.url),"utf8"));
  return {
    sqlite,
    prepare(sql) {
      const bound = values => ({
        first:async()=>sqlite.prepare(sql).get(...values)??null,
        all:async()=>({results:sqlite.prepare(sql).all(...values)}),
        run:async()=>({meta:sqlite.prepare(sql).run(...values)})
      });
      return {...bound([]),bind:(...values)=>bound(values)};
    },
    batch:async stmts=>Promise.all(stmts.map(stmt=>stmt.all()))
  };
}
export const vectors = texts => texts.map((_,i)=>Array.from({length:384},(_,j)=>j===i?1:0));
export const validAi={run:async (_,{text})=>({data:vectors(text)})};
export const person={project:"project-a",dailyMicro:10000,maxActive:8};
export const body={kind:"batch-embedding",texts:["alpha","beta","gamma","delta","epsilon"],budgetMicro:500};
export function request(url,opts={}) {return new Request(url,{...opts,...(opts.body instanceof ReadableStream?{duplex:"half"}:{})});}
export async function environment(remote={}) {
  const privateEnv={BOX_1_LEDGER:database(),AI:validAi,...remote};
  const token="abcdefghijklmnopqrstuvwxyz123456789";
  const project="pie-pi-phi";
  const other="supercalifragilisticexpialidocious";
  const token2=token+"B";
  return {privateEnv,token,project,token2,other,publicEnv:{
    BOX_ONE:{fetch:(url,opts)=>box1.fetch(request(url,opts),privateEnv)},
    COMPUTE_LIMIT:{limit:async()=>({success:true})},
    JOB_PROJECT_KEYS:JSON.stringify({[project]:{sha256:await sha256(token),dailyMicro:10000,maxActive:8},
      [other]:{sha256:await sha256(token2),dailyMicro:10000,maxActive:8}})
  }};
}
