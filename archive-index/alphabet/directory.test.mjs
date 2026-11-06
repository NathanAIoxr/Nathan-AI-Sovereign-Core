import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ALPHABET,validateDirectory,filterDirectory,letterCounts,sourceLink,kinds} from './directory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const doc=JSON.parse(fs.readFileSync(path.join(root,'archive-index/alphabet/directory.json'),'utf8'));
const tax=JSON.parse(fs.readFileSync(path.join(root,'archive-index/alphabet/store-taxonomy.json'),'utf8'));
const letters=JSON.parse(fs.readFileSync(path.join(root,'archive-index/alphabet/letter-manifests.json'),'utf8'));
test('whole alphabet is 26 separate populated departments',()=>{
 assert.equal(ALPHABET.length,26);assert.equal(letters.letters.length,26);assert.equal(letters.letters.map(x=>x.letter).join(''),ALPHABET);
 const counts=letterCounts(doc.entries);for(const c of ALPHABET){assert.ok(counts[c]>0,c);assert.equal(letters.letters.find(x=>x.letter===c).entryCount,counts[c]);}
});
test('taxonomy and directory types validate',()=>assert.equal(validateDirectory(doc,tax),true));
test('underlying source counts retained without claiming unique complete apps',()=>{
 const count=k=>doc.entries.filter(x=>x.kind===k).length;
 assert.equal(count('standalone-app'),139);assert.equal(count('game-catalog'),84);assert.equal(count('feature-concept'),104);assert.equal(count('authored-sequence'),130);assert.equal(count('word-family'),59);assert.equal(doc.entryCount,doc.entries.length);
 assert.ok(doc.countingRule.includes('same app'));
});
test('five original independent authored sequences at every letter',()=>{
 for(const c of ALPHABET)assert.equal(filterDirectory(doc.entries,{letter:c,kind:'authored-sequence'}).length,5);
 assert.equal(doc.entries.find(x=>x.id==='authored:Physics A–Z:E').title,'The Entangled Evil of Baryons');
});
test('source-assigned letter distinct from literal initial',()=>{
 const b=doc.entries.find(x=>x.id==='feature:B1');assert.equal(b.title,'Appliance Durability Audit');assert.equal(b.assignedLetter,'B');assert.equal(b.titleInitial,'A');
 assert.ok(filterDirectory(doc.entries,{letter:'B',kind:'feature-concept'}).some(x=>x.id===b.id));
 assert.ok(filterDirectory(doc.entries,{letter:'A',letterMode:'literal',kind:'feature-concept'}).some(x=>x.id===b.id));
});
test('privacy or restricted source anchors not republished',()=>{
 assert.ok(!doc.entries.some(x=>x.id.startsWith('program:private:')||x.kind==='private-archive-anchor'));
 assert.ok(doc.entries.filter(x=>x.id.startsWith('source-a:')).every(x=>!x.summary.includes('private source bytes')));
 assert.equal(doc.coverage.excludedPrivateProgramAnchors,14);
 assert.equal(doc.coverage.excludedAEditorialReview,4);
});
test('E geometry and source families still independent',()=>{
 assert.equal(doc.entries.filter(x=>x.id.startsWith('e-word:')).length,18);
 assert.ok(fs.existsSync(path.join(root,'archive-index/alphabet/e/geometry.json')));
 assert.ok(fs.existsSync(path.join(root,'archive-index/alphabet/e/e-family.mjs')));
 assert.ok(fs.existsSync(path.join(root,'archive-index/alphabet/e/e-word-families.json')));
});
test('Apple primary/secondary and Google category proposals remain honest',()=>{
 assert.equal(tax.apple.categoryRule.includes('primary plus optional secondary'),true);
 assert.equal(tax.google.categoryRule.includes('at most five'),true);
 assert.ok(doc.entries.filter(x=>x.kind==='feature-concept').every(x=>x.store.review!=='published'));
 assert.ok(doc.entries.filter(x=>x.kind==='authored-sequence').every(x=>x.store.review==='not-applicable'));
 assert.ok(doc.entries.filter(x=>x.kind==='game-catalog').every(x=>x.store.apple.primary==='Games'));
});
test('all published launch links exist and remain relative',()=>{
 let n=0;for(const record of doc.entries){const href=sourceLink(record);if(!href)continue;n++;assert.ok(fs.existsSync(path.resolve(root,'archive-index/alphabet',href)),record.title+' '+href);}
 assert.ok(n>=130);
});
test('all 26 manifest files and independent letter pages exist',()=>{
 for(const c of ALPHABET){const dirname=path.join(root,'archive-index/alphabet',c.toLowerCase());const manifest=JSON.parse(fs.readFileSync(path.join(dirname,'letter-manifest.json'),'utf8'));assert.equal(manifest.letter,c);assert.ok(fs.existsSync(path.join(dirname,'index.html')));}
});
test('search is non-destructive, supports first/last title, stage and categories',()=>{
 const original=doc.entries[0].title;
 assert.ok(filterDirectory(doc.entries,{query:'Eloher'}).some(x=>x.id.startsWith('e-word:')));
 assert.ok(filterDirectory(doc.entries,{apple:'Games'}).length>=84);
 assert.ok(filterDirectory(doc.entries,{kind:'standalone-app',letter:'A'}).length>0);
 assert.ok(kinds(doc.entries).includes('program-record'));
 assert.equal(doc.entries[0].title,original);
 assert.throws(()=>filterDirectory(doc.entries,{letter:'1'}));
});

