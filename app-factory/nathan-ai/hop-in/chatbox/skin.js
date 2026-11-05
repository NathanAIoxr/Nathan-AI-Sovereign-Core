(function(){
'use strict';
const Core=window.NathanVisualSkin,$=id=>document.getElementById(id);
if(!Core||!$('visual-skin'))return;
const svg=$('visual-skin'),NS='http://www.w3.org/2000/svg';
const defaults={schema:'nathan-ai.visual-skin.v1',mode:'sacred-geometry',seed:18760529,quiet:false};
let state={...defaults},saved=null,canSave=true;
function el(tag){return document.createElementNS(NS,tag)}
function rand32(){if(globalThis.crypto&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]}return Math.floor(Math.random()*4294967296)}
function draw(){const art=Core.build(state.mode,state.seed);svg.replaceChildren();svg.setAttribute('viewBox','0 0 1140 280');svg.setAttribute('preserveAspectRatio','xMidYMid slice');const defs=el('defs'),grad=el('radialGradient');grad.id='nathan-glow';for(const [offset,color,opacity] of [['0%',art.palette.gold,'0.30'],['52%',art.palette.ice,'0.10'],['100%',art.palette.fade,'0']]){const stop=el('stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);stop.setAttribute('stop-opacity',opacity);grad.append(stop);}defs.append(grad);svg.append(defs);const glow=el('ellipse');for(const [k,v] of Object.entries({cx:'570',cy:'139',rx:'380',ry:'235',fill:'url(#nathan-glow)'}))glow.setAttribute(k,v);svg.append(glow);
const layer=el('g');layer.setAttribute('fill','none');layer.setAttribute('stroke',art.palette.gold);layer.setAttribute('stroke-width','1.15');for(const item of art.shapes){const shape=el(item.type);for(const [k,v] of Object.entries(item.props))shape.setAttribute(k,String(v));if(!item.props.fill)shape.setAttribute('stroke',art.palette.gold);layer.append(shape);}svg.append(layer);$('visual-banner').dataset.quiet=String(state.quiet);$('skin-mode').value=state.mode;$('skin-quiet').checked=state.quiet;$('skin-seed').textContent=String(state.seed);$('skin-note').textContent='Original procedural artwork. '+(state.mode==='glyphs'?'Glyph-inspired forms are decorative, not authentic inscriptions. ':'')+'Over four billion seed values per style; not stored images or pre-existing works.';}
function set(patch){try{state=Core.config({...state,...patch});draw();}catch(e){$('skin-note').textContent=e.message}}
function save(){if(!canSave)return;try{if(localStorage.getItem(Core.KEY)!==saved)throw Error('Visual settings changed in another tab. Reload before saving.');const raw=JSON.stringify(state);localStorage.setItem(Core.KEY,raw);saved=raw;$('skin-note').textContent='Visual skin saved to this browser profile; nothing else changed.'}catch(e){$('skin-note').textContent='Not saved: '+e.message}}
try{saved=localStorage.getItem(Core.KEY);if(saved)state=Core.config(JSON.parse(saved));}catch(e){canSave=false;state={...defaults};$('skin-note').textContent='Saved visual preference unreadable; original was preserved.'}
$('skin-mode').addEventListener('change',()=>set({mode:$('skin-mode').value}));
$('skin-shuffle').addEventListener('click',()=>set({seed:rand32()}));
$('skin-quiet').addEventListener('change',()=>set({quiet:$('skin-quiet').checked}));
$('skin-save').addEventListener('click',save);
draw();
})();