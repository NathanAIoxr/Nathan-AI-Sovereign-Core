import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { collectWikipedia } from './wikimedia.mjs';
import { intakeStatements, ownerReferences, prepareIntake } from './intake.mjs';
import { queuePlan } from './queue-plan.mjs';
import { buildSeed } from '../catalog.mjs';
import { serveCardGames } from '../academy-card-games.mjs';

const page = (pageid,title,revid=1000+pageid,extra={}) => ({
  pageid,ns:0,title,revisions:[{revid}],...extra,
});
const fake = (data) => Response.json(data);

test('Wikipedia follows only documented continuation and pins the revision',async ()=>{
  const urls = [];
  const headers = [];
  const response = await collectWikipedia({
    categories:['Rummy'],token:'test-bearer',retry:async()=>{},
    fetcher:async (url,options)=>{
      urls.push(url); headers.push(options.headers);
      if (urls.length===1) return fake({query:{pages:[page(3,'Gin rummy'),page(4,'Skip',1004,{pageprops:{disambiguation:''}})]},
        continue:{continue:'-||',gcmcontinue:'page|cursor|30',host:'example.net'}});
      return fake({query:{pages:[page(3,'Gin rummy',2000),page(5,'Rummy')] }});
    },
  });
  assert.equal(urls[1].searchParams.get('gcmcontinue'),'page|cursor|30');
  assert.equal(urls[1].searchParams.get('host'),null);
  assert.ok(urls.every((url)=>url.host==='en.wikipedia.org'));
  assert.equal(headers[0].Authorization,'Bearer test-bearer');
  assert.equal(response.pages.length,2);
  assert.equal(response.pages[0].revisionUrl,'https://en.wikipedia.org/?oldid=2000');
  assert.equal(response.access,'oauth-bearer');
});

test('backpressure honors retry and leaves public reads unauthenticated',async ()=>{
  let calls = 0;
  let waits = 0;
  const result = await collectWikipedia({categories:['Card game terminology'],
    retry:async (milliseconds)=>{assert.equal(milliseconds,5000); waits++;},
    fetcher:async (_url,options)=>{
      assert.equal(options.headers.Authorization,undefined);
      return ++calls === 1 ? Response.json({}, {status:429,headers:{'retry-after':'1'}}) :
        fake({query:{pages:[page(14,'Card counting')]}});
    },
  });
  assert.equal(waits,1);
  assert.equal(result.access,'public');
  assert.equal(result.pages[0].recordType,'reference');
});

test('original positions, API and re-runnable D1 intake maintain citations and game separation',async ()=>{
  const owner = await ownerReferences();
  assert.equal(owner.sources.length,69);
  assert.equal(owner.specs.length,22);
  assert.ok(owner.sources.some((v)=>v.id==='NT-CARD-001'&&v.categories[0]==='Deck Tradition / Uncertain Rules'));
  const pages = Array.from({length:100},(_,i)=>({
    id:'enwiki:'+(i+1),pageId:i+1,title:i===0?'Gin rummy':"Test's game "+(i+1),recordType:'game-lead',
    url:'https://en.wikipedia.org/?curid='+(i+1),revision:2000+i,revisionUrl:'https://en.wikipedia.org/?oldid='+(2000+i),categories:['Rummy'],
  }));
  const s = await prepareIntake({pages,access:'public',coverage:[]});
  assert.ok(s.receipt.alpha.inputDigest === s.receipt.beta.inputDigest && s.receipt.verified);
  assert.equal(s.references.find((item)=>item.id==='enwiki:1').linkedGame,'gin-rummy');
  assert.equal(s.references.find((item)=>item.id==='enwiki:2').linkedGame,null);
  const seed = await buildSeed();
  const sql = await intakeStatements(s);
  const db = new DatabaseSync(':memory:');
  db.exec([seed.schema,...seed.chunks,seed.receipt,sql.schema,...sql.chunks,sql.receipt].join('\n'));
  db.exec([...sql.chunks,sql.receipt].join('\n'));
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM card_research_runs').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM card_games').get().n,2321);
  function prepare(query,values=[]) { return {bind:(...params)=>prepare(query,params),
    all:()=>({results:db.prepare(query).all(...values)}),
    first:()=>db.prepare(query).get(...values),
  }; }
  const env = {prepare,batch:(items)=>items.map((item)=>item.all())};
  const api = async (path,query='') => (await serveCardGames(new Request('https://example.com/'+path+query),env,path)).json();
  assert.equal((await api('api/references','?q=Gin')).items[0].linked_game,'gin-rummy');
  assert.equal((await api('api/games/gin-rummy')).researchReferences.find((item)=>item.source==="wikipedia").revision,2000);
  assert.equal((await api('api/references/engine-specs')).specs.length,22);
  assert.ok((await api('api/references/summary')).refresh.digest);
  const bad = {...pages[0],revisionUrl:'https://example.com'};
  await assert.rejects(prepareIntake({pages:[bad,...pages.slice(1)]}),/Invalid Wikipedia snapshot/);
});

test('existing Build Loop job IDs are stable and jobs are draft-only',async ()=>{
  const plan = JSON.parse(await readFile(new URL('draft-plan.json',import.meta.url),'utf8'));
  const run = queuePlan(plan,1);
  assert.equal(run.planId,queuePlan(plan,2).planId);
  assert.equal(Object.keys(run.taskIds).length,3);
  assert.equal(run.batch.length,7);
  assert.ok(run.batch.filter(x=>x.sql.includes('INSERT INTO build_queue')).every(x=>x.sql.includes("'pending',0")));
  assert.throws(()=>queuePlan({...plan,tasks:[{...plan.tasks[0],publish:1}]}),/Invalid draft task/);
});
