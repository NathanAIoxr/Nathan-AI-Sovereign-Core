/* NATHAN TABOR OCTOPUS — arena renderer, formula companion, local-first app.
   No telemetry, advertising, purchases, human targeting, or network APIs. */
(()=>{'use strict';
const G=window.OctopusArsenal,M=window.SovereignContinuum,R=window.OctopusRoot;
if(!G||!M||!R){document.body.textContent='Octopus game dependencies could not load. Check that the game, Root, and Continuum files are together.';return}
const $=id=>document.getElementById(id),KEY='tabor.octopus.arsenal.career.v1',CAL='tabor.octopus.arsenal.calibrated.v1',ROOT_KEY='tabor-octopus-root-v1',SET_KEY='tabor.octopus.arsenal.settings.v1';
let saved={},calibrated=new Set(),settings={motion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false,auto:false,sound:false},paused=false,autoTimer=0,lastTime=0,game=G.create();
try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');calibrated=new Set(JSON.parse(localStorage.getItem(CAL)||'[]').filter(id=>M.GATES.some(x=>x.id===id)));settings={...settings,...JSON.parse(localStorage.getItem(SET_KEY)||'{}')}}catch(_){saved={};calibrated=new Set()}
game=G.create(Date.now()>>>0,G.validateCareer(saved));$('motionToggle').checked=!!settings.motion;
const set=(id,value)=>{$(id).textContent=String(value)};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(game.career));localStorage.setItem(CAL,JSON.stringify([...calibrated]));localStorage.setItem(SET_KEY,JSON.stringify(settings))}catch(e){set('saveMessage','Local storage unavailable; export your progress as JSON.');}}
function download(name,text){const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800);}
function showTab(view){if(view!=='arena'&&game.mode==='playing')paused=true;
 for(const b of document.querySelectorAll('.tab')){const active=b.dataset.tab===view;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')}
 for(const p of document.querySelectorAll('.screen'))p.classList.toggle('active',p.id==='view-'+view);
 if(view==='arena')refreshOverlay();if(view==='codex')renderCodex();if(view==='workshop')renderWorkshop();if(view==='root')rootStatus();if(view==='arsenal')renderArsenal();
 window.scrollTo({top:0,behavior:settings.motion?'instant':'smooth'});
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
const canvas=$('arenaCanvas'),ctx=canvas.getContext('2d');if(!ctx)return;const W=960,H=630,cx=G.CORE.x*W,cy=G.CORE.y*H;
const stars=Array.from({length:145},(_,i)=>({x:(i*311.71+27)%W,y:(i*179.33+61)%H,r:.45+(i%4)*.35,a:.25+(i%5)*.11}));
function line(x1,y1,x2,y2,color,width=2,alpha=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.stroke();ctx.globalAlpha=1}
function circle(x,y,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function poly(x,y,r,sides,turn,color){ctx.beginPath();for(let i=0;i<=sides;i++){const a=Math.PI*2*i/sides+turn,xx=x+r*Math.cos(a),yy=y+r*Math.sin(a);if(!i)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke()}
function textAt(text,x,y,size,color='#c9f7f4',align='center',weight='bold'){ctx.font=weight+' '+size+'px system-ui';ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(text,x,y)}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,4,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#06142800');circle(x,y,r,g)}
function drawOctopus(now){
 const f=settings.motion?0:now*.0013;
 ctx.save();ctx.shadowColor='#5cefdc';ctx.shadowBlur=17;
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,reach=95+(Math.sin(f+i*1.2)*11),endX=cx+Math.cos(a)*reach,endY=cy+Math.sin(a)*reach;
 ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*27,cy+Math.sin(a)*21);ctx.bezierCurveTo(cx+Math.cos(a+.35)*82,cy+Math.sin(a+.35)*76,endX+Math.sin(f+i)*19,endY+Math.cos(f+i)*21,endX,endY);
 ctx.lineWidth=12;ctx.strokeStyle=i===game.selected?G.WEAPONS[i].color:'#1e7896';ctx.stroke();
 ctx.lineWidth=3;ctx.strokeStyle='#92f7ea';ctx.stroke();circle(endX,endY,7,'#bff9e6','#ecb974',2);
 }
 ctx.shadowBlur=18;glow(cx,cy,80,'#2da7d663');const head=ctx.createRadialGradient(cx-16,cy-20,10,cx,cy,60);head.addColorStop(0,'#65e2f3');head.addColorStop(.65,'#147b9b');head.addColorStop(1,'#0b365c');ctx.beginPath();ctx.ellipse(cx,cy,53,46,0,0,Math.PI*2);ctx.fillStyle=head;ctx.fill();ctx.strokeStyle='#a6ffee';ctx.lineWidth=4;ctx.stroke();
 circle(cx-17,cy-3,6,'#ffc979');circle(cx+17,cy-3,6,'#ffc979');ctx.beginPath();ctx.arc(cx,cy+12,13,0,Math.PI);ctx.strokeStyle='#e9ffff';ctx.lineWidth=3;ctx.stroke();
 ctx.restore();textAt('MIDDLE C',cx,cy+72,14,'#b8f5e6');textAt('INNOCENCE SANCTUARY',cx,cy-66,11,'#ffe2ac');
}
function background(t){
 ctx.clearRect(0,0,W,H);let bg=ctx.createRadialGradient(cx,cy,30,cx,cy,630);bg.addColorStop(0,'#123a56');bg.addColorStop(.43,'#08182f');bg.addColorStop(1,'#030816');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 for(let i=0;i<stars.length;i++){const s=stars[i];ctx.globalAlpha=s.a;circle(s.x,s.y,s.r,'#d5eafe')}ctx.globalAlpha=1;
 ctx.strokeStyle='#1c40605c';ctx.lineWidth=1;for(let i=0;i<W;i+=48)line(i,0,i,H,'#275173',.7,.21);
 for(let i=0;i<H;i+=48)line(0,i,W,i,'#275173',.7,.21);
 for(let r of [115,176,239,299]){ctx.beginPath();ctx.ellipse(cx,cy,r,r*.7,0,0,Math.PI*2);ctx.strokeStyle='#346f8b75';ctx.lineWidth=1.1;ctx.stroke()}
 const hue=G.currentArea(game).color;poly(cx,cy,306,8,Math.PI/8,hue+'88');
 if(game.slowTimer>0){ctx.fillStyle='#8c75e41b';ctx.fillRect(0,0,W,H);}
 for(const cl of game.clouds){glow(cl.x*W,cl.y*H,120,'#8ce9f52f');circle(cl.x*W,cl.y*H,cl.r*W,null,'#8ce9f6',1);}
 if(game.wave>0){textAt(G.currentArea(game).place.toUpperCase(),W/2,29,17,'#eec887');textAt('WAVE '+game.wave+' / '+G.MAX_WAVE,W/2,51,12,'#8edbdb')}
}
function drawEnemies(t){
 for(const e of game.enemies){const x=e.x*W,y=e.y*H,r=e.size*W*(e.type==='warden'?1.15:1);if(x<-45||y<-45||x>W+45||y>H+45)continue;
 const color=e.type==='warden'?'#f9bb78':e.type==='armored'?'#fa7f9a':e.type==='dart'?'#ca9ffc':'#f17d82';
 ctx.save();ctx.shadowColor=color;ctx.shadowBlur=e.flash>0?28:13;poly(x,y,r,e.type==='warden'?8:6,t*.0005+e.id*.7,color);circle(x,y,r*.56,e.flash>0?'#fff5ef':'#3d1635');if(e.type==='warden'){circle(x,y,r*1.25,null,'#e6c17c',2);textAt('WARDEN',x,y-r-16,12,color)}
 ctx.restore();ctx.fillStyle='#2a1424';ctx.fillRect(x-r,y-r-11,r*2,4);ctx.fillStyle=color;ctx.fillRect(x-r,y-r-11,Math.max(0,e.health/e.maxHealth)*r*2,4);
 }
}
function drawEffects(){
 for(const v of game.visuals){const alpha=Math.max(0,Math.min(1,v.t/.36));ctx.globalAlpha=alpha;const x=v.x*W,y=v.y*H;
 if(v.kind==='ring'){circle(x,y,Math.max(2,v.radius*W*(1.18-alpha*.35)),null,v.color||'#a0fff1',Math.max(1,7*alpha));}
 if(v.kind==='beam'){ctx.save();ctx.shadowBlur=16;ctx.shadowColor=v.color||'#fff';line(x,y,v.x2*W,v.y2*H,v.color||'#fff',3+8*alpha);line(x,y,v.x2*W,v.y2*H,'#ffffff',1.5);ctx.restore()}
 if(v.kind==='burst')glow(x,y,40+30*(1-alpha),v.color||'#ffb1a0');
 ctx.globalAlpha=1;}
}
function render(now=0){background(now);drawOctopus(now);drawEnemies(now);drawEffects();if(game.mode==='lost'){ctx.fillStyle='#d65a7820';ctx.fillRect(0,0,W,H)}if(game.mode==='won'){glow(cx,cy,260,'#f8db7b32')}}
function point(event){const rect=canvas.getBoundingClientRect();return {x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height}}
function nearestEnemy(){return game.enemies.slice().sort((a,b)=>Math.hypot(a.x-.5,a.y-.53)-Math.hypot(b.x-.5,b.y-.53))[0]||{x:.5,y:.2}}
function attack(at){const r=G.fire(game,game.selected,at);if(r.ok){sound(190+game.selected*52);persist()}else if(r.reason&&r.reason!=='Tentacle recharging.'){set('notice',r.reason)}refreshHud();}
canvas.addEventListener('pointerdown',event=>{if(game.mode==='playing'&&!paused){const p=point(event);attack(p);canvas.focus({preventScroll:true})}});
document.addEventListener('keydown',event=>{const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
 if(/^[1-8]$/.test(event.key)){game.selected=Number(event.key)-1;quickWeapons();refreshHud();}
 else if(event.code==='Space'&&game.mode==='playing'&&!paused){event.preventDefault();const e=nearestEnemy();attack({x:e.x,y:e.y})}
 else if(event.key.toLowerCase()==='p')togglePause();
 else if(event.key==='Enter'&&(game.mode==='ready'||game.mode==='between'))beginWave();
});
const overlay=$('arenaOverlay');
function refreshOverlay(){let title='',hint='',button='',eyebrow='';
 if(paused&&game.mode==='playing'){eyebrow='TIME IS A MOMENT';title='ARENA PAUSED';hint='Your sanctuary remains exactly where you left it.';button='RESUME DEFENSE ▶'}
 else if(game.mode==='ready'){eyebrow='READY TO BEGIN';title='ONE OCTOPUS. EIGHT TENTACLES.';hint='15 waves, five worlds, mathematical powers and a protected core.';button='START WAVE 1 ▶'}
 else if(game.mode==='between'){eyebrow='WAVE '+game.wave+' CLEARED';title='FORM MORPHS. ARCHITECTURE REMAINS.';hint='Use the Workshop between encounters to upgrade your tentacles.';button='START WAVE '+(game.wave+1)+' ▶'}
 else if(game.mode==='lost'){eyebrow='THE SANCTUARY FELL';title='NO LOSS IS FINAL';hint='Your upgrades and earned tokens remain. Try a new campaign.';button='RESTART THE CAMPAIGN'}
 else if(game.mode==='won'){eyebrow='THE MIDDLE C IS SECURE';title='CHECKMATE. INNOCENCE PROTECTED.';hint='All five worlds and fifteen waves cleared. Continue building your Root.';button='PLAY AGAIN'}
 else{overlay.classList.add('hidden');set('pauseButton','⏸ PAUSE');return}
 overlay.classList.remove('hidden');set('overlayEyebrow',eyebrow);set('overlayTitle',title);set('overlayText',hint);set('waveStart',button);set('pauseButton',paused?'▶ RESUME':'⏸ PAUSE');
}
function beginWave(){if(paused&&game.mode==='playing'){paused=false}else if(game.mode==='won'||game.mode==='lost'){const old=game.career;game=G.create(Date.now()>>>0,old);G.start(game)}else{G.start(game)}persist();refreshOverlay();refreshHud();}
$('waveStart').onclick=beginWave;
function togglePause(){if(game.mode!=='playing')return;paused=!paused;refreshOverlay();}
$('pauseButton').onclick=togglePause;
$('restartButton').onclick=()=>{if(!confirm('Start a new game run? Permanent upgrades and tokens stay saved.'))return;paused=false;game=G.create(Date.now()>>>0,game.career);persist();refreshOverlay();refreshHud();};
function quickWeapons(){
 const box=$('quickWeapons');box.replaceChildren();for(const [i,w] of G.WEAPONS.entries()){const b=document.createElement('button');b.type='button';b.className='weapon'+(game.selected===i?' active':'');b.style.setProperty('--glow',w.color);b.setAttribute('aria-pressed',game.selected===i?'true':'false');
 const glyph=document.createElement('span');glyph.className='glyph';glyph.textContent=w.symbol;const copy=document.createElement('span');const name=document.createElement('span');name.className='name';name.textContent=(i+1)+'. '+w.name;const meta=document.createElement('span');meta.className='meta';meta.textContent='Lv '+game.career.levels[i]+' · '+w.energy+' energy';if(game.cooldowns[i]>.2){meta.classList.add('charge');meta.textContent='Recharging '+game.cooldowns[i].toFixed(1)+'s';}
 copy.append(name,meta);b.append(glyph,copy);b.title=w.description+' | '+w.formula;b.onclick=()=>{game.selected=i;quickWeapons()};box.append(b);}}
function refreshHud(){const s=G.status(game);set('hullText',s.hull+'%');$('hullMeter').value=s.hull;set('energyText',s.energy);$('energyMeter').value=s.energy;set('enemyText',s.hostiles);set('scoreText',s.score.toLocaleString());set('tokensText',s.tokens.toLocaleString());set('regionTitle',s.zone);set('waveCount','WAVE '+s.wave+' / '+G.MAX_WAVE);set('walletValue',s.tokens);set('notice',game.noticeTime>0?game.notice:'');}
$('autoButton').onclick=()=>{settings.auto=!settings.auto;set('autoButton','◎ AUTO-DEFEND: '+(settings.auto?'ON':'OFF'));$('autoButton').setAttribute('aria-pressed',String(settings.auto));persist()};
$('motionToggle').onchange=e=>{settings.motion=e.target.checked;document.body.dataset.reduced=String(settings.motion);persist()};
$('autoButton').setAttribute('aria-pressed',String(settings.auto));set('autoButton','◎ AUTO-DEFEND: '+(settings.auto?'ON':'OFF'));
document.body.dataset.reduced=String(settings.motion);
let audio=null;
$('soundButton').onclick=()=>{settings.sound=!settings.sound;set('soundButton','♫ SOUND: '+(settings.sound?'ON':'OFF'));$('soundButton').setAttribute('aria-pressed',String(settings.sound));persist();if(settings.sound)sound(523)};
$('soundButton').setAttribute('aria-pressed',String(settings.sound));set('soundButton','♫ SOUND: '+(settings.sound?'ON':'OFF'));
function sound(hz){if(!settings.sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const osc=audio.createOscillator(),vol=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(hz,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(80,hz/2),audio.currentTime+.10);vol.gain.setValueAtTime(.07,audio.currentTime);vol.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);osc.connect(vol).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.14);}catch(_){}}
function frame(timestamp){const dt=Math.min(.07,(timestamp-lastTime)/1000||0);lastTime=timestamp;
 if(game.mode==='playing'&&!paused){G.step(game,dt);if(settings.auto&&game.enemies.length){autoTimer-=dt;if(autoTimer<=0){const e=nearestEnemy();attack({x:e.x,y:e.y});autoTimer=.6;}}
 if(game.mode!=='playing'){persist();refreshOverlay();}}
 if(frame.lastHud===undefined||timestamp-frame.lastHud>190){refreshHud();if(game.mode==='playing')quickCooldownLabels();frame.lastHud=timestamp}
 render(timestamp);requestAnimationFrame(frame)}
