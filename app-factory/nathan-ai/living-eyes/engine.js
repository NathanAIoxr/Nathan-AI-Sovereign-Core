/* NATHAN AI - LIVING EYES / owner-defined source-preserving full-tilt engine.
   "Living" means responsive software, not consciousness or biological life.
   Original I / Eye Scan, Hall of Mirrors and Complete Mind are not modified. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanLivingEyes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BASE_AXES=Object.freeze([
 {id:'V1',name:'Vertical top-down, left',angle:90},
 {id:'V2',name:'Vertical bottom-up, left',angle:270},
 {id:'V3',name:'Vertical top-down, right',angle:90},
 {id:'V4',name:'Vertical bottom-up, right',angle:270},
 {id:'D1',name:'Diagonal upper-left to lower-right',angle:45},
 {id:'D2',name:'Diagonal lower-left to upper-right',angle:135}
]);
const QUARTERS=Object.freeze([0,90,180,270]);
const MODES=Object.freeze({canonical:48,mirror:96,counter:192,full:384});
const freeze=Object.freeze;
const norm=x=>((x%360)+360)%360;
const round=n=>Math.round(n*1e6)/1e6;
const position=(deg,r)=>({x:round(Math.cos(deg*Math.PI/180)*r),y:round(Math.sin(deg*Math.PI/180)*r)});
const verticalFlip=p=>({x:p.x,y:-p.y});
const mirrorFlip=p=>({x:-p.x,y:p.y});
const halfTurn=p=>({x:-p.x,y:-p.y});
const ZERO=freeze({x:0,y:0});
const TRACKS=freeze(QUARTERS.flatMap((q,g)=>BASE_AXES.map((a,i)=>freeze({
 id:'Q'+g+'-'+a.id,axis:a.id,family:a.name,group:g,quarter:q,baseAngle:norm(q+a.angle),assignedRotation:(i+g)%2===0?'CW':'CCW'
}))));
function frame(tick=0,options={}){
 if(!Number.isFinite(tick))throw new TypeError('Finite tick required');
 const mode=options.mode||'full',velocity=options.velocity===undefined?1.5:Number(options.velocity),cycle=options.cycle===undefined?180:Number(options.cycle);
 if(!Object.hasOwn(MODES,mode))throw new RangeError('Unknown mode');
 if(!Number.isFinite(velocity)||velocity<0||velocity>20)throw new RangeError('Velocity outside 0..20');
 if(!Number.isInteger(cycle)||cycle<4||cycle%2)throw new RangeError('Cycle must be an even integer >=4');
 const lock=options.lock===true;
 const c=((tick%cycle)+cycle)%cycle;
 const r=lock?0:Math.abs(Math.cos(Math.PI*c/cycle));
 const mirrorModes=mode==='canonical'?[false]:[false,true];
 const directions=mode==='counter'||mode==='full'?['CW','CCW']:null;
 const halfTurns=mode==='full'?[false,true]:[false];
 const points=[];
 for(const a of TRACKS)for(const inv of [false,true])for(const mirror of mirrorModes)
 for(const dir of (directions||[a.assignedRotation]))for(const rotate180 of halfTurns){
   const angle=norm(a.baseAngle+(dir==='CW'?1:-1)*velocity*tick);
   let p=position(angle,r);
   if(inv)p=verticalFlip(p); // y->-y (NOT the same as 180°)
   if(mirror)p=mirrorFlip(p); // x->-x
   if(rotate180)p=halfTurn(p); // x->-x AND y->-y
   if(lock||r<1e-10)p=ZERO;
   points.push(freeze({id:a.id+'/i'+Number(inv)+'/m'+Number(mirror)+'/'+dir+'/h'+Number(rotate180),
     trackId:a.id,axis:a.axis,quarter:a.quarter,direction:dir,inversion:inv,mirror,rotate180,angle:round(angle),x:p.x,y:p.y}));
 }
 if(points.length!==MODES[mode])throw new Error('Axis-count invariant failed');
 return freeze({schema:'nathan-ai.living-eyes.v1',tick,mode,velocity,sourceAxes:6,orientationGroups:4,primaryTracks:24,
   viewCount:points.length,equator:ZERO,converged:points.every(p=>p.x===0&&p.y===0),points:freeze(points)});
}
function inspect(text,deps={}){
 if(typeof text!=='string')throw new TypeError('Text must be owner-selected');
 if(new TextEncoder().encode(text).length>512000)throw new RangeError('512000-byte limit');
 const eye=deps.eyeScanner,mirror=deps.hallOfMirrors;
 const tokens=text.match(/[\p{L}\p{N}]+/gu)||[];
 return freeze({schema:'nathan-ai.living-eyes.inspect.v1',original:text,bytes:new TextEncoder().encode(text).length,
   tokenCount:tokens.length,
   eyeScan:eye&&typeof eye.scan==='function'?eye.scan(text):null,
   hallOfMirrors:mirror&&typeof mirror.presentations==='function'?mirror.presentations(text):null,
   passiveReview:mirror&&typeof mirror.classify==='function'?mirror.classify(text):null,
   glitchLiteral:/\bglitch\b/iu.test(text),
   note:'Glitch is a literal match; not proof of corruption. No automatic capture, surveillance, transmission or storage.'});
}
function gates(kind){if(kind!=='eye'&&kind!=='ear')throw new RangeError('Unknown gate type');
 return freeze(Array.from({length:12},(_,i)=>freeze({id:kind.toUpperCase()+'-'+String(i+1).padStart(2,'0'),
   status:'Conceptual channel only; no physical sensor attached'})))}
return freeze({BASE_AXES,TRACKS,QUARTERS,MODES,ZERO,norm,position,verticalFlip,mirrorFlip,halfTurn,frame,inspect,gates});
});