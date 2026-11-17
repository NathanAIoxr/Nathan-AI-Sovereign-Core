const gameOrigin='https://grapple-it.nathantaboract.workers.dev';
const checks=[
 {id:'launch',path:'/',kind:'html',required:['Grapple It by Nathan Tabor','gear-view','arcade-view','daily-form']},
 {id:'daily',path:'/api/daily',kind:'daily'},
 {id:'offline',path:'/sw.js',kind:'javascript',required:['frame-loop.mjs','precision-bridge.mjs','cache.match']},
 {id:'mobile-runtime',path:'/frame-loop.mjs',kind:'javascript',required:['export function createFrameLoop']},
];
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const cutoff=7*24*60*60*1000;
function validate(check, response, text) {
 if(response.status!==200)return 'HTTP '+response.status;
 const type=response.headers.get('Content-Type')??'';
 if(check.kind==='daily'){
  if(!type.includes('application/json'))return 'Unexpected API content type';
  const value=JSON.parse(text);
  return /^\d{4}-\d{2}-\d{2}$/.test(value?.day)&&Array.isArray(value?.scores)&&value.scores.length<=20 ? null : 'Invalid leaderboard payload';
 }
 if(!type.includes(check.kind))return 'Unexpected content type';
 const missing=check.required.find(marker=>!text.includes(marker));
 return missing?'Missing '+missing:null;
}
async function runCheck(game, check) {
 const start=Date.now();
 let detail;
 try {
  const response=await game.fetch(new Request(gameOrigin+check.path,{signal:AbortSignal.timeout(10000)}));
  detail=validate(check,response,await response.text());
 } catch {
  detail='The live route did not return a usable response';
 }
 return {bee:check.id,route:check.path,status:detail?'fail':'pass',detail,ms:Date.now()-start};
}
export async function runBees(env,checkedAt) {
 const result=await Promise.all(checks.map(check=>runCheck(env.GAME,check)));
 const status=result.every(item=>item.status==='pass')?'pass':'fail';
 const receipt={checkedAt:new Date(checkedAt).toISOString(),status,checks:result};
 await env.DB.batch([
  env.DB.prepare('INSERT OR IGNORE INTO grapple_bee_runs (checked_at,status,results) VALUES (?,?,?)').bind(checkedAt,status,JSON.stringify(result)),
  env.DB.prepare('DELETE FROM grapple_bee_runs WHERE checked_at < ?').bind(checkedAt-cutoff),
 ]);
 console.log(JSON.stringify(receipt));
 return receipt;
}
export default {
 async scheduled(controller,env){await runBees(env,controller.scheduledTime);},
 async fetch(request,env) {
  const path=new URL(request.url).pathname;
  if(request.method!=='GET')return json({error:'Use GET.'},405);
  if(path!=='/'&&path!=='/status')return json({error:'Page not found.'},404);
  try {
   const row=await env.DB.prepare('SELECT checked_at,status,results FROM grapple_bee_runs ORDER BY checked_at DESC LIMIT 1').first();
   if(!row)return json({status:'waiting',message:'Awaiting the first scheduled Grapple It check.'});
   const stale=Date.now()-row.checked_at>13*60*1000;
   return json({status:stale?'stale':row.status,checkedAt:new Date(row.checked_at).toISOString(),checks:JSON.parse(row.results)},stale||row.status==='fail'?503:200);
  }catch{return json({status:'unavailable'},503);}
 },
};
