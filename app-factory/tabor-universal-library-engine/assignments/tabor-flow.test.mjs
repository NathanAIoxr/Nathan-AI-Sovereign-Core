import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseManifest, syncTabor, taborFlow} from './tabor-flow.mjs';

const root = new URL('../../../projects/find-the-tabor/public/',import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('release.json',root)));
const fileBytes = path => readFileSync(new URL(path,root));

test('manifest requires all nine approved editions, unique paths and valid digests', async () => {
  assert.equal((await parseManifest(manifest)).files.length,59);
  const copy = structuredClone(manifest);
  copy.files[0].path = '../intake-secret.txt';
  await assert.rejects(parseManifest(copy),/Invalid release file/);
  copy.files[0] = {...manifest.files[0],sha256:'a'.repeat(64)};
  await assert.rejects(parseManifest(copy),/Invalid release digest/);
});

test('publication skips intact assets, copies a changed file, then records live parity', async t => {
  const assets = new Map();
  let payload;
  let lock = false;
  const statements = {prepare(sql) {
    const stmt = {args:[],bind(...args){this.args=args; return this;},
      async first(){return payload ? {payload} : null;},
      async all(){return {results:[...assets].map(([path,sha256])=>({path,sha256}))};},
      async run(){
        if (sql.startsWith('INSERT INTO publication_lease')) {
          const changes = Number(!lock);
          lock=true;
          return {meta:{changes}};
        }
        if (sql.startsWith('DELETE FROM publication_lease')) lock=false;
        if (sql.startsWith('INSERT INTO publication_receipt')) payload=this.args[1];
        if (sql.startsWith('INSERT INTO publication_assets')) assets.set(...this.args);
        if (sql.startsWith('DELETE FROM publication_assets')) assets.delete(this.args[0]);
      }
    };
    return stmt;
  },batch: statements => Promise.all(statements.map(s=>s.run()))};
  const objects = new Map(manifest.files.map(({path})=>[path,fileBytes(path)]));
  const changed = 'lineage/style.css';
  objects.delete(changed);
  const writes = [];
  const bucket = {async get(path) {
    const bytes = objects.get(path);
    return bytes && {size:bytes.length,arrayBuffer:async()=>bytes};
  },async put(path,bytes,meta) {writes.push([path,meta.httpMetadata.contentType]); objects.set(path,bytes);}};
  t.mock.method(globalThis,'fetch',async input => {
    const path = new URL(input).pathname;
    const asset = path.split('/public/')[1] ?? path.substring(1);
    return new Response(asset === 'release.json' ? JSON.stringify(manifest) : fileBytes(asset));
  });
  const env = {TABOR_RESEARCH:statements,TABOR_PUBLIC:bucket};
  const first = await syncTabor(env,Date.now());
  assert.deepEqual(writes,[[changed,'text/css; charset=utf-8']]);
  assert.equal(first.state,'verified');
  assert.equal(first.stored,59);
  assert.equal(first.public.length,9);
  const second = await syncTabor(env,Date.now()+300000);
  assert.equal(second.uploaded,0);
  assert.equal(writes.length,1);
  assert.equal((await (await taborFlow('/api/find-the-tabor',env)).json()).receipt.state,'verified');
  assert.equal(lock,false);
});
