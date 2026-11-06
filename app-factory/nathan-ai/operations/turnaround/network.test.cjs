'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { options, pathnameToFile, createServer, START } = require('./network-server.cjs');
const engine = require('./engine.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'registry.json'), 'utf8'));

test('localhost is default and LAN exposure requires explicit consent', () => {
  assert.deepEqual(options([]), { host:'127.0.0.1', port:8787, lan:false, help:false });
  assert.throws(() => options(['--host','0.0.0.0']), /requires --lan/);
  assert.equal(options(['--host','0.0.0.0','--lan','--port','8788']).port,8788);
  assert.throws(() => options(['--host','example.com']), /Host must/);
  assert.throws(() => options(['--port','-1']), /Port must/);
});

test('only public app-factory static files have file mappings', () => {
  assert.ok(pathnameToFile('/'));
  assert.ok(pathnameToFile(START));
  assert.ok(pathnameToFile(START+'engine.js'));
  assert.ok(pathnameToFile('/app-factory/nathan-ai/appearance/shared.css'));
  for (const bad of [
    '/.git/config','/app-factory/.env','/app-factory/secrets/creds.json',
    '/app-factory/nathan-ai/../../.git/config',
    '/app-factory/nathan-ai/operations/turnaround/secret.txt',
    '/app-factory/nathan-ai/operations/turnaround/%2e%2e/%2e%2e/private-samples/file.png',
    '/app-factory/nathan-ai/private-samples/example.png',
    '/app-factory/nathan-ai/operations/turnaround/network-server.cjs'
  ]) assert.equal(pathnameToFile(bad),null,bad);
});

async function request(port, pathname, method='GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host:'127.0.0.1', port, path:pathname, method }, resp => {
      let body = '';
      resp.setEncoding('utf8');
      resp.on('data', b => body += b);
      resp.on('end', () => resolve({ status:resp.statusCode, headers:resp.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('read-only Wi-Fi app host serves local app assets without upload or API execution', async (t) => {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0,'127.0.0.1',resolve); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const port = server.address().port;
  const app = await request(port, START);
  assert.equal(app.status,200);
  assert.match(app.body,/RUN THIS ON YOUR NETWORK/);
  assert.match(app.headers['content-security-policy'],/connect-src 'self'/);
  const js = await request(port, START+'engine.js');
  assert.equal(js.status,200);
  assert.match(js.body,/virtualPage/);
  const post = await request(port, START, 'POST');
  assert.equal(post.status,405);
  const hidden = await request(port, '/.git/config');
  assert.equal(hidden.status,404);
  const head = await request(port, START+'registry.json','HEAD');
  assert.equal(head.status,200);
  assert.equal(head.body,'');
});

test('69-million virtual positions page without creating 69-million objects', () => {
  const tier = data.node_tiers[0];
  const first = engine.virtualPage(tier, 1, 20);
  assert.equal(first.indexes.length,20);
  assert.equal(first.sourceCount,69696969);
  assert.equal(first.next,21);
  assert.equal(first.indexes[0].id,'misfit:1');
  const end = engine.virtualPage(tier, 69696965, 20);
  assert.equal(end.indexes.length,5);
  assert.equal(end.next,null);
  assert.equal(end.indexes.at(-1).ordinal,69696969);
  assert.ok(engine.virtualPage(tier,1,1000000).indexes.length<=100);
});

test('long local text is not silently chopped at an AI token quota', () => {
  const source = 'Original words without quotas. '.repeat(250);
  assert.ok(source.length>4000);
  assert.equal(engine.shadowViews(source).original,source);
  let state = engine.initialState();
  state = engine.transition(state,{type:'QUEUE_ITEM',title:source});
  assert.equal(state.queuedItems[0].title,source.trim());
});
