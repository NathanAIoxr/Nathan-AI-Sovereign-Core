import {quantum,chip,shard,runChecks,DIVISIONS} from './science.mjs';
import {page,ui} from './web.mjs';
import {homeStatus, homePulse, ownChecks} from './home-core.mjs';
import {home, systems, workers, styles, browser} from './home-web.mjs';
import * as mind from './mind-game.mjs';
import * as hounds from './hounds-game.mjs';
import * as labs from './labs-game.mjs';

const PAGE_HEADERS={"Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"};
const INTERVAL=15*60*1000;
const body=(data,type,status=200,cache="no-store")=>new Response(data,{status,headers:{...PAGE_HEADERS,"Content-Type":type,"Cache-Control":cache}});
const json=(value,status=200,cache)=>body(JSON.stringify(value),"application/json; charset=utf-8",status,cache);
const cached="public, max-age=300";
const games=new Map([['mind',mind],['hounds',hounds],['labs',labs]]);
const fixed=(params,name,original,min,max,integer=false)=>{
  if(!params.has(name))return original;
  const raw=params.get(name);
  if(!raw?.trim()||raw.length>32)return NaN;
  const val=Number(raw);
  return Number.isFinite(val)&&val>=min&&val<=max&&(!integer||Number.isInteger(val))?val:NaN;
};

async function ledger(db) {
  const [window,counts,rows]=await Promise.all([
    db.prepare("SELECT started_ms,ends_ms FROM campaign WHERE id=1").first(),
    db.prepare("SELECT source, COUNT(*) AS runs, SUM(passed) AS passed FROM receipts GROUP BY source").all(),
    db.prepare("SELECT scheduled_ms,source,passed,result FROM receipts ORDER BY scheduled_ms DESC LIMIT 10").all(),
  ]);
  return {window,active:window?Date.now()<window.ends_ms:false,counts:counts.results,
    receipts:rows.results.map(({scheduled_ms,source,passed,result})=>({scheduled_ms,source,passed:!!passed,result:JSON.parse(result)}))};
}
async function campaignRun(db,when) {
  const window=await db.prepare("SELECT started_ms,ends_ms FROM campaign WHERE id=1").first();
  if(!window||when<window.started_ms||when>=window.ends_ms)return;
  const result=runChecks();
  const slot=Math.floor(when/INTERVAL);
  await db.prepare("INSERT OR IGNORE INTO receipts(slot,scheduled_ms,source,passed,result) VALUES(?,?,'scheduled',?,?)")
    .bind(slot,when,Number(result.passed),JSON.stringify(result)).run();
  console.log(JSON.stringify({event:"scheduled_lab_check",slot,passed:result.passed,checks:result.checks.length}));
}
export default {
  async fetch(request,env){
    if(!['GET','HEAD'].includes(request.method))return json({error:"Read-only endpoint."},405);
    const url=new URL(request.url), p=url.searchParams;
    if(url.pathname==="/")return body(home,"text/html; charset=utf-8",200,cached);
    if(url.pathname==="/systems" || url.pathname==="/systems/")return body(systems,"text/html; charset=utf-8",200,cached);
    if(url.pathname==="/workers" || url.pathname==="/workers/")return body(workers,"text/html; charset=utf-8",200,cached);
    if(url.pathname==="/workbench" || url.pathname==="/workbench/")return body(page,"text/html; charset=utf-8",200,cached);
    if(url.pathname==="/home.css")return body(styles,"text/css; charset=utf-8",200,cached);
    if(url.pathname==="/home.js")return body(browser,"application/javascript; charset=utf-8",200,cached);
    if(url.pathname==="/api/home/check")return json(ownChecks());
    if(url.pathname==="/api/home/status")return json(await homeStatus(env.PUBLIC_LABS_DB));
    const gamePath=url.pathname.match(/^\/play\/(mind|hounds|labs)(\.js)?$/);
    if(gamePath){
      const game=games.get(gamePath[1]);
      return gamePath[2]?body(game.script,"application/javascript; charset=utf-8",200,cached):body(game.page,"text/html; charset=utf-8",200,cached);
    }
    if(url.pathname==="/app.js")return body(ui,"application/javascript; charset=utf-8",200,cached);
    if(url.pathname==="/api/checks")return json(runChecks());
    if(url.pathname==="/api/receipts")return json(await ledger(env.PUBLIC_LABS_DB));
    if(url.pathname==="/api/quantum"){
      const args=[fixed(p,"angle",90,0,180),fixed(p,"phase",0,-180,180),fixed(p,"seconds",1e-15,0,1e-11)];
      return args.some(Number.isNaN)?json({error:"Angle 0–180°, phase −180–180°, seconds 0–1e−11."},400):json(quantum(...args),200,cached);
    }
    if(url.pathname==="/api/chip"){
      const args=[fixed(p,"a",15,0,15,true),fixed(p,"b",15,0,15,true),fixed(p,"carry",1,0,1,true)];
      return args.some(Number.isNaN)?json({error:"A and B must be integers 0–15. Carry must be 0 or 1."},400):json(chip(...args),200,cached);
    }
    if(url.pathname==="/api/shard"){
      const n=fixed(p,"parts",8,1,8,true),i=fixed(p,"index",0,0,7,true);
      return !DIVISIONS.includes(n)||Number.isNaN(i)||i>=n?json({error:"Use 1, 2, 4 or 8 shards and a valid zero-based index."},400):json(shard(n,i),200,cached);
    }
    return json({error:"Not found."},404);
  },
  async scheduled(event,env){
    const results=await Promise.allSettled([
      campaignRun(env.PUBLIC_LABS_DB,event.scheduledTime),homePulse(env.PUBLIC_LABS_DB,event.scheduledTime),
    ]);
    for(const [i,result] of results.entries()){
      if(result.status==="rejected")console.error(JSON.stringify({event:i===0?"labs_campaign_failed":"home_pulse_failed"}));
    }
    if(results.some(r=>r.status==="rejected"))throw new Error("A scheduled Labs task failed.");
  }
};
export {campaignRun};
