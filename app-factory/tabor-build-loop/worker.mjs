import { DurableObject } from "cloudflare:workers";
import { consoleCode, consolePage } from "./console.mjs";
import { authenticate, challenge, oauth } from "./oauth.mjs";
import { enqueue, getJob, nextWake, readText, reply, resumePublish, runOne, stats } from "./queue.mjs";

const protocol = "2025-06-18";
const toolDefinitions = [
  { name:"queue_build",description:"Queue a JavaScript module draft in the owner’s Tabor build queue. GitHub publishing is opt-in and limited to its dedicated draft branch.",
    inputSchema:{type:"object",properties:{prompt:{type:"string",maxLength:4000},kind:{type:"string",enum:["module","probe"]},
      idempotency_key:{type:"string",maxLength:100},publish:{type:"boolean"}},required:["prompt"],additionalProperties:false},
    annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:true} },
  { name:"publish_build",description:"Requeue an existing generated module for delivery to the dedicated draft branch after GitHub credentials are configured.",
    inputSchema:{type:"object",properties:{id:{type:"string"}},required:["id"],additionalProperties:false},
    annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:true} },
  { name:"build_status",description:"Read the state, provider, hash, and optional code for one build job.",inputSchema:{type:"object",
    properties:{id:{type:"string"},include_code:{type:"boolean"}},required:["id"],additionalProperties:false},annotations:{readOnlyHint:true} },
  { name:"build_queue_status",description:"Read aggregate job counts and last Cron and alarm timestamps.",inputSchema:{type:"object",properties:{},additionalProperties:false},
    annotations:{readOnlyHint:true} },
];

const scheduler = env => env.DISPATCHER.getByName("tabor-build-queue");

export class BuildDispatcher extends DurableObject {
  async wake() {
    const existing = await this.ctx.storage.getAlarm();
    if (existing === null || existing > Date.now()+1000) await this.ctx.storage.setAlarm(Date.now()+350);
  }
  async alarm() {
    await this.env.DB.prepare("UPDATE build_clock SET last_alarm_at=? WHERE singleton=1").bind(Date.now()).run();
    await runOne(this.env);
    const next = await nextWake(this.env);
    if (typeof next === "number") await this.ctx.storage.setAlarm(Math.max(next,Date.now()+350));
  }
}

async function mcp(request, env, ctx, origin) {
  if (!await authenticate(request,env)) return challenge(origin);
  if (request.method !== "POST") return new Response(null,{status:405,headers:{allow:"POST"}});
  try {
    const message = JSON.parse(await readText(request,16000));
    if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
      return reply({jsonrpc:"2.0",id:null,error:{code:-32600,message:"Invalid request"}},400);
    }
    const id = message.id;
    if (id === undefined) return new Response(null,{status:202});
    const respond = result => reply({jsonrpc:"2.0",id,result},200,{"mcp-protocol-version":protocol});
    if (message.method === "initialize") return respond({
      protocolVersion:["2025-03-26","2025-06-18","2025-11-25"].includes(message.params?.protocolVersion) ? message.params.protocolVersion : protocol,
      capabilities:{tools:{}},serverInfo:{name:"tabor-build-loop",version:"1.0.0"},
    });
    if (message.method === "ping") return respond({});
    if (message.method === "tools/list") return respond({tools:toolDefinitions});
    if (message.method !== "tools/call") return reply({jsonrpc:"2.0",id,error:{code:-32601,message:"Method not found"}});
    try {
      const {name,arguments:args = {}} = message.params ?? {};
      let result;
      if (name === "queue_build") {
        result = await enqueue(env,args);
        ctx.waitUntil(scheduler(env).wake());
      } else if (name === "publish_build") {
        result = await resumePublish(env,args.id);
        if (result.status === "pending") ctx.waitUntil(scheduler(env).wake());
      } else if (name === "build_status") result = await getJob(env,args.id,args.include_code === true);
      else if (name === "build_queue_status") result = await stats(env);
      else throw new RangeError("Unknown tool");
      if (result === null) throw new RangeError("Build job not found");
      return respond({content:[{type:"text",text:JSON.stringify(result)}],structuredContent:result});
    } catch (error) {
      return respond({content:[{type:"text",text:error instanceof RangeError ? error.message : "Build tool failed"}],isError:true});
    }
  } catch {
    return reply({jsonrpc:"2.0",id:null,error:{code:-32700,message:"Invalid or oversized JSON"}},400);
  }
}

export default {
  async fetch(request, env, ctx) {
    const { pathname,origin } = new URL(request.url);
    if (pathname === "/mcp") return mcp(request,env,ctx,origin);
    if (request.method === "GET" && ["/console","/console/","/console.mjs"].includes(pathname)) {
      const js = pathname.endsWith(".mjs");
      return new Response(js ? consoleCode : consolePage,{headers:{
        "content-type":js ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8",
        "cache-control":"no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff",
        "content-security-policy":"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
      }});
    }
    if (pathname === "/health" && request.method === "GET") return reply({service:"tabor-build-loop",
      repository:env.GITHUB_REPOSITORY, model:env.OPENAI_API_KEY ? "OpenAI" : env.AI ? "Workers AI" : "deterministic",
      github_configured:Boolean(env.GITHUB_TOKEN), ...await stats(env)});
    if (pathname === "/" && request.method === "GET") return reply({service:"Tabor Build Loop",mcp:origin+"/mcp",health:origin+"/health",console:origin+"/console/"});
    try { return await oauth(request,env) || reply({error:"not_found"},404); }
    catch { return reply({error:"invalid_request"},400); }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      await env.DB.prepare("UPDATE build_clock SET last_cron_at=? WHERE singleton=1").bind(event.scheduledTime).run();
      await scheduler(env).wake();
    })());
  },
};