function quickCooldownLabels(){const btns=$('quickWeapons').children;G.WEAPONS.forEach((w,i)=>{const meta=btns[i]?.querySelector('.meta');if(meta){const sec=game.cooldowns[i];meta.textContent=sec>.1?'⏱ '+sec.toFixed(1)+'s':'Lv '+game.career.levels[i]+' · '+w.energy+' energy';meta.classList.toggle('charge',sec>.1)}})}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.mode==='playing'){paused=true;refreshOverlay()}});
function weaponCard(w,i,mode){
 const panel=document.createElement('article');panel.className='panel';panel.style.setProperty('--glow',w.color);
 const top=document.createElement('div');top.className='card-top';const glyph=document.createElement('span');glyph.className='glyph-large';glyph.textContent=w.symbol;const label=document.createElement('span');label.className='family';label.textContent=G.AREAS.find(a=>a.id===w.family)?.title||w.family.toUpperCase();top.append(glyph,label);
 const title=document.createElement('h3');title.textContent=w.name;const body=document.createElement('p');body.textContent=w.description;const formula=document.createElement('div');formula.className='formula';formula.textContent=w.formula;
 const foot=document.createElement('p');foot.className='footnote';foot.textContent='Level '+game.career.levels[i]+' • '+w.energy+' Root energy • '+w.cooldown+'s recharge';
 panel.append(top,title,body,formula,foot);
 if(mode==='arsenal'){const b=document.createElement('button');b.type='button';b.textContent='EQUIP ARM '+(i+1);b.onclick=()=>{game.selected=i;quickWeapons();showTab('arena')};panel.append(b)}
 if(mode==='workshop'){const cost=15+game.career.levels[i]*12,b=document.createElement('button');b.type='button';b.textContent=game.career.levels[i]>=5?'MAX LEVEL':game.career.tokens<cost?'NEED '+cost+' TOKENS':'UPGRADE • '+cost+' TOKENS';b.disabled=game.career.levels[i]>=5||game.career.tokens<cost||game.mode==='playing';b.onclick=()=>{const r=G.upgrade(game,i);if(r.ok){persist();renderWorkshop();quickWeapons();refreshHud()}else set('saveMessage',r.reason)};panel.append(b)}
 return panel;
}
function renderArsenal(){const el=$('arsenalCards');el.replaceChildren();G.WEAPONS.forEach((w,i)=>el.append(weaponCard(w,i,'arsenal')))}
function renderWorkshop(){
 const el=$('upgradeCards');el.replaceChildren();G.WEAPONS.forEach((w,i)=>el.append(weaponCard(w,i,'workshop')));
 const c=game.career;set('walletValue',c.tokens);const pairs=[['Best wave',c.bestWave+'/'+G.MAX_WAVE],['High score',c.bestScore],['Campaign victories',c.victories],['Unique gate calibrations',calibrated.size+'/25']];makeStats('careerInfo',pairs);
}
function makeStats(id,values){$(id).replaceChildren();for(const [label,value] of values){const box=document.createElement('div');box.textContent=label;const strong=document.createElement('strong');strong.textContent=String(value);box.append(strong);$(id).append(box)}}
$('exportSave').onclick=()=>download('nathan-tabor-octopus-save.json',JSON.stringify({schema:'tabor.octopus.game.v1',career:game.career,calibrated:[...calibrated],settings:{motion:settings.motion,auto:settings.auto}},null,2));
$('importSave').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>150000)throw Error('Save file too large');const d=JSON.parse(await file.text());if(d.schema!=='tabor.octopus.game.v1'||!d.career)throw Error('Not an Octopus save');if(game.mode==='playing')throw Error('Finish or restart the active encounter first');game.career=G.validateCareer(d.career);calibrated=new Set((Array.isArray(d.calibrated)?d.calibrated:[]).filter(id=>M.GATES.some(g=>g.id===id)));persist();renderWorkshop();quickWeapons();set('saveMessage','Verified local save imported; never replaces the Octopus ROOT graph.')}catch(err){set('saveMessage',err.message)}e.target.value=''};
$('resetSave').onclick=()=>{if(!confirm('Delete this browser’s Octopus Arena progress, upgrades and formula rewards? Root source data remains untouched.'))return;game=G.create(Date.now()>>>0,G.newCareer());calibrated=new Set();paused=false;persist();renderWorkshop();quickWeapons();refreshOverlay();refreshHud();set('saveMessage','Local game progress reset. Root data is unchanged.');};
let challenge=null;
function labDefaultInput(g,dir){const v=dir==='forward'?g.forward:g.backward;let candidate=v.value*1.17;if(v.value===0)candidate=g.id==='warp-wall'?11:g.id==='field-pressure'?.01:1;if(g.id==='mirror-pair'&&dir==='forward')candidate=.88;if(g.id==='mirror-pair'&&dir==='backward')candidate=.94;if(g.id==='pair-mirror'&&dir==='forward')candidate=.88;if(g.id==='pair-mirror'&&dir==='backward')candidate=.95;if(g.id==='choice-entropy'&&dir==='backward')candidate=.89;if(g.id==='pattern-pulse'&&dir==='backward')candidate=.61;if(g.id==='wave-fade'&&dir==='forward')candidate=3.4e9;if(g.id==='nerve-echo'&&dir==='backward')candidate=-.0668;return candidate}
function prepareLab(){
 const g=M.GATES.find(g=>g.id===$('labGate').value);if(!g)return;const direction=$('labDirection').value;const primary=direction==='forward'?g.forward:g.backward;
 const values={[primary.key]:labDefaultInput(g,direction)};
 let target;try{target=M.calculate(g.id,values,direction).value}catch(_){values[primary.key]=primary.value;target=M.calculate(g.id,values,direction).value}
 challenge={gate:g.id,dir:direction,input:values[primary.key],target};
 $('labInputs').replaceChildren();
 for(const p of [primary,...g.context]){const col=document.createElement('div'),lab=document.createElement('label'),i=document.createElement('input');i.type='number';i.step='any';i.dataset.key=p.key;i.id='math-'+p.key;i.value=String(p.value);lab.htmlFor=i.id;lab.textContent=p.label+(p.unit?' ('+p.unit+')':'');col.append(lab,i);$('labInputs').append(col)}
 set('labGateName',g.name);set('labFormula',g.equation);set('labBoundary','ASSUMPTION / LIMIT — '+g.boundary);set('labTarget',compact(target));set('labOutput','—');set('labStatus',calibrated.has(g.id)?'Previously calibrated. You can still practice.':'Adjust the input to match the target output within 1%.');
}
function compact(v){if(!Number.isFinite(v))return String(v);return Math.abs(v)>=1e5||(Math.abs(v)<.001&&v!==0)?v.toExponential(6):Number(v.toPrecision(8)).toLocaleString('en-US',{maximumFractionDigits:10})}
for(const g of M.GATES){const o=document.createElement('option');o.value=g.id;o.textContent=g.name+' — '+G.AREAS.find(a=>a.id===g.family)?.title;$('labGate').append(o)}
$('labGate').onchange=prepareLab;$('labDirection').onchange=prepareLab;$('labChallenge').onclick=prepareLab;
$('labHint').onclick=()=>set('labStatus','HINT: Try '+String(Number(challenge.input.toPrecision(9)))+' as the primary input. Keep the context values unchanged.');
$('labSolve').onclick=()=>{
 const g=M.GATES.find(g=>g.id===challenge.gate),values={};for(const input of $('labInputs').querySelectorAll('input')){if(input.value.trim()===''){set('labStatus','Enter '+input.dataset.key);return}values[input.dataset.key]=Number(input.value)}
 try{const r=M.calculate(g.id,values,challenge.dir),relative=Math.abs(r.value-challenge.target)/Math.max(Math.abs(challenge.target),1e-30);set('labOutput',compact(r.value));
 if(relative<=.01){if(calibrated.has(g.id)){set('labStatus','MIDDLE C VERIFIED ✓ This formula has already earned its reward.')}else{calibrated.add(g.id);G.grantCalibration(game);persist();refreshHud();set('labStatus','MIDDLE C VERIFIED ✓ New formula mastered! +4 game tokens.')}}else set('labStatus','Difference '+(relative*100).toFixed(3)+'%. Bring the forward and backward numbers together.');}
 catch(e){set('labOutput','—');set('labStatus',e.message)}};
