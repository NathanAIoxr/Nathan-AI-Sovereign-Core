export class AgentState {
 private state:DurableObjectState;
 constructor(state:DurableObjectState){this.state=state}
 async fetch(request:Request):Promise<Response>{
  const url=new URL(request.url);const id=url.searchParams.get("id");
  if(!id||id.length>128||!/^[a-zA-Z0-9_-]+$/.test(id))return Response.json({error:"invalid_id"},{status:400});
  if(request.method==="GET"){const value=await this.state.storage.get("agent:"+id);return Response.json({id,value:value??null})}
  if(request.method==="PUT"){const body=await request.text();if(body.length>8192)return Response.json({error:"too_large"},{status:413});await this.state.storage.put("agent:"+id,body);return Response.json({id,stored:true})}
  return Response.json({error:"method_not_allowed"},{status:405})
 }
}
