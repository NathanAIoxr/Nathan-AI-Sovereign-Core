import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'
import { roster } from './tools.mjs'

const subdomain=process.argv[2]??'nathantaboract.workers.dev'
if(!/^[a-z0-9-]+\.workers\.dev$/i.test(subdomain))throw new Error('Expected a workers.dev account subdomain')

async function request(url,input){
  for(let attempt=1;;attempt++){
    try{
      const response=await fetch(url,{
        signal:AbortSignal.timeout(14000),
        ...(input?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)}:{})
      })
      if(!response.ok)throw new Error('HTTP '+response.status)
      return response.json()
    }catch(error){
      if(attempt===3)throw error
      await setTimeout(600*attempt)
    }
  }
}

const base='https://tabor-nathan-mind-fleet-registry.'+subdomain
const health=await request(base+'/health')
const registry=await request(base+'/fleet')
assert.equal(health.workers,101)
assert.equal(health.bots,101)
assert.equal(registry.entries.length,101)
const checks=[]
for(let offset=0;offset<roster.length;offset+=10){
  const batch=await Promise.all(roster.slice(offset,offset+10).map(async entry=>{
    const host='https://tabor-nathan-mind-'+entry.worker.toLowerCase()+'.'+subdomain
    try{
      const [worker,bot]=await Promise.all([request(host+'/',entry.input),request(host+'/bot/'+entry.n,entry.input)])
      assert.equal(worker.id,entry.worker)
      assert.equal(bot.id,entry.bot)
      assert.equal(worker.build,health.build)
      assert.equal(bot.build,health.build)
      assert.deepEqual(bot.result,worker.result)
      assert.ok(Object.keys(bot.review).length)
      return {worker:entry.worker,bot:entry.bot,ok:true}
    }catch(error){
      return {worker:entry.worker,bot:entry.bot,ok:false,error:error.message,cause:error.cause?.message}
    }
  }))
  checks.push(...batch)
}
const failed=checks.filter(check=>!check.ok)
console.log(JSON.stringify({build:health.build,verifiedWorkers:checks.length-failed.length,verifiedBots:checks.length-failed.length,failed},null,2))
if(failed.length)process.exitCode=1
