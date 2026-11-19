import {test} from 'node:test'
import assert from 'node:assert/strict'
import {chapterTitles,realms,hats,newGame,readGame,readCreation,frequency,inspect,chooseHat,stackName,chapterAccess} from './world.mjs'
import {chapters} from './chronicles.mjs'
import worker from './worker.mjs'

test('seven coordinates use unique keys and only the matching dials open the gate',()=>{
  assert.equal(new Set(realms.map(realm=>realm.id)).size,7)
  for(const realm of realms){
    assert.equal(inspect(realm,realm.mode,realm.order).open,true)
    assert.equal(inspect(realm,realm.mode==='pi'?'phi':'pi',realm.order).open,false)
    assert.equal(inspect(realm,realm.mode,realm.order==='az'?'za':'az').open,false)
    assert.equal(inspect(realm,'pi','za').shown,[...realm.glyph].reverse().join(''))
  }
})

test('frequency is stable and imported state is bounded',()=>{
  assert.deepEqual(frequency('trace:1:2'),frequency('trace:1:2'))
  assert.notEqual(frequency('trace:1:2').signature,frequency('trace:1:3').signature)
  assert.deepEqual(readGame({edition:0}),newGame())
  const game=readGame({edition:1,seed:'bad/seed',walked:-1,visited:['outside','here','here'],found:['above','below','unknown'],stack:['above','above','unknown'],creations:[null,{name:'North',word:'gate',mode:'pi',order:'za'}]})
  assert.deepEqual(game.visited,['middle','here'])
  assert.deepEqual(game.found,['above','below'])
  assert.deepEqual(game.stack,['above'])
  assert.equal(game.walked,0)
  assert.equal(game.seed,'')
  assert.deepEqual(game.creations,[{name:'North',word:'GATE',mode:'pi',order:'za'}])
  assert.equal(readCreation({name:'North',word:'<tag>',mode:'pi',order:'za'}),null)
})

test('brims must be found before stacking and full stack stops at three',()=>{
  const game={...newGame(),found:['above','below','silt-weave','over-there'],stack:['above','below','silt-weave']}
  assert.equal(stackName(game.stack),'Aurora over Doggerland')
  assert.equal(chooseHat(game,'over-there'),game.stack)
  assert.equal(chooseHat(game,'nowhere'),game.stack)
  assert.deepEqual(chooseHat(game,'below'),['above','silt-weave'])
})

test('thirteen keys and the final chapter follow the shared journey',()=>{
  assert.equal(chapterTitles.length,13)
  assert.equal(new Set(chapters.map(chapter=>chapter.key)).size,13)
  assert.equal(chapterAccess(newGame()).filter(Boolean).length,0)
  const complete={...newGame(),seed:'first',found:hats.map(hat=>hat.id),stack:['here','there','above'],visited:realms.map(realm=>realm.id),rescued:true,creations:[{name:'North',word:'GATE',mode:'pi',order:'za'}]}
  assert.equal(chapterAccess(complete).filter(Boolean).length,13)
  assert.equal(chapterAccess({...complete,rescued:false}).at(-1),false)
  assert.equal(chapterAccess({...complete,creations:[]}).at(-1),false)
})

test('Worker only serves declared resources and its health requires the browser build',async()=>{
  const object={body:'game',size:4,httpEtag:'"v1"'}
  const env={STATIONS:{head:async()=>object,get:async()=>object}}
  const run=(path,options,binding=env)=>worker.fetch(new Request('https://example.test'+path,options),binding)
  const root=await run('/')
  assert.equal(await root.text(),'game')
  assert.equal(root.headers.get('Content-Type'),'text/html; charset=utf-8')
  assert.equal((await run('/',{headers:{'If-None-Match':'"v1"'}})).status,304)
  assert.equal(await (await run('/',{method:'HEAD'})).text(),'')
  assert.equal((await run('/worker.mjs')).status,404)
  assert.equal((await run('/',{method:'POST'})).status,405)
  assert.equal((await (await run('/api/atlas')).json()).chapters.length,13)
  assert.equal((await (await run('/api/health')).json()).coordinates,7)
  assert.equal((await run('/api/health',undefined,{STATIONS:{head:async()=>null}})).status,503)
})
