// Read-only API module to mount under an authorized existing Worker route.
// No new Cloudflare Worker script or DNS zone required.
import {base12} from './index.mjs';
const digits='0123456789XE';
export async function classificationFetch(request,env){
 const url=new URL(request.url);
 if(request.method!=='GET')return new Response('Method Not Allowed',{status:405});
 if(url.pathname==='/api/nathan/classification/health')return Response.json({service:'nathan-classification',mode:'HOLD',ready:Boolean(env.CATALOG_DB)});
 if(url.pathname!=='/api/nathan/classification/coins')return new Response('Not Found',{status:404});
 if(!env.CATALOG_DB)return Response.json({error:'D1 binding missing'},{status:503});
 const project=url.searchParams.get('project');
 const valid=['tabor-bank-of-69','sovereign-coins','external-network-research'];
 if(project&&!valid.includes(project))return Response.json({error:'invalid project'},{status:400});
 const limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit')??50)||50));
 const query=project?'SELECT project_id,item_key,position,duodecimal,dewey_code,ticker,identity_status,mode FROM nathan_coin_classification_overlay WHERE project_id=? ORDER BY position LIMIT ?':'SELECT project_id,item_key,position,duodecimal,dewey_code,ticker,identity_status,mode FROM nathan_coin_classification_overlay ORDER BY project_id,position LIMIT ?';
 const result=project?await env.CATALOG_DB.prepare(query).bind(project,limit).all():await env.CATALOG_DB.prepare(query).bind(limit).all();
 return Response.json({project:project??'all',records:result.results,mode:'HOLD'},{headers:{'Cache-Control':'private, max-age=30','X-Content-Type-Options':'nosniff'}});
}
