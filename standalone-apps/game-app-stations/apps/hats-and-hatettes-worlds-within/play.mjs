import {briefing,finale,realms,hats,mentors,pattern,chapterTitles,questions,frequency,newGame,readGame,readCreation,inspect,chooseHat,stackName,chapterAccess} from './world.mjs'
import {paint} from './landscape.mjs'
import {chapters} from './chronicles.mjs'
import {setupExpeditions} from './expedition-ui.mjs'

const $ = id => document.getElementById(id)
const key = 'worlds-within-v1'
let game = newGame()
try {game=readGame(JSON.parse(localStorage.getItem(key)))} catch {}
let realm = null
let creation = null
let blended = null
let mode = 'pi'
let order = 'az'
let mentor = 0
let rhythm = -1
let audio = null
let sound = false
let stream = null
let cameraPending = false
let selectedChapter = null
let refreshExpeditions=()=>{}

function save() {
  try {localStorage.setItem(key,JSON.stringify(game))} catch {}
}

function announce(message) {$('notice').textContent=message}
function button(label, action, style='quiet') {
  const element=document.createElement('button')
  element.type='button'
  element.className=style
  element.textContent=label
  element.addEventListener('click',action)
  return element
}

function selectRealm(entry) {
  realm=entry
  creation=null
  blended=null
  if (!game.visited.includes(entry.id)) game.visited.push(entry.id)
  update()
}

function objects() {
  const markers=$('markers')
  for (const entry of realms) {
    const control=button('',()=>selectRealm(entry),'realm')
    const dot=document.createElement('span')
    dot.className='dot'
    dot.style.setProperty('--dot',entry.color)
    const words=document.createElement('span')
    const heading=document.createElement('strong')
    heading.textContent=entry.heading
    const title=document.createElement('small')
    title.textContent=entry.name
    words.append(heading,title)
    control.append(dot,words)
    control.dataset.realm=entry.id
    $('realm-list').append(control)
    const marker=button('✧',()=>selectRealm(entry),'marker')
    marker.setAttribute('aria-label','Enter '+entry.name)
    marker.style.left=entry.x+'%'
    marker.style.top=entry.y+'%'
    marker.style.setProperty('--dot',entry.color)
    markers.append(marker)
  }
}

function renderScene() {
  const active=realm ?? creation
  $('markers').hidden=Boolean(active || blended)
  $('back').hidden=!$('markers').hidden
  $('view-label').textContent=realm?'POCKET WORLD':creation?'FORGED PORTAL':blended?'STACKED WORLD':'SEVEN COORDINATES'
  $('scene-coordinate').textContent=realm?.heading ?? (blended?'1 + 1 = 2':creation?'CROWN FORGE':'HATS & HATETTES')
  $('realm-title').textContent=active?.name ?? blended ?? 'The Grand Atlas'
  $('realm-lore').textContent=realm?.lore ?? (creation?'A traveler forged this vault. Tune the dials to read their world key.':blended==='Aurora over Doggerland'?'Walk the northern lights above a drowned Mesolithic landscape.':blended?'The pocket worlds overlap and their tones play together.':'Every brim is a doorway. Pick a coordinate to cross.')
  for (const control of $('realm-list').children) control.setAttribute('aria-current',String(control.dataset.realm===realm?.id))
  for (const [id,value] of [['pi',mode],['phi',mode],['az',order],['za',order]]) $(id).setAttribute('aria-pressed',String(id===value))
  $('dial-symbol').textContent=mode==='pi'?'π':'φ'
  $('clue').textContent=active ? (active.mode==='pi'?'Follow the circle':'Follow the spiral')+' · '+(active.order==='az'?'read forward':'read backward') : 'Pick a coordinate to find its inscription.'
  $('glyph').textContent=active?inspect(active,mode,order).shown:'✧'
  $('unseal').disabled=!active
  paint($('landscape'),realm?.id ?? blended?.toLowerCase().replaceAll(' ','-') ?? (creation?'here':'atlas'),mode)
}

