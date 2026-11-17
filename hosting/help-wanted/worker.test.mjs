import assert from 'node:assert/strict';
import test from 'node:test';
import {handle, refresh} from './worker.mjs';

const observed = '2026-11-16T21:32:00Z';
const help = {html_url:'https://github.com/example/repo/issues/12',
  title:'Correct a <link>', updated_at:observed};

function storage() {
  const entries = new Map();
  return {QUEUE:{async get(key){return JSON.parse(entries.get(key) ?? 'null');},
    async put(key,value){entries.set(key,value);}}};
}

function fixtureSearch() {
  const responses = [
    {total_count:123,items:[]},
    {total_count:4,incomplete_results:true,items:[
      help, help,
      {...help,title:'CVE-2026 vulnerability'},
      {...help,html_url:'https://example.net/example/repo/issues/13'}
    ]}
  ];
  return async () => ({ok:true,json:async()=>responses.shift()});
}

test('scout preserves source identity and filters working leads', async () => {
  const snapshot = await refresh(storage(),fixtureSearch(),observed);
  assert.equal(snapshot.publicMatchCount,123);
  assert.equal(snapshot.documentationIncomplete,true);
  assert.deepEqual(snapshot.issues.map(issue=>issue.id),['example/repo#12']);
  assert.equal(snapshot.issues[0].sourceChecked,1);
  assert.equal(snapshot.issues[0].patchChecked,0);
  assert.equal(snapshot.issues[0].delivered,0);
});

test('dashboard escapes titles and routes are read-only', async () => {
  const env = storage();
  await refresh(env,fixtureSearch(),observed);
  const response = await handle(new Request('https://test.invalid/'),env);
  assert.equal(response.status,200);
  const dashboard = await response.text();
  assert.ok(dashboard.includes('Correct a &lt;link&gt;'));
  assert.ok(dashboard.includes('Goldener density-weighing guide'));

  const denied = await handle(new Request('https://test.invalid/api/queue',{method:'POST'}),env);
  assert.equal(denied.status,405);
  const head = await handle(new Request('https://test.invalid/health',{method:'HEAD'}),env);
  assert.equal(head.status,200);
  assert.equal(await head.text(),'');
});

test('rate-limited refresh keeps the last successful snapshot', async () => {
  const env = storage();
  const before = await refresh(env,fixtureSearch(),observed);
  const later = '2026-11-16T22:32:00Z';
  await refresh(env,async()=>({ok:false,status:429}),later);
  assert.deepEqual(await env.QUEUE.get('queue:v1'),before);
  assert.deepEqual(await env.QUEUE.get('attempt:v1'),{
    attemptedAt:later,errors:['GitHub search returned HTTP 429','GitHub search returned HTTP 429']
  });
});
