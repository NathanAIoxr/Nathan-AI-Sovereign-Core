/* Private ONE v025 A–Z Studio: native input, bounded animation, read-only inspector. */
(function(){'use strict';
const engine=window.StudioMatch3,architecture=window.StructuralGateway,$=id=>document.getElementById(id);
const KEY='one.private.v025.studio.v1',GLYPHS=['◇','○','△','□','⬡','✦'],NAMES=['cyan diamond','violet circle','gold triangle','jade square','coral hexagon','silver star'],COLORS=['#70e5ed','#cca5ff','#ffdb91','#8fe2b6','#ffabb7','#d9e8fc'],POWER_MARK={row:'↔',column:'↕',blast:'✹',spectrum:'✺'};
let state=engine.initial(),meta={wins:0,best:0},recorded=false,selected=null,hint=null,locked=false,pointer=null,suppressPointerClick=false,storage='available',storageMessage='',audio=null;
const observed={pointerSwaps:0,animatedTurns:0},motion=matchMedia('(prefers-reduced-motion: reduce)');
function validateEnvelope(data){if(data?.schema!=='one.v025.studio.app.v1')throw Error('Unknown Studio progress file');const next=engine.restore(data.save);if(!data.meta||!Number.isSafeInteger(data.meta.wins)||data.meta.wins<0||!Number.isSafeInteger(data.meta.best)||data.meta.best<0||typeof data.recorded!=='boolean'||data.recorded&&next.status!=='won')throw Error('Invalid local run records');return {...data,meta:{...data.meta},save:{...data.save}};}
const saves=window.OneSaveStore.create({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},KEY,validateEnvelope);
const loaded=saves.load();if(loaded.data){state=engine.restore(loaded.data.save);meta=loaded.data.meta;recorded=loaded.data.recorded;}
function storageStatus(result){storage=result.status==='saved'||result.status==='loaded'||result.status==='empty'?'available':result.status==='damaged'?'preserved malformed save':'unavailable';storageMessage=result.status==='damaged'?'Existing save could not be loaded and has not been overwritten. Recover the previous autosave or import a backup.':result.status==='unavailable'?'Browser storage unavailable. Play remains available; use Export game JSON for a backup.':'';$('recover-save').disabled=locked||!result.backupAvailable;$('damaged-save').hidden=saves.damagedText()===null;$('storage-note').textContent=storageMessage;}
storageStatus(loaded);
function element(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function say(text){$('status').textContent=text;}
function envelope(){return {schema:'one.v025.studio.app.v1',save:engine.save(state),meta,recorded};}
function persist(options){storageStatus(saves.write(envelope(),options));}
function recordOutcome(){meta.best=Math.max(meta.best,state.score);if(state.status==='won'&&!recorded){meta.wins++;recorded=true;}}
function renderHUD(){
 $('score').textContent=state.score;$('target').textContent=state.goal;$('turns').textContent=state.moves+'/'+state.budget;$('run-wins').textContent=meta.wins;$('seed').value=state.seed;
 $('motion').textContent=motion.matches?'Reduced motion: animation is bypassed; rules are unchanged.':'Animated swaps and cascades. Your system’s reduced-motion preference is respected.';
 for(const id of ['hint','retry','start','random','import-save'])$(id).disabled=locked||(id==='hint'&&state.status!=='playing');
 $('play-hint').disabled=locked||!hint||state.status!=='playing';$('board').querySelectorAll('button').forEach(b=>{b.disabled=locked||state.status!=='playing';});$('board').setAttribute('aria-busy',String(locked));
 $('recover-save').disabled=locked||!saves.load().backupAvailable;
 const stats=$('run-stats');stats.replaceChildren();for(const [name,value] of Object.entries(state.stats))stats.append(element('p',name.replace(/([A-Z])/g,' $1')+': '+value));stats.append(element('p','Best local score: '+meta.best));
 $('storage-note').textContent=storageMessage;
}
function renderBoard(board=state.board,classes={}){
 const fragment=document.createDocumentFragment();
 board.forEach((tile,i)=>{
  const b=element('button',undefined,'gem'+(selected===i?' selected':'')+(hint&&(hint.a===i||hint.b===i)?' hinted':'')+(classes.clear?.includes(i)?' clearing':'')+(classes.arrive?' arriving':''));
  b.type='button';b.dataset.cell=i;b.dataset.id=tile.id;b.dataset.power=tile.power||'';b.style.setProperty('--gem',COLORS[tile.value]);b.disabled=locked||state.status!=='playing';
  b.setAttribute('aria-label','Row '+(Math.floor(i/8)+1)+', column '+(i%8+1)+': '+NAMES[tile.value]+(tile.power?', '+tile.power+' power':''));b.setAttribute('aria-pressed',String(selected===i));
  b.append(element('span',tile.power==='spectrum'?'✺':GLYPHS[tile.value]));if(tile.power)b.append(element('span',POWER_MARK[tile.power],'power'));
  b.addEventListener('click',()=>{if(locked||state.status!=='playing')return;if(selected===i){selected=null;hint=null;renderBoard();$('board').querySelector('[data-cell="'+i+'"]').focus({preventScroll:true});say('Selection cleared. Choose another gem.');}else if(selected===null){selected=i;hint=null;renderBoard();$('board').querySelector('[data-cell="'+i+'"]').focus({preventScroll:true});say('Now choose a neighboring gem.');}else{const a=selected;selected=null;play(a,i);}});
  b.addEventListener('keydown',e=>{const offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8}[e.key];if(offset!==undefined){e.preventDefault();const next=i+offset;if(engine.adjacent(i,next))$('board').querySelector('[data-cell="'+next+'"]').focus();}if(e.key==='Home'||e.key==='End'){e.preventDefault();$('board').querySelector('[data-cell="'+(e.key==='Home'?0:63)+'"]').focus();}if(e.key==='Escape'){e.preventDefault();selected=null;hint=null;renderBoard();renderHUD();$('board').querySelector('[data-cell="'+i+'"]').focus({preventScroll:true});}});
  fragment.append(b);
 });
 $('board').replaceChildren(fragment);
}
function observation(){return {locked,pointerSwaps:observed.pointerSwaps,animatedTurns:observed.animatedTurns,reducedMotion:motion.matches,labelledTiles:$('board').querySelectorAll('button[aria-label]').length,liveStatus:$('status').getAttribute('aria-live')==='polite',sound:$('sound').checked,hudScore:Number($('score').textContent),hudMoves:Number($('turns').textContent.split('/')[0]),storage,wins:meta.wins};}
function renderInspector(){
 const search=$('search').value.trim().toLowerCase(),direction=$('direction').value,rows=architecture.audit(state,engine,observation()).filter(row=>(direction==='all'||row.direction===direction)&&(!search||[row.letter,row.label,row.system,row.definition,row.engineMapping].join(' ').toLowerCase().includes(search)));
 const list=$('layers');list.replaceChildren();for(const row of rows){const card=element('article',undefined,'layer');card.dataset.layer=row.id;
  card.append(element('span',row.direction.toUpperCase()+' '+row.letter,'eyebrow'),element('h3',row.label),element('strong',row.system),element('p',row.definition),element('code',row.engineMapping),element('p',row.labelSource,'small'),element('span',row.result.status.toUpperCase(),'badge '+row.result.status),element('p',row.result.evidence));list.append(card);}
 $('layer-count').textContent=rows.length+' / 52 entries · Reverse inspection is read-only.';
}
function download(value,name,type='application/json'){const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type}),url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function tone(){if(!$('sound').checked)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C){say('Sound is unavailable in this browser. Gameplay is unchanged.');return;}audio=audio||new C();audio.resume().catch(()=>{});const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.frequency.setValueAtTime(330,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(660,audio.currentTime+.12);gain.gain.setValueAtTime(.025,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.16);}catch(err){$('sound').checked=false;}}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function animateTurn(a,b){
 if(motion.matches)return;
 const left=$('board').querySelector('[data-cell="'+a+'"]'),right=$('board').querySelector('[data-cell="'+b+'"]');
 if(left&&right){const x=left.getBoundingClientRect(),y=right.getBoundingClientRect();left.style.transform='translate('+(y.x-x.x)+'px,'+(y.y-x.y)+'px)';right.style.transform='translate('+(x.x-y.x)+'px,'+(x.y-y.y)+'px)';await delay(150);}
 for(const frame of state.lastTurn.frames.slice(0,3)){renderBoard(frame.before,{clear:frame.cleared});await delay(150);renderBoard(frame.after,{arrive:true});await delay(160);}
 observed.animatedTurns++;
}
async function play(a,b){
 if(locked||state.status!=='playing')return;const focused=document.activeElement?.dataset.cell;locked=true;selected=null;hint=null;renderHUD();
 try{
  // Commit only a fully resolved turn. An unexpected resolution error cannot
  // leave a partially changed live board or overwrite the last playable save.
  const next=engine.restore(engine.save(state)),accepted=engine.swap(next,a,b);state=next;recordOutcome();persist();
  if(!accepted){say(state.lastTurn.reason==='not_adjacent'?'Choose orthogonal neighbors. No move spent.':'No match — exact board restored. No move spent.');return;}
  renderHUD();tone();await animateTurn(a,b);
  const t=state.lastTurn;say(state.status==='won'?'TARGET COMPLETE · '+state.score+' points. Retry this seed or try a new puzzle.':state.status==='failed'?'Move budget reached · '+state.score+'/'+state.goal+'. Retry freely.':t.cleared+' cleared · '+t.cascades+' cascade'+(t.cascades===1?'':'s')+' · +'+t.scoreGained+' points'+(t.powersMade?' · '+t.powersMade+' power earned':'')+(t.reshuffled?' · free dead-board recovery':''));
 }catch(err){say('Move could not be completed: '+err.message);}
 finally{locked=false;renderHUD();renderBoard();if(focused!==undefined)$('board').querySelector('[data-cell="'+focused+'"]:not(:disabled)')?.focus({preventScroll:true});if(!$('inspector-view').hidden)renderInspector();}
}
$('board').addEventListener('pointerdown',e=>{const cell=e.target.closest('button[data-cell]');if(!cell||locked||state.status!=='playing'||e.button!==0)return;suppressPointerClick=false;pointer={id:e.pointerId,cell:Number(cell.dataset.cell),x:e.clientX,y:e.clientY};cell.setPointerCapture?.(e.pointerId);});
$('board').addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.hypot(dx,dy)<12)return;suppressPointerClick=true;observed.pointerSwaps++;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('button[data-cell]');let b=target?Number(target.dataset.cell):-1;if(!engine.adjacent(p.cell,b))b=p.cell+(Math.abs(dx)>Math.abs(dy)?Math.sign(dx):8*Math.sign(dy));play(p.cell,b);});
$('board').addEventListener('pointercancel',()=>{pointer=null;});
$('board').addEventListener('click',e=>{if(suppressPointerClick&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();suppressPointerClick=false;}},true);
function newGame(seed){if(locked)return;try{state=engine.initial(seed);selected=null;hint=null;recorded=false;persist();renderHUD();renderBoard();say('New seeded board. Select, drag or use keyboard controls.');}catch(err){say(err.message);}}
$('start').addEventListener('click',()=>newGame(Number($('seed').value)));$('retry').addEventListener('click',()=>newGame(state.seed));$('random').addEventListener('click',()=>newGame(crypto.getRandomValues(new Uint32Array(1))[0]));
$('hint').addEventListener('click',()=>{if(locked)return;hint=engine.moves(state)[0]||null;selected=null;renderBoard();renderHUD();say(hint?'Try row '+(Math.floor(hint.a/8)+1)+', column '+(hint.a%8+1)+' ↔ row '+(Math.floor(hint.b/8)+1)+', column '+(hint.b%8+1)+' · '+hint.tiles+' opening tiles'+(hint.powers.length?' · creates '+hint.powers.join(', '):'')+'. Future refills are not predicted.':'No hint available after the run ends.');});
$('play-hint').addEventListener('click',()=>{if(hint){const {a,b}=hint;play(a,b);}});
$('sound').addEventListener('change',()=>{if($('sound').checked)tone();else audio?.suspend().catch(()=>{});});
for(const view of ['play','inspector','rules'])$(view+'-tab').addEventListener('click',()=>{for(const key of ['play','inspector','rules']){$(key+'-tab').setAttribute('aria-selected',String(key===view));$(key+'-view').hidden=key!==view;}if(view==='inspector')renderInspector();});
for(const id of ['search','direction'])$(id).addEventListener(id==='search'?'input':'change',renderInspector);$('audit').addEventListener('click',renderInspector);
$('export-save').addEventListener('click',()=>download(envelope(),'PRIVATE_ONE_v025_Studio_save.json'));
$('recover-save').addEventListener('click',()=>{if(locked)return;const result=saves.recover();storageStatus(result);if(result.data){state=engine.restore(result.data.save);meta=result.data.meta;recorded=result.data.recorded;selected=null;hint=null;renderHUD();renderBoard();say('Previous autosave recovered. The current valid run is retained as the alternate recovery copy.');}});
$('damaged-save').addEventListener('click',()=>{const text=saves.damagedText();if(text!==null)download(text,'PRIVATE_ONE_v025_Studio_preserved_save.txt','text/plain');});
$('import-save').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file||locked)return;if(file.size>1024*1024)throw Error('File exceeds 1 MB');const data=JSON.parse(await file.text()),checked=data.schema==='one.v025.studio.app.v1'?validateEnvelope(data):null,next=engine.restore(checked?checked.save:data);if(locked)throw Error('Wait for the current animation');state=next;meta=checked?checked.meta:meta;recorded=checked?checked.recorded:next.status==='won';selected=null;hint=null;persist({replaceDamaged:true});renderHUD();renderBoard();say('Studio save restored exactly.');}catch(err){say('Import failed: '+err.message+'. Current game preserved.');}finally{e.target.value='';}});
$('export-matrix').addEventListener('click',()=>download({schema:'one.v025.az.matrix.v1',author:'Nathan Tabor',entries:52,layers:architecture.MATRIX},'PRIVATE_ONE_v025_AZ_52_layers.json'));
$('export-blueprint').addEventListener('click',()=>download(architecture.document(),'PRIVATE_ONE_v025_AZ_blueprint.md','text/markdown'));
motion.addEventListener?.('change',()=>renderHUD());
persist();renderHUD();renderBoard();
if(state.status!=='playing')say(state.status==='won'?'TARGET COMPLETE · saved run restored.':'Saved run ended. Retry freely.');
})();
