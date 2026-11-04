const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),library=path.join(root,'one/library-mind'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'))),first=JSON.parse(fs.readFileSync(path.join(__dirname,'first-versions.json'))),current=JSON.parse(fs.readFileSync(path.join(library,'documents.json'))),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
test('all current texts and recovered earlier texts match the preservation manifest',()=>{
 assert.equal(manifest.records.length,55);assert.equal(manifest.summary.unchanged_from_first_saved,52);assert.equal(first.length,3);
 for(const m of manifest.records){const row=current.find(r=>r.id===m.id);assert.equal(sha(row.content),m.current_sha256);const old=first.find(r=>r.id===m.id)?.record||row;assert.equal(sha(old.content),m.first_sha256);assert.equal(m.has_revisions,m.first_sha256!==m.current_sha256);}
});
test('recovered records are byte-equivalent JSON values from their stated source commit',()=>{
 for(const entry of first){const text=cp.execFileSync('git',['show',entry.first_commit+':app-factory/one/library-mind/documents.json'],{cwd:path.resolve(root,'..'),encoding:'utf8'});const original=JSON.parse(text).find(r=>r.id===entry.id);assert.deepEqual(entry.record,original);}
});
test('all original downloads keep their published SHA-256 and size',()=>{
 const publication=JSON.parse(fs.readFileSync(path.join(library,'publication.json')));assert.equal(manifest.downloads.length,publication.downloads.length);
 for(const row of manifest.downloads){const bytes=fs.readFileSync(path.join(library,row.file));assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);assert.equal(row.sha256,publication.downloads.find(r=>r.file===row.file).sha256);}
});
test('the reader preserves source separation and renders saved words inertly',()=>{
 const js=fs.readFileSync(path.join(__dirname,'works.js'),'utf8');assert.doesNotMatch(js,/innerHTML\s*=|localStorage\.|\.replace\([^\n]*content/);assert.match(js,/textContent=r.content/);assert.match(js,/version==='first'/);
 const plan=JSON.parse(fs.readFileSync(path.join(library,'plan.json')));assert.equal(plan.length,13);assert.equal(new Set(plan.map(r=>r.title)).size,13);
});
test('home branding keeps all existing public destinations and puts original works first',()=>{
 const home=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');assert.match(home,/nathan-identity-title/);assert.match(home,/My Original Works/);assert.match(home,/THE LIBRARY MIND OF JOHN NATHAN TABOR/);assert.match(home,/OUR WORD IS OUR BOND/);
 const baseline=cp.execFileSync('git',['show','67aab9a:app-factory/nathan-ai/index.html'],{cwd:path.resolve(root,'..'),encoding:'utf8'});for(const [,href]of baseline.matchAll(/href="([^"]+)"/g))assert.ok(home.includes('href="'+href+'"'),href);
});
