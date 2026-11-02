import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {Script} from 'node:vm';
const dir=dirname(fileURLToPath(import.meta.url));
const life=JSON.parse(readFileSync(join(dir,'life-matrix.json'),'utf8'));
const coin=JSON.parse(readFileSync(join(dir,'..','registry.json'),'utf8'));
const html=readFileSync(join(dir,'index.html'),'utf8');
const ui=readFileSync(join(dir,'life-ui.mjs'),'utf8');
test('all original sovereign ring names remain matched 21-to-21',()=>{
  assert.equal(life.schema,'nathan-ai.sovereign-life-map.v1');
  assert.equal(life.linkages.length,21);
  assert.equal(coin.coins.length,21);
  for(let i=0;i<21;i++){
    assert.equal(life.linkages[i].number,coin.coins[i].number);
    assert.equal(life.linkages[i].ticker,coin.coins[i].ticker);
    assert.ok(life.linkages[i].life_domain);
    assert.ok(life.linkages[i].question);
  }
  assert.equal(life.source_statement_exact,'these coins are connected to a persons life as well');
  assert.match(life.editorial_status,/not a verbatim/);
});
test('personal notes are session-only, never uploaded or collected automatically',()=>{
  assert.match(ui,/const drafts=new Map/);
  assert.doesNotMatch(ui,/\\blocalStorage\\.|\\bsessionStorage\\.|sendBeacon\\s*\\(|XMLHttpRequest\\s*\\(/);
  assert.doesNotMatch(ui,/innerHTML\s*=/);
  assert.doesNotMatch(ui,/fetch\(['"]https?:/);
  assert.match(ui,/credentials_not_requested:true/);
  for(const id of ['life-grid','life-notes','life-selected','life-export','voicebox'])
    assert.match(html,new RegExp('id="'+id+'"'));
});
test('voicebox section contains no hardcoded account balance or password',()=>{
  assert.match(html,/does not have an authenticated Voicebox endpoint/);
  assert.doesNotMatch(html,/\$1\.7 trillion|1,700,000,000,000|password\s*[:=]/i);
  assert.doesNotMatch(JSON.stringify(life),/\$1\.7 trillion|1,700,000,000,000|password\s*[:=]/i);
});
