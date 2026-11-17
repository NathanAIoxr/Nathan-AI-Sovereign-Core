import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';
import test from 'node:test';
import worker from './worker.mjs';
import { homePulse, connections, INTERVAL } from './home-core.mjs';
import { directory } from './home-directory.mjs';
import { script as mind } from './mind-game.mjs';
import { script as hounds } from './hounds-game.mjs';
import { page as playerPage, script as player } from './labs-game.mjs';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['schema.sql','home-schema.sql']) sqlite.exec(readFileSync(new URL(file,import.meta.url),'utf8'));
  function statement(sql,params=[]){
    return {bind:(...args)=>statement(sql,args),first:async()=>sqlite.prepare(sql).get(...params),
      all:async()=>({results:sqlite.prepare(sql).all(...params)}),commit:()=>sqlite.prepare(sql).run(...params)};
  }
  const batch=async stmts=>stmts.map(stmt=>stmt.commit());
  return {sqlite,db:{prepare:statement,batch}};
}

test('home and play routes coexist with legacy APIs and prohibit writes',async()=>{
  const {db}=database();
  const call=(path,method='GET')=>worker.fetch(new Request('https://labs.example'+path,{method}),{PUBLIC_LABS_DB:db});
  const home=await (await call('/')).text();
  assert.match(home,/The mind\. The brain\. The skull\./);
  assert.doesNotMatch(home,/Machine-readable receipt|21 Hive role definitions/);
  const catalog=await (await call('/systems/')).text();
  assert.match(catalog,/Library of Tabor/);
  assert.match(catalog,/Find a system/);
  assert.match(catalog,/src="\/home\.js\?v=2"/);
  const links=directory.flatMap(group=>group.entries.map(entry=>entry[1]));
  assert.equal(new Set(links).size,links.length);
  assert.match(await (await call('/workers')).text(),/21 Hive role definitions/);
  assert.match(await (await call('/workbench')).text(),/4T Clover logic/);
  assert.equal((await call('/api/chip?a=1&b=1&carry=0')).status,200);
  assert.equal((await call('/api/home/status','POST')).status,405);
  assert.deepEqual((await (await call('/api/receipts')).json()).receipts,[]);
  for (const mode of ['mind','hounds','labs']){
    const response=await call('/play/'+mode);
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
    const gameHtml=await response.text();
    if(mode==='hounds')assert.ok(gameHtml.includes('src="/play/hounds.js?v=protect-1"'));
    else assert.match(gameHtml, new RegExp('src="/play/'+mode+'\\.js"'));
    assert.equal((await call('/play/'+mode+'.js')).status,200);
  }
  for(const code of [mind,hounds,player,await (await call('/home.js')).text()]) new Script(code);
  assert.equal((await (await call('/api/home/check')).json()).passed,true);
  assert.equal((await (await call('/api/home/status')).json()).checks.checks.length,3);
  assert.match(playerPage,/lab-data/);
  assert.doesNotMatch(playerPage+player,/mail\.google\.com|libfile_/);
});

test('scheduled pulse validates expected auth, records status only, and bounds retention',async()=>{
  const {db,sqlite}=database();
  const moment=2000000000000;
  const fake=async(url,opts)=>{
    assert.ok(connections.some(s=>s.url+s.path===url));
    assert.equal(opts.redirect,'manual');
    assert.equal(opts.method,'GET');
    if(url.includes('nathan-ai-fleet'))return Response.json({service:'nathan-ai-fleet',workers:{managed:64},
      supervisors:{assigned:64,checked:40,healthy:39,protected:1,failed:0,pending:24,ignored:'unpublished body'}});
    return new Response('unpublished body',{status:url.includes('one-sovereign-hub')?403:200});
  };
  await homePulse(db,moment,fake);
  await homePulse(db,moment,()=>assert.fail('duplicate should skip requests'));
  const last=JSON.parse(sqlite.prepare('SELECT result FROM home_pulses').get().result);
  assert.equal(last.passed,true);
  assert.equal(last.targets.at(-1).state,'owner-sign-in');
  assert.deepEqual(last.targets.find(x=>x.id==='nathan-ai-fleet').fleet,
    {managed:64,assigned:64,checked:40,healthy:39,protected:1,failed:0,pending:24});
  assert.doesNotMatch(JSON.stringify(last),/unpublished body/);
  await homePulse(db,moment+INTERVAL,async()=>new Response(null,{status:200}));
  assert.equal(JSON.parse(sqlite.prepare('SELECT result FROM home_pulses ORDER BY slot DESC').get().result).passed,false);
  for(let i=2;i<35;i++) await homePulse(db,moment+INTERVAL*i,fake);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM home_pulses').get().n,32);
});

