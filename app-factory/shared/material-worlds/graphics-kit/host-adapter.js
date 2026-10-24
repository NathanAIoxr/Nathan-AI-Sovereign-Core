/* Optional host adapter. Consumes confirmed visual events, never game state. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./graphics-core.js'));else root.TaborGraphicsFX=factory(root.TaborGraphics);})(typeof globalThis!=='undefined'?globalThis:this,function(G){
'use strict';
function attach(canvas,options={}){
if(!canvas||typeof canvas.getContext!=='function')throw Error('A canvas is required');
const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D is unavailable');
let config={motion:false,particles:true,budget:96,...options},pool=new G.Particles(0),raf=0,last=0,dead=false,width=1,height=1;
const media=matchMedia('(prefers-reduced-motion: reduce)');
function blocked(){return !config.motion||media.matches||document.hidden;}
function resize(){if(dead)return;const box=canvas.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);pool.clear();}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;pool.clear();ctx.clearRect(0,0,width,height);}
function configure(next){const c={...config,...next};if(typeof c.motion!=='boolean'||typeof c.particles!=='boolean'||!Number.isInteger(c.budget)||c.budget<0||c.budget>240)throw Error('Invalid effect settings');config=c;pool=new G.Particles(c.budget,17);stop();}
function frame(now){raf=0;if(dead||blocked()){stop();return;}pool.step(Math.min(.05,Math.max(0,(now-last)/1000)));last=now;ctx.clearRect(0,0,width,height);for(const p of pool.items){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;if(pool.items.length)raf=requestAnimationFrame(frame);}
function emit(type,payload={}){if(dead||blocked()||!config.particles)return false;const colors={match:'#f1d65b',star:'#fff1ce',heal:'#65ba75',impact:'#e75947'},element=G.elements.find(e=>e.id===payload.element);if(!Object.prototype.hasOwnProperty.call(colors,type))throw Error('Unsupported visual event');const x=payload.x===undefined?width/2:payload.x,y=payload.y===undefined?height/2:payload.y;if(typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid effect position');pool.burst(Math.max(0,Math.min(width,x)),Math.max(0,Math.min(height,y)),type==='star'?48:24,element?element.color:colors[type]);if(!raf&&pool.items.length){last=performance.now();raf=requestAnimationFrame(frame);}return true;}
function preference(){if(blocked())stop();}
configure(config);resize();
const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;if(observer)observer.observe(canvas);else window.addEventListener('resize',resize);
media.addEventListener('change',preference);document.addEventListener('visibilitychange',preference);
return {emit,configure,destroy(){if(dead)return;dead=true;stop();if(observer)observer.disconnect();else window.removeEventListener('resize',resize);media.removeEventListener('change',preference);document.removeEventListener('visibilitychange',preference);}};
}
return {attach};
});