function update() {
  save()
  renderScene()
  refreshExpeditions()
  const access=chapterAccess(game)
  const signature=game.seed?frequency(game.seed):null
  $('signature').textContent=signature?signature.signature+' · '+signature.tone+' Hz · '+game.walked+' steps':'—'
  $('mentor').textContent=mentors[mentor].join(' · ')
  $('progress').textContent=access.filter(Boolean).length+' / 13 chapters open · '+game.found.length+' / '+hats.length+' brims found'
  $('books').replaceChildren(...chapterTitles.map((name,index)=>{
    const item=document.createElement('li')
    if (access[index]) {
      item.append(button(name,()=>{
        selectedChapter=index
        renderChapter(access)
      }))
    } else {
      item.textContent=name
    }
    item.title=questions[index<4?0:index<9?1:2]
    item.classList.toggle('unlocked',access[index])
    const state=document.createElement('span')
    state.className='chapter-state'
    state.textContent=access[index]?' · Open':' · Locked'
    item.append(state)
    return item
  }))
  renderChapter(access)
  $('buddy').textContent=signature
    ? 'Your frequency is '+signature.signature+'. '+game.walked+' steps, '+game.found.length+' brims, '+game.creations.length+' forged worlds and '+Number(game.rescued)+' traveler freed.'
    : 'Start at the True Mirror to tune your frequency and open your first chapter.'
  $('done').hidden=!access.at(-1)
  $('done').textContent=finale
  $('inventory').replaceChildren(...hats.filter(hat=>game.found.includes(hat.id)).map(hat=>{
    const control=button(hat.name,()=>{
      const next=chooseHat(game,hat.id)
      if(next===game.stack) return announce('Three brims are equipped. Tap an equipped brim to remove it.')
      game.stack=next
      update()
    })
    control.setAttribute('aria-pressed',String(game.stack.includes(hat.id)))
    return control
  }))
  $('stack-caption').textContent=game.stack.length?stackName(game.stack)+' · '+game.stack.length+' / 3 equipped':'Unseal a brim, then tap it to equip it.'
  $('listen').disabled=game.stack.length===0
  $('blend').disabled=game.stack.length<2
  $('form').disabled=!access.at(-1)
  $('form').textContent=access.at(-1)?'Form · '+game.form+' · Change':'Become the Hat & Hatette'
  $('creations').replaceChildren(...game.creations.map(entry=>button(entry.name,()=>showCreation(entry))))
}

function renderChapter(access) {
  const chapter=access[selectedChapter]?chapters[selectedChapter]:null
  $('chapter').hidden=!chapter
  $('chapter-key').hidden=!chapter
  $('chapter').textContent=chapter?[chapter.place,chapter.brim,'Frequency key '+chapter.key,chapter.note].join(' · '):''
}

function showCreation(entry) {
  creation=entry
  realm=null
  blended=null
  $('share-label').hidden=false
  const url=new URL(location.href)
  url.hash='forge='+encodeURIComponent(JSON.stringify(entry))
  $('share').value=url.href
  update()
  $('atlas').scrollIntoView({block:'start'})
}

function setCoordinate(seed) {
  game.seed=seed
  mentor=frequency(seed).offset%mentors.length
  update()
  announce('Frequency tuned. The First Hat is open in your Chronicles.')
}

async function playTones(tones) {
  try {
    audio ??= new AudioContext()
    await audio.resume()
    for (const [index,tone] of tones.entries()) {
      const time=audio.currentTime+index*.095
      const voice=audio.createOscillator()
      const gain=audio.createGain()
      voice.type=['sine','triangle','sine'][index%3]
      voice.frequency.value=tone
      gain.gain.setValueAtTime(.0001,time)
      gain.gain.exponentialRampToValueAtTime(.085,time+.035)
      gain.gain.exponentialRampToValueAtTime(.0001,time+.72)
      voice.connect(gain)
      gain.connect(audio.destination)
      voice.start(time)
      voice.stop(time+.75)
    }
  } catch {announce('Audio is unavailable in this browser.')}
}

function updateRhythm(message) {
  $('rhythm').textContent=message
  for (const control of document.querySelectorAll('[data-beat]')) control.disabled=rhythm<0
}

function stopCamera() {
  stream?.getTracks().forEach(track=>track.stop())
  stream=null
  $('mirror-camera').srcObject=null
  $('mirror-camera').hidden=true
  $('camera').textContent='Open camera mirror'
}

