import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { audience, verifyIntakeIdentity } from '../card-intake-auth.mjs';
import { publishReferences } from '../card-intake-publish.mjs';
import { prepareIntake } from './intake.mjs';
import { buildSeed } from '../catalog.mjs';

const origin='https://example.test/api/references/intake';
const repo='NathanAIoxr/Nathan-AI-Sovereign-Core';
const branch='refs/heads/main';
const params={name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])};
const now=1900000000;
const key = await crypto.subtle.generateKey(params,true,['sign','verify']);
const jwk = await crypto.subtle.exportKey('jwk',key.publicKey);
const claims={iss:'https://token.actions.githubusercontent.com',aud:audience, repository:repo,
  repository_id:'1038249626',repository_owner_id:'226606102',ref:branch,
  workflow_ref:repo+'/.github/workflows/tabor-academy-card-source-intake.yml@'+branch,
  event_name:'schedule',iat:now-1,nbf:now-1,exp:now+300,run_id:'98754'};
async function token(data) {
  const tagged = Buffer.from(JSON.stringify({alg:'RS256',kid:'test-key'})).toString('base64url')+'.'+
    Buffer.from(JSON.stringify(data)).toString('base64url');
  const signed = await crypto.subtle.sign(params,key.privateKey,Buffer.from(tagged));
  return tagged+'.'+Buffer.from(signed).toString('base64url');
}

test('the intake accepts only a verified short-lived identity from this exact workflow', async ()=>{
  let attempts=0;
  const fetcher=(url)=>{
    assert.equal(url,'https://token.actions.githubusercontent.com/.well-known/jwks');
    attempts++;
    return Response.json({keys:[{...jwk,kid:'test-key'}]});
  };
  async function verify(data) {
    const signed=await token(data);
    return verifyIntakeIdentity(new Request(origin,{headers:{authorization:'Bearer '+signed}}),{fetcher,now});
  }
  assert.equal((await verify(claims)).runId,'98754');
  for (const wrong of [{repository_id:'999'},{repository_owner_id:'999'},{aud:'any-other'},{ref:'refs/heads/feature'},
    {workflow_ref:'different.yml'},{event_name:'pull_request'},{exp:now-1},{exp:now+901}]) {
    assert.equal(await verify({...claims,...wrong}),null);
  }
  const real=await token(claims);
  const parts=real.split('.');
  parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);
  assert.equal(await verifyIntakeIdentity(new Request(origin,{headers:{authorization:'Bearer '+parts.join('.')}}),{fetcher,now}),null);
  assert.equal(attempts,2);
});

test('the worker validates the receipt and applies the reference import as one scoped transaction', async ()=>{
  const seed=await buildSeed();
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(seed.schema+await readFile(new URL('schema.sql',import.meta.url),'utf8'));
  for(const sql of seed.chunks)sqlite.exec(sql);
  const db={
    prepare:(sql)=>({bind:(...values)=>()=>sqlite.prepare(sql).run(...values)}),
    batch:(statements)=>{
      sqlite.exec('BEGIN');
      try { for(const execute of statements)execute(); sqlite.exec('COMMIT'); }
      catch(error){ sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const pages=Array.from({length:100},(_,i)=>({
    id:'enwiki:'+(i+1),pageId:i+1,title:'Card test '+i,recordType:'game-lead',
    revision:1000+i,url:'https://en.wikipedia.org/?curid='+(i+1),revisionUrl:'https://en.wikipedia.org/?oldid='+(1000+i),
    categories:['Card games'],
  }));
  const prepared=await prepareIntake({pages,access:'public',coverage:[]});
  const {references,specs,evidence,receipt}=prepared;
  const valid={references,specs,evidence,receipt};
  let req=(payload)=>new Request(origin,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  assert.equal((await publishReferences(req(valid),db,async()=>null)).status,401);
  assert.equal((await publishReferences(req({...valid,evidence:{...evidence,digest:'wrong'}}),db,async()=>({runId:'1'}))).status,422);
  for (let i=0;i<2;i++) {
    const result=await publishReferences(req(valid),db,async()=>({runId:'1'}));
    assert.equal(result.status,200);
    assert.equal((await result.json()).id,receipt.correlationId);
  }
  assert.equal(sqlite.prepare('SELECT count(*) AS count FROM card_research_sources').get().count,169);
  assert.equal(sqlite.prepare('SELECT count(*) AS count FROM card_research_runs').get().count,1);
  assert.equal(sqlite.prepare('SELECT count(*) AS count FROM card_games').get().count,2321);
});
