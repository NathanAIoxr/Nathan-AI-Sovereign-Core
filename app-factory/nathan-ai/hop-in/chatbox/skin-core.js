(function(root){
'use strict';
const MODES=['sacred-geometry','symmetry','tessellations','glyphs','orbits','minimal'];
const KEY='nathan-ai.visual-skin.v1';
const MAX_SEED=4294967295;
const PALETTES=[
{gold:'#e8b66b',ice:'#7dcff2',mint:'#a1ead0',fade:'#193348'},
{gold:'#f9c28c',ice:'#c8a3ff',mint:'#81e5e0',fade:'#1c2545'},
{gold:'#eff0bf',ice:'#7fcaa2',mint:'#82b6df',fade:'#16393b'},
{gold:'#f0a4ac',ice:'#b5d8ff',mint:'#d0bcff',fade:'#2b2d49'},
{gold:'#f2bf76',ice:'#91cdf4',mint:'#98e7bb',fade:'#2d384c'}
];
function cleanMode(mode){return MODES.includes(mode)?mode:'sacred-geometry'}
function seedNumber(x){const n=Number(x);return Number.isInteger(n)&&n>=0&&n<=MAX_SEED?n>>>0:0}
function random(seed){let s=seedNumber(seed)||0x4f1bbcdc;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
function point(cx,cy,r,theta){return [Number((cx+r*Math.cos(theta)).toFixed(2)),Number((cy+r*Math.sin(theta)).toFixed(2))];}
function polygon(cx,cy,r,n,phase=0){const coords=[];for(let i=0;i<n;i++)coords.push(point(cx,cy,r,Math.PI*2*i/n+phase));return coords.map(p=>p.join(',')).join(' ');}
function glyphPaths(){
 // Original ornamental glyph motifs inspired by ancient inscription geometry, NOT transcriptions.
 return [
 'M-12 0 Q0 -16 12 0 Q0 16 -12 0 Z M0 -6 A6 6 0 1 0 0 6 A6 6 0 1 0 0 -6',
 'M-8 -12 L-8 12 M8 -12 L8 12 M-12 0 Q0 -7 12 0',
 'M-10 11 L0 -13 L10 11 M-6 2 L6 2',
 'M-14 -6 Q0 -16 14 -6 M-12 6 Q0 14 12 6 M0 -12 L0 12',
 'M-12 -9 L12 -9 L0 0 L12 9 L-12 9',
 'M-10 0 C-4 -15 4 -15 10 0 C4 15 -4 15 -10 0 Z M-7 0 L7 0'
 ];
}
function build(mode,seed){mode=cleanMode(mode);seed=seedNumber(seed);const rnd=random(seed),palette=PALETTES[seed%PALETTES.length],shapes=[];
const add=(type,props)=>shapes.push({type,props});
const core=()=>{for(let k=0;k<3;k++){const r=37+k*29;add('circle',{cx:570,cy:139,r,opacity:.20+k*.07});}
for(let k=0;k<12;k++){const angle=k*Math.PI/6+(seed%360)*Math.PI/180,r=123+(k%3)*12;add('line',{x1:570,y1:139,x2:point(570,139,r,angle)[0],y2:point(570,139,r,angle)[1],opacity:.08});}
add('circle',{cx:570,cy:139,r:6,fill:palette.gold,opacity:.8});};
core();
if(mode==='sacred-geometry'){for(let j=0;j<3;j++)for(let i=0;i<6;i++){const a=i*Math.PI/3+j*.11,r=38+j*25,[cx,cy]=point(570,139,r,a);add('circle',{cx,cy,r:39+j*5,opacity:.12+j*.06});}for(let n=0;n<6;n++)add('polygon',{points:polygon(570,139,35+n*20,6+n%3,n*.13),opacity:.08+n*.05});}
else if(mode==='symmetry'){const arms=6+seed%13;for(let j=0;j<arms;j++){const a=2*Math.PI*j/arms;for(let k=0;k<4;k++){const rr=40+k*28,[cx,cy]=point(570,139,rr,a);add('line',{x1:cx,y1:cy,x2:point(570,139,rr+36,a+.13+Math.sin(seed+k)*.04)[0],y2:point(570,139,rr+36,a+.13+Math.sin(seed+k)*.04)[1],opacity:.15+k*.09});add('circle',{cx,cy,r:2+k%2,fill:palette.mint,opacity:.65});}}}
else if(mode==='tessellations'){const sides=[3,4,5,6,8][seed%5];for(let y=0;y<7;y++)for(let x=0;x<20;x++){const xx=x*64-6+(y%2)*32,yy=y*42+14;add('polygon',{points:polygon(xx,yy,30,sides,(x+y)*.1),opacity:.08+(((x+y)%5)*.028)});}}
else if(mode==='glyphs'){const glyphs=glyphPaths();for(let j=0;j<30;j++){const x=50+(j%15)*74,y=65+Math.floor(j/15)*160;add('path',{d:glyphs[(j+seed)%glyphs.length],transform:'translate('+x+' '+y+') scale('+(0.72+.4*rnd()).toFixed(2)+')',opacity:.14+.3*rnd()});}}
else if(mode==='orbits'){for(let j=0;j<10;j++){const r=47+j*12,angle=(seed%97)*.01+j*.68;add('ellipse',{cx:570,cy:139,rx:r*1.55,ry:r*.48,transform:'rotate('+(angle*180/Math.PI).toFixed(1)+' 570 139)',opacity:.09+j*.03});const [x,y]=point(570,139,r,angle);add('circle',{cx:x,cy:y,r:2+(j%4),fill:palette.ice,opacity:.6});}}
else {for(let j=0;j<5;j++)add('polygon',{points:polygon(570,139,48+j*22,3+(j%6),seed*.0001),opacity:.12+j*.07});}
for(let i=0;i<55;i++){const x=14+rnd()*1110,y=9+rnd()*265,r=.6+rnd()*1.4;add('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:r.toFixed(1),fill:i%3?palette.ice:palette.gold,opacity:(.1+rnd()*.55).toFixed(2)});}
return {mode,seed,palette,shapes};}
function config(input){if(!input||typeof input!=='object'||Array.isArray(input)||input.schema!=='nathan-ai.visual-skin.v1')throw Error('Invalid skin settings');if(!MODES.includes(input.mode)||!Number.isInteger(input.seed)||input.seed<0||input.seed>MAX_SEED||typeof input.quiet!=='boolean')throw Error('Invalid skin mode, seed or calm setting');return {schema:'nathan-ai.visual-skin.v1',mode:input.mode,seed:input.seed,quiet:input.quiet};}
const API={MODES,KEY,PALETTES,MAX_SEED,cleanMode,seedNumber,random,point,polygon,glyphPaths,build,config};if(typeof module==='object'&&module.exports)module.exports=API;else root.NathanVisualSkin=API;
})(typeof window==='object'?window:globalThis);