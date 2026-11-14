'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {randomBytes,randomUUID,createHash,timingSafeEqual}=require('node:crypto');
const {skins,defaults,settings}=require('../nathan-ai/appearance/engine.js');
const ROOT=path.resolve(__dirname,'../..'), ID=/^[a-z][a-z0-9-]{0,63}$/;
const hash=x=>createHash('sha256').update(x).digest();
function checkApp(a){
 if(!a||!ID.test(a.id)||typeof a.name!=='string'||!a.name.trim()||a.name.length>120)throw Error('Invalid app ID or name');
 if(typeof a.description!=='string'||a.description.length>1000)throw Error('Invalid description');
 if(typeof a.entry!=='string'||!a.entry.startsWith('app-factory/')||a.entry.includes('..')||/[?#\\]/.test(a.entry)||!a.entry.endsWith('.html')||!fs.existsSync(path.join(ROOT,a.entry)))throw Error('Entry must reference an existing local app HTML file');
 if(!Array.isArray(a.fields)||a.fields.length<1||a.fields.length>20)throw Error('Use 1–20 fields');
 const names=new Set();for(const f of a.fields){if(!f||!ID.test(f.key)||names.has(f.key)||typeof f.label!=='string'||!f.label.trim()||f.label.length>80||!['text','number','boolean'].includes(f.type))throw Error('Invalid or duplicate field');names.add(f.key)}
 return {id:a.id,name:a.name.trim(),description:a.description,entry:a.entry,appearance:settings(a.appearance||defaults),fields:a.fields.map(f=>({key:f.key,label:f.label,type:f.type}))};
}
function checkRecord(app,input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!app.fields.some(f=>f.key===k)))throw Error('Unknown record field');
 const clean={};for(const f of app.fields){const v=input[f.key];if(v===undefined)continue;if(typeof v!==(f.type==='text'?'string':f.type)||(f.type==='number'&&!Number.isFinite(v))||(f.type==='text'&&v.length>10000))throw Error('Invalid '+f.label);clean[f.key]=v}return clean;
}
function createApp({dbPath,token,root=ROOT}={}){
 if(typeof token!=='string'||token.length<32)throw Error('ONE_SHELL_TOKEN must be at least 32 characters');
 if(!dbPath)throw Error('Database path required');
 const db=new DatabaseSync(dbPath);db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS apps(id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, app_id TEXT NOT NULL REFERENCES apps(id), body TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS records_by_app ON records(app_id); PRAGMA user_version=1;');
 const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'seed.json'),'utf8'));
 for(const row of seed.apps){const a=checkApp(row);db.prepare('INSERT OR IGNORE INTO apps VALUES(?,?)').run(a.id,JSON.stringify(a))}
 const sessions=new Map(),attempts=new Map(),expected=hash(token);
 const app=id=>{const row=db.prepare('SELECT body FROM apps WHERE id=?').get(id);return row?JSON.parse(row.body):null};
 const server=http.createServer(async(req,res)=>{
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
  try{
   const u=new URL(req.url,'http://localhost'),p=u.pathname;
   if(req.headers.host!==server.allowedHost)return send(403,{error:'Invalid host'});
   if(req.headers.origin&&req.headers.origin!==`http://${server.allowedHost}`)return send(403,{error:'Cross-origin request denied'});
   if(p==='/healthz'&&req.method==='GET')return send(200,{status:'ok',storage:'sqlite',schema:1});
   if(p.startsWith('/api/')){
    if(!['GET','POST','PUT','DELETE'].includes(req.method))return send(405,{error:'Unsupported method'});
    let body={};if(['POST','PUT'].includes(req.method)){
     if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON required'});
     const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>262144)return send(413,{error:'Request too large'});chunks.push(c)}
     try{body=JSON.parse(Buffer.concat(chunks).toString())}catch{return send(400,{error:'Invalid JSON'})}
    }
    if(p==='/api/session'&&req.method==='POST'){
     const now=Date.now(),key=req.socket.remoteAddress;let limit=attempts.get(key);if(!limit||limit.until<now){limit={count:0,until:now+60000};attempts.set(key,limit)}
     if(++limit.count>10)return send(429,{error:'Too many login attempts; retry in a minute'});
     if(typeof body.token!=='string'||!timingSafeEqual(hash(body.token),expected))return send(401,{error:'Invalid owner token'});
     for(const [k,v]of sessions)if(v<Date.now())sessions.delete(k);
     const sid=randomBytes(32).toString('hex');sessions.set(sid,Date.now()+8*3600000);
     res.setHeader('Set-Cookie',`one_shell=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);return send(200,{authenticated:true});
    }
    const sid=(req.headers.cookie||'').match(/(?:^|;\s*)one_shell=([a-f0-9]{64})(?:;|$)/)?.[1];
    if(!sid||(sessions.get(sid)||0)<Date.now())return send(401,{error:'Sign in with the owner token'});
    if(p==='/api/session'&&req.method==='DELETE'){sessions.delete(sid);res.setHeader('Set-Cookie','one_shell=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(200,{authenticated:false})}
    if(p==='/api/bootstrap'&&req.method==='GET')return send(200,{mode:'sqlite',apps:db.prepare('SELECT body FROM apps ORDER BY id').all().map(x=>JSON.parse(x.body)),themes:skins});
    if(p==='/api/apps'&&req.method==='POST'){
     const a=checkApp(body);if(app(a.id))return send(409,{error:'App already exists'});db.prepare('INSERT INTO apps VALUES(?,?)').run(a.id,JSON.stringify(a));return send(201,a);
    }
    const m=p.match(/^\/api\/apps\/([a-z][a-z0-9-]{0,63})(?:\/records(?:\/([a-f0-9-]{36}))?)?$/);
    if(!m)return send(404,{error:'Unknown API route'});
    const a=app(m[1]);if(!a)return send(404,{error:'App not found'});
    if(!p.includes('/records')){
     if(req.method==='GET')return send(200,a);
     if(req.method==='PUT'){
      const next=checkApp({...body,id:a.id});
      // Prevent schema changes invalidating stored content.
      const rows=db.prepare('SELECT body FROM records WHERE app_id=?').all(a.id);for(const row of rows)checkRecord(next,JSON.parse(row.body));
      db.prepare('UPDATE apps SET body=? WHERE id=?').run(JSON.stringify(next),a.id);return send(200,next);
     }
    }else{
     if(!m[2]&&req.method==='GET')return send(200,{items:db.prepare('SELECT id,body,updated_at FROM records WHERE app_id=? ORDER BY updated_at DESC LIMIT 1000').all(a.id).map(x=>({id:x.id,data:JSON.parse(x.body),updatedAt:x.updated_at})),limit:1000});
     if(!m[2]&&req.method==='POST'){const data=checkRecord(a,body),id=randomUUID(),at=new Date().toISOString();db.prepare('INSERT INTO records VALUES(?,?,?,?)').run(id,a.id,JSON.stringify(data),at);return send(201,{id,data,updatedAt:at})}
     if(m[2]){
      const r=db.prepare('SELECT id FROM records WHERE id=? AND app_id=?').get(m[2],a.id);if(!r)return send(404,{error:'Record not found in this app'});
      if(req.method==='PUT'){const data=checkRecord(a,body),at=new Date().toISOString();db.prepare('UPDATE records SET body=?,updated_at=? WHERE id=? AND app_id=?').run(JSON.stringify(data),at,m[2],a.id);return send(200,{id:m[2],data,updatedAt:at})}
      if(req.method==='DELETE'){db.prepare('DELETE FROM records WHERE id=? AND app_id=?').run(m[2],a.id);return send(200,{deleted:true})}
     }
    }
    return send(405,{error:'Unsupported operation'});
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Read only static files'});
   // Serve only this shell and its shared appearance implementation.
   let file=decodeURIComponent(p);if(file==='/'){res.writeHead(302,{Location:'/app-factory/app-shell/index.html'});res.end();return;}
   const allowed=file.startsWith('/app-factory/')||file.startsWith('/branding/')||file.startsWith('/docs/');
   const resolved=path.resolve(root,'.'+file),ext=path.extname(resolved);
   if(!allowed||!resolved.startsWith(root+path.sep)||!['.html','.js','.mjs','.css','.json','.svg','.png','.jpg','.webmanifest'].includes(ext)||file.split('/').some(x=>x.startsWith('.')))return send(404,{error:'Not found'});
   // Do not follow symlinks outside the static root.
   if(!fs.existsSync(resolved)||!fs.realpathSync(resolved).startsWith(root+path.sep))return send(404,{error:'Not found'});
   if(!file.startsWith('/app-factory/app-shell/'))res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'");
   res.setHeader('Content-Type',({'.mjs':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'})[ext]);
   res.end(req.method==='HEAD'?undefined:fs.readFileSync(resolved));
  }catch(e){send(e.code==='SQLITE_ERROR'?500:400,{error:e.code?'Database operation failed':e.message})}
 });
 const originalListen=server.listen.bind(server);server.listen=(port=0,host='127.0.0.1',cb)=>{if(host!=='127.0.0.1')throw Error('Local owner server must bind to 127.0.0.1');return originalListen(port,host,()=>{server.allowedHost=`127.0.0.1:${server.address().port}`;cb?.()})};
 server.on('close',()=>db.close());return server;
}
if(require.main===module){
 const dir=process.env.ONE_SHELL_DATA_DIR;if(!dir||!path.isAbsolute(dir))throw Error('Set ONE_SHELL_DATA_DIR to a private absolute path outside the repository');
 if(dir===ROOT||dir.startsWith(ROOT+path.sep))throw Error('Database must stay outside the public repository');
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const s=createApp({dbPath:path.join(dir,'one-shell.sqlite'),token:process.env.ONE_SHELL_TOKEN});s.listen(Number(process.env.PORT||8793),'127.0.0.1',()=>console.log(`ONE app shell: http://${s.allowedHost}`));
}
module.exports={createApp,checkApp,checkRecord};
