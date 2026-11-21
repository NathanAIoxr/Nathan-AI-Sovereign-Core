const PUBLIC_COLUMNS = "id,tier,domain,item_a_label,item_b_label,item_c_label,clue_prompt";
const ALL_COLUMNS = PUBLIC_COLUMNS + ",core_parts,operations,traits_attributes,scale_medium,input_output,flow_direction,modification_exemption,blind_spot_note";
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const headers = {"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"*"};
  if (request.method === "OPTIONS") return new Response(null,{status:204,headers:{...headers,"Access-Control-Allow-Methods":"GET,OPTIONS"}});
  if (request.method !== "GET" || url.pathname !== "/api/lessons") return Response.json({error:"Not found"},{status:404,headers});
  if (!env.DB) return Response.json({error:"Database binding unavailable"},{status:503,headers});
  const investigative = url.searchParams.get("investigative") === "true";
  const tier = url.searchParams.get("tier");
  if (tier && !["Tier 1: Kids","Tier 2: Youth","Tier 3: Adults"].includes(tier)) return Response.json({error:"Invalid tier"},{status:400,headers});
  const columns = investigative ? PUBLIC_COLUMNS : ALL_COLUMNS;
  const sql = "SELECT " + columns + " FROM blueprint_lessons" + (tier ? " WHERE tier = ?" : "") + " ORDER BY id";
  try {
   const statement = env.DB.prepare(sql);
   const result = tier ? await statement.bind(tier).all() : await statement.all();
   return Response.json({mode:investigative?"investigative":"instant",count:result.results.length,lessons:result.results},{headers});
  } catch(e) { return Response.json({error:"Database query failed"},{status:500,headers}); }
 }
};