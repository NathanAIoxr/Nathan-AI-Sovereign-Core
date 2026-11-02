'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const here = __dirname;
const intake = fs.readFileSync(path.join(here,'source-intake.js'),'utf8');
const page = fs.readFileSync(path.join(here,'index.html'),'utf8');
const hub = fs.readFileSync(path.join(here,'../index.html'),'utf8');
const hubJs = fs.readFileSync(path.join(here,'../hub.js'),'utf8');
const recovery = fs.readFileSync(path.join(here,'../build-recovery/index.html'),'utf8');
test('private source-intake browser script has valid JavaScript syntax', () => {
  assert.doesNotThrow(() => new vm.Script(intake,{filename:'source-intake.js'}));
});
test('all three Nathan AI navigation entrypoints link to the importer', () => {
  assert.match(hub, /href="\.\/source-intake\/index\.html"/);
  assert.match(hubJs, /href:'\.\/source-intake\/index\.html'/);
  assert.match(recovery, /href="\.\.\/source-intake\/index\.html"/);
});
test('HTML controls are paired with actual script listeners', () => {
  for(const id of ['pass','file-import','folder-import','source','import','clear','search','export-manifest','refresh','records','status','counts','result-summary','preview']){
    assert.ok(page.includes('id="'+id+'"'), 'missing '+id+' in HTML');
    assert.ok(intake.includes("'"+id+"'"), 'missing '+id+' in JS');
  }
});
test('importer encrypts original bytes and fingerprints duplicates', () => {
  assert.match(intake,/AES-GCM/);
  assert.match(intake,/PBKDF2/);
  assert.match(intake,/SHA-256/);
  assert.match(intake,/250000/);
  assert.match(intake,/secretFilename\(path\)/);
  assert.match(intake,/MAX_FILE/);
});
test('importer contains no network upload, remote fetch, or credential storage path', () => {
  assert.doesNotMatch(intake,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|\.send\s*\(/);
  assert.doesNotMatch(intake,/localStorage|sessionStorage/);
  assert.match(page,/No remote backup/);
  assert.match(page,/Do not import recovery phrases, credentials, private keys/);
});
test('manifest is metadata only, without ciphertext or passphrase fields', () => {
  const fields = /\(\{id,sha256,name,relativePath,source,size,type,importedAt\}\)/;
  assert.match(intake,fields);
  assert.match(intake,/Metadata only; does not contain original bytes/);
});