test('new F sources preserve 64 general-only titles, 15 separate cross-script entries and old 24 sources',()=>{
 const f=filterDirectory(doc.entries,{letter:'F'});
 assert.equal(f.length,103);
 assert.equal(f.filter(x=>x.id.startsWith('source-f:')).length,64);
 assert.equal(f.filter(x=>x.id.startsWith('f-route:')).length,15);
 assert.ok(f.some(x=>x.title==='F is also a P cut open'));
 assert.ok(f.some(x=>x.title==='The Fabric of the World'));
 assert.ok(f.some(x=>x.title==='ᚠ Fehu / Fé'));
 assert.equal(doc.coverage.excludedFPrivacyOrReview,5);
});

test('G source family added without replacing the G 713-title standalone owner index',()=>{
 const g=filterDirectory(doc.entries,{letter:'G'});
 assert.equal(g.length,50);
 assert.equal(g.filter(x=>x.id.startsWith('g-route:')).length,26);
 assert.ok(g.some(x=>x.title==='5 rotated around'));
 assert.ok(g.some(x=>x.title==='a 6 reshaped'));
 assert.ok(g.some(x=>x.title==='G (Forward: The Generator | RTL: The Ground Vault)'));
 assert.equal(doc.coverage.inputCounts.gPublicMasterTitleSupplement,713);
 assert.equal(doc.coverage.excludedGPrivacyOrReview,6);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'archive-index/alphabet/g/letter-manifest.json'),'utf8'));
 assert.equal(manifest.entryCount,50);
 assert.ok(fs.existsSync(path.join(root,'archive-index/alphabet/g/source-catalog-g.json.gz')));
});

test('five creator-supplied God Goddess Dog Doggess Sseggod names are cross-indexed, never moved from their literal initials',()=>{
 const originals=['God','Goddess','Dog','Doggess','Sseggod'];
 const words=filterDirectory(doc.entries,{letter:'G'}).filter(x=>x.sourceCategory==='god-dog-word-family');
 assert.deepEqual(words.map(x=>x.title),originals);
 assert.ok(words.every(x=>x.crossIndexOnly&&x.kind==='word-family'));
 assert.equal(words.find(x=>x.title==='Dog').titleInitial,'D');
 assert.equal(words.find(x=>x.title==='Sseggod').titleInitial,'S');
 assert.equal(doc.entryCount,1942);
});
