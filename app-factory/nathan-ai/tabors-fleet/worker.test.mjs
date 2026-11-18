import { test } from 'node:test'
import assert from 'node:assert/strict'
import app from './worker.mjs'
import { roster } from './tools.mjs'

function get(route, env) {
  return app.fetch(new Request('https://fleet.example'+route),env)
}
function post(route, body, env) {
  return app.fetch(new Request('https://fleet.example'+route,{
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body)
  }),env)
}

test('every roster entry has a unique ID, callable Worker and distinct bot with a review',async()=>{
  assert.equal(roster.length,101)
  assert.equal(new Set(roster.map(e=>e.worker)).size,101)
  assert.equal(new Set(roster.map(e=>e.botName)).size,101)
  for(const entry of roster){
    const env={FLEET_MEMBER:String(entry.n)}
    const health=await (await get('/health',env)).json()
    assert.equal(health.worker,entry.worker)
    assert.equal(health.bot,entry.bot)
    const worker=await post('/',entry.input,env)
    assert.equal(worker.status,200,entry.name)
    const bot=await post('/bot/'+entry.n,entry.input,env)
    assert.equal(bot.status,200,entry.botName)
    const result=await worker.json(),review=await bot.json()
    assert.equal(result.id,entry.worker)
    assert.equal(review.id,entry.bot)
    assert.deepEqual(result.result,review.result)
    assert.ok(Object.keys(review.review).length,entry.botName)
    assert.equal((await get('/worker/'+(entry.n===1?2:1),env)).status,404)
  }
})

test('Unicode mirror preserves combining sequences and a family emoji',async()=>{
  const text='a\u0301👩‍👩‍👦'
  const response=await post('/bot/002',{text})
  const {result,review}=await response.json()
  assert.equal(result.mirror,'👩‍👩‍👦a\u0301')
  assert.equal(review.verified,true)
})

test('large base conversion stays exact and bad digits fail',async()=>{
  const value='900719925474099333333333333'
  const res=await (await post('/bot/14',{value,from:10,to:12})).json()
  assert.equal(res.review.verified,true)
  assert.equal((await post('/worker/14',{value:'2',from:2,to:12})).status,422)
})

test('verbatim receipt retains line endings and spaces',async()=>{
  const {result,review}=await (await post('/bot/21',{text:' A\r\n'})).json()
  assert.equal(result.bytes,4)
  assert.equal(result.verbatim_locked,true)
  assert.equal(review.verified,true)
  const {result:change}=await (await post('/worker/22',{text:' A\r\n',edited:' A\n'})).json()
  assert.equal(change.same,false)
})

test('batch returns per-job errors and caps task count',async()=>{
  const jobs=[{id:'NTB-014',input:{value:'144',from:10,to:12}},{id:'NTW-101',input:{}}]
  const result=await (await post('/batch',{jobs},{FLEET_MEMBER:'101'})).json()
  assert.equal(result.successful,1)
  assert.equal(result.results[0].result.value,'100')
  assert.equal(result.results[1].ok,false)
  assert.equal((await post('/batch',{jobs:Array(13).fill(jobs[0])})).status,422)
})

test('guards reject invalid requests',async()=>{
  assert.equal((await get('/worker/102')).status,404)
  assert.equal((await post('/worker/21',{text:'a'.repeat(65536)})).status,413)
  assert.equal((await post('/worker/21',[])).status,400)
  for(const [contentType,body,status] of [['text/plain','{}',415],['application/json','{oops',400]]){
    const response=await app.fetch(new Request('https://fleet.example/worker/21',{method:'POST',headers:{'content-type':contentType},body}))
    assert.equal(response.status,status)
  }
})

test('fleet and vault expose secure same-origin assets and the original registry routes',async()=>{
  for(const route of ['/','/vault','/fleet','/health','/policy','/worker/1','/bot/1','/app.js','/app.css']){
    const response=await get(route)
    assert.equal(response.status,200,route)
    assert.match(response.headers.get('content-security-policy'),/connect-src 'self'/)
  }
  const fleet=await (await get('/fleet')).json()
  assert.equal(fleet.workers,101)
  assert.equal(fleet.bots,101)
  assert.equal(fleet.entries.length,101)
  assert.equal((await (await get('/worker/1')).json()).domain,'language')
  assert.match(await (await get('/vault')).text(),/Voice Vault/)
})
