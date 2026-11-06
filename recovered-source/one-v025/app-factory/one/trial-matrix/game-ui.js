/* ONE 33 Trial Matrix: browser presentation. No analytics endpoints or auto-upload. */
(function(){'use strict';
const game=window.OneTrialMatrix;if(!game)throw Error('Trial Matrix engine missing.');
const $=id=>document.getElementById(id);
const profiles=window.TrialProfile,storageKey='one.private.v025.progress.v1';
function validateEnvelope(data){
 if(data?.schema!=='one.33trial.progress.v1')throw Error('Unknown progress file');
 const profile=profiles.validate(data.profile),session=game.restore(data.save);
 if(data.clock!==undefined){if(session.level!==5)throw Error('Unexpected spiral clock');window.OneActiveClock.create(0,data.clock);}
 return {...data,profile,save:{...data.save,session}};
}
function sameSave(a,b){const content=data=>JSON.stringify({...data,save:{...data.save,exportedAt:null}});return content(a)===content(b);}
const saves=window.OneSaveStore.create({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},storageKey,validateEnvelope,{equal:sameSave});
let stored=saves.load(),profile=stored.data?.profile||profiles.initial(),storageWarning='',savedSession=stored.data?.save.session||null;
let session=savedSession||game.initial(profiles.next(profile),8291973,false,Date.now(),{mode:'campaign',difficulty:'tactician'}),selected=null,planStart=null,hintMove=null;
let manualPause=!!savedSession&&session.level===5,clock=window.OneActiveClock.create(performance.now(),{remaining:stored.data?.clock?.remaining||2000,paused:manualPause||document.hidden});
function paused(){return session.level===5&&clock.snapshot().paused;}
function storageStatus(result){
 stored=result;storageWarning=result.status==='damaged'?'Local save could not be loaded. Its original bytes are preserved. Recover the previous autosave or import a backup.':result.status==='unavailable'?'Browser storage unavailable. Use Export JSON to keep your progress.':'';
 $('recover-save').disabled=!result.backupAvailable;$('damaged-save').hidden=saves.damagedText()===null;
 $('storage-status').textContent=storageWarning;
}
storageStatus(stored);
$('telemetry').checked=session.telemetryEnabled;
function syncSettings(){ $('play-mode').value=session.strategy?'campaign':'practice';$('difficulty').value=session.strategy?.difficulty||'tactician';$('puzzle-seed').value=session.seed; }
syncSettings();
function envelope(){return {schema:'one.33trial.progress.v1',profile,save:game.save(session),...(session.level===5?{clock:clock.snapshot()}:{})};}
function persist(options){storageStatus(saves.write(envelope(),options));}
function settle(){const reward=profiles.award(profile,session,game.LEVELS[session.level-1]);if(reward.earned)session.feedback+=' Earned '+reward.coins+' coins and '+reward.gems+' gems.';persist();}

function button(text,fn,cls,aria){const b=document.createElement('button');b.type='button';b.textContent=text;if(cls)b.className=cls;if(aria)b.setAttribute('aria-label',aria);if(fn)b.addEventListener('click',fn);return b;}
function node(tag,text,cls){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function resetSelection(){selected=null;planStart=null;hintMove=null;}
function newTrial(level=session.level,settings={}){
 const mode=settings.mode||$('play-mode').value,difficulty=settings.difficulty||$('difficulty').value;
 let seed=settings.seed??Number($('puzzle-seed').value);if(!Number.isInteger(seed)||seed<0||seed>4294967295){$('feedback').textContent='Use an integer seed from 0 to 4294967295.';return;}
 const daily=settings.daily||null;if(daily)seed=game.strategy.dailySeed(daily,level,difficulty);
 resetSelection();session=game.initial(level,seed,!!$('telemetry').checked,Date.now(),{mode,difficulty,daily});manualPause=false;clock=window.OneActiveClock.create(performance.now(),{paused:document.hidden});syncSettings();persist();render();
}
function chooseLevel(level){newTrial(level);}
function update(a){
 if(paused())return;const focus=document.activeElement?.dataset.slot;
 try{const next=game.restore(game.save(session));game.step(next,a,Date.now());session=next;resetSelection();settle();render();if(focus!==undefined)$('board').querySelector('[data-slot="'+focus+'"]:not(:disabled)')?.focus({preventScroll:true});}
 catch(err){$('feedback').textContent='Move could not be completed: '+err.message+'. Your previous board and save are preserved.';}
}
function tap(i,coord){if(session.status!=='playing'||paused())return;
 if(selected?.i===i){resetSelection();renderBoard();$('selection-hint').textContent='Selection cleared. Choose another tile.';return;}
 if(selected===null){selected={i,coord};planStart=Date.now();$('selection-hint').textContent='Now select the tile to swap with';renderBoard();return;}
 const start=selected;if(session.level===4)update({type:'swap',a:start.coord,b:coord,planStartMs:planStart});else update({type:'swap',a:start.i,b:i,planStartMs:planStart});
}
function tile(value,onClick,extra='',number){let glyph=value===-1?'🧭':value===null?'':game.GLYPHS[Math.min(session.level-1,4)][value];const b=button(glyph,onClick,'tile '+extra+(selected!==null&&number===selected.i?' selected':''),number==null?undefined:'Slot '+(number+1)+(value===null?' structural void':' '+glyph));if(value===-1)b.classList.add('anchor');if(value===null){b.classList.add('void');b.disabled=true;}if(onClick===null)b.disabled=true;if(number!==undefined)b.dataset.slot=number;return b;}
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
function expanded(){
 const b=session.board,grid=node('div',undefined,'expanded-board');grid.style.setProperty('--columns',b.cols);
 for(let i=0;i<b.cells.length;i++){
  const p=game.expansion.presentation(session,i,selected?.i===i||hintMove?.a===i||hintMove?.b===i),tileButton=button(p.text,()=>tap(i),'tile'+(p.void?' void':'')+(selected?.i===i?' selected':'')+(hintMove?.a===i||hintMove?.b===i?' hinted':'')+(session.strategy?.intent?.hits.includes(i)?' threatened':''));
  tileButton.disabled=p.disabled||session.status!=='playing';tileButton.setAttribute('aria-label','Row '+(Math.floor(i/b.cols)+1)+', column '+(i%b.cols+1)+': '+p.text+(p.disabled?' (fixed)':''));tileButton.dataset.slot=i;
  if(p.ink)tileButton.style.color=p.ink;
  if(session.level===10){tileButton.style.borderColor=['#efdba9','#83d3e5','#ccafff'][(Math.floor(i/b.cols/3)+Math.floor(i%b.cols/3))%3];}
  if(session.level===24){if(i%b.cols===4)tileButton.style.marginLeft='6px';if(Math.floor(i/b.cols)===4)tileButton.style.marginTop='6px';}
  grid.append(tileButton);
 }
 $('board').append(grid);$('board').append(node('p',game.expansion.status(session),'help'));
 const actions=$('ring-actions');actions.hidden=false;
 if(session.level===8)actions.append(button(b.revealed?'Hide symbols':'Study symbols (free)',()=>update({type:'study'})));
 if(session.level===23)for(const phase of [0,1]){const control=button((phase?'Dark':'Light')+' state',()=>update({type:'phase',phase}));control.setAttribute('aria-pressed',String(b.phase===phase));actions.append(control);}
 if(session.level===26)actions.append(button(b.inspect?'Hide weights':'Inspect weights (free)',()=>update({type:'inspect'})));
}
function syncDock(){ $('dock-play').disabled=!hintMove||session.status!=='playing';$('dock-hint').disabled=session.status!=='playing';$('dock-opponent').hidden=!session.strategy; }
function bindBoardInput(){for(const b of $('board').querySelectorAll('button[data-slot]'))b.setAttribute('aria-pressed',String(selected?.i===Number(b.dataset.slot)));}
function neighborByDirection(start,dx,dy){
 const origin=start.getBoundingClientRect(),ox=origin.x+origin.width/2,oy=origin.y+origin.height/2;
 let best=null,rank=Infinity;for(const b of $('board').querySelectorAll('button[data-slot]:not(:disabled)')){if(b===start)continue;const r=b.getBoundingClientRect(),x=r.x+r.width/2-ox,y=r.y+r.height/2-oy,forward=x*dx+y*dy,side=Math.abs(x*dy-y*dx);if(forward<=1||side>forward*.65)continue;const score=forward+side*3;if(score<rank){rank=score;best=b;}}
 return best;
}
$('board').addEventListener('keydown',e=>{
 const start=e.target.closest('button[data-slot]');if(!start||paused())return;
 const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
 if(direction){e.preventDefault();neighborByDirection(start,...direction)?.focus({preventScroll:true});}
 if(e.key==='Home'||e.key==='End'){e.preventDefault();const tiles=[...$('board').querySelectorAll('button[data-slot]:not(:disabled)')];(e.key==='Home'?tiles[0]:tiles.at(-1))?.focus({preventScroll:true});}
 if(e.key==='Escape'){e.preventDefault();const slot=start.dataset.slot;resetSelection();renderBoard();$('board').querySelector('[data-slot="'+slot+'"]')?.focus({preventScroll:true});}
});
let pointer=null,suppressPointerClick=false;
$('board').addEventListener('pointerdown',e=>{const tile=e.target.closest('button[data-slot]:not(:disabled)');if(!tile||e.button!==0||paused()||session.status!=='playing')return;suppressPointerClick=false;pointer={id:e.pointerId,slot:Number(tile.dataset.slot),x:e.clientX,y:e.clientY,tile};tile.setPointerCapture?.(e.pointerId);});
$('board').addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=pointer;pointer=null;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.hypot(dx,dy)<14)return;
 suppressPointerClick=true;let target=document.elementFromPoint(e.clientX,e.clientY)?.closest('#board button[data-slot]:not(:disabled)');if(!target||target===p.tile)target=neighborByDirection(p.tile,...(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]));
 if(!target)return;const a=p.slot,b=Number(target.dataset.slot);resetSelection();update(session.level===4?{type:'swap',a:{r:Math.floor(a/100),c:a%100},b:{r:Math.floor(b/100),c:b%100}}:{type:'swap',a,b});
});
$('board').addEventListener('pointercancel',()=>{pointer=null;});
$('board').addEventListener('click',e=>{if(suppressPointerClick&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();suppressPointerClick=false;}},true);
function renderBoard(){const b=$('board');b.replaceChildren();$('ring-actions').hidden=true;$('ring-actions').replaceChildren();
 if(session.level===1)monolith();else if(session.level===2)babylon();else if(session.level===3)rhombus();else if(session.level===4)epidaurus();else if(session.level===5)archimedes();else expanded();
 bindBoardInput();
 if(paused())b.querySelectorAll('button').forEach(tile=>{tile.disabled=true;});
 b.setAttribute('aria-disabled',String(paused()));
 syncDock();
 $('transmute').disabled=!session.strategy||session.level<6||!selected||session.strategy.focus<3||session.strategy.abilityUsed||session.status!=='playing';
 if(selected)$('board').querySelector('[data-slot="'+selected.i+'"]')?.focus({preventScroll:true});
 $('selection-hint').textContent=selected===null?'Select '+(session.level===2?'a ring rotation':'a tile to begin'):'Choose the second tile';
}
function formatMetric(v){if(v==null)return 'Insufficient moves';if(typeof v==='number')return Number.isInteger(v)?String(v):v.toFixed(3);return String(v);}
function renderMetrics(){const el=$('metrics');el.replaceChildren();const m=game.metrics(session);
 const entries=Object.entries(m).filter(([k])=>!['schema','trialId','trialName','gameplayOnly','notStandardizedIQTest','consentOptIn','elapsedMs','moves','progress','penalties','outcome','interpretation'].includes(k));
 if(!session.telemetryEnabled){el.append(node('p','Detailed move log is off. Completion and combat counters remain available locally.'));return;}
 for(const [key,value] of entries){const line=node('p',undefined,'metric');const strong=node('strong',key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())+': ');line.append(strong,node('span',value&&typeof value==='object'?JSON.stringify(value):formatMetric(value)));el.append(line);}
 if(m.interpretation)el.append(node('p',m.interpretation,'small'));
}
const stanceText={balanced:'Full base damage. Preserve flexibility while learning the guardian.',precision:'Opening runs of 4+ deal 30% more damage; smaller openings deal 10% less.',cascade:'Bonus damage when the turn scores more than the opening clear alone; weaker single clears.',fortify:'Gain 5 shield per board turn; deal 25% less damage.'};
function prepareHint(action){
 if(paused())return;
 hintMove=action;if(session.level===23&&action.phase!==undefined)game.step(session,{type:'phase',phase:action.phase},Date.now());
 selected=null;planStart=null;renderBoard();$('feedback').textContent='Plan: '+game.strategy.actionText(action)+'.';$('apply-hint').disabled=false;persist();
}
function renderAnalysis(){
 const list=$('analysis-list');list.replaceChildren();if(!session.strategy||!$('analysis-panel').open)return;
 const moves=game.analyze(session).slice(0,5);
 if(!moves.length){list.append(node('p',session.level===8&&!session.board.revealed?'Study the symbols to compare visible moves.':'No opening clear is currently available. A setup move or the next spiral feed may be needed.'));return;}
 for(const move of moves){const b=button(game.strategy.actionText(move.action),()=>prepareHint(move.action));b.disabled=paused();b.append(node('small',move.tiles+' opening tiles · '+(move.objective===null?'unknown weight':move.objective+' objective points')+(move.denies?' · contests the guardian’s marked match':'')+(move.contractGain?' · advances mastery contract':'')));list.append(b);}
}
function renderGuide(){
 const guide=game.strategy.GUIDES[session.level-1],el=$('field-guide');$('guide-title').textContent=game.LEVELS[session.level-1].name;el.replaceChildren();
 for(const [title,text] of [['Opening plan',guide.opening],['Advanced counterplay',guide.advanced],['Mastery contract',guide.contract]]){const card=node('div',undefined,'guide-card');card.append(node('h3',title),node('p',text));el.append(card);}
}
const temperaments={Collector:'Takes the largest opening clear.',Saboteur:'Targets your objective points and contract opportunities.',Architect:'Prioritizes longer and multiple simultaneous matches.',Echo:'Chases the symbol you cleared most recently. Bait it with your choice of opening.'};
function renderCampaign(){
 const t=session.strategy;$('campaign-panel').hidden=!t;
 $('run-label').textContent=(t?game.strategy.DIFFICULTIES[t.difficulty].name+' campaign':'Classic practice')+' · seed '+session.seed+(t?.daily?' · Daily '+t.daily+' UTC':'');
 renderGuide();if(!t)return;
 const guide=game.strategy.GUIDES[session.level-1],phase=game.strategy.phase(session);
 $('hero-health').textContent=t.health+' / '+t.maxHealth+' health';$('hero-bar').max=t.maxHealth;$('hero-bar').value=t.health;
 $('guardian-name').textContent=guide.guardian;$('guardian-bar').max=t.guardianMax;$('guardian-bar').value=t.guardianHealth;
 $('guardian-health').textContent=t.guardianHealth+' / '+t.guardianMax+' health';$('focus-status').textContent=t.focus+'/6 focus · '+t.shield+' shield · '+t.heroTurns+'/'+t.limit+' player turns';$('hero-stance').textContent=t.stance;
 $('guardian-mark').textContent=['◈','⌬','✦'][Math.floor((session.level-1)/11)];$('boss-phase').textContent=guide.boss?'BOSS · PHASE '+phase:'EPOCH '+game.LEVELS[session.level-1].epoch;
 const intent=t.intent?game.strategy.actionText(t.intent.action)+' · '+t.intent.tiles+' opening tiles':'No strike available.';
 $('guardian-intent').textContent=t.guardianHealth===0?'Guardian defeated. Finish the board objective.':guide.temperament+' · '+temperaments[guide.temperament]+' Intent: '+intent+(guide.boss?' · Shield: '+game.strategy.SYMBOLS[(session.level+phase-1)%4]:'')+(t.difficulty==='story'?' · Acts every second player turn.':'');
 const value=game.strategy.contractValue(session);$('contract-status').textContent='Mastery '+Math.min(value,guide.target)+'/'+guide.target+' · '+guide.contract+(value>=guide.target?' ✓ Achieved':' (optional)');
 $('stance-help').textContent=stanceText[t.stance];$('stances').replaceChildren();for(const stance of Object.keys(stanceText)){const b=button(stance[0].toUpperCase()+stance.slice(1),()=>update({type:'stance',stance}));b.setAttribute('aria-pressed',String(t.stance===stance));b.disabled=session.status!=='playing';$('stances').append(b);}
 $('forecasts').replaceChildren();for(let symbol=0;symbol<4;symbol++){const b=button(game.strategy.SYMBOLS[symbol],()=>update({type:'forecast',symbol}));b.setAttribute('aria-pressed',String(t.forecast===symbol));b.setAttribute('aria-label','Forecast symbol '+game.strategy.SYMBOLS[symbol]);b.disabled=t.forecast!==null||session.status!=='playing';$('forecasts').append(b);}
 for(const [id,cost] of [['ward',3],['gambit',2]])$(id).disabled=t.abilityUsed||t.focus<cost||session.status!=='playing';
 $('combat-log').replaceChildren();t.log.slice().reverse().forEach(line=>$('combat-log').append(node('li',line)));renderAnalysis();
}
function render(){const def=game.LEVELS[session.level-1];$('stage-title').textContent=def.name;$('stage-tagline').textContent='“'+def.tagline+'”';$('level-tag').textContent='EPOCH '+def.epoch+' · TRIAL '+String(session.level).padStart(2,'0')+' / 33 · '+def.geometry;
 $('hint').disabled=session.status!=='playing';
 $('apply-hint').disabled=!hintMove;
 const nav=$('level-nav');nav.replaceChildren();game.LEVELS.forEach(def=>{const b=button('',()=>chooseLevel(def.id));b.append(node('strong',String(def.id).padStart(2,'0')),node('span',def.name));if(def.id===session.level)b.setAttribute('aria-current','step');if(profile.completed.includes(def.id))b.append(node('small','★'.repeat(profile.stars[def.id])+' Complete'));if(profile.mastery?.[def.id])b.append(node('small',['','Explorer','Tactician','Grandmaster'][profile.mastery[def.id].rank]+' mastered'+(profile.mastery[def.id].contract?' · ◈':'')));nav.append(b);});
 $('wallet').textContent='Free starter gift included · '+profile.coins+' coins · '+profile.gems+' gems · '+Object.values(profile.stars).reduce((a,b)=>a+b,0)+' stars · '+profile.completed.length+'/33 completed. All stages, hints and retries are free.';
 $('storage-status').textContent=storageWarning;
 $('continue').textContent='Continue → Trial '+profiles.next(profile);
 const stats=[['Level',String(session.level)+'/33'],['Progress',session.progress+'/'+def.goal],['Moves',session.strategy?session.strategy.heroTurns+'/'+session.strategy.limit:session.moves+(def.moveLimit===null?'':'/'+def.moveLimit)],['Structural penalties',session.penalties]];
 $('scoreboard').replaceChildren();for(const [label,val] of stats){const x=node('div',undefined,'stat');x.append(node('strong',val),node('span',label));$('scoreboard').append(x);}
 const m=game.metrics(session);
 $('feedback').textContent=(session.status==='playing'?session.feedback||'Choose tiles or use the ring controls to begin.':session.status==='won'?'TRIAL COMPLETE — '+session.feedback:'TRIAL FAILED — '+session.feedback)
 +(session.level===5?' · Spiral occupancy '+session.board.chain.length+'/64':'');
 $('mechanics').textContent=def.detail;
 $('spec-details').replaceChildren();
 for(const [label,text] of [['Geometry',def.geometry],['Rules',def.detail],['Gameplay metric',def.metric],['Trial objective',String(def.goal)+(session.level===10?' rooms':session.level===33?' seals':session.level>=6?' objective points':' structural matches')]]){
  const x=node('p');x.append(node('strong',label+': '),node('span',text));$('spec-details').append(x);
 }
 if(session.level===2)$('spec-details').append(node('p','The displayed I/II/III/IV symbols follow the submitted visual labels; they are Roman-style numerals, not verified cuneiform.','technical'));
 if(session.level===5)$('spec-details').append(node('p','The entropy clock injects one tile every 2,000 ms of active play. Pause freezes the board and feed. Hidden tabs pause automatically; saved spiral sessions reopen paused.','technical'));
 renderBoard();renderMetrics();renderCampaign();
 renderClock();renderResult();
}
function renderResult(){
 const ended=session.status!=='playing';$('result-panel').hidden=!ended;if(!ended)return;
 const won=session.status==='won',t=session.strategy,def=game.LEVELS[session.level-1];
 $('result-title').textContent=won?'Trial complete · '+def.name:'Plan the next attempt';
 $('result-summary').textContent=(t?t.heroTurns+' player turns · '+t.health+'/'+t.maxHealth+' health':session.moves+' moves')+' · '+session.score+' score · '+Math.min(session.progress,def.goal)+'/'+def.goal+' objective'+(t?' · '+t.guardianHealth+'/'+t.guardianMax+' guardian health remaining':'')+'.';
 $('result-advice').textContent=won?(t?(game.strategy.contractValue(session)>=game.strategy.GUIDES[session.level-1].target?'Mastery contract achieved. ':'Guardian defeated. ')+game.strategy.DIFFICULTIES[t.difficulty].name+' medal earned. Try another difficulty or continue.':'Progress and earned rewards recorded. Continue or replay for more stars.'):(session.level===5&&session.board.chain.length>=64?'The entropy void filled. Clear near the head, use the free setup hint, and pause whenever you need planning time.':t&&t.health===0?'Try Fortify and Ward before the guardian strikes. Contest its marked opening to limit committed attacks.':t?'The player-turn budget ended. Compare opening moves in the strategy lab, use Precision for long runs and track the board objective alongside guardian health.':'The move budget ended. Compare the field guide with the board objective, then retry the same seed to refine your plan.');
 $('result-next').hidden=!won;$('result-next').textContent=session.level<33?'Next trial → '+String(session.level+1).padStart(2,'0'):'Explore the 33-stage atlas';
}
$('result-next').addEventListener('click',()=>{if(session.level<33){newTrial(session.level+1);$('board-panel').scrollIntoView({behavior:'instant'});}else{$('level-nav').scrollIntoView({behavior:'instant'});$('level-nav').querySelector('button')?.focus();}});
$('result-retry').addEventListener('click',()=>$('new-session').click());
function downloadJSON(value,filename){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function feedTicks(ticks){let n=0;while(n<ticks&&session.status==='playing'){game.step(session,{type:'tick'},Date.now());n++;}if(n){resetSelection();settle();render();}}
function renderClock(){
 $('pause-spiral').hidden=session.level!==5;$('pause-spiral').disabled=session.status!=='playing';$('pause-spiral').textContent=paused()?'Resume spiral':'Pause spiral';
 $('clock-note').hidden=session.level!==5;$('clock-note').textContent=session.status!=='playing'?'Entropy clock stopped.':paused()?'PAUSED · Board and entropy feed are frozen.':'Next feed in '+(clock.snapshot().remaining/1000).toFixed(1)+'s · Pauses when this tab is hidden.';
 if(paused()){for(const id of ['hint','apply-hint','dock-hint','dock-play','ward','gambit','transmute'])$(id).disabled=true;document.querySelectorAll('#stances button,#forecasts button,#analysis-list button').forEach(b=>{b.disabled=true;});}
}
function synchronizeSpiral(){if(session.level!==5||session.status!=='playing')return;feedTicks(clock.advance(performance.now()));renderClock();}
$('pause-spiral').addEventListener('click',()=>{if(session.level!==5||session.status!=='playing')return;if(paused()){manualPause=false;clock.resume(performance.now());}else{manualPause=true;feedTicks(clock.pause(performance.now()));}resetSelection();persist();render();});
$('telemetry').addEventListener('change',()=>{if(session.moves||session.progress||session.level===5&&session.board.ticks){$('feedback').textContent='Detailed telemetry preference changed. Press Restart trial to apply the new setting.';return;}newTrial();});
$('new-session').addEventListener('click',()=>newTrial(session.level,{seed:session.seed,mode:session.strategy?'campaign':'practice',difficulty:session.strategy?.difficulty||'tactician',daily:session.strategy?.daily}));
$('start-run').addEventListener('click',()=>newTrial());
$('new-puzzle').addEventListener('click',()=>newTrial(session.level,{seed:crypto.getRandomValues(new Uint32Array(1))[0]}));
$('daily-run').addEventListener('click',()=>newTrial(session.level,{mode:'campaign',daily:new Date().toISOString().slice(0,10)}));
$('ward').addEventListener('click',()=>update({type:'ability',name:'ward'}));
$('gambit').addEventListener('click',()=>update({type:'ability',name:'gambit'}));
$('transmute').addEventListener('click',()=>{if(selected)update({type:'ability',name:'transmute',slot:selected.i});});
$('analysis-panel').addEventListener('toggle',renderAnalysis);
$('dock-hint').addEventListener('click',()=>{$('hint').click();$('board-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
$('dock-play').addEventListener('click',()=>$('apply-hint').click());
new MutationObserver(()=>{$('board-feedback').textContent=$('feedback').textContent;}).observe($('feedback'),{childList:true,subtree:true,characterData:true});
$('continue').addEventListener('click',()=>newTrial(profiles.next(profile)));
$('hint').addEventListener('click',()=>{
 if(paused())return;
 hintMove=game.hint(session);
 if(!hintMove){$('apply-hint').disabled=true;syncDock();$('feedback').textContent='No visible match available. Study hidden memory tiles, prepare a setup move, or wait for the spiral feed.';return;}
 if(session.level===23)game.step(session,{type:'phase',phase:hintMove.phase},Date.now());
 selected=null;planStart=null;renderBoard();
 const position=v=>typeof v==='object'?'row '+(v.r+1)+', column '+(v.c+1):'slot '+(v+1);
 $('feedback').textContent=hintMove.type==='rotate'?'Free hint: rotate '+hintMove.ring+' '+(hintMove.direction===1?'clockwise':'counterclockwise')+'.':'Free hint: swap '+position(hintMove.a)+' with '+position(hintMove.b)+'.';
 $('apply-hint').disabled=false;
});
$('apply-hint').addEventListener('click',()=>{if(!hintMove)return;const action=hintMove;hintMove=null;update(action);$('apply-hint').disabled=true;});
$('export').addEventListener('click',()=>{downloadJSON(envelope(),'PRIVATE_ONE_v025_THE_33_Level_'+session.level+'_progress.json');});
$('recover-save').addEventListener('click',()=>{const result=saves.recover();storageStatus(result);if(result.data){applyRestored(result.data);render();$('feedback').textContent='Previous autosave recovered. Current valid save is retained as the alternate recovery copy.';}});
$('damaged-save').addEventListener('click',()=>{const text=saves.damagedText();if(text===null)return;const blob=new Blob([text],{type:'text/plain'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='PRIVATE_ONE_v025_preserved_save.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function applyRestored(data){session=game.restore(data.save);profile=profiles.validate(data.profile);manualPause=session.level===5&&(data.clock?.paused??true);clock=window.OneActiveClock.create(performance.now(),{remaining:data.clock?.remaining||2000,paused:manualPause||document.hidden});syncSettings();$('telemetry').checked=session.telemetryEnabled;resetSelection();}
$('import').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>1024*1024)throw Error('Save file too large (1 MB limit)');const data=JSON.parse(await f.text()),next=data.schema==='one.33trial.progress.v1'?validateEnvelope(data):{schema:'one.33trial.progress.v1',profile,save:{...data,session:game.restore(data)}};applyRestored(next);if(session.level===5&&!data.clock){manualPause=false;clock.resume(performance.now());}profiles.award(profile,session,game.LEVELS[session.level-1]);persist({replaceDamaged:true});render();}
 catch(err){$('feedback').textContent='Save import failed: '+(err.message||String(err));}finally{e.target.value='';}});
document.addEventListener('visibilitychange',()=>{if(session.level!==5||session.status!=='playing')return;if(document.hidden){feedTicks(clock.pause(performance.now()));persist();}else if(!manualPause){clock.resume(performance.now());}resetSelection();render();});
window.addEventListener('pagehide',()=>{if(session.level===5)feedTicks(clock.pause(performance.now()));persist();});
setInterval(()=>synchronizeSpiral(),250);
render();
if(stored.status!=='damaged'&&stored.status!=='unavailable'){settle();render();}
})();