function renderCodex(){const term=$('searchGates').value.trim().toLowerCase(),fam=$('filterFamily').value,el=$('codexCards');el.replaceChildren();
 const models=[...M.GATES.map(g=>({id:g.id,family:g.family,name:g.name,equation:g.equation,boundary:g.boundary,mode:'interactive'})),...M.DEEP_GATES.map(g=>({...g,mode:'python reference'}))];
 let count=0;for(const m of models){if(fam!=='all'&&m.family!==fam)continue;if(term&&!JSON.stringify(m).toLowerCase().includes(term))continue;count++;const p=document.createElement('article');p.className='panel';const cap=document.createElement('div');cap.className='family';cap.textContent=(G.AREAS.find(a=>a.id===m.family)?.title||m.family)+' · '+m.mode.toUpperCase();const h=document.createElement('h3');h.textContent=m.name;const f=document.createElement('div');f.className='formula';f.textContent=m.equation;const d=document.createElement('p');d.className='footnote';d.textContent=m.boundary;p.append(cap,h,f,d);if(m.mode==='interactive'){const b=document.createElement('button');b.type='button';b.textContent='CALIBRATE THIS GATE';b.onclick=()=>{$('labGate').value=m.id;prepareLab();showTab('laboratory')};p.append(b)}else{const link=document.createElement('a');link.className='linkbutton';link.href='../sovereign-continuum/advanced.py';link.textContent='VIEW PYTHON MODEL';p.append(link)}el.append(p)}
 if(!count){const p=document.createElement('p');p.textContent='No matching receptors.';el.append(p)}}