const profiles=[
  ['Work Hat','Open the Chronicles and keep your next chapter in view.'],
  ['Creator Hat','Shape a world and choose its language in Forge Studio.'],
  ['Gaming Hat','Find your route through seven coordinates and enter the Rhythm Arena.'],
  ['Ghost Hat','Use the local workspace. Camera preview and sound switch off.'],
]
for(const [name,description] of profiles){
  $('profiles').append(button(name,event=>{
    for(const control of $('profiles').children) control.setAttribute('aria-pressed',String(control===event.currentTarget))
    $('profile-description').textContent=description
    if(name==='Ghost Hat'){
      stopCamera()
      if(sound) $('sound').click()
    }
  }))
}
$('profiles').firstElementChild.click()
$('suffix').addEventListener('input',event=>{
  const word=event.target.value.trim()
  const pairs={dude:'dudette',boy:'boyette',girl:'girlette',king:'kingette',pal:'palette',hat:'hatette'}
  $('word-pair').textContent=word?word+' ↔ '+(pairs[word.toLowerCase()]??word+'ette'):'—'
})
try { $('reflection').value=localStorage.getItem(key+'-reflection')??'' } catch {}
$('reflection').addEventListener('input',event=>{
  try { localStorage.setItem(key+'-reflection',event.target.value) }
  catch { $('reflection-state').textContent='Browser storage is unavailable.' }
})
objects()
$('salutation').textContent=briefing
for (const id of ['pi','phi']) $(id).addEventListener('click',()=>{mode=id;renderScene()})
for (const id of ['az','za']) $(id).addEventListener('click',()=>{order=id;renderScene()})
$('back').addEventListener('click',()=>{realm=null;creation=null;blended=null;renderScene()})
$('unseal').addEventListener('click',()=>{
  const active=realm??creation
  if (!active) return
  if (!inspect(active,mode,order).open) return announce('The vault is sealed. Match both parts of the inscription.')
  if (creation) return announce('Forge world open · '+creation.name+' · '+creation.word)
  if (game.found.includes(realm.id)) return announce(realm.hat+' is already in your collection.')
  const pair=realm.id==='below'?'silt-weave':realm.id==='nowhere'?'alpha-omega':null
  game.found=[...new Set([...game.found,realm.id,...(pair?[pair]:[])])]
  update()
  announce(realm.hat+' unlocked.'+(realm.id==='below'?' Silt-Weave Hatette unlocked.':realm.id==='nowhere'?' Alpha-Omega Brim unlocked.':''))
  if (sound) void playTones([realm.tone])
})
$('chapter-key').addEventListener('click',()=>{
  if(!chapterAccess(game)[selectedChapter]) return
  const routes=['middle','here','middle','below','below','there','over-there','over-there','above','there','there','nowhere','here']
  const entry=realms.find(item=>item.id===routes[selectedChapter])
  mode=entry.mode
  order=entry.order
  selectRealm(entry)
  $('atlas').scrollIntoView({block:'start'})
  announce(chapters[selectedChapter].key+' · '+entry.name+' · frequency tuned.')
})
$('seed').addEventListener('click',()=>setCoordinate(crypto.randomUUID()))
$('next-mentor').addEventListener('click',()=>{mentor=(mentor+1)%mentors.length;update()})
$('walk').addEventListener('click',()=>{
  if(!game.seed) return announce('Tune a frequency first.')
  game.walked=Math.min(9999,game.walked+1)
  update()
  if (sound) void playTones([frequency(game.seed).tone])
  announce('Accelerated Sovereign Walk · '+game.walked+' steps logged.')
})
$('camera').addEventListener('click',async()=>{
  if (stream) return stopCamera()
  if (cameraPending) return
  cameraPending=true
  try {
    const incoming=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'environment'}})
    if (document.hidden) return incoming.getTracks().forEach(track=>track.stop())
    stream=incoming
    $('mirror-camera').srcObject=stream
    $('mirror-camera').hidden=false
    $('camera').textContent='Close camera mirror'
  } catch {announce('Camera unavailable. Generate a coordinate or trace on the pad.')}
  finally {cameraPending=false}
})
addEventListener('pagehide',stopCamera)
document.addEventListener('visibilitychange',()=>{if(document.hidden) stopCamera()})

