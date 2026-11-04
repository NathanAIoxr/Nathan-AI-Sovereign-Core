const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=__dirname,assets=JSON.parse(fs.readFileSync(path.join(base,'offline-assets.json'),'utf8'));
test('install manifest has a scoped home and actual 192/512 PNG icons',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(base,'manifest.webmanifest'),'utf8'));assert.equal(m.start_url,'./');assert.equal(m.scope,'./');assert.equal(m.display,'standalone');
 for(const icon of m.icons){const b=fs.readFileSync(path.join(base,icon.src));assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16),Number(icon.sizes.split('x')[0]));}
});
test('offline asset list contains only existing named public files',()=>{
 assert.equal(new Set(assets).size,assets.length);for(const name of assets){assert.doesNotMatch(name,/[?#]|:\/\/|private-samples|api\//);const target=path.resolve(base,name==='./'?'index.html':name);assert.ok(target.startsWith(path.resolve(base,'..')+path.sep));assert.ok(fs.statSync(target).isFile(),name);}
 for(const required of ['index.html','command-center/app.js','assistant/app.js','appearance/app.js'])assert.ok(assets.includes(required));
});
test('service worker leaves API, query, foreign and write requests alone',()=>{
 const listeners={};vm.runInNewContext(fs.readFileSync(path.join(base,'sw.js'),'utf8'),{self:{registration:{scope:'https://example.test/app-factory/nathan-ai/'},addEventListener:(name,fn)=>listeners[name]=fn},URL});
 for(const [url,method] of [['https://example.test/api/nathan/status','GET'],['https://example.test/app-factory/nathan-ai/?private=1','GET'],['https://outside.test/index.html','GET'],['https://example.test/app-factory/nathan-ai/index.html','POST']]){let intercepted=false;listeners.fetch({request:{url,method},respondWith:()=>{intercepted=true;}});assert.equal(intercepted,false,url);}
});
