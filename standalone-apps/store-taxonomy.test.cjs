'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const original=JSON.parse(read('standalone-apps/catalog.json')),tax=JSON.parse(read('standalone-apps/store-taxonomy.json'));
const appleApps=new Set(tax.categories.appleApps),appleGenres=new Set(tax.categories.appleGameGenres),
      googleApps=new Set(tax.categories.googleApps),googleGenres=new Set(tax.categories.googleGameGenres);
test('complete source-preserving taxonomy covers every published standalone route one-to-one',()=>{
 assert.equal(tax.schema,'nathan-ai.app-store-taxonomy.v1');
 assert.equal(tax.records.length,original.entries.length);
 assert.equal(tax.counts.distinctStandaloneRoutes,original.entries.length);
 assert.equal(tax.originalSourcesRemainUnmodified,true);
 const keys=new Set();
 for(let i=0;i<tax.records.length;i++){
  const r=tax.records[i],src=original.entries[i];
  assert.equal(r.catalogId,src.id);assert.equal(r.sourcePath,src.sourcePath);
  assert.equal(r.title,src.title);assert.equal(r.route,src.standalonePath);
  assert.equal(r.developmentStage,src.status);
  assert.equal(r.collection,'standalone-public-route');
  assert.ok(!keys.has(r.catalogId),'Unique original identity: '+r.catalogId);keys.add(r.catalogId);
  assert.ok(fs.existsSync(path.join(ROOT,r.route)),r.route);
  assert.ok(fs.existsSync(path.join(ROOT,r.sourcePath)),r.sourcePath);
 }
 assert.equal(keys.size,139);
});
test('Apple proposals use valid primary, optional secondary and at most two accurate game genres',()=>{
 assert.equal(appleApps.size,tax.categories.appleApps.length);
 assert.equal(appleGenres.size,tax.categories.appleGameGenres.length);
 for(const r of [...tax.records,...tax.editions,...tax.additionalReviewed]){
  assert.ok(appleApps.has(r.apple.primary),r.title+' Apple '+r.apple.primary);
  assert.ok(r.apple.secondary===null||appleApps.has(r.apple.secondary),r.title);
  assert.notEqual(r.apple.secondary,r.apple.primary,r.title+' secondary must differ from primary');
  assert.ok(Array.isArray(r.apple.gameGenres)&&r.apple.gameGenres.length<=2);
  for(const g of r.apple.gameGenres)assert.ok(appleGenres.has(g),r.title+' '+g);
  if(r.google.type==='Game'){assert.equal(r.apple.primary,'Games');assert.ok(r.apple.gameGenres.length>=1)}
  else assert.notEqual(r.apple.primary,'Games');
 }
 assert.equal(tax.records.filter(r=>r.apple.primary==='Games').length,22);
});
test('Google Play proposals have one category or one game genre, plus up to five clearly labeled keywords',()=>{
 for(const r of [...tax.records,...tax.editions,...tax.additionalReviewed]){
  assert.ok(['App','Game'].includes(r.google.type));
  assert.ok((r.google.type==='App'?googleApps:googleGenres).has(r.google.category),r.title+' '+r.google.category);
  assert.ok(Array.isArray(r.google.suggestedTags)&&r.google.suggestedTags.length<=5);
  assert.ok(new Set(r.google.suggestedTags).size===r.google.suggestedTags.length);
  assert.equal(r.review,'editorial-category-proposal-not-store-submission');
 }
 assert.equal(tax.records.filter(r=>r.google.type==='Game').length,22);
 assert.deepEqual(tax.records.filter(x=>x.google.type==='Game').map(x=>x.catalogId),original.entries.filter(x=>x.category==='games').map(x=>x.id));
 assert.equal(tax.authority.google.startsWith('https://support.google.com/'),true);
 assert.equal(tax.authority.apple.startsWith('https://developer.apple.com/'),true);
});
test('11 independent edition variants have four working existing form URLs and remain distinct from 139 source routes',()=>{
 assert.equal(tax.editions.length,11);
 assert.equal(tax.counts.independentEditionVariants,11);
 assert.equal(new Set(tax.editions.map(e=>e.editionId)).size,11);
 for(const e of tax.editions){
  assert.equal(e.notUniqueProduct,true);
  assert.match(e.route,/^app-factory\/nathan-ai\/independent-editions\/[^/]+\/index\.html$/);
  assert.ok(fs.existsSync(path.join(ROOT,e.route)),e.route);
  assert.equal(e.formRoutes.app,'?form=app');
  assert.equal(e.formRoutes.game,'?form=game');
  assert.equal(e.formRoutes.book,'?form=book');
  assert.equal(e.formRoutes.academy,'?form=academy');
 }
 assert.equal(tax.editions.find(x=>x.editionId==='hack-d-hack').developmentStage,'historical-design-source-not-verified');
});
test('nine existing website studios are already in source catalog and are not counted twice',()=>{
 const studios=tax.records.filter(x=>x.sourcePath.startsWith('app-factory/sites/')&&x.sourcePath!=='app-factory/sites/index.html');
 assert.equal(studios.length,9);
 assert.equal(tax.counts.independentSiteStudiosAlreadyInSourceRoutes,9);
 const sitesCode=read('app-factory/sites/sites-data.js'),sandbox={window:{}};
 vm.runInNewContext(sitesCode,sandbox,{timeout:1000});
 assert.equal(sandbox.window.NathanIndependentSites.length,9);
 for(const site of sandbox.window.NathanIndependentSites)
  assert.ok(studios.some(x=>x.sourcePath===('app-factory/sites/'+site.slug+'/index.html')),site.slug);
});
test('prior Capability Atlas proposals and five previously indexed original routes remain separately attributed',()=>{
 const prior=JSON.parse(read('app-factory/nathan-ai/capability-atlas/store-discovery.json'));
 const oldByPath=new Map(prior.records.map(r=>[r.path,r]));
 assert.equal(prior.records.length,67);
 assert.equal(tax.counts.priorCapabilityAtlasMatchedRoutes,62);
 assert.equal(tax.additionalReviewed.length,5);
 for(const r of tax.additionalReviewed){
  assert.equal(r.collection,'capability-atlas-reviewed-source');
  assert.equal(r.route,r.sourcePath);
  assert.ok(fs.existsSync(path.join(ROOT,r.sourcePath)),r.sourcePath);
  assert.ok(oldByPath.has(r.sourcePath));
  assert.equal(r.google.type==='Game'?'game':'app',oldByPath.get(r.sourcePath).google.type);
 }
 assert.equal(tax.records.filter(r=>r.priorCapabilityAtlasReview).length,62);
 assert.equal(tax.records.filter(r=>r.classificationRequiresReconciliation===true).length,tax.counts.priorProposalConflictsToReview);
 assert.equal(tax.counts.priorProposalConflictsToReview,29);
 assert.match(read('standalone-apps/index.html'),/Capability Atlas discovery review/);
});
test('browser app has searchable source-safe categories, games genres and edition links without store submission code',()=>{
 const html=read('standalone-apps/index.html'),js=read('standalone-apps/store-browser.js'),css=read('standalone-apps/store-browser.css');
 assert.doesNotThrow(()=>new vm.Script(js));
 for(const id of ['store','group','category','genre','collection','sort','search','programs','category-cards','count','more','total','registry-counts','family-counts','status'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/Apple App Store/);assert.match(html,/Google Play/);
 assert.match(html,/not a separately installable offline binary/);
 assert.match(html,/Original Websites/);assert.match(html,/Original Apps/);assert.match(html,/Interactive Chatbox/);
 assert.match(html,/submitted to, approved by, or published in Apple App Store or Google Play/);
 assert.match(js,/store-taxonomy\.json/);assert.match(js,/catalog\.json/);
 assert.match(js,/source\.sourcePath!==r\.sourcePath/);
 assert.match(js,/suggestedTags\.length>5/);
 assert.match(js,/formRoutes|for\(const form of/);
 assert.doesNotMatch(js,/innerHTML\s*=|eval\s*\(|navigator\.credentials|\.submit\(|https?:\/\/api\./);
 assert.match(css,/category-chip/);
});
test('categories linked from original websites, original apps, editions and Factory without changing their source programs',()=>{
 for(const f of [
 'app-factory/nathan-ai/websites/index.html',
 'app-factory/nathan-ai/websites/launchpad.html',
 'app-factory/nathan-ai/universal-workspace/index.html',
 'app-factory/nathan-ai/independent-editions/index.html',
 'app-factory/sites/index.html'
 ])assert.match(read(f),/standalone-apps\//,f);
 assert.match(read('.github/workflows/factory-ci.yml'),/standalone-apps\/store-taxonomy\.test\.cjs/);
});
