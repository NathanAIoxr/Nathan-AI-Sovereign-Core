import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(resolve(here,p),'utf8');
test('original print shop is present and executable browser HTML',()=>{
 const s=read('../five-matrix-print-shop/index.html');
 assert.match(s,/Nathan Tabor 3-D Print Shop/);
 assert.match(s,/requestAnimationFrame\(loop\)/);
 assert.match(s,/id="step"/);
 assert.match(s,/id="run"/);
});
test('original DATA ATAD preserved',()=>assert.match(read('data-atad/index.html'),/DATA ATAD/i));
test('KJV atlas original records preserved',()=>{
 assert.ok(existsSync(resolve(here,'kjv-blueprint-atlas/index.html')));
 const data=JSON.parse(read('kjv-blueprint-atlas/catalog.json'));
 assert.equal(data.length,215);
});
test('KJV gates and weapons original preserved',()=>{
 const s=read('gates-weapons-explorer/catalog.csv');
 assert.ok(s.trim().split(/\r?\n/).length>=86);
 assert.match(read('gates-weapons-explorer/index.html'),/gate/i);
});
test('Vatican research retains candidate/known categories',()=>{
 const x=JSON.parse(read('vatican-catalog/catalog.json'));
 assert.equal(x.records.length,170);
});
test('Protection page preserved as authored',()=>{
 assert.match(read('protect-innocence/index.html'),/AMEN = pedophiles =/);
});
test('source registry links launch artifacts',()=>{
 const index=read('index.html');
 for(const p of ['five-matrix-print-shop/index.html','data-atad/index.html','kjv-blueprint-atlas/index.html','gates-weapons-explorer/index.html','vatican-catalog/catalog.json','protect-innocence/index.html'])
  assert.ok(index.includes(p),p);
});
test('source hash matches original simulator export',async()=>{
 const {createHash}=await import('node:crypto');
 const hash=createHash('sha256').update(read('../five-matrix-print-shop/index.html')).digest('hex');
 assert.equal(hash,'973e296eb7b8dc5577681c69aa555ae4c28cc328a24f0f8ff2d59c74477fa3c0');
});