const trace=$('hand-trace')
let sample=null
function point(event) {
  const bounds=trace.getBoundingClientRect()
  return [event.clientX-bounds.left,event.clientY-bounds.top]
}
trace.addEventListener('pointerdown',event=>{
  if(sample || stream) return
  trace.setPointerCapture(event.pointerId)
  trace.width=trace.clientWidth
  trace.height=trace.clientHeight
  sample={pointer:event.pointerId, start:point(event), ticks:0, length:0}
  sample.last=sample.start
})
trace.addEventListener('pointermove',event=>{
  if(sample?.pointer!==event.pointerId) return
  const current=point(event), ctx=trace.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(...sample.last)
  ctx.lineTo(...current)
  ctx.strokeStyle='#edc28c'
  ctx.lineWidth=3
  ctx.lineCap='round'
  ctx.stroke()
  sample.length+=Math.hypot(current[0]-sample.last[0],current[1]-sample.last[1])
  sample.ticks+=1
  sample.last=current
})
trace.addEventListener('pointerup',event=>{
  if(sample?.pointer!==event.pointerId) return
  if(sample.ticks>1) setCoordinate('trace:'+Math.min(999,Math.round(sample.length/12))+':'+Math.min(99,sample.ticks))
  sample=null
})
trace.addEventListener('lostpointercapture',()=>{sample=null})
$('sound').addEventListener('click',()=>{
  sound=!sound
  $('sound').setAttribute('aria-pressed',String(sound))
  $('sound').textContent=sound?'Sound on':'Sound off'
  if(sound) void playTones([196])
})
function stackedTones(){return game.stack.map(id=>hats.find(hat=>hat.id===id).tone)}
$('listen').addEventListener('click',()=>void playTones(stackedTones()))
$('blend').addEventListener('click',()=>{
  if(game.stack.length<2) return
  blended=stackName(game.stack)
  realm=null
  creation=null
  renderScene()
  if (sound) void playTones(stackedTones())
  $('atlas').scrollIntoView({block:'start'})
})
$('form').addEventListener('click',()=>{
  if(!chapterAccess(game).at(-1)) return
  const forms=['wearer','world','word']
  game.form=forms[(forms.indexOf(game.form)+1)%forms.length]
  update()
  announce('You are the '+game.form+'. '+finale)
})
$('catch').addEventListener('click',()=>{
  if (!game.visited.includes('there')) return updateRhythm('Enter There to reach the Rhythm Arena.')
  rhythm=0
  updateRhythm('LABEL CAUGHT · H-A-T-E-T-T-E-S · 0 / 4 beats')
})
for (const control of document.querySelectorAll('[data-beat]')) control.addEventListener('click',()=>{
  const beat=control.dataset.beat
  if(pattern[rhythm]!==beat){
    rhythm=0
    return updateRhythm('Start again · STOMP, STOMP, CLAP, REST.')
  }
  if(sound && beat!=='rest') void playTones([beat==='stomp'?105:311])
  rhythm++
  if(rhythm<pattern.length) return updateRhythm('H-A-T-E-T-T-E-S · '+rhythm+' / 4 beats')
  rhythm=-1
  game.rescued=true
  updateRhythm('H-A-T-E-R-S · 1 − 1 = 0 · Cage shattered. Traveler freed.')
  update()
})
$('forge-form').addEventListener('submit',event=>{
  event.preventDefault()
  if (game.creations.length>=13) return announce('Your thirteen Forge slots are full. Export the journey to keep a copy.')
  const entry=readCreation(Object.fromEntries(new FormData(event.currentTarget)))
  if (!entry) return announce('Use a name of 2–36 characters and a vault word of 2–16 letters.')
  game.creations.push(entry)
  event.currentTarget.reset()
  showCreation(entry)
  announce('Portal forged. Its link is in the Crown Forge.')
})
$('share').addEventListener('focus',event=>event.currentTarget.select())
$('export').addEventListener('click',()=>{
  const link=document.createElement('a')
  const file=URL.createObjectURL(new Blob([JSON.stringify(game,null,2)],{type:'application/json'}))
  link.href=file
  link.download='worlds-within-journey.json'
  link.click()
  setTimeout(()=>URL.revokeObjectURL(file),1000)
})
$('import').addEventListener('change',async event=>{
  const file=event.target.files[0]
  event.target.value=''
  if(!file) return
  try {
    if (file.size>32768) throw new Error('size')
    const data=JSON.parse(await file.text())
    if(data?.edition!==game.edition) throw new Error('edition')
    game=readGame(data)
    update()
    announce('Journey imported.')
  } catch {announce('Choose a Worlds Within journey from this edition.')}
})
function readPortal(){
  if (!location.hash.startsWith('#forge=') || location.hash.length>650) return
  try {
    const value=readCreation(JSON.parse(decodeURIComponent(location.hash.slice(7))))
    if (value) showCreation(value)
  } catch {}
}
addEventListener('hashchange',readPortal)
new ResizeObserver(renderScene).observe($('landscape'))
refreshExpeditions=setupExpeditions(()=>game.expeditions, progress=>{
  game.expeditions=progress
  save()
})
update()
readPortal()
