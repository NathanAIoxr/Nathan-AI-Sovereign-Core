import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker from './worker.mjs';

const origin = 'https://example.test';
function req(path, method = 'GET') { return new Request(origin + path, { method }); }

test('public endpoints serve HTML and module metadata', async () => {
  const page = await worker.fetch(req('/'));
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  const html = await page.text();
  assert.match(html, /id="viewer"/);
  assert.match(html, /id="pad"/);
  assert.match(html, /id="craft"/);
  assert.match(html, /id="voice"/);
  const js = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(js, 'browser script is included');
  assert.doesNotThrow(() => new vm.Script(js), 'browser JavaScript parses');
});

test('12 unique, labeled textile modules', async () => {
  const response = await worker.fetch(req('/api/modules'));
  assert.equal(response.status, 200);
  const list = await response.json();
  assert.equal(list.length, 12);
  assert.equal(new Set(list.map(x => x.id)).size, 12);
  assert.ok(list.every(x => x.name && x.kind && x.guide));
  for (const id of ['nalebinding','tatting','sprang','bobbin','spindle']) {
    assert.ok(list.some(x => x.id === id));
  }
});

test('health describes illustrative release precisely', async () => {
  const r = await worker.fetch(req('/health'));
  const data = await r.json();
  assert.deepEqual({ ok:data.ok, modules:data.modules, physics:data.physics }, { ok:true, modules:12, physics:'illustrative' });
});

test('method and path restrictions do not alter state', async () => {
  assert.equal((await worker.fetch(req('/file-missing'))).status, 404);
  const r=await worker.fetch(req('/', 'POST'));
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('allow'),'GET, HEAD');
  const head=await worker.fetch(req('/health','HEAD'));
  assert.equal(head.status,200);
  assert.equal((await head.text()).length,0);
});

test('worker uses no network / storage bindings', async () => {
  const html=await (await worker.fetch(req('/'))).text();
  assert.doesNotMatch(html, /fetch\(/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.match(html, /no external requests/);
});

test('scheduled check is bounded and has no external side effects', async () => {
  const messages=[];
  const old=console.log;
  console.log=x=>messages.push(x);
  try { await worker.scheduled({cron:'5 * * * *'}, {}, {}); } finally { console.log=old; }
  assert.equal(messages.length,1);
  const data=JSON.parse(messages[0]);
  assert.equal(data.checkedModules,12);
  assert.equal(data.health,'pass');
});
