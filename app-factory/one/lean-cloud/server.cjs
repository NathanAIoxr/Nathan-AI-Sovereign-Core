'use strict';
// ONE private, single-owner ciphertext backup gateway. No plaintext, models or cloud API keys.
// Tested starter, NOT a multi-user production service or independent backup system.
const http=require('node:http');
const fs=require('node:fs');
const fsp=fs.promises;
const path=require('node:path');
const {createHash,timingSafeEqual,randomUUID}=require('node:crypto');
const LIMIT=140*1024*1024;
const MAGIC=Buffer.from([79,78,69,86,76,84,49,0]);
function reply(res,code,value){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))}
function makeHandler({token,dir,origins=[]}){
 if(typeof token!=='string'||token.length<32||/^(change|replace|example|test)/i.test(token))throw Error('Set a unique 32+-character ONE_SYNC_TOKEN secret');
 if(!path.isAbsolute(dir))throw Error('ONE_DATA_DIR must be absolute');
 const expected=createHash('sha256').update(token).digest();
 const authorized=req=>{const auth=req.headers.authorization||'';if(!auth.startsWith('Bearer '))return false;const candidate=createHash('sha256').update(auth.slice(7)).digest();return timingSafeEqual(candidate,expected)};
 return async function(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const origin=req.headers.origin;
  if(origin){
   if(!origins.includes(origin))return reply(res,403,{error:'origin_not_allowed'});
   res.setHeader('Access-Control-Allow-Origin',origin);
   res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, X-ONE-SHA256');
   res.setHeader('Vary','Origin');
  }
  if(req.method==='OPTIONS')return reply(res,204,{});
  if(req.method==='GET'&&req.url==='/healthz')return reply(res,200,{status:'running',mode:'owner-encrypted-archives',backup_verified:false});
  if(!authorized(req))return reply(res,401,{error:'not_authorized'});
  const loc=(req.url||'').split('?')[0];
  if(req.method==='POST'&&loc==='/v1/backups'){
   const claimed=req.headers['x-one-sha256'];
   if(typeof claimed!=='string'||!/^[a-f0-9]{64}$/.test(claimed))return reply(res,400,{error:'client_checksum_required'});
   if(req.headers['content-type']!=='application/octet-stream')return reply(res,415,{error:'binary_content_type_required'});
   if(Number(req.headers['content-length'])>LIMIT)return reply(res,413,{error:'backup_too_large'});
   const store=path.join(dir,'backups');let tmp,handle;
   try{
    await fsp.mkdir(store,{recursive:true,mode:0o700});
    tmp=path.join(store,'.upload-'+randomUUID());handle=await fsp.open(tmp,'wx',0o600);
    const hash=createHash('sha256');let size=0,head=Buffer.alloc(0);
    for await(const chunk of req){
     size+=chunk.length;if(size>LIMIT)throw Object.assign(Error('backup_too_large'),{status:413});
     hash.update(chunk);if(head.length<8)head=Buffer.concat([head,chunk.subarray(0,8-head.length)]);
     let offset=0;while(offset<chunk.length){const n=(await handle.write(chunk,offset,chunk.length-offset,null)).bytesWritten;if(!n)throw Error('zero_byte_write');offset+=n}
    }
    if(head.length!==8||!head.equals(MAGIC))throw Object.assign(Error('not_a_ONE_sealed_backup'),{status:422});
    const digest=hash.digest('hex');if(digest!==claimed)throw Object.assign(Error('checksum_mismatch'),{status:422});
    await handle.sync();await handle.close();handle=null;
    const final=path.join(store,digest+'.onevault');let exists=false;
    try{await fsp.stat(final);exists=true}catch(e){if(e.code!=='ENOENT')throw e}
    if(!exists)await fsp.rename(tmp,final);
    else await fsp.unlink(tmp);
    tmp=null;
    return reply(res,201,{status:'cloud_verified',sha256:digest,bytes:size,already_existed:exists,backup_verified:false});
   }catch(e){if(handle)await handle.close().catch(()=>{});if(tmp)await fsp.unlink(tmp).catch(()=>{});if(!res.headersSent)return reply(res,e.status||500,{error:e.status?e.message:'storage_failure'});}
   return;
  }
  if(req.method==='GET'&&loc==='/v1/backups'){
   try{const store=path.join(dir,'backups');const names=await fsp.readdir(store).catch(e=>e.code==='ENOENT'?[]:Promise.reject(e));const items=[];
    for(const name of names){if(!/^[a-f0-9]{64}\.onevault$/.test(name))continue;const st=await fsp.stat(path.join(store,name));if(st.isFile())items.push({sha256:name.slice(0,64),bytes:st.size,stored_at:st.mtime.toISOString()})}
    return reply(res,200,{items:items.sort((a,b)=>b.stored_at.localeCompare(a.stored_at)),backup_verified:false})
   }catch(e){return reply(res,500,{error:'storage_failure'})}
  }
  const match=loc.match(/^\/v1\/backups\/([a-f0-9]{64})$/);
  if(req.method==='GET'&&match){
   const file=path.join(dir,'backups',match[1]+'.onevault');
   try{const st=await fsp.stat(file);if(!st.isFile())return reply(res,404,{error:'not_found'});
    res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':st.size,'Content-Disposition':'attachment; filename="ONE-'+match[1]+'.onevault"','Cache-Control':'no-store','X-ONE-SHA256':match[1]});
    return fs.createReadStream(file).pipe(res)
   }catch(e){return reply(res,e.code==='ENOENT'?404:500,{error:e.code==='ENOENT'?'not_found':'storage_failure'})}
  }
  return reply(res,404,{error:'not_found'});
 };
}
if(require.main===module){
 const handler=makeHandler({token:process.env.ONE_SYNC_TOKEN,dir:process.env.ONE_DATA_DIR||'/data',origins:(process.env.ONE_ALLOWED_ORIGINS||'').split(',').filter(Boolean)});
 const port=Number(process.env.PORT||8787);
 http.createServer(handler).listen(port,'0.0.0.0',()=>console.log('ONE encrypted cloud gateway ready on port '+port+' (no originals logged)'));
}
module.exports={makeHandler,LIMIT,MAGIC};
