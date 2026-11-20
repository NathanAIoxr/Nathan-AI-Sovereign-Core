import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {traceGit} from './trace-github.mjs';
import {scanD1, scanStorage} from './trace-cloudflare.mjs';
import {storageReferences} from './trace-references.mjs';

test('Git tracks alternate paths to a leaf and distinguishes cycles and boundaries', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nathan-reader-'));
  try {
    const git = (...args) => execFileSync('git', args, {cwd:dir});
    git('init', '-q');
    await writeFile(join(dir, 'start.md'), '[A](a.md) [B](b.md) [outside](https://example.com/webhooks/private-id?key=secret)');
    await writeFile(join(dir, 'a.md'), '[Leaf](leaf.md)');
    await writeFile(join(dir, 'b.md'), '[Leaf](leaf.md)');
    await writeFile(join(dir, 'leaf.md'), 'No links here.');
    await writeFile(join(dir, 'cycle.md'), '[Self](cycle.md)');
    await writeFile(join(dir, 'missing.md'), '[Missing](none.md)');
    await writeFile(join(dir, 'binary.png'), Buffer.from([0, 1, 2]));
    git('add', '.');
    git('-c', 'user.name=Reader Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'Fixture');
    const {nodes, edges, summary} = await traceGit(dir);
    assert.equal(summary.tracked, 7);
    assert.equal(summary.verifiedLeaves, 1);
    assert.equal(summary.nodesReachingDetectedLeaves, 4);
    assert.equal(edges.filter(edge => edge.target === 'leaf.md').length, 2);
    assert.ok(edges.some(edge => edge.target === 'https://example.com/[redacted]' && edge.status === 'boundary'));
    assert.ok(edges.some(edge => edge.target === 'none.md' && edge.status === 'unresolved'));
    assert.equal(nodes.find(node => node.path === 'cycle.md').reachesDetectedLeaf, false);
    assert.equal(nodes.find(node => node.path === 'binary.png').leaf, false);
  } finally {
    await rm(dir, {recursive:true, force:true});
  }
});

test('D1 scans successive pages through a stable order and emits hashes and references', async () => {
  const requests = [];
  const rows = [{id:1, source_ref:'app-factory/nathan-ai/example/app.json'},{id:2, source_ref:''}];
  const request = async ({body}) => {
    requests.push(body);
    const results = body.sql.includes('pragma_table_info') ? [{name:'id',pk:1}] :
      rows.slice(body.params[1], body.params[1] + body.params[0]);
    return {success:true,result:[{success:true,results}]};
  };
  const db = '2744aea4-b218-41e9-ab21-a04f25c10475';
  const first = await scanD1(request,'account',db,'table"name',{limit:1});
  assert.equal(first.next, 1);
  assert.equal(first.records[0].links[0], 'github-path:app-factory/nathan-ai/example/app.json');
  assert.match(requests[1].sql, /FROM "table""name" ORDER BY "id"/);
  const last = await scanD1(request,'account',db,'table"name',{offset:first.next,limit:2});
  assert.equal(last.next, null);
  assert.match(last.records[0].sha256, /^[a-f0-9]{64}$/);
});

test('KV reports missing values without labelling them as leaves', async () => {
  const request = async ({method}) => method === 'GET' ? {
    success:true,result:[{name:'a'},{name:'b'}],result_info:{cursor:'next'}
  } : {success:true,result:{values:{a:'https://example.com/tree?token=redacted'}}};
  const result = await scanStorage(request,'account',{kind:'kv',id:'namespace'});
  assert.equal(result.next, 'next');
  assert.deepEqual(result.records.map(record => record.state), ['references-found','read-error']);
  assert.deepEqual(result.records[0].links, ['https://example.com/tree']);
  assert.deepEqual(storageReferences('{"snapshot":"{\\"source_ref\\":\\"zones/example/site.html\\"}"}'), ['github-path:zones/example/site.html']);
});