for(const a of G.AREAS){const o=document.createElement('option');o.value=a.id;o.textContent=a.title;$('filterFamily').append(o)}
$('searchGates').addEventListener('input',renderCodex);$('filterFamily').onchange=renderCodex;
function rootStatus(){let s;try{const raw=localStorage.getItem(ROOT_KEY);s=raw?R.load(raw):R.create();makeStats('rootStats',[['Stable receptors',s.nodes.length],['Tested symbolic links',s.edges.length],['Review tray',s.cookie.length],['Continuum gate nodes',s.nodes.filter(n=>n.id.startsWith('continuum:gate-')||n.id.startsWith('continuum:deep-')).length]]);}
catch(err){set('rootMessage','Root snapshot needs manual recovery: '+err.message)}}
$('refreshRoot').onclick=rootStatus;
$('graftRoot').onclick=()=>{try{const raw=localStorage.getItem(ROOT_KEY);const before=raw?R.load(raw):R.create();const result=M.graft(before,R);localStorage.setItem(ROOT_KEY,R.save(result.state));set('rootMessage','Grafted '+result.added+' new nodes and '+result.attached+' reviewed links; '+result.state.cookie.length+' prior review entries preserved.');rootStatus()}catch(e){set('rootMessage','Graft not applied: '+e.message)}};
$('installHelp').onclick=()=>set('installMessage','iPhone Safari: Share → Add to Home Screen. On compatible Android browsers: browser menu → Install app / Add to Home screen. For offline play, open the hosted game online once so local assets can cache.');
let lastAutosave=0;
function loop(now){frame(now);if(now-lastAutosave>15000&&game.mode==='playing'){persist();lastAutosave=now}} // wrapped below to avoid double raf
// Actual animation and game stepping have a single RAF, not separate loops.
function tick(now){const dt=Math.min(.07,(now-lastTime)/1000||0);lastTime=now;
 if(game.mode==='playing'&&!paused){G.step(game,dt);if(settings.auto&&game.enemies.length){autoTimer-=dt;if(autoTimer<=0){const e=nearestEnemy();attack({x:e.x,y:e.y});autoTimer=.55;}}
 if(game.mode!=='playing'){persist();refreshOverlay();}}
 if(tick.lastHud===undefined||now-tick.lastHud>200){refreshHud();if(game.mode==='playing')quickCooldownLabels();tick.lastHud=now}render(now);requestAnimationFrame(tick)}
// Page load.
renderArsenal();quickWeapons();prepareLab();refreshHud();refreshOverlay();requestAnimationFrame(tick);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
