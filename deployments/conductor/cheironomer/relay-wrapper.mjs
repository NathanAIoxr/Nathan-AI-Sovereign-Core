import legacy from "./tweezer-tap-os/src/relay.mjs";

const base="https://cheironomer.internal/tabor-sites/conductor/cheironomer";
const bus="nathan-ai-cheironomer-events";
const target=env=>env.CHEIR_ZONES.get("nathan-ai-conductor");

export default {
  async fetch(request,env,ctx) {
    const domain=new URL(request.url).hostname;
    if (domain.endsWith(".workers.dev")) return legacy.fetch(request,env,ctx);
    const holding=()=>new Response("Nathan AI · HOLDING",{status:503,headers:{"Cache-Control":"no-store","Retry-After":"60","Content-Type":"text/plain; charset=utf-8"}});
    if(await env.CHEIR_HOLDING.get("ZONE_STATUS:"+domain)!=="LIVE")return holding();
    const check=await target(env).fetch(base+"/internal/dns-gate?domain="+encodeURIComponent(domain),
      {headers:{Authorization:"Bearer "+env.CHEIR_RELAY_KEY}});
    if(!check.ok||!(await check.json()).live)return holding();
    return fetch(request);
  },
  async scheduled(event,env) {
    const [old,health]=await Promise.allSettled([
      legacy.scheduled(event,env),
      target(env).fetch(base+"/health")
    ]);
    if(old.status==="rejected")throw old.reason;
    if(health.status==="rejected"||!health.value.ok)throw Error("Cheironomer TIME wake failed");
  },
  async queue(batch,env) {
    if(batch.queue!==bus)return legacy.queue(batch,env);
    if(!env.CHEIR_RELAY_KEY)throw Error("Cheironomer relay key not configured");
    const result=await target(env).fetch(base+"/internal/emit",{
      method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+env.CHEIR_RELAY_KEY},
      body:JSON.stringify({messages:batch.messages.map(message=>message.body)})
    });
    if(!result.ok)throw Error("Cheironomer EMIT relay failed");
    const accepted=new Set((await result.json()).ack);
    for(const [i,message] of batch.messages.entries()){
      if(accepted.has(i))message.ack();
      else message.retry({delaySeconds:60});
    }
  }
};
