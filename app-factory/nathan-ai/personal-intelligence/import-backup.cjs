#!/usr/bin/env node
'use strict';
/* Verified backup -> owner-approved folder -> read-only MCP bridge.
 * Explicit local paths only. No HTTP, public writes, overwrites or provider credentials.
 */
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const Backup=require('../../vault-backup.js');
function cleanFilename(filename){
 const just=path.basename(String(filename||'original.bin').replace(/\\/g,'/'));
 const safe=just.replace(/[^a-zA-Z0-9 ._()-]/g,'_').replace(/^\.+/,'').slice(0,110).trim();
 return safe||'original.bin';
}
async function restoreToFolder(zipFile,destination){
 if(!zipFile||!destination)throw Error('Usage: node import-backup.cjs /path/to/verified-backup.zip /path/to/existing-approved-folder');
 const root=await fs.realpath(path.resolve(destination));
 if(!(await fs.stat(root)).isDirectory())throw Error('Approved MCP destination must be an existing directory');
 const archive=await fs.readFile(zipFile);
 if(archive.length>Backup.MAX_TOTAL+1024)throw Error('ZIP exceeds supported mobile backup size');
 const verified=await Backup.parse(new Uint8Array(archive));
 let written=0,matched=0;
 const manifest=[];
 for(const item of verified.items){
  const record=item.record;
  const digest=crypto.createHash('sha256').update(item.bytes).digest('hex');
  if(digest!==record.sha256)throw Error('SHA-256 verification failed');
  const clean=cleanFilename(record.name);
  const outputName=digest.slice(0,16)+'__'+clean;
  const filename=path.join(root,outputName);
  try{await fs.writeFile(filename,item.bytes,{flag:'wx',mode:0o600});written++;}
  catch(e){if(e.code!=='EEXIST')throw e;const old=await fs.readFile(filename);const existing=crypto.createHash('sha256').update(old).digest('hex');if(existing!==digest)throw Error('Existing file hash collision: '+outputName);matched++;}
  manifest.push({sourceId:record.id,name:record.name,storedAs:outputName,mime:record.mime||'application/octet-stream',sha256:digest,size:item.bytes.length,importedAt:new Date().toISOString()});
 }
 // Never overwrite a prior historical import manifest. Record a versioned audit copy instead.
 const file=path.join(root,'.nathan-pi-import-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex')+'.json');
 await fs.writeFile(file,JSON.stringify({schema:'nathan.personal-intelligence.mcp-import.v1',records:manifest},null,2),{flag:'wx',mode:0o600});
 return {verified:verified.items.length,written,matched,manifest:file};
}
if(require.main===module){restoreToFolder(process.argv[2],process.argv[3]).then(result=>process.stdout.write(JSON.stringify(result,null,2)+'\n')).catch(e=>{process.stderr.write('Import failed: '+e.message+'\n');process.exitCode=1;});}
module.exports={cleanFilename,restoreToFolder};