test('the alternate uses the same release without changing history or score',()=>{
  const dom=new Map();
  const get=id=>{
    if(!dom.has(id)) dom.set(id,{textContent:'',value:'',options:[],setAttribute(){},addEventListener(){},getContext(){return {};}});
    return dom.get(id);
  };
  // The bootstrap below resizeCanvas only registers the animation and resizes the DOM.
  // Exercise the real game functions without simulating paint or pointer hardware.
  const end=mind.indexOf('function resizeCanvas(');
  assert.ok(end>0);
  const result=runInNewContext(mind.slice(0,end)+`
    beginShot();
    for(let i=0;i<242&&shot;i++)tick();
    if(!history)throw Error('Missing original shot');
    const before=JSON.stringify(history), score=progress.score;
    get('replay-wind').value=String(history.wind);
    get('what-if').onclick();
    const rerun=replay.record.outcome===history.outcome && JSON.stringify(replay.record.path)===JSON.stringify(history.path);
    get('replay-wind').value='500';
    get('what-if').onclick();
    ({rerun, original:JSON.stringify(history)===before, score:progress.score===score,
      wind:replay.record.wind, changed:JSON.stringify(replay.record.path)!==JSON.stringify(history.path),
      label:get('what-if-result').textContent.includes('Alternate')});
  `,{document:{getElementById:get},localStorage:{getItem(){return null;},setItem(){}},
    matchMedia:()=>({matches:true}),navigator:{},window:{}});
  assert.deepEqual(JSON.parse(JSON.stringify(result)),{rerun:true,original:true,score:true,wind:500,changed:true,label:true});
});

test('the public Hounds route opens with the purpose visible and protects the Spark in play', async () => {
  const html=await (await worker.fetch(new Request('https://labs.example/play/hounds'),{})).text();
  assert.match(html,/<h1>Release the Hounds of Hell<\/h1>/);
  assert.match(html,/<h2 id="purpose-title">Protect Innocence<\/h2>/);
  assert.ok(html.indexOf('PROTECT ALL INNOCENCE AT THE ATOMIC LEVEL.') < html.indexOf('id="play"'));
  const map=new Map();
  const get=id=>{
    if(!map.has(id))map.set(id,{textContent:'',options:[],setAttribute(){},addEventListener(){},getContext(){return {};}});
    return map.get(id);
  };
  const end=hounds.indexOf('function resizeCanvas(');
  assert.ok(end>0);
  const result=runInNewContext(hounds.slice(0,end)+`
    refresh();
    const startsProtected=world===HOUNDS_WORLD && ui.launch.disabled;
    beginShot();
    const beforeRelease=shot===null;
    releaseHounds();
    beginShot();
    const beforeGate=shot===null;
    ambient=HOUND_TRAVEL+1;
    gateOpened=true;
    beginShot();
    shot.x=PROTECTED_PIECE.x-25;
    shot.y=PROTECTED_PIECE.y;
    shot.vx=6000;
    shot.vy=0;
    shot.path=[{x:shot.x,y:shot.y}];
    tick();
    const blockedSpark=history.outcome==="Protected piece touched" && history.gained===0 && progress.score===0;
    let won=false;
    for(let power=-58;power<=55&&!won;power+=1){
      beginShot(0,power);
      for(let i=0;i<242&&shot;i++)tick();
      won=history.outcome==="Hit" && history.gained>0 && ui.message.textContent.startsWith("SPARK PROTECTED");
    }
    const saved=progress.score;
    clearAttempt();
    ({startsProtected,beforeRelease,beforeGate,blockedSpark,won,reset:ui.launch.disabled && progress.score===saved});
  `,{document:{getElementById:get},localStorage:{getItem(){return null;},setItem(){}},
    matchMedia:()=>({matches:true}),navigator:{},window:{}});
  assert.deepEqual(JSON.parse(JSON.stringify(result)),{
    startsProtected:true,beforeRelease:true,beforeGate:true,blockedSpark:true,won:true,reset:true
  });
});
