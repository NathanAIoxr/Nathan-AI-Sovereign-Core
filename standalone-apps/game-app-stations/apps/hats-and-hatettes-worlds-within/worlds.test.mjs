import {test} from 'node:test'
import assert from 'node:assert/strict'
import {chapterTitles,realms,hats,newGame,readGame,readCreation,frequency,inspect,chooseHat,stackName,chapterAccess} from './world.mjs'
import {chapters} from './chronicles.mjs'
import worker from './worker.mjs'
import {expeditions,expeditionGroups,evidenceLabels} from './expedition-data.mjs'
import {variantCount,makePair,stageFor,showInscription,restorePair,countPairs,hasPair,foldText} from './expedition.mjs'
import {styles} from './headwear.mjs'
import {metRecords,metSnapshot} from './met-headwear.mjs'

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

test('all expedition tiles have one stable pair per variant and source notes are explicit',()=>{
  assert.deepEqual(Object.keys(expeditionGroups),['water','cave','tree','myth'])
  assert.equal(expeditions.length,34)
  const pairs=expeditions.flatMap(realm=>{
    assert.equal(realm.motifs.length,4)
    assert.ok(evidenceLabels[realm.evidence])
    if(realm.evidence!=='fiction') assert.equal(new URL(realm.source).protocol,'https:')
    return Array.from({length:variantCount},(_,index)=>{
      const pair=makePair(realm,index)
      assert.deepEqual(makePair(realm,index),pair)
      assert.notEqual(pair.hat,pair.hatette)
      for(let step=0;step<3;step++){
        const gate=stageFor(realm,index,step)
        assert.ok(['pi','phi'].includes(gate.mode))
        assert.ok(['az','za'].includes(gate.order))
        assert.equal(showInscription(showInscription(gate.word,'za'),'za'),gate.word)
      }
      return pair
    })
  })
  assert.equal(pairs.length,4352)
  assert.equal(new Set(pairs.map(pair=>pair.id)).size,pairs.length)
  assert.equal(makePair(expeditions[0],-1),null)
  assert.equal(makePair(expeditions[0],variantCount),null)
})

test('expedition progress round-trips with old journey saves and fits all pairs',()=>{
  assert.deepEqual(readGame({edition:1}).expeditions,{})
  let progress={}
  const realm=expeditions[0]
  progress=restorePair(progress,realm,0)
  progress=restorePair(progress,realm,127)
  assert.equal(countPairs(progress),2)
  assert.equal(countPairs(restorePair(progress,realm,127)),2)
  assert.equal(hasPair(progress,realm.id,0),true)
  assert.equal(hasPair(progress,realm.id,126),false)
  assert.equal(hasPair(progress,realm.id,127),true)
  assert.deepEqual(readGame({edition:1,expeditions:{...progress,unknown:'0'.repeat(32)}}).expeditions,progress)
  const full=Object.fromEntries(expeditions.map(item=>[item.id,'f'.repeat(32)]))
  assert.equal(countPairs(full),4352)
  assert.ok(JSON.stringify(full).length<2000)
})

test('Wardrobe vocab and museum object data have stable identities',()=>{
  assert.equal(new Set(styles.map(style=>style.name)).size,styles.length)
  assert.ok(styles.some(style=>style.name==='Jingasa'))
  assert.equal(new Set(metRecords.map(row=>row[0])).size,metRecords.length)
  assert.ok(metRecords.some(row=>row[0]===24080&&foldText(row.join(' ')).includes('jingasa')))
  assert.match(metSnapshot,/^[a-f0-9]{64}$/)
})

test('Worker exposes expedition and filtered catalog data with bounded query arguments',async()=>{
  let queries=[]
  const binding={
    prepare(sql){return {bind(...args){queries.push({sql,args});return {sql,args}}}},
    async batch(){return [{results:[{total:1}]},{results:[{id:'doggerland-00'}]}]},
  }
  const fetch=(path,env={CATALOG:binding})=>worker.fetch(new Request('https://example.test'+path),env)
  assert.equal((await (await fetch('/api/expeditions')).json()).expeditions.length,34)
  const result=await (await fetch('/api/catalog?kind=pairs&q=doggerland&limit=1000&offset=-4')).json()
  assert.equal(result.total,1)
  assert.deepEqual(queries[1].args,['doggerland',100,0])
  assert.match(queries[1].sql,/FROM pair/)
  assert.equal((await fetch('/api/catalog?kind=secrets')).status,400)
  assert.equal((await fetch('/api/catalog',{})).status,503)
})
