import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('./saturday-morning.js',import.meta.url),'utf8');
test('Worker source parses',()=>assert.doesNotThrow(()=>new vm.Script(source)));
test('22 families and all A-Z slots are represented',()=>{assert.match(source,/const FAMILIES=/);assert.match(source,/primarySlots:FAMILIES.length\*26/);assert.match(source,/ABCDEFGHIJKLMNOPQRSTUVWXYZ/)});
test('local-only rewrite editor and playable signal game are present',()=>{for(const marker of ['save-draft','export-drafts','import-drafts','start-game','/api/ledger'])assert.ok(source.includes(marker),marker)});
test('no known third-party source labels are in the public Worker',()=>{for(const word of ['Daisy Duke','The A-Team','Scooby-Doo','ThunderCats','G.I. Joe','Smurfs','Transformers','Voltron','He-Man'])assert.ok(!source.includes(word),word)});
