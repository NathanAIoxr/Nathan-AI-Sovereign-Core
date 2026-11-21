export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const headers = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  if(request.method !== "GET") return Response.json({error:"Method not allowed"},{status:405,headers});
  if(url.pathname !== "/api/activities") return Response.json({error:"Not found"},{status:404,headers});
  if(!env.DB) return Response.json({error:"D1 binding unavailable"},{status:503,headers});
  const collection = url.searchParams.get("collection");
  const sql = "SELECT id,collection,source_number,category,title,presentation_mode,materials,instructions,safety_note,age_group,simulation_id,review_status FROM glitter_activities" + (collection ? " WHERE collection = ?" : "") + " ORDER BY collection,source_number";
  try {
   const stmt = env.DB.prepare(sql);
   const result = collection ? await stmt.bind(collection).all() : await stmt.all();
   return Response.json({count:result.results.length,activities:result.results},{headers});
  } catch { return Response.json({error:"Query failed"},{status:500,headers}); }
 }
};