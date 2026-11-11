'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const backup=require('../../vault-backup.js');
const importer=require('./import-backup.cjs');
const mcp=require('./mcp-server.cjs');
test('verified Creator Vault backup can be restored to authorized MCP folder without losing bytes',async t=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'nathan-zip-mcp-'));t.after(()=>fs.rm(temp,{force:true,recursive:true}));
 const folder=path.join(temp,'approved');await fs.mkdir(folder);
 const originals=[{record:{id:'o1',name:'original-notes.txt',kind:'asset',mime:'text/plain'},bytes:new TextEncoder().encode('Exact original words and dates')},{record:{id:'o2',name:'photo.png',kind:'asset',mime:'image/png'},bytes:Uint8Array.from([137,80,78,71,13,10,26,10])}];
 const zipped=await backup.create(originals),zip=path.join(temp,'backup.zip');await fs.writeFile(zip,zipped.bytes);
 const first=await importer.restoreToFolder(zip,folder);assert.deepEqual([first.verified,first.written,first.matched],[2,2,0]);
 const all=await mcp.listSources(folder);assert.equal(all.length,2);
 const textAsset=all.find(x=>x.name.endsWith('original-notes.txt'));const text=await mcp.readSource(folder,textAsset.id);assert.equal(text.content,'Exact original words and dates');
 const imageAsset=all.find(x=>x.name.endsWith('photo.png'));const image=await mcp.getImage(folder,imageAsset.id);assert.equal(Buffer.from(image.data,'base64').length,8);
 const second=await importer.restoreToFolder(zip,folder);assert.deepEqual([second.written,second.matched],[0,2]);
 assert.equal(importer.cleanFilename('../../outside.txt'),'outside.txt');
});
test('invalid backup is rejected without creating fake originals',async t=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'nathan-zip-mcp-'));t.after(()=>fs.rm(tmp,{force:true,recursive:true}));
 const output=path.join(tmp,'approved');await fs.mkdir(output);const source=path.join(tmp,'broken.zip');await fs.writeFile(source,'not a zip');
 await assert.rejects(importer.restoreToFolder(source,output),/ZIP end marker|Corrupt|missing/);
 assert.deepEqual(await mcp.listSources(output),[]);
});
