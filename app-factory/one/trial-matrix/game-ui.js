/* ONE 33 Trial Matrix: browser presentation. No analytics endpoints or auto-upload. */
(function(){'use strict';
const game=window.OneTrialMatrix;if(!game)throw Error('Trial Matrix engine missing.');
const $=id=>document.getElementById(id);
let session=game.initial(1,8291973,false,Date.now()),selected=null,planStart=null,feedAt=null;
const labels=['Monolith','Babylon’s Gate','Rhombus of Ur','Epidaurus Acoustic','Archimedes’ Spiral'];
function button(text,fn,cls,aria){const b=document.createElement('button');b.type='button';b.textContent=text;if(cls)b.className=cls;if(aria)b.setAttribute('aria-label',aria);if(fn)b.addEventListener('click',fn);return b;}
function node(tag,text,cls){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function resetSelection(){selected=null;planStart=null;}
function newTrial(level=session.level){resetSelection();session=game.initial(level,8291973+level*101,!!$('telemetry').checked,Date.now());feedAt=level===5?Date.now()+2000:null;render();}
function chooseLevel(level){newTrial(level);}
function update(a){game.step(session,a,Date.now());resetSelection();render();}
function tap(i,coord){if(session.status!=='playing')return;
 if(selected===null){selected={i,coord};planStart=Date.now();$('selection-hint').textContent='Now select the tile to swap with';renderBoard();return;}
 const start=selected;if(session.level===4)update({type:'swap',a:start.coord,b:coord,planStartMs:planStart});else update({type:'swap',a:start.i,b:i,planStartMs:planStart});
}
function tile(value,onClick,extra='',number){let glyph=value===-1?'🧭':value===null?'':game.GLYPHS[session.level-1][value];const b=button(glyph,onClick,'tile '+extra+(selected!==null&&number===selected.i?' selected':''),number==null?undefined:'Slot '+(number+1)+(value===null?' structural void':' '+glyph));if(value===-1)b.classList.add('anchor');if(value===null){b.classList.add('void');b.disabled=true;}if(onClick===null)b.disabled=true;return b;}
function monolith(){const wrap=node('div',undefined,'tiles');session.board.forEach((v,i)=>{const playable=i<16&&v!==-1;let b=tile(v,playable?()=>tap(i):null,'',i);b.title=i===16?'The immutable compass anchor':i<16?'Choose LEFT wing: right wing auto-mirrors':'Right symmetry wing: automatic';wrap.append(b);});$('board').append(wrap);}
function makeRing(name,values,ring){const section=node('div',undefined,'ring '+name),title=node('div',name.toUpperCase()+' · '+values.length+' nodes','ring-name');section.append(title);values.forEach((v,i)=>{const b=tile(v,null,'',i);b.title=name+' node '+(i+1);const angle=-Math.PI/2+2*Math.PI*i/values.length;b.style.left=(50+43*Math.cos(angle))+'%';b.style.top=(50+43*Math.sin(angle))+'%';b.style.transform='translate(-50%,-50%)';section.append(b);});return section;}
function babylon(){const rings=node('div',undefined,'rings');rings.append(makeRing('outer',session.board.outer),makeRing('inner',session.board.inner),makeRing('core',session.board.core));$('board').append(rings);
 const p=$('ring-actions');p.hidden=false;p.replaceChildren();for(const ring of ['outer','inner'])for(const dir of [-1,1])p.append(button(ring.toUpperCase()+(dir===1?' ↻ clockwise':' ↺ counterclockwise'),()=>update({type:'rotate',ring,direction:dir})));
 p.append(node('span','Aligned radial paths: '+game.axes(session).length+'/3','small'));}
function rhombus(){const wrap=node('div',undefined,'diamond');session.board.forEach((v,i)=>wrap.append(tile(v,v===null?null:()=>tap(i),'',i)));$('board').append(wrap);}
function epidaurus(){const all=node('div',undefined,'funnel');session.board.forEach((row,r)=>{const line=node('div',undefined,'tiles'+(r===5?' bed':''));row.forEach((v,c)=>line.append(tile(v,()=>tap(r*100+c,{r,c}),'',r*100+c)));all.append(line);});$('board').append(all);}
function archimedes(){const grid=node('div',undefined,'spiral'),coordinates=new Map(game.SPIRAL.map(([r,c],i)=>[r*8+c,i]));
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){const idx=coordinates.get(r*8+c),v=session.board.chain[idx],occupied=idx<session.board.chain.length,voidSlot=idx===63;
 const onClick=occupied&&session.status==='playing'?()=>tap(idx):null;
 const b=tile(occupied?v:null,onClick,voidSlot?'maw':occupied?'':'emptied',idx);
 b.classList.remove('void');b.disabled=!occupied;b.textContent=voidSlot?'💀':occupied?game.GLYPHS[4][v]:'·';
 const x=node('small',String(idx+1));b.prepend(x);b.setAttribute('aria-label','Spiral slot '+(idx+1)+(voidSlot?' Entropy Void':'')+(occupied?' occupied':' empty'));grid.append(b);
 }$('board').append(grid);}
function renderBoard(){const b=$('board');b.replaceChildren();$('ring-actions').hidden=true;$('ring-actions').replaceChildren();
 if(session.level===1)monolith();else if(session.level===2)babylon();else if(session.level===3)rhombus();else if(session.level===4)epidaurus();else archimedes();
 $('selection-hint').textContent=selected===null?'Select '+(session.level===2?'a ring rotation':'a tile to begin'):'Choose the second tile';
}
function formatMetric(v){if(v==null)return 'Insufficient moves';if(typeof v==='number')return Number.isInteger(v)?String(v):v.toFixed(3);return String(v);}
function renderMetrics(){const el=$('metrics');el.replaceChildren();const m=game.metrics(session);
 const entries=Object.entries(m).filter(([k])=>!['schema','trialId','trialName','gameplayOnly','notStandardizedIQTest','consentOptIn','elapsedMs','moves','progress','penalties','outcome','interpretation'].includes(k));
 if(!session.telemetryEnabled){el.append(node('p','Detailed event telemetry OFF. Basic game counters remain available during play; no detailed events are stored.'));return;}
 for(const [key,value] of entries){const line=node('p',undefined,'metric');const strong=node('strong',key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())+': ');line.append(strong,node('span',value&&typeof value==='object'?JSON.stringify(value):formatMetric(value)));el.append(line);}
 if(m.interpretation)el.append(node('p',m.interpretation,'small'));
}
function render(){const def=game.LEVELS[session.level-1];$('stage-title').textContent=def.name;$('stage-tagline').textContent='“'+def.tagline+'”';$('level-tag').textContent='TRIAL 0'+session.level+' / 33 · '+def.geometry;
 const nav=$('level-nav');nav.replaceChildren();game.LEVELS.forEach(def=>{const b=button('',()=>chooseLevel(def.id));b.append(node('strong',String(def.id).padStart(2,'0')),node('span',labels[def.id-1]));if(def.id===session.level)b.setAttribute('aria-current','step');nav.append(b);});
 const stats=[['Level',String(session.level)+'/33'],['Progress',session.progress+'/'+def.goal],['Moves',session.moves+(def.moveLimit===null?'':'/'+def.moveLimit)],['Structural penalties',session.penalties]];
 $('scoreboard').replaceChildren();for(const [label,val] of stats){const x=node('div',undefined,'stat');x.append(node('strong',val),node('span',label));$('scoreboard').append(x);}
 const m=game.metrics(session);
 $('feedback').textContent=(session.status==='playing'?session.feedback||'Choose tiles or use the ring controls to begin.':session.status==='won'?'TRIAL COMPLETE — '+session.feedback:'TRIAL FAILED — '+session.feedback)
 +(session.level===5?' · Spiral occupancy '+session.board.chain.length+'/64':'');
 $('mechanics').textContent=def.detail;
 $('spec-details').replaceChildren();
 for(const [label,text] of [['Geometry',def.geometry],['Rules',def.detail],['Gameplay metric',def.metric],['Trial objective',String(def.goal)+' progress triggers (implementation target, not author-specified)']]){
  const x=node('p');x.append(node('strong',label+': '),node('span',text));$('spec-details').append(x);
 }
 if(session.level===2)$('spec-details').append(node('p','The displayed I/II/III/IV symbols follow the submitted visual labels; they are Roman-style numerals, not verified cuneiform.','technical'));
 if(session.level===5)$('spec-details').append(node('p','The entropy clock injects one tile every 2,000 ms while this level is active. Browsers may throttle timers in background tabs.','technical'));
 renderBoard();renderMetrics();
}
function downloadJSON(value,filename){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function synchronizeSpiral(){if(session.level!==5||session.status!=='playing'||feedAt==null)return;
 const now=Date.now();let n=0;while(now>=feedAt&&session.status==='playing'&&n<128){game.step(session,{type:'tick'},feedAt);feedAt+=2000;n++;}if(n)render();
}
$('telemetry').addEventListener('change',()=>{if(session.moves||session.progress||session.level===5&&session.board.ticks){$('feedback').textContent='Detailed telemetry preference changed. Press Restart trial to apply the new setting.';return;}newTrial();});
$('new-session').addEventListener('click',()=>newTrial());
$('export').addEventListener('click',()=>{const result=game.save(session);downloadJSON(result,'ONE_33_Trial_Matrix_Epoch_I_Level_'+session.level+'_save.json');});
$('import').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>1024*1024)throw Error('Save file too large (1 MB limit)');session=game.restore(JSON.parse(await f.text()));$('telemetry').checked=session.telemetryEnabled;resetSelection();feedAt=session.level===5?Date.now()+2000:null;render();}
 catch(err){$('feedback').textContent='Save import failed: '+(err.message||String(err));}finally{e.target.value='';}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)synchronizeSpiral();});
setInterval(()=>synchronizeSpiral(),250);
render();
})();