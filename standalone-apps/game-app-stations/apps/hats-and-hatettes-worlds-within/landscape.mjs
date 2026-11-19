import {realms} from './world.mjs'

function randomizer(seed) {
  return () => {
    seed = (Math.imul(1664525,seed) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function trace(ctx, points, fill, stroke, close = false) {
  ctx.beginPath()
  for (const [index,[x,y]] of points.entries()) {
    if (index === 0) ctx.moveTo(x,y)
    else ctx.lineTo(x,y)
  }
  if (close) ctx.closePath()
  if (fill) {ctx.fillStyle=fill; ctx.fill()}
  if (stroke) {ctx.strokeStyle=stroke; ctx.stroke()}
}

function bands(ctx, random, colors, horizon, amplitude) {
  for (const [index,color] of colors.entries()) {
    const base = horizon + index * 41
    const peaks = Array.from({length:33},(_,i)=>{
      const x = i * 28
      return [x,base + Math.sin(i * .41 + index) * amplitude - random() * amplitude]
    })
    trace(ctx,[[0,570],...peaks,[900,570]],color,null,true)
  }
}

function aurora(ctx, color) {
  for (let ribbon=0;ribbon<21;ribbon++) {
    ctx.beginPath()
    for (let x=-20;x<915;x+=7) {
      const y=135 + ribbon*3.9 + Math.sin(x*.008+ribbon*.013)*57 + Math.cos(x*.015)*12
      if (x===-20) ctx.moveTo(x,y)
      else ctx.lineTo(x,y)
    }
    ctx.strokeStyle=color
    ctx.globalAlpha=.018 + ribbon*.0027
    ctx.lineWidth=3
    ctx.stroke()
  }
  ctx.globalAlpha=1
}

function glyph(ctx,x,y,r,color) {
  ctx.lineWidth=1
  ctx.strokeStyle=color
  ctx.beginPath()
  ctx.ellipse(x,y,r,r*.39,-.28,0,Math.PI*2)
  ctx.ellipse(x,y,r*.48,r,0.5,0,Math.PI*2)
  ctx.stroke()
}

export function paint(canvas, id, mode) {
  const width=canvas.clientWidth
  const height=canvas.clientHeight
  if (!width || !height) return
  const scale=Math.min(globalThis.devicePixelRatio || 1,2)
  canvas.width=Math.round(width*scale)
  canvas.height=Math.round(height*scale)
  const ctx=canvas.getContext('2d')
  ctx.scale(canvas.width/900,canvas.height/530)
  const seed=[...id].reduce((total,x)=>total+x.charCodeAt(0),191)
  const random=randomizer(seed)
  const isSea=['below','aurora-over-doggerland','the-north-sea-gate'].includes(id)
  const isSky=['above','over-there','the-solstice-crown'].includes(id)
  const isMirror=['nowhere','the-double-mirror'].includes(id)
  const accent=realms.find(realm=>realm.id===id)?.color ?? '#a4efce'
  const sky=ctx.createLinearGradient(0,0,0,530)
  sky.addColorStop(0,isMirror?'#211a37':isSea?'#143b53':'#111a30')
  sky.addColorStop(.62,isMirror?'#3e3053':isSea?'#245365':isSky?'#23534f':'#35454c')
  sky.addColorStop(1,'#102430')
  ctx.fillStyle=sky
  ctx.fillRect(0,0,900,530)
  const glow=ctx.createRadialGradient(450,205,15,450,205,360)
  glow.addColorStop(0,isSea?'#60f4c54f':'#f5c59343')
  glow.addColorStop(1,'#00000000')
  ctx.fillStyle=glow
  ctx.fillRect(0,0,900,530)
  for(let i=0;i<290;i++){
    const x=random()*900, y=random()*470, radius=.2+random()*1.6
    ctx.globalAlpha=.12+random()*.62
    ctx.fillStyle=i%4===0?accent:'#ffe8c9'
    ctx.beginPath()
    ctx.arc(x,y,radius,0,Math.PI*2)
    ctx.fill()
  }
  ctx.globalAlpha=1
  aurora(ctx,isMirror?'#cca8ff':'#8ffff0')
  if (isSea) {
    for (let i=0;i<7;i++){
      const x=i*155-5
      trace(ctx,[[x,-10],[x+31,-10],[x+170,400],[x-138,400]],'#a2fffa13',null,true)
    }
  }
  bands(ctx,random,isSea?['#254c57','#1e424e','#153340','#102830']:['#34434c','#293944','#1e303a','#162932'],isSea?350:325,isSea?22:47)
  if (isSea || isSky || isMirror || id==='atlas') {
    const x=isSea?465:448, y=isSea?365:235
    for(let i=0;i<15;i++){
      const left=x-205+i*27
      const top=y-28-random()*75
      trace(ctx,[[left,y],[left+4,top],[left+14,top-12],[left+20,top+4],[left+26,y]],'#0e2334','#a4cfc449',true)
      if (i%2===0) trace(ctx,[[left+9,top+15],[left+9,y-8]],null,accent+'80')
    }
    glyph(ctx,450,165,mode==='phi'?106:85,accent+'75')
  } else {
    for(let i=0;i<22;i++){
      const x=i*43, y=318+random()*82
      trace(ctx,[[x,420],[x,y],[x+15,y-12],[x+35,y-4],[x+35,420]],'#142832','#cda77842',true)
      for(let w=0;w<3;w++) trace(ctx,[[x+9+w*7,y+15],[x+9+w*7,y+32]],null,'#ffd09485')
    }
  }
  if(id==='atlas'){
    ctx.lineWidth=1.4
    ctx.setLineDash([3,6])
    const center=realms[0]
    for(const realm of realms.slice(1)){
      trace(ctx,[[center.x*9,center.y*5.3],[realm.x*9,realm.y*5.3]],null,realm.color+'9c')
    }
    ctx.setLineDash([])
  }
  if(mode==='phi'){
    const spiral=Array.from({length:160},(_,i)=>{
      const t=i*.069
      const r=1.6*Math.exp(.398*t)
      return [449+Math.cos(t)*r,216+Math.sin(t)*r*.78]
    })
    trace(ctx,spiral,null,accent+'aa')
  }
  ctx.lineWidth=.7
  ctx.strokeStyle='#c0b39138'
  ctx.strokeRect(14,14,872,502)
}
