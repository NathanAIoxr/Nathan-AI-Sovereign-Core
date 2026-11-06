/* Shared graphics primitives for Nathan Tabor's app framework. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TaborGraphics=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const themes={bethlehem:{sky:'#101b37',panel:'#25283a',gold:'#d8b96a',text:'#fff1ce',earth:'#a88161'},woodland:{sky:'#102820',panel:'#283d31',gold:'#c6b777',text:'#f5f0d2',earth:'#987351'},forge:{sky:'#21182b',panel:'#342637',gold:'#cfaa75',text:'#fff0d8',earth:'#9c7974'}};
const elements=[{id:'fire',label:'Fire',color:'#e75947',mark:'M25 9Q43 28 36 39Q27 50 17 39Q10 29 21 19L21 30Q31 24 25 9Z'},{id:'nature',label:'Nature',color:'#65ba75',mark:'M14 39Q8 13 39 12Q43 40 14 39ZM14 39L33 20'},{id:'ice',label:'Ice',color:'#78c9f2',mark:'M25 10V40M12 17L38 33M12 33L38 17M20 14L25 19L30 14M20 36L25 31L30 36'},{id:'holy',label:'Holy',color:'#f1d65b',mark:'M25 9L29 21L41 25L29 29L25 42L21 29L9 25L21 21Z'},{id:'dark',label:'Dark',color:'#b18ae5',mark:'M31 11A16 16 0 1 0 39 35A18 18 0 0 1 31 11Z'}];
const glyphs={
egg:'M25 7C17 7 10 25 10 32A15 15 0 0 0 40 32C40 25 33 7 25 7Z',
gene:'M15 7C40 17 10 33 35 43M35 7C10 17 40 33 15 43M19 12H31M19 21H31M19 29H31M19 38H31',
hox:'M10 10H40V40H10ZM10 20H40M10 30H40M20 10V40M30 10V40',
rule:'M13 8H37V43H13ZM19 17H31M19 25H31M19 33H27',
duality:'M24 10A16 16 0 1 0 24 40M26 10A16 16 0 1 1 26 40M20 25H30',
polarity:'M25 6V44M6 25H44M20 12L25 6L30 12M20 38L25 44L30 38',
tale:'M11 10H35V35H11ZM16 17H30M16 23H30M16 29H25M18 40H41V17',
story:'M25 13Q13 5 6 13V40Q16 34 25 41Q34 34 44 40V13Q36 5 25 13V41',
truth:'M9 25L20 36L42 12M10 9H23M9 9V19',
star:'M25 5L30 20L45 25L30 30L25 45L20 30L5 25L20 20Z',
lantern:'M18 15V10Q25 2 32 10V15M14 15H36L33 41H17ZM18 21H32M25 21V35',
compass:'M25 4A21 21 0 1 0 25 46A21 21 0 1 0 25 4M31 18L28 29L17 33L21 21Z',
gift:'M7 21H43V30H7ZM12 30V44H38V30M25 21V44M25 21C4 17 14 3 25 21C46 17 36 3 25 21Z',
scroll:'M12 9H39Q46 9 41 17H17V37Q17 45 8 41Q4 36 11 34M17 41H38V17',
shield:'M25 5L42 13V28Q39 41 25 46Q11 41 8 28V13ZM16 25L23 32L35 18',
forge:'M6 21H44L35 29H27V37H37V43H13V37H23V29H14ZM15 12L29 6L35 13L21 19Z',
house:'M5 25L25 7L45 25M11 22V44H39V22M21 44V30H30V44',
vote:'M7 25H43V44H7ZM17 25L13 12L31 6L36 23M20 15L25 19L30 11M18 32H32',
replay:'M11 16A19 19 0 1 1 8 31M11 6V18H23M22 17L34 25L22 33Z',
sound:'M6 19H15L26 9V41L15 31H6ZM33 17Q42 25 33 33M39 10Q53 25 39 40',
pause:'M14 9H21V41H14ZM29 9H36V41H29Z',
play:'M14 7L42 25L14 43Z',
snow:'M25 4V46M7 14L43 36M7 36L43 14M17 10L25 17L33 10M17 40L25 33L33 40',
moon:'M32 6A21 21 0 1 0 44 35A23 23 0 0 1 32 6Z',
settings:'M25 15A10 10 0 1 0 25 35A10 10 0 1 0 25 15M25 5V12M25 38V45M5 25H12M38 25H45M11 11L16 16M34 34L39 39M11 39L16 34M34 16L39 11',
people:'M17 9A7 7 0 1 0 17 23A7 7 0 1 0 17 9M33 12A6 6 0 1 0 33 24A6 6 0 1 0 33 12M4 43V35Q17 20 29 35V43M30 30Q44 29 46 39V43'
};
function finite(n,name,min,max){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw new RangeError(name);return n;}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function icon(id,size=50,color='#d8b96a'){if(!glyphs[id])throw new RangeError('Unknown icon');finite(size,'size',8,2048);if(!/^#[0-9a-f]{6}$/i.test(color))throw new RangeError('color');return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="'+size+'" height="'+size+'" role="img" aria-label="'+escape(id)+'"><path d="'+glyphs[id]+'" fill="none" stroke="'+color+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';}
function gem(id,size=64){const e=elements.find(x=>x.id===id);if(!e)throw new RangeError('Unknown element');finite(size,'size',8,2048);return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 56" width="'+size+'" height="'+size+'" role="img" aria-label="'+e.label+'"><path d="M25 2L46 13L42 39L25 54L8 39L4 13Z" fill="'+e.color+'" stroke="#e7c681" stroke-width="2"/><path d="M25 2L25 49L8 39L4 13Z" fill="#000" opacity=".18"/><path d="M4 13L25 19L46 13L25 2Z" fill="#fff" opacity=".3"/><path d="'+e.mark+'" fill="none" stroke="#14202c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function pack(rects,maxWidth=2048,padding=2){finite(maxWidth,'width',16,4096);finite(padding,'padding',0,32);if(!Number.isInteger(maxWidth)||!Number.isInteger(padding)||!Array.isArray(rects)||rects.length>128)throw new RangeError('packer input');const ids=new Set();let x=padding,y=padding,row=0;const frames=[];for(const r of rects){if(typeof r.id!=='string'||!r.id||ids.has(r.id))throw new RangeError('unique id');ids.add(r.id);finite(r.width,'frame width',1,4096);finite(r.height,'frame height',1,4096);if(!Number.isInteger(r.width)||!Number.isInteger(r.height)||r.width+2*padding>maxWidth)throw new RangeError('frame size');if(x+r.width+padding>maxWidth){x=padding;y+=row+padding;row=0;}if(y+r.height+padding>4096)throw new RangeError('atlas exceeds 4096');frames.push({id:r.id,x,y,width:r.width,height:r.height});x+=r.width+padding;row=Math.max(row,r.height);}return {width:maxWidth,height:rects.length?y+row+padding:1,padding,frames};}
const presets={
idle:[{t:0,x:0,y:0,scale:1,opacity:1},{t:.5,x:0,y:-3,scale:1.01,opacity:1},{t:1,x:0,y:0,scale:1,opacity:1}],
cutin:[{t:0,x:-200,y:0,scale:.9,opacity:0},{t:.2,x:0,y:0,scale:1.03,opacity:1},{t:.7,x:0,y:0,scale:1,opacity:1},{t:1,x:160,y:0,scale:1,opacity:0}],
impact:[{t:0,x:0,y:0,scale:1,opacity:1},{t:.18,x:-5,y:0,scale:1.08,opacity:1},{t:.4,x:4,y:0,scale:.96,opacity:1},{t:1,x:0,y:0,scale:1,opacity:1}],
reveal:[{t:0,x:0,y:12,scale:.85,opacity:0},{t:.6,x:0,y:0,scale:1.03,opacity:1},{t:1,x:0,y:0,scale:1,opacity:1}]
};
function sample(frames,t,reduced=false){finite(t,'time',0,1);if(!Array.isArray(frames)||frames.length<2||frames.length>256)throw new RangeError('frames');for(let i=0;i<frames.length;i++){const f=frames[i];finite(f.t,'keyframe time',0,1);if(i&&f.t<=frames[i-1].t)throw new RangeError('keyframe order');finite(f.x,'x',-4096,4096);finite(f.y,'y',-4096,4096);finite(f.scale,'scale',.01,10);finite(f.opacity,'opacity',0,1);}if(frames[0].t!==0||frames[frames.length-1].t!==1)throw new RangeError('endpoint times');if(reduced)return {x:0,y:0,scale:1,opacity:1};const i=Math.max(0,frames.findIndex(f=>f.t>=t)-1),a=frames[i],b=frames[i+1],u=(t-a.t)/(b.t-a.t),s=u*u*(3-2*u);return Object.fromEntries(['x','y','scale','opacity'].map(k=>[k,a[k]+(b[k]-a[k])*s]));}
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
class Particles{
constructor(cap=120,seed=7){finite(cap,'capacity',0,512);if(!Number.isInteger(cap))throw new RangeError('capacity');this.cap=cap;this.random=rng(seed);this.items=[];}
burst(x,y,count=24,color='#f1d65b'){finite(x,'x',-4096,8192);finite(y,'y',-4096,8192);finite(count,'count',0,512);if(!Number.isInteger(count)||!/^#[0-9a-f]{6}$/i.test(color))throw new RangeError('burst');for(let i=0;i<count&&this.items.length<this.cap;i++){const a=this.random()*Math.PI*2,v=30+this.random()*130;this.items.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.3+this.random()*.7,color});}return this.items.length;}
step(dt){finite(dt,'delta',0,.1);for(const p of this.items){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt;}this.items=this.items.filter(p=>p.life>0);return this.items;}
clear(){this.items=[];}
}
return {themes,elements,glyphs,icon,gem,pack,presets,sample,rng,Particles};
});
