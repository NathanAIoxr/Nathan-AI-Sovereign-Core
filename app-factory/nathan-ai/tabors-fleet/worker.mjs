import { items, roster, domains } from './tools.mjs'
import { page, browserScript, css } from './ui.mjs'

const build = 'nathan-mind-fleet-1.0.2'
const legacyDomains = ['language','logic','archive','research','creative','physics','devices','engineering','operations','sovereignty']
const legacyRoles = ['Research Scout','Source Collector','Citation Verifier','Fact Checker','Contradiction Auditor','Schema Architect','Code Builder','Unit Test Runner','Security Reviewer','Release Reviewer']
const suffix = '.nathantaboract.workers.dev'
const scriptName = n => `tabor-nathan-mind-${roster[n-1].worker.toLowerCase()}`
const memberUrl = n => `https://${scriptName(n)}${suffix}`
const activeRoster = roster.map(e=>({...e, workerUrl:memberUrl(e.n), botUrl:`${memberUrl(e.n)}/bot/${e.n}`}))
const meta = {name:'Nathan Mind Fleet',credit:'By Nathan Tabor and Nathan AI',workers:roster.length,bots:roster.length,mode:'on_demand',bots_running:false}
const headers = {
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'permissions-policy':'microphone=(self), camera=(), geolocation=()',
  'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; media-src blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
}
const json = (body,status=200) => Response.json(body,{status,headers})
const asset = (body,type) => new Response(body,{headers:{...headers,'content-type':type}})
const error = (code,message,status) => json({error:code,message},status)
const domainId = n=>n===101?'orchestration':legacyDomains[Math.floor((n-1)/10)]
const profile = (n,kind) => {
  const entry=activeRoster[n-1]
  return {...entry,id:kind==='worker'?entry.worker:entry.bot,domain:domainId(n),group:entry.domain,status:'callable',role:kind==='bot'?entry.botName:null}
}

async function readBody(request){
  const type=(request.headers.get('content-type')??'').split(';')[0].trim().toLowerCase()
  if(type!=='application/json') return {error:error('content_type','Use application/json',415)}
  if(!request.body)return {error:error('invalid_json','Send a JSON object',400)}
  const reader=request.body.getReader(), decoder=new TextDecoder('utf-8',{fatal:true})
  let size=0, text=''
  try{
    while(true){
      const {value,done}=await reader.read()
      if(done)break
      size+=value.byteLength
      if(size>65536){await reader.cancel();return {error:error('too_large','Request body limit is 64 KiB',413)}}
      text+=decoder.decode(value,{stream:true})
    }
    const input=JSON.parse(text+decoder.decode())
    if(!input||typeof input!=='object'||Array.isArray(input)) throw new TypeError()
    return {input}
  }catch{
    await reader.cancel().catch(()=>{})
    return {error:error('invalid_json','Send a valid UTF-8 JSON object',400)}
  }
}

async function execute(kind,n,input){
  const tool=items[n-1], entry=roster[n-1]
  const result=await tool.run(input)
  const response={id:kind==='worker'?entry.worker:entry.bot,worker:entry.worker,build,result}
  if(kind==='bot')response.review=await tool.review(result,input)
  return response
}

async function runBatch(input){
  if(!Array.isArray(input.jobs)||!input.jobs.length||input.jobs.length>12)throw new RangeError('Provide 1 to 12 jobs')
  const results=[]
  for(const [index,job] of input.jobs.entries()){
    const match=/^NT([WB])-(\d{3})$/.exec(job?.id)
    const n=Number(match?.[2]), data=job?.input
    if(!(n>=1&&n<=100)||!data||typeof data!=='object'||Array.isArray(data)){
      results.push({index,ok:false,error:'Use an NTW or NTB ID from 001 through 100 and a JSON input object'})
      continue
    }
    try{
      results.push({index,ok:true,...await execute(match[1]==='W'?'worker':'bot',n,data)})
    }catch(e){
      results.push({index,ok:false,error:e instanceof TypeError||e instanceof RangeError?e.message:'Job failed'})
    }
  }
  return {id:'NTB-101',build,results,successful:results.filter(r=>r.ok).length}
}

export default {
  async fetch(request,env={}){
    const {pathname:path}=new URL(request.url)
    const member=Number(env.FLEET_MEMBER??0)
    const get=request.method==='GET'||request.method==='HEAD'
    const post=request.method==='POST'
    if(get&&path==='/health')return json(member?{ok:true,build,worker:roster[member-1].worker,bot:roster[member-1].bot}:{ok:true,...meta,build})
    if(get&&!member){
      if(path==='/fleet')return json({...meta,build,domains:legacyDomains,roles:legacyRoles,groups:domains,entries:activeRoster})
      if(path==='/policy')return json({external_writes:false,autonomous_replication:false,approval_before_deploy:true,execution:'on_demand',vault:'browser_local',personal_data_seeded:false})
      if(path==='/app.js')return asset(browserScript,'text/javascript; charset=utf-8')
      if(path==='/app.css')return asset(css,'text/css; charset=utf-8')
      if(path==='/'||path==='/vault')return asset(page(path==='/vault'),'text/html; charset=utf-8')
    }
    const match=/^\/(worker|bot)\/(\d{1,3})$/.exec(path)
    const n=path==='/'&&member?member:Number(match?.[2]??0)
    const kind=match?.[1]??'worker'
    const batch=(!member||member===101)&&path==='/batch'
    if(!batch&&(!(n>=1&&n<=roster.length)||(member&&n!==member)))return error('not_found','Fleet route does not exist',404)
    if(get&&!batch)return json(profile(n,kind))
    if(!post)return error('method','Use POST with a JSON body',405)
    const body=await readBody(request)
    if(body.error)return body.error
    try{
      return json(batch?await runBatch(body.input):await execute(kind,n,body.input))
    }catch(e){
      return e instanceof TypeError||e instanceof RangeError
        ?error('invalid_input',e.message,422):error('execution_failed','Tool execution failed',500)
    }
  }
}
