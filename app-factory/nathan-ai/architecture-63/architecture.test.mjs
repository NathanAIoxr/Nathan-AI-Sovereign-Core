import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalog, selectRows, createBrief, flattenCatalog } from './architecture.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(readFileSync(resolve(root,'registry.json'),'utf8'));
const rows=validateCatalog(data);

test('63 architecture concepts: independent 21/21/21 groups',()=>{
  assert.deepEqual(data.catalog.map(g=>g.entries.length),[21,21,21]);
  assert.equal(rows.length,63);
  assert.equal(new Set(rows.map(x=>x.id)).size,63);
  assert.ok(data.invariants.includes('1+1=2 BUILD'));
  assert.ok(data.invariants.includes('1-1=0 CLEAR'));
});
test('routes point to existing independent Nathan AI pages',()=>{
  for(const item of rows){
    assert.equal(item.stage,'design reference');
    assert.ok(existsSync(resolve(root,item.route)),item.id+' has missing route '+item.route);
    assert.ok(!item.route.includes('://'));
  }
});
test('filters and derived project brief never modify original source',()=>{
  assert.equal(selectRows(rows,{family:'games'}).length,21);
  assert.equal(selectRows(rows,{family:'logic'}).length,21);
  assert.equal(selectRows(rows,{family:'infrastructure'}).length,21);
  assert.ok(selectRows(rows,{query:'mirror'}).length>=1);
  const original=JSON.stringify(rows);
  const brief=createBrief(rows,[rows[0].id,rows[42].id]);
  assert.equal(brief.concepts.length,2);
  assert.equal(JSON.stringify(rows),original);
  assert.ok(brief.preservation.includes('unchanged'));
});
test('derived public module excludes identified external vendor and game labels',()=>{
  const publicFiles=['registry.json','index.html','architecture.mjs'].map(n=>readFileSync(resolve(root,n),'utf8')).join('\n');
  const excluded=[/roblox/i,/monopoly/i,/pokemon|pokémon/i,/kubernetes/i,/docker/i,/react native/i,/linux/i,/postgres/i,/kafka/i,/rubik/i,/uno!/i,/honor of kings/i,/clash royale/i,/candy crush/i,/gossip harbor/i,/apple store/i,/tencent/i,/meta platforms/i,/thunderbolt/i];
  for(const term of excluded)assert.equal(term.test(publicFiles),false,'third-party label leaked: '+term);
});
