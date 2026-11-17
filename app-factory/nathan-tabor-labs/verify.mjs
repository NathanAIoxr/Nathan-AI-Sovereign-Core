import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker,{campaignRun} from './worker.mjs';
import {ui} from './web.mjs';

new vm.Script(ui);
const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
const noon=Date.UTC(2026,10,17,19);
db.prepare('INSERT INTO campaign VALUES(1,?,?)').run(noon,noon+86400000);
function statement(sql,params=[]){
  return {bind:(...args)=>statement(sql,args),first:async()=>db.prepare(sql).get(...params),all:async()=>({results:db.prepare(sql).all(...params)}),run:async()=>db.prepare(sql).run(...params)};
}
const env={PUBLIC_LABS_DB:{prepare:statement}};
const call=(path,method='GET')=>worker.fetch(new Request('https://labs.example'+path,{method}),env);
assert.equal((await call('/')).status,200);
assert.equal((await call('/api/chip?a=16')).status,400);
assert.equal((await call('/api/checks','POST')).status,405);
assert.equal((await call('/api/shard?parts=4&index=4')).status,400);
assert.equal((await (await call('/api/checks')).json()).passed,true);
await campaignRun(env.PUBLIC_LABS_DB,noon-1);
await campaignRun(env.PUBLIC_LABS_DB,noon);
await campaignRun(env.PUBLIC_LABS_DB,noon+120000);
await campaignRun(env.PUBLIC_LABS_DB,noon+86400000);
const ledger=await (await call('/api/receipts')).json();
assert.equal(ledger.counts[0].runs,1);
assert.equal(ledger.counts[0].passed,1);
assert.equal(ledger.receipts[0].source,'scheduled');
console.log('Public API, browser script, 24-hour boundary and duplicate receipt controls passed.');
