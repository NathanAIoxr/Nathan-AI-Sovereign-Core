/* NATHAN AI 🚀 Flyer Studio · local-first, source-preserving marketing visuals */
(function(root,factory){
  const engine=factory();
  if(typeof module==='object'&&module.exports){module.exports=engine;}
  else{root.NathanFlyer=engine;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='nathan-ai.flyer.v1';
const URL='https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/';
const FORMATS={
 portrait:{name:'Portrait · 4:5',w:1080,h:1350},
 square:{name:'Square · 1:1',w:1080,h:1080},
 story:{name:'Story · 9:16',w:1080,h:1920},
 landscape:{name:'Landscape · 16:9',w:1600,h:900}
};
const PALETTES={
 sovereign:{name:'Midnight & Gold',bg:'#071520',mid:'#10364a',ink:'#f8f6ef',muted:'#c2d8e2',accent:'#f0d099',rim:'#78bdce'},
 stellar:{name:'Stellar Violet',bg:'#180e32',mid:'#3b2265',ink:'#ffffff',muted:'#ded8f4',accent:'#aaf5de',rim:'#a998f3'},
 copper:{name:'Copper & Ember',bg:'#251513',mid:'#543324',ink:'#fff5e8',muted:'#f0d7bd',accent:'#f3bb70',rim:'#ec9578'},
 glacier:{name:'Ocean Signal',bg:'#052437',mid:'#166180',ink:'#f4ffff',muted:'#c7ebf3',accent:'#9eecff',rim:'#59afc9'},
 parchment:{name:'Parchment',bg:'#eee3cb',mid:'#d2c4aa',ink:'#172b36',muted:'#354f5a',accent:'#98582e',rim:'#7b7867'}
};
const PRESETS=[
{id:'nathan',name:'Nathan AI — One System',palette:'sovereign',style:'orbit',eyebrow:'NATHAN AI 🚀 · OFFICIAL PROJECT FLYER',headline:'ONE MIND. ONE CONNECTED SYSTEM.',body:'Books. Languages. Games. Inventions. Research. Original creations connected through one front door.',cta:'EXPLORE NATHAN AI',url:URL,footer:'BY NATHAN TABOR · OUR WORD IS OUR BOND'},
{id:'library',name:'133,333,333 — Master Blueprint',palette:'stellar',style:'library',eyebrow:'THE LIBRARY MIND OF JOHN NATHAN TABOR',headline:'133,333,333 MASTER BLUEPRINT',body:'33 original departments. 33,000,000 planned book addresses. 66,666-language catalog goal. Preserve the originals. Build the future.',cta:'EXPLORE THE BLUEPRINT',url:URL,footer:'PLANNED SCALE · NOT A COUNT OF COMPLETED BOOKS'},
{id:'games',name:'Games & Puzzles',palette:'copper',style:'grid',eyebrow:'NATHAN AI 🚀 · PLAY · THINK · CREATE',headline:'GAMES & PUZZLES',body:'Original worlds, word games, strategy, mirrors, trials and creative mechanics. Explore the growing games and puzzles atlas.',cta:'EXPLORE THE GAMES',url:URL,footer:'BUILD · PLAY · LEARN · PRESERVE THE ORIGINAL'},
{id:'words',name:'MAGICAL MINDS — WORDS',palette:'glacier',style:'mirror',eyebrow:'WORDS · MAGICAL MINDS',headline:'EVERY WORD IS A CODE.',body:'LTR — RTL — on this side of the mirror — as the mirror — and on the other side of the mirror.',cta:'DISCOVER WORDS',url:URL,footer:'BY NATHAN TABOR · ORIGINAL LANGUAGE & CIPHER PROJECT'},
{id:'trinity',name:'The Tabor Trinity',palette:'sovereign',style:'orbit',eyebrow:'THE TABOR TRINITY',headline:'FIELD. PARTICLE. WAVE.',body:'THE TABORIC LIGHT · THE LIGHT OF TABOR · THE TABOR LIGHT CIPHER. The original three names, in their original order.',cta:'EXPLORE THE SERIES',url:URL,footer:'1+1=2 BUILD · 1−1=0 CLEAR'},
{id:'christmas',name:'Christmas Toy Drive — concept',palette:'glacier',style:'stars',eyebrow:'HANDLING LIFE · COMMUNITY PROJECTS',headline:'CHRISTMAS TOY DRIVE',body:'A Nathan Tabor community-project concept. Share the vision, support innocence, and discover the project. No donations are collected through this flyer.',cta:'LEARN ABOUT THE PROJECT',url:URL,footer:'PROJECT CONCEPT · NOT A DONATION CHECKOUT'}
];
const LIMITS={eyebrow:120,headline:120,body:500,cta:80,url:245,footer:160};
function text(value,max){return String(value===undefined||value===null?'':value).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max)}
function key(x,table,def){return Object.prototype.hasOwnProperty.call(table,x)?x:def}
function getPreset(id){const p=PRESETS.find(x=>x.id===id)||PRESETS[0];return {preset:p.id,palette:p.palette,format:'portrait',style:p.style,eyebrow:p.eyebrow,headline:p.headline,body:p.body,cta:p.cta,url:p.url,footer:p.footer}}
function normalize(v){
  v=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const p=getPreset(v.preset),r={...p};
  r.preset=PRESETS.some(x=>x.id===v.preset)?v.preset:p.preset;
  r.palette=key(v.palette,PALETTES,p.palette);
  r.format=key(v.format,FORMATS,'portrait');
  r.style=['orbit','grid','library','mirror','stars'].includes(v.style)?v.style:p.style;
  for(const [k,max] of Object.entries(LIMITS))r[k]=text(v[k]===undefined?p[k]:v[k],max);
  return r;
}
function xml(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function slug(v){return text(v,70).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-+$/g,'').slice(0,60)||'nathan-ai-flyer'}
function lines(value,limit,maxLines){
  const words=text(value,700).split(/\s+/).filter(Boolean),r=[];
  let row='';
  for(const word of words){
    if((row?row.length+1:0)+word.length<=limit){row=row?row+' '+word:word;continue;}
    if(row){r.push(row);row='';}
    if(word.length>limit){
      let rem=word;
      while(rem.length>limit){r.push(rem.slice(0,limit));rem=rem.slice(limit);}
      row=rem;
    }else row=word;
  }
  if(row)r.push(row);
  if(r.length>maxLines){const keep=r.slice(0,maxLines);keep[maxLines-1]=keep[maxLines-1].slice(0,Math.max(0,limit-2))+'…';return keep;}
  return r;
}
function tspans(arr,x,y,dy){return arr.map((s,i)=>'<tspan x="'+x+'" y="'+(y+i*dy)+'">'+xml(s)+'</tspan>').join('')}
function decorative(style,w,h,c){
  const mid=Math.round(w*.72),yc=Math.round(h*.32),r=Math.round(Math.min(w,h)*.24);
  if(style==='orbit')return '<g opacity=".7" fill="none" stroke="'+c.rim+'"><circle cx="'+mid+'" cy="'+yc+'" r="'+r+'" stroke-width="2"/><circle cx="'+mid+'" cy="'+yc+'" r="'+Math.round(r*.74)+'" stroke-width="1" stroke-dasharray="5 17"/><ellipse cx="'+mid+'" cy="'+yc+'" rx="'+Math.round(r*1.23)+'" ry="'+Math.round(r*.40)+'" transform="rotate(-34 '+mid+' '+yc+')" stroke-width="2"/></g><circle cx="'+Math.round(mid+r*.68)+'" cy="'+Math.round(yc-r*.7)+'" r="9" fill="'+c.accent+'"/>';
  if(style==='library')return '<g opacity=".3" fill="none" stroke="'+c.rim+'" stroke-width="3"><path d="M '+(w*.6)+' '+(h*.16)+' L '+(w*.89)+' '+(h*.11)+' L '+(w*.89)+' '+(h*.55)+' L '+(w*.6)+' '+(h*.6)+' Z"/><path d="M '+(w*.6)+' '+(h*.16)+' L '+(w*.47)+' '+(h*.12)+' L '+(w*.47)+' '+(h*.54)+' L '+(w*.6)+' '+(h*.6)+' M '+(w*.7)+' '+(h*.15)+' V '+(h*.56)+' M '+(w*.8)+' '+(h*.13)+' V '+(h*.54)+'"/></g>';
  if(style==='mirror')return '<g opacity=".27" stroke="'+c.rim+'" fill="none"><circle cx="'+mid+'" cy="'+yc+'" r="'+r+'" stroke-width="4"/><path d="M '+mid+' '+(yc-r*1.5)+' V '+(yc+r*1.5)+'" stroke-dasharray="8 16" stroke-width="5"/><path d="M '+(mid-r)+' '+yc+' L '+mid+' '+(yc-r)+' L '+(mid+r)+' '+yc+' L '+mid+' '+(yc+r)+' Z" stroke-width="3"/></g>';
  if(style==='stars')return Array.from({length:18},(_,i)=>{const x=Math.round(w*(.09+((i*43)%85)/100)),y=Math.round(h*(.11+((i*23)%43)/100)),sz=i%3+2;return '<circle cx="'+x+'" cy="'+y+'" r="'+sz+'" fill="'+c.accent+'" opacity=".52"/>'}).join('');
  return '<g opacity=".2" stroke="'+c.rim+'" stroke-width="3">'+Array.from({length:9},(_,i)=>'<path d="M '+(w*.48)+' '+(h*(.1+i*.055))+' H '+(w*.95)+'"/>').join('')+'</g>';
}
function buildSVG(input){
 const d=normalize(input),f=FORMATS[d.format],w=f.w,h=f.h,c=PALETTES[d.palette];
 const pad=Math.round(w*.071),maxW=w-2*pad,land=d.format==='landscape';
 const base=land?80:w<1100?76:92;
 const titleSize=land?66:79;
 const headlineLines=lines(d.headline,land?29:21,land?3:4);
 const bodyLines=lines(d.body,land?48:34,land?4:8);
 const eyebrowLines=lines(d.eyebrow,land?70:51,2);
 const top=Math.round(h*(land?.205:.29));
 const titleY=land?Math.round(h*.28):Math.round(h*.36);
 const bodyY=titleY+(headlineLines.length+0.25)*titleSize*1.09+Math.round(h*.028);
 const bodySize=land?29:31,bodyDy=bodySize*1.4;
 const ctaY=Math.min(Math.round(h*(land?.72:.81)),bodyY+bodyLines.length*bodyDy+Math.round(h*.045));
 const ctaH=land?68:86;
 const maxBoxW=w-pad*2,ctaW=Math.min(maxBoxW,land?530:650);
 const urlLines=lines(d.url,land?75:51,2);
 const isLight=d.palette==='parchment';
 let out='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+xml(d.headline||'Nathan AI flyer')+'">';
 out+='<defs><linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c.bg+'"/><stop offset="1" stop-color="'+c.mid+'"/></linearGradient><linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="'+c.accent+'"/><stop offset="1" stop-color="'+c.rim+'"/></linearGradient></defs>';
 out+='<rect width="'+w+'" height="'+h+'" fill="url(#background)"/>';
 out+=decorative(d.style,w,h,c);
 out+='<rect x="'+Math.round(pad*.44)+'" y="'+Math.round(pad*.44)+'" width="'+Math.round(w-pad*.88)+'" height="'+Math.round(h-pad*.88)+'" rx="24" fill="none" stroke="'+c.rim+'" stroke-opacity=".36" stroke-width="2"/>';
 out+='<path d="M '+pad+' '+Math.round(h*.135)+' H '+(w-pad)+'" stroke="'+c.rim+'" stroke-width="2" stroke-opacity=".54"/>';
 out+='<g font-family="Arial,Helvetica,sans-serif" fill="'+c.ink+'">';
 out+='<text x="'+pad+'" y="'+Math.round(h*.098)+'" font-size="'+Math.round(w*.048)+'" font-weight="800" letter-spacing="2">NATHAN AI</text>';
 out+='<text x="'+(w-pad)+'" y="'+Math.round(h*.096)+'" text-anchor="end" font-size="'+Math.round(w*.053)+'" fill="'+c.accent+'">🚀</text>';
 out+='<text x="'+pad+'" y="'+top+'" fill="'+c.accent+'" font-size="'+(land?23:24)+'" font-weight="700" letter-spacing="1.8">'+tspans(eyebrowLines,pad,top,32)+'</text>';
 out+='<text x="'+pad+'" y="'+titleY+'" font-size="'+titleSize+'" font-weight="900" letter-spacing="-2.7">'+tspans(headlineLines,pad,titleY,titleSize*1.09)+'</text>';
 out+='<text x="'+pad+'" y="'+bodyY+'" font-size="'+bodySize+'" fill="'+c.muted+'" font-weight="500">'+tspans(bodyLines,pad,bodyY,bodyDy)+'</text>';
 out+='</g>';
 out+='<rect x="'+pad+'" y="'+ctaY+'" rx="15" width="'+ctaW+'" height="'+ctaH+'" fill="url(#metal)"/>';
 out+='<text x="'+(pad+ctaW/2)+'" y="'+(ctaY+ctaH*.64)+'" font-family="Arial,Helvetica,sans-serif" font-size="'+(land?29:31)+'" text-anchor="middle" fill="'+(isLight?'#fff7ed':'#0a1825')+'" font-weight="800">'+xml(d.cta)+'</text>';
 let urlY=ctaY+ctaH+41;
 out+='<text x="'+pad+'" y="'+urlY+'" fill="'+c.muted+'" font-family="Arial,Helvetica,sans-serif" font-size="'+(land?19:22)+'">'+tspans(urlLines,pad,urlY,28)+'</text>';
 const footY=h-Math.round(h*.058);
 out+='<path d="M '+pad+' '+(footY-39)+' H '+(w-pad)+'" stroke="'+c.rim+'" opacity=".58"/>';
 out+='<text x="'+pad+'" y="'+footY+'" font-family="Arial,Helvetica,sans-serif" font-size="'+(land?18:21)+'" letter-spacing=".65" fill="'+c.accent+'">'+xml(lines(d.footer,land?98:65,1).join(' '))+'</text>';
 out+='</svg>';
 return out;
}
function exportJSON(input){return JSON.stringify({schema:SCHEMA,createdBy:'NATHAN AI Flyer Studio',data:normalize(input)},null,2)+'\n'}
function importJSON(raw){
 if(typeof raw!=='string'||raw.length>30000)throw new Error('Design file exceeds the 30 KB local import limit.');
 const obj=JSON.parse(raw);
 if(!obj||obj.schema!==SCHEMA||!obj.data||typeof obj.data!=='object'||Array.isArray(obj.data))throw new Error('Not a NATHAN AI Flyer Studio design.');
 return normalize(obj.data);
}
return {SCHEMA,FORMATS,PALETTES,PRESETS,LIMITS,getPreset,normalize,buildSVG,exportJSON,importJSON,xml,slug,lines};
});
