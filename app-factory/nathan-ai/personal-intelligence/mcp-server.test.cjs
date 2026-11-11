'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const m=require('./mcp-server.cjs');
test('directory-bound MCP lists only intended files, prevents traversal, reads hashed originals',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nathan-pi-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 await fs.writeFile(path.join(dir,'letter.txt'),'Owner words exactly');await fs.writeFile(path.join(dir,'.env'),'TOP_SECRET');await fs.writeFile(path.join(dir,'secret.pem'),'KEY');
 await fs.mkdir(path.join(dir,'Project'));await fs.writeFile(path.join(dir,'Project','index.md'),'Source-linked project');
 const list=await m.listSources(dir);assert.deepEqual(new Set(list.map(x=>x.id)),new Set(['Project/index.md','letter.txt']));assert.equal((await m.searchVault(dir,'source-linked')).length,1);
 const r=await m.readSource(dir,'letter.txt');assert.equal(r.content,'Owner words exactly');assert.equal(r.sha256.length,64);await assert.rejects(m.readSource(dir,'../secret.pem'),/not found|Invalid/);
 await assert.rejects(m.readSource(dir,'.env'),/not found/);
 const response=await m.dispatch({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'read_source',arguments:{asset_id:'letter.txt'}}},dir);
 assert.equal(response.id,3);assert.equal(response.result.isError,undefined);assert.match(response.result.content[0].text,/Owner words exactly/);
});
test('symlink escapes are excluded and images have precise output type',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nathan-pi-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 await fs.writeFile(path.join(dir,'pic.png'),Buffer.from([137,80,78,71]));
 await fs.writeFile(path.join(dir,'file.txt'),'safely local');
 try{await fs.symlink(os.tmpdir(),path.join(dir,'escape'),'dir');}catch(e){/* platforms may disallow symlinks */}
 assert.equal((await m.listSources(dir)).some(x=>x.id.startsWith('escape')),false);
 const img=await m.getImage(dir,'pic.png');assert.equal(img.mime,'image/png');assert.equal(Buffer.from(img.data,'base64').length,4);
 await assert.rejects(m.getImage(dir,'file.txt'),/raster/);
});
test('MCP does not claim internet, provider sync or credentials',async()=>{
 const init=await m.dispatch({jsonrpc:'2.0',id:1,method:'initialize'},'');assert.equal(init.result.serverInfo.name,'nathan-personal-intelligence-local');
 const list=await m.dispatch({jsonrpc:'2.0',id:2,method:'tools/list'},'');assert.ok(list.result.tools.every(x=>['list_sources','search_vault','read_source','get_image'].includes(x.name)));
 const failed=await m.dispatch({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'list_sources',arguments:{}}},'');assert.equal(failed.result.isError,true);
});
