'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('./registry.js'),E=require('./engine.js'),root=path.resolve(__dirname,'..');
const EXACT='Things are only complicated because people make them complicated when you remove the complication you see the root issue and is very simple to fix';
test('original program identities remain separate with four individual routes each',()=>{
 assert.deepEqual(R.validate(),{independentProgramIdentities:11,formsPerProgram:4,individualEditionRoutes:44});
 assert.equal(new Set(R.PROGRAMS.map(p=>p.id)).size,11);
 for(const p of R.PROGRAMS){assert.ok(p.title&&p.sourceTitle);assert.equal(p.work.length,3);for(const f of E.FORMS){assert.ok(fs.existsSync(path.join(__dirname,p.id,'index.html')));}}
});
test('all source paths resolve to pre-existing published code or explicit historical source status',()=>{
 for(const p of R.PROGRAMS){const original=path.resolve(root,p.source,'index.html');assert.ok(fs.existsSync(original),p.id+' -> '+original)}
 assert.equal(R.find('hack-d-hack').stage,'historical-design-source-not-verified');
 assert.match(R.find('dehack-deliver').overclaim,/104/);
});
test('author original quotation and three exact original steps are not rewritten',()=>{
 const p=R.find('root-clear-build');
 assert.equal(p.authorQuote,EXACT);
 assert.deepEqual(p.originalSteps,['REMOVE THE COMPLICATION','EXPOSE THE ROOT ISSUE','FIX THE ROOT ISSUE']);
 assert.deepEqual(p.work,p.originalSteps);
});
test('working data is local and original imports keep exact text plus byte fingerprint separately',()=>{
 const p=R.find('original-works'),start=E.newSession(p,'app');
 assert.equal(start.original.text,null);assert.equal(start.derivedNotes,'');
 const sha='f'.repeat(64),original='Exact original\nUnicode ✓';
 const withFile=E.attachOriginal(start,p,{name:'Original 01.md',bytes:Buffer.byteLength(original),sha256:sha,text:original});
 assert.equal(withFile.original.text,original);assert.equal(withFile.original.sha256,sha);
 const notes=E.withNotes(withFile,p,'New derived chapter');assert.equal(notes.original.text,original);
 const marked=E.checkStep(notes,p,2,true);assert.deepEqual(marked.checked,[2]);assert.equal(marked.original.text,original);
 assert.equal(start.original.text,null);
 assert.throws(()=>E.attachOriginal(start,p,{name:'bad.txt',bytes:1048577,sha256:sha,text:'x'}),/byte limit/);
 assert.throws(()=>E.attachOriginal(start,p,{name:'bad.txt',bytes:1,sha256:'x',text:'x'}),/fingerprint/);
 assert.throws(()=>E.validateSession({...withFile,visibleSourceChanged:true},p),/must never/);
 assert.throws(()=>E.validateSession({...withFile,id:'different'},p),/does not match/);
});
test('each game contains three playable rounds, deterministic grading and answer feedback',()=>{
 for(const p of R.PROGRAMS){
  const q=E.questions(p);assert.equal(q.length,3);
  let s=E.newSession(p,'game');for(const row of q)s=E.answer(s,p,row.answer);
  assert.deepEqual(E.grade(s,p),{completed:3,correct:3,total:3});
  assert.throws(()=>E.answer(s,p,0),/finished/);
  assert.ok(q[0].explanation.length>5);
 }
});
test('book workbook separates creator authored lines, imported source, and derived writing',()=>{
 const p=R.find('root-clear-build'),s=E.newSession(p,'book');
 let md=E.bookMarkdown(p,s);assert.ok(md.includes(EXACT));assert.match(md,/Derived reading workbook/);
 assert.match(md,/No private original manuscript was imported/);
 const original=E.attachOriginal(s,p,{name:'original.txt',bytes:8,sha256:'c'.repeat(64),text:'Exact 01'});
 md=E.bookMarkdown(p,E.withNotes(original,p,'An entirely separate new interpretation'));
 assert.ok(md.includes('Exact 01'));assert.ok(md.includes('An entirely separate new interpretation'));
 assert.ok(md.indexOf('Owner-imported source')<md.indexOf('New, separately labeled draft notes'));
});
test('chatbox handoff only includes public identity; no user-authored private words',()=>{
 const p=R.find('dehack-deliver');const packet=E.handoff(p,'academy');
 assert.deepEqual(E.validateHandoff(packet),{id:p.id,title:p.title,form:'academy'});
 assert.equal(packet.sourceTextIncluded,false);assert.equal(packet.userTextIncluded,false);
 assert.equal(packet.modelRequestSent,false);assert.ok(!JSON.stringify(packet).includes('derivedNotes'));
 assert.throws(()=>E.validateHandoff({...packet,sourceTextIncluded:true}),/private/);
 assert.throws(()=>E.handoff(p,'not-a-form'),/Unknown/);
});
test('all 11 independent pages use scoped shared Nathan AI appearance, launcher and local edition scripts',()=>{
 const pages=['index.html',...R.PROGRAMS.map(p=>path.join(p.id,'index.html'))];
 for(const file of pages){
  const html=fs.readFileSync(path.join(__dirname,file),'utf8');
  assert.equal((html.match(/data-nathan-shared-appearance/g)||[]).length,1,file);
  assert.equal((html.match(/data-nathan-command-center/g)||[]).length,1,file);
  const prefix=file==='index.html'?'./':'../';
  for(const name of ['registry.js','engine.js','app.js','style.css'])assert.ok(html.includes(prefix+name),file+' '+name);
  assert.doesNotMatch(html,/<iframe|<img[^>]*src=/i);
 }
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 assert.doesNotMatch(app,/innerHTML\s*=|\beval\s*\(|\bfetch\s*\(|XMLHttpRequest|WebSocket/);
 assert.match(app,/crypto\.subtle\.digest\('SHA-256',data\)/);
 assert.match(app,/sessionStorage\.setItem\(E\.BRIDGE/);
});
test('HOP IN receives a source-identity-only handoff with explicit manual Send',()=>{
 const chatbox=fs.readFileSync(path.resolve(__dirname,'../hop-in/chatbox/index.html'),'utf8');
 const bridge=fs.readFileSync(path.join(__dirname,'chatbox-bridge.js'),'utf8');
 assert.match(chatbox,/independent-editions\/chatbox-bridge\.js/);
 assert.match(chatbox,/independent-editions\/registry\.js/);
 assert.match(bridge,/Press Send yourself/);
 assert.doesNotMatch(bridge,/\.submit\(|\bfetch\(|innerHTML\s*=|localStorage/);
});
