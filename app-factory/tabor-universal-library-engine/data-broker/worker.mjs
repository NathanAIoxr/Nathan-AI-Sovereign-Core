import { databases, collections } from "./connections.mjs";
const responseHeaders={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const ttl=300000;
let cached=null, inflight=null;
const json=(method,value,status=200)=>new Response(method==="HEAD"?null:JSON.stringify(value),{status,headers:responseHeaders});
async function testDatabase(db,env){
  const handle=env[db.binding];
  if(!handle)return "unbound";
  try{
    const row=await handle.prepare("SELECT 1 AS ready").first();
    return row?.ready===1?"ready":"unavailable";
  }catch{return "unavailable";}
}
async function checkConnections(env){
  const results=[];
  for(let offset=0;offset<databases.length;offset+=5)
    results.push(...await Promise.all(databases.slice(offset,offset+5).map(db=>testDatabase(db,env))));
  return {
    schema:"tabor-accords.library-connections.v1",
    checkedAt:new Date().toISOString(),
    totals:{discovered:databases.length,bound:results.filter(x=>x!=="unbound").length,ready:results.filter(x=>x==="ready").length},
    published:databases.flatMap((db,i)=>db.label?[{title:db.label,state:results[i]}]:[]),
    restricted:databases.filter(db=>!db.label).length,
    providers:[
      {title:"GitHub",state:"Repository sources linked"},
      {title:"Airtable",state:"D1 snapshots connected"},
      {title:"Notion",state:"D1 snapshot connected"},
      {title:"Gmail and other provider APIs",state:"Live credentials pending"}
    ]
  };
}
async function status(env){
  if(cached&&cached.expires>Date.now())return cached.value;
  inflight??=checkConnections(env).then(value=>{
    cached={value,expires:Date.now()+ttl};return value;
  }).finally(()=>{inflight=null;});
  return inflight;
}
async function readCollection(id,env){
  const collection=collections[id];
  if(!collection||!env[collection.binding])return null;
  const data=await env[collection.binding].prepare(collection.sql).all();
  return {title:collection.title,rows:data.results.map(({id,title,category})=>({id,title,category}))};
}

export default {
  async fetch(request,env){
    const u=new URL(request.url),method=request.method;
    if(u.hostname!=="library-data.internal"||u.search)return json(method,{error:"Unknown route"},404);
    if(method!=="GET"&&method!=="HEAD")return json(method,{error:"Read-only endpoint"},405);
    if(u.pathname==="/connections")return json(method,method==="HEAD"?null:await status(env));
    const match=/^\/collections\/(worlds|cosmic)$/.exec(u.pathname);
    if(!match)return json(method,{error:"Unknown route"},404);
    if(method==="HEAD")return json(method,null);
    try{
      const data=await readCollection(match[1],env);
      return data?json(method,data):json(method,{error:"Collection unavailable"},503);
    }catch{return json(method,{error:"Collection unavailable"},503);}
  }
};
