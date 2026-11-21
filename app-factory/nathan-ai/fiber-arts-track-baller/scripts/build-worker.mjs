import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const manifest = await readFile(path.join(root, 'manifest.json'), 'utf8');
const parsed = JSON.parse(manifest);
if (parsed.schema !== 'tabor.one.fiber.touch.v1' || parsed.crafts?.length !== 12 ||
    parsed.crafts.some(c => !Array.isArray(c.steps) || c.steps.length !== 6)) {
  throw new Error('Fiber manifest integrity check failed');
}
const source = `const HTML=${JSON.stringify(html)};
const MANIFEST=${JSON.stringify(manifest)};
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(),geolocation=()'};
const json=(obj,status=200)=>new Response(JSON.stringify(obj,null,2),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export default {
 async fetch(request) {
  const u=new URL(request.url);
  if(request.method!=='GET' && request.method!=='HEAD')return json({error:'method_not_allowed'},405);
  if(u.pathname==='/'||u.pathname==='/index.html')return new Response(request.method==='HEAD'?null:HTML,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=180'}});
  if(u.pathname==='/api/manifest'||u.pathname==='/manifest.json')return new Response(request.method==='HEAD'?null:MANIFEST,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=180'}});
  if(u.pathname==='/api/health'||u.pathname==='/api/status') {const m=JSON.parse(MANIFEST);return json({ok:true,product:'Tabor ONE Fiber Track Baller',version:'2026-11-18',crafts:m.crafts.length,operations:m.crafts.reduce((n,x)=>n+(x.steps?.length??x.operations?.length??0),0),input:['quaternion trackball','two-finger pinch','directional swipe','long-press anchor'],eventLedger:'client-side export',simulation:'instructional not mechanically certified',repository:'NathanAIoxr/Nathan-AI-Sovereign-Core'});}
  return json({error:'not_found',path:u.pathname},404);
 },
 async scheduled(_event,_env,_ctx) {const m=JSON.parse(MANIFEST);const count=m.crafts?.length??0;const ok=count===12&&m.schema==='tabor.one.fiber.touch.v1';console.log(JSON.stringify({kind:'fiber_manifest_integrity',ok,crafts:count,checkedAt:new Date().toISOString()}));}
};
`;
await mkdir(path.join(root,'dist'),{recursive:true});
await writeFile(path.join(root,'dist','worker.mjs'),source,'utf8');
console.log('Built dist/worker.mjs (' + source.length + ' bytes); crafts: ' + parsed.crafts.length);
