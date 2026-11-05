'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const catalog=JSON.parse(read('standalone-apps/catalog.json'));
const websiteCode=read('app-factory/nathan-ai/websites/registry.js');
const originalApps=JSON.parse(read('app-factory/nathan-ai/universal-workspace/app-registry.json')).entries;
const sandbox={window:{}};vm.runInNewContext(websiteCode,sandbox,{timeout:1000});
const websites=sandbox.window.NathanAIWebsiteModules;
const originalPath=w=>w.url.endsWith('/')?'app-factory/'+w.url.slice(6)+'index.html':'app-factory/'+w.url.slice(6);
const slug=p=>p==='index.html'?'root':p.replace(/\/index\.html$/,'').replace(/\.html$/,'');
const repoBlobSha=source=>{const data=fs.readFileSync(path.join(ROOT,source));return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+data.length+'\0'),data])).digest('hex')};
test('website + apps sources stay in their original locations and are deduplicated only by source path',()=>{
 assert.equal(catalog.schema,'nathan-ai.standalone-apps.v1');
 assert.equal(websites.length,catalog.sourceCounts.websites);
 assert.equal(originalApps.length,catalog.sourceCounts.workspaceApps);
 const websitePaths=Array.from(websites,originalPath),known=new Set(websitePaths);
 assert.equal(websitePaths.length,new Set(websitePaths).size);
 assert.equal(catalog.sourceCounts.shared,originalApps.filter(a=>known.has(a.path)).length);
 assert.deepEqual(catalog.entries.slice(0,websites.length).map(x=>x.sourcePath),websitePaths);
 const extra=originalApps.filter(x=>!known.has(x.path)&&!catalog.excludedPaths.includes(x.path));
 assert.deepEqual(catalog.entries.slice(websites.length).map(x=>x.sourcePath),extra.map(x=>x.path));
 assert.equal(catalog.entries.length,websites.length+extra.length);
 assert.equal(catalog.sourceCounts.standaloneEntries,catalog.entries.length);
});
test('all standalone landing routes exist; original HTML sources and exact source IDs are retained',()=>{
 const used=new Set(),sourceUsed=new Set();
 for(const e of catalog.entries){
  assert.ok(!used.has(e.standalonePath),e.standalonePath);used.add(e.standalonePath);
  assert.ok(!sourceUsed.has(e.sourcePath),e.sourcePath);sourceUsed.add(e.sourcePath);
  assert.match(e.sourcePath,/^(?:app-factory\/|archive-index\/|index\.html$)/);
  assert.ok(!e.sourcePath.includes('..')&&!e.sourcePath.includes('\\'));
  assert.equal(e.standalonePath,'standalone-apps/'+slug(e.sourcePath)+'/index.html');
  assert.ok(fs.existsSync(path.join(ROOT,e.sourcePath)),e.sourcePath);
  assert.ok(fs.statSync(path.join(ROOT,e.sourcePath)).isFile());
  assert.match(e.sourceBlobSha,/^[0-9a-f]{40}$/);
  assert.equal(e.originalUnchanged,true);
  assert.equal(e.delivery,'same-origin-standalone-launch-page');
  const html=read(e.standalonePath);
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/<iframe id="program-frame"/);
  assert.match(html,/data-page="standalone"/);
  assert.ok(html.includes('data-source="'+e.sourcePath+'"'));
  assert.ok(html.includes('data-sha="'+e.sourceBlobSha+'"'));
  const rel='../'.repeat(e.standalonePath.split('/').length-2);
  assert.ok(html.includes('href="'+rel+'shared.css"'),e.standalonePath);
  assert.ok(html.includes('src="'+rel+'engine.js"'),e.standalonePath);
  assert.doesNotMatch(html,/onload=|<script>(?!\s*<\/script>)/i);
 }
 assert.ok(catalog.entries.length>=130);
});
test('snapshot original content hashes can be independently inspected without modifying source',()=>{
 assert.match(catalog.snapshotCommit,/^[0-9a-f]{40}$/);
 for(const e of catalog.entries){
  if(process.env.STANDALONE_STRICT_ORIGINAL_HASH==='1')assert.equal(repoBlobSha(e.sourcePath),e.sourceBlobSha,'original has changed since catalog snapshot: '+e.sourcePath);
 }
});
test('no restricted research, private reader, native-bundled resources or test-only pages newly published as standalones',()=>{
 for(const bad of catalog.excludedPaths){
  assert.equal(catalog.entries.some(x=>x.sourcePath===bad),false,bad);
  assert.ok(fs.existsSync(path.join(ROOT,bad)),bad+' still exists in original path');
 }
 assert.ok(catalog.excludedPaths.length>=8);
});
test('standalone launch engine verifies local paths and does not collect credentials or execute a model request',()=>{
 const src=read('standalone-apps/engine.js'),bridge=read('standalone-apps/chatbox-bridge.js');
 new vm.Script(src);new vm.Script(bridge);
 assert.match(src,/sessionStorage\.setItem\('nathan-ai\.standalone-context\.v1'/);
 assert.match(src,/frame\.src=url\(source\)/);
 assert.match(src,/new URL\(path,repoRoot\)/);
 assert.doesNotMatch(src,/innerHTML\s*=|\beval\s*\(|navigator\.credentials|document\.cookie|XMLHttpRequest|WebSocket/);
 assert.match(bridge,/Press Send yourself/);
 assert.doesNotMatch(bridge,/\.submit\(|\bfetch\(|innerHTML\s*=|XMLHttpRequest|WebSocket/);
 const chat=read('app-factory/nathan-ai/hop-in/chatbox/index.html');
 assert.match(chat,/\.\.\/\.\.\/\.\.\/\.\.\/standalone-apps\/chatbox-bridge\.js/);
 assert.match(chat,/independent-editions\/chatbox-bridge\.js/);
});
test('catalog browser provides search, distinct entries, original links and existing website/workspace links',()=>{
 const html=read('standalone-apps/index.html');
 for(const id of ['search','group','programs','count','more','total','registry-counts','status'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/Original Websites/);assert.match(html,/Original Apps/);assert.match(html,/Interactive Chatbox/);
 assert.match(html,/not a separately installable offline binary/);
 assert.match(read('standalone-apps/README.md'),/original/);
 for(const p of ['app-factory/nathan-ai/websites/launchpad.html','app-factory/nathan-ai/universal-workspace/index.html'])assert.match(read(p),/standalone-apps\//);
});
test('canonical original source file bytes remain unchanged at the audited snapshot if requested',()=>{
 if(process.env.STANDALONE_STRICT_ORIGINAL_HASH!=='1')return;
 for(const e of catalog.entries)assert.equal(repoBlobSha(e.sourcePath),e.sourceBlobSha,e.sourcePath);
});
