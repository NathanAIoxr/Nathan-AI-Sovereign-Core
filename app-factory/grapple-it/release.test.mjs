import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {createFrameLoop} from './public/frame-loop.mjs';
import {runBees} from './bee/worker.mjs';

const queue=new Map();
let id=0,draws=0;
const frames=createFrameLoop(()=>draws++,callback=>{queue.set(++id,callback);return id;},id=>queue.delete(id));
frames.start();
frames.start();
assert.equal(queue.size,1);
const [[first,callback]]=queue;queue.delete(first);callback(10);
assert.equal(draws,1);
assert.equal(queue.size,1);
frames.stop();assert.equal(queue.size,0);
frames.start();frames.stop();assert.equal(queue.size,0);

const handlers={};
const cached=new Response('verified cached shell');
let upstream=new Response('outage',{status:503});
const origin='https://game.test';
runInNewContext(await readFile(new URL('./public/sw.js',import.meta.url),'utf8'),{
 self:{registration:{scope:origin+'/'},addEventListener:(event,fn)=>handlers[event]=fn},
 caches:{open:async()=>({match:async()=>cached})},
 fetch:async()=>upstream,
 URL,Response
});
const request=path=>{
 let value;
 handlers.fetch({request:new Request(origin+path),respondWith:p=>{value=p;}});
 return value;
};
assert.equal(await request('/frame-loop.mjs'),cached);
assert.equal(request('/api/daily'),undefined);
assert.equal(request('/unknown'),undefined);
upstream=new Response('missing',{status:404});
assert.equal((await request('/frame-loop.mjs')).status,404);

const db=new DatabaseSync(':memory:');
db.exec(await readFile(new URL('./bee/migration.sql',import.meta.url),'utf8'));
const DB={
 prepare(sql){return {bind(...params){return ()=>db.prepare(sql).run(...params);}};},
 async batch(ops){return ops.map(run=>run());},
};
const GAME={async fetch(req){
 const path=new URL(req.url).pathname;
 if(path==='/api/daily')return Response.json({day:'2026-11-17',scores:[]});
 const file=path==='/'?'index.html':path.slice(1);
 return new Response(await readFile(new URL('./public/'+file,import.meta.url),'utf8'),{headers:{'Content-Type':path==='/'?'text/html':'text/javascript'}});
}};
const now=Date.now();
const passing=await runBees({DB,GAME},now);
assert.equal(passing.status,'pass');
assert.equal(passing.checks.length,4);
await runBees({DB,GAME},now);
assert.equal(db.prepare('SELECT count(*) AS total FROM grapple_bee_runs').get().total,1);
const fail=await runBees({DB,GAME:{fetch:async()=>new Response('unavailable',{status:503})}},now+60000);
assert.equal(fail.status,'fail');
assert.equal(fail.checks.filter(check=>check.status==='fail').length,4);
db.close();
console.log('Active animation loops, offline recovery, and Bee D1 receipts passed.');
