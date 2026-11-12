'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root=__dirname;
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
const charter=fs.readFileSync(path.join(root,'LAUNCH.md'),'utf8');

test('GODTABOR directory preserves standalone identities and honest release states',()=>{
  assert.equal(catalog.schema,'godtabor.enterprises.catalog.v1');
  assert.equal(catalog.brand,'GODTABOR ENTERPRISES');
  assert.equal(catalog.creator,'Nathan Tabor');
  assert.ok(catalog.projects.length>=10);
  const names=catalog.projects.map(x=>x.id);
  assert.equal(new Set(names).size,names.length);
  const statuses=new Set(Object.keys(catalog.status_terms));
  for(const p of catalog.projects){
    assert.match(p.id,/^[a-z][a-z0-9-]+$/);
    assert.ok(['literal','figurative','mythological'].includes(p.realm));
    assert.ok(statuses.has(p.status),p.name+' must use known status');
    assert.ok(p.name&&p.description&&p.kind);
    if(p.href){
      assert.ok(p.href.startsWith('https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/'),p.href);
      assert.notEqual(p.status,'proposal',p.name+' cannot have a live route while still called unreleased');
    }
  }
  assert.ok(catalog.projects.some(x=>x.realm==='mythological'&&x.id==='godtabor-franchise'));
});
test('responsive landing is source-linked and distinct from legal registration',()=>{
  assert.match(page,/<!doctype html>/i);
  assert.match(page,/<html lang="en"/i);
  assert.match(page,/<meta name="viewport"/i);
  assert.match(page,/<main\b/i);
  assert.match(page,/id="directory"/);
  assert.match(page,/fetch\("\.\/catalog\.json"\)/);
  assert.match(page,/prefers-reduced-motion/);
  assert.match(page,/Legal registration, tax setup/);
  assert.match(page,/not a production SaaS/i);
  assert.doesNotMatch(page,/<iframe\b|<form[^>]*\saction=/i);
  assert.match(charter,/No filing is claimed here/);
  assert.match(charter,/private databases, documents, linked accounts/);
});
