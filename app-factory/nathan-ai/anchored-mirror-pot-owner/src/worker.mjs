// Mountable Cloudflare Worker handler. Separate project records; no payment or wallet permissions.
import {assessCycle} from './engine.mjs';
const allowed=new Set(['device-first-voice-box','sovereign-coins','tabor-bank-of-69','sovereign-conductor-bridge']);
export async function potOwnerFetch(request,env){
 const url=new URL(request.url);
 if(request.method!=='GET')return Response.json({error:'read-only'},{status:405});
 if(url.pathname==='/api/nathan/pots/health')return Response.json({service:'anchored-mirror-pot-owner',mode:'HOLD',databaseBound:Boolean(env.POT_DB)});
 if(url.pathname!=='/api/nathan/pots')return Response.json({error:'not found'},{status:404});
 if(!env.POT_DB)return Response.json({error:'POT_DB not bound'},{status:503});
 const project=url.searchParams.get('project');
 if(project&&!allowed.has(project))return Response.json({error:'invalid project'},{status:400});
 const sql=project?'SELECT pot_id,independent_project,model,mode,verification_status FROM nathan_anchored_mirror_pots WHERE independent_project=? ORDER BY pot_id':'SELECT pot_id,independent_project,model,mode,verification_status FROM nathan_anchored_mirror_pots ORDER BY pot_id';
 const result=project?await env.POT_DB.prepare(sql).bind(project).all():await env.POT_DB.prepare(sql).all();
 return Response.json({pots:result.results,example:assessCycle({grossReceipts:0,maxLoss:0}),mode:'HOLD'},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
