import { normalize, verification, indexCatalog, indexPhonetics, indexEvidence, semanticText, seed } from './model.mjs';
import { assets } from './assets.mjs';

const keyPattern = /^[a-f0-9-]{36}$/;
const sessionPattern = /^[0-9a-f]{64}$/;
const contentTypes = {'/':'text/html; charset=utf-8','/app.mjs':'text/javascript; charset=utf-8',
  '/model.mjs':'text/javascript; charset=utf-8','/style.css':'text/css; charset=utf-8','/specification':'text/plain; charset=utf-8'};
const rows = async (env,sql,...params) => (await env.DB.prepare(sql).bind(...params).all()).results;
const stmt = (env,sql,...params) => env.DB.prepare(sql).bind(...params);
const embedding = '@cf/baai/bge-small-en-v1.5';
const json = (data,status=200,headers={}) => Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const error = (message,status=400) => json({error:message},status);
function encodeAudio(buffer) {
  const bytes=new Uint8Array(buffer);
  const chunkSize=24576;
  const chunks=[];
  for(let i=0;i<bytes.length;i+=chunkSize) {
    chunks.push(btoa(String.fromCharCode(...bytes.subarray(i,i+chunkSize))));
  }
  return chunks.join('');
}
const deserialize = (row) => ({...JSON.parse(row.content),id:row.id,revision:row.revision,published:row.published===1});
function workspace(request) {
  const name = new URL(request.url).protocol==='https:' ? '__Host-tabor_academy' : 'tabor_academy';
  const existing = request.headers.get('Cookie')?.split(';').map(x=>x.trim().split('=')).find(([key])=>key===name)?.[1];
  if (sessionPattern.test(existing || '')) return {id:existing};
  const id = Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  return {id,cookie:name+'='+id+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000'+(name.startsWith('__Host')?'; Secure':'')};
}
function publicEntry(entry) {
  const {transcript,corrections,phonetic,audioId,...content}=entry;
  return content;
}
async function indexEntry(env, workspaceId, entry) {
  if (env.AI && env.VECTORS) {
    if (entry.published) {
      const {data}=await env.AI.run(embedding,{text:[semanticText(entry)]});
      await env.VECTORS.upsert([{id:entry.id,values:data[0]}]);
    } else {
      await env.VECTORS.deleteByIds([entry.id]);
    }
  }
  await stmt(env,`INSERT INTO indexing (workspace,id,revision,catalog,phonetics,evidence) VALUES (?,?,?,?,?,?)
    ON CONFLICT(workspace,id) DO UPDATE SET revision=excluded.revision,catalog=excluded.catalog,phonetics=excluded.phonetics,evidence=excluded.evidence
    WHERE excluded.revision >= indexing.revision`,
  workspaceId,entry.id,entry.revision,indexCatalog(entry),indexPhonetics(entry),indexEvidence(entry)).run();
}
async function refreshIndexes(env, workspaceId=null) {
  const pending = await rows(env,`SELECT entries.* FROM entries LEFT JOIN indexing USING(workspace,id)
    WHERE (indexing.revision IS NULL OR indexing.revision<entries.revision)
      AND (? IS NULL OR entries.workspace=?) ORDER BY updated_at LIMIT 40`,workspaceId,workspaceId);
  for (const row of pending) {
    try { await indexEntry(env,row.workspace,deserialize(row)); }
    catch(e) { console.error('Index retry:',e.message); }
  }
}
async function handle(request,env,ctx) {
  const url=new URL(request.url);
  const path=url.pathname;
  if (env.ACCESS_REQUIRED==='true' && path!=='/api/health' && !ctx.access) return error('Sign in to the Tabor Academy staging workspace.',403);
  if (Object.hasOwn(assets,path) && request.method==='GET') {
    return new Response(assets[path],{headers:{'Content-Type':contentTypes[path],
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; media-src 'self' blob:; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  }
  if (path==='/api/health') return json({app:'Tabor Academy',environment:env.ENVIRONMENT||'local',database:Boolean(env.DB),
    audio:Boolean(env.AUDIO),discovery:Boolean(env.AI&&env.VECTORS),transcription:Boolean(env.AI)});
  if (!path.startsWith('/api/')) return error('Page not found.',404);
  const session=workspace(request);
  if (request.method!=='GET' && request.headers.get('Origin')!==url.origin) return error('Open the app to make changes.',403);
  if (request.method==='GET' && path==='/api/bootstrap') {
    ctx.waitUntil(refreshIndexes(env,session.id).catch(e=>console.error('Index retry:',e.message)));
    const items=await rows(env,'SELECT * FROM entries WHERE workspace=? ORDER BY updated_at DESC LIMIT 200',session.id);
    return json({seed,entries:items.map(deserialize),environment:env.ENVIRONMENT||'local',
      audio:Boolean(env.AUDIO),transcription:Boolean(env.AI),semantic:Boolean(env.AI&&env.VECTORS)},200,session.cookie?{'Set-Cookie':session.cookie}:{});
  }
  if (request.method==='GET' && path==='/api/catalog') {
    const search=(url.searchParams.get('q')||'').trim().slice(0,180);
    let matches = [];
    if (search && url.searchParams.get('semantic')==='1' && env.AI && env.VECTORS) {
      try {
        const {data}=await env.AI.run(embedding,{text:[search]});
        const query=await env.VECTORS.query(data[0],{topK:20});
        matches=query.matches.map(item=>item.id);
      } catch { /* Exact catalog lookup remains available. */ }
    }
    const conditions=matches.map(()=>'?').join(',');
    const found=await rows(env,`SELECT entries.* FROM entries LEFT JOIN indexing USING(workspace,id)
      WHERE published=1 AND (?='' OR instr(lower(COALESCE(indexing.catalog,'')||entries.content),lower(?))>0
        ${conditions?' OR entries.id IN ('+conditions+')':''}) ORDER BY updated_at DESC LIMIT 150`,search,search,...matches);
    const entries=found.map(deserialize).filter(e=>verification(e).retained).map(publicEntry);
    const needle=search.toLocaleLowerCase();
    return json({entries:entries.filter(e=>!needle||matches.includes(e.id)||
      [indexCatalog(e),e.result,e.origin,e.rootMeaning,e.source,e.strong].join(' ').toLocaleLowerCase().includes(needle))
      .sort((a,b)=>Number(matches.includes(b.id))-Number(matches.includes(a.id))).slice(0,100)});
  }
  if (!sessionPattern.test(session.id) || session.cookie) return error('Open or refresh Tabor Academy first.',401);

  if (path==='/api/entries' && request.method==='POST') {
    const data=await request.json();
    const entry=normalize(data);
    if (!entry.title.trim()) return error('Enter a title for the Library record.');
    if (entry.audioId && !(await stmt(env,'SELECT id FROM recordings WHERE workspace=? AND id=?',session.id,entry.audioId).first())) {
      return error('The recording is missing from this workspace.');
    }
    if (data.id && !keyPattern.test(data.id)) return error('Invalid entry.');
    const id=data.id||crypto.randomUUID();
    const prior=data.id && await stmt(env,'SELECT * FROM entries WHERE workspace=? AND id=?',session.id,id).first();
    if (data.id && !prior) return error('Entry not found.',404);
    if (prior && prior.revision!==data.revision) return error('This record has a newer revision. Refresh before editing.',409);
    if (prior && JSON.parse(prior.content).transcript && JSON.parse(prior.content).transcript!==entry.transcript) {
      return error('The captured wording is locked. Save additions in Corrections or start a new capture.',409);
    }
    const check=verification(entry);
    if (data.publish===true && (!check.retained || data.shareApproved!==true)) {
      return json({error:'The Sovereignty & Innocence Filter blocked publication.',verification:check},422);
    }
    const published=data.publish===true;
    const now=Date.now();
    const content=JSON.stringify(entry);
    const revision=prior?prior.revision+1:1;
    const write=prior ? stmt(env,`UPDATE entries SET content=?,revision=?,published=?,updated_at=?
      WHERE workspace=? AND id=? AND revision=?`,content,revision,Number(published),now,session.id,id,prior.revision)
      : stmt(env,'INSERT INTO entries(workspace,id,content,revision,published,updated_at) VALUES(?,?,?,?,?,?)',
        session.id,id,content,revision,Number(published),now);
    if(!(await write.run()).meta.changes) return error('This record has a newer revision.',409);
    const saved={...entry,id,revision,published};
    ctx.waitUntil(indexEntry(env,session.id,saved).catch(err=>console.error('Indexing:',err.message)));
    return json({entry:saved,verification:check});
  }
  if (path==='/api/audio' && request.method==='POST') {
    if (!env.AUDIO) return error('Audio storage is unavailable.',503);
    const kind=request.headers.get('Content-Type')?.split(';')[0];
    if(!['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','audio/x-m4a'].includes(kind)) return error('Use an audio recording.',415);
    const buffer=await request.arrayBuffer();
    if(!buffer.byteLength || buffer.byteLength>8*1024*1024) return error('Use a recording under 8 MB.',413);
    const id=crypto.randomUUID();
    const file=session.id+'/'+id;
    await env.AUDIO.put(file,buffer,{httpMetadata:{contentType:kind}});
    try {
      await stmt(env,'INSERT INTO recordings(workspace,id,filename,created_at) VALUES(?,?,?,?)',session.id,id,file,Date.now()).run();
    } catch (e) {
      await env.AUDIO.delete(file);
      throw e;
    }
    let transcript='';
    let warning='';
    if (url.searchParams.get('transcribe')==='1' && env.AI) {
      try {
        const result=await env.AI.run('@cf/openai/whisper-large-v3-turbo',{audio:encodeAudio(buffer)});
        transcript=result.text||'';
      } catch { warning='Audio saved. Automatic transcription is unavailable for this recording.'; }
    }
    return json({id,transcript,warning},201);
  }
  const audioMatch=path.match(/^\/api\/audio\/([a-f0-9-]{36})$/);
  if (audioMatch && request.method==='GET') {
    const row=await stmt(env,'SELECT filename FROM recordings WHERE workspace=? AND id=?',session.id,audioMatch[1]).first();
    const object=row && env.AUDIO && await env.AUDIO.get(row.filename);
    if(!object) return error('Recording not found.',404);
    const headers=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    object.writeHttpMetadata(headers);
    return new Response(object.body,{headers});
  }
  return error('Page not found.',404);
}
export default {
  async fetch(request,env,ctx) {
    try { return await handle(request,env,ctx); }
    catch(e) { console.error(e.message); return error(e instanceof SyntaxError?'Invalid request JSON.':'The request could not be saved.',e instanceof SyntaxError?400:500); }
  },
  scheduled(_event,env,ctx) { ctx.waitUntil(refreshIndexes(env)); }
};
