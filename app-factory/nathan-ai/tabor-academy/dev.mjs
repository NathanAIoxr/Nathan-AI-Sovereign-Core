import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { DatabaseSync } from 'node:sqlite';
import { readFile,mkdir } from 'node:fs/promises';
await import('./build.mjs');
const {default:worker}=await import('./dist/worker.mjs');
const local=new URL('./.local/',import.meta.url);
await mkdir(local,{recursive:true});
const db=new DatabaseSync(new URL('academy.sqlite',local));
db.exec(await readFile(new URL('./migrations/0001_library.sql',import.meta.url),'utf8'));
const env={DB:{prepare(sql){return {bind(...args){
  const query=db.prepare(sql);
  return {all:async()=>({results:query.all(...args)}),first:async()=>query.get(...args),run:async()=>({meta:query.run(...args)})};
}};}}, AUDIO:{
  async put(key,bytes,{httpMetadata}) {
    const {writeFile}=await import('node:fs/promises');
    const [scope,id]=key.split('/');
    const dir=new URL(scope+'/',local);
    await mkdir(dir,{recursive:true});
    await writeFile(new URL(id,dir),Buffer.from(bytes));
    await writeFile(new URL(id+'.type',dir),httpMetadata.contentType);
  },
  async get(key) {
    try {
      const [body,type]=await Promise.all([readFile(new URL(key,local)),readFile(new URL(key+'.type',local),'utf8')]);
      return {body,writeHttpMetadata:headers=>headers.set('Content-Type',type)};
    } catch(e) {if(e.code!=='ENOENT') throw e; return null;}
  },
  async delete(key) { const {rm}=await import('node:fs/promises'); await Promise.all([rm(new URL(key,local),{force:true}),rm(new URL(key+'.type',local),{force:true})]); }
}};
const port=Number(process.env.TABOR_ACADEMY_PORT||8272);
createServer(async(req,res)=>{
  const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,
    ...(req.method==='GET'||req.method==='HEAD'?{}:{body:Readable.toWeb(req),duplex:'half'})});
  const response=await worker.fetch(request,env,{waitUntil:promise=>promise.catch(console.error)});
  res.writeHead(response.status,Object.fromEntries(response.headers));
  if (response.body) Readable.fromWeb(response.body).pipe(res);
  else res.end();
}).listen(port,'127.0.0.1',()=>console.log('Tabor Academy on http://127.0.0.1:'+port));
