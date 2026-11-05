/* ADDITIVE v003 — Game Arcade, Communication Academy, Idea Garage, Canvas & Calendar expansion.
   Original v001 functions and exports remain intact; v001 projects import without conversion.
   All creative text is locally rule-generated or user-authored; no network/LLM dependency. */
const GAME_MODES = [
 {id:'spark',icon:'✦',name:'Spark Sprint',desc:'Take a raw thought and release five, seven, or twelve fresh directions.',reward:20},
 {id:'remix',icon:'↗',name:'Remix Relay',desc:'Combine two preserved ideas into a brand-new possibility.',reward:30},
 {id:'story',icon:'≋',name:'Story Ladder',desc:'Build a beginning, middle, and ending in three moves.',reward:35},
 {id:'alphabet',icon:'A–Z',name:'Alphabet Adventure',desc:'Give every letter a creative word, thought, or story.',reward:15},
 {id:'mirror',icon:'⇄',name:'Mirror Maze',desc:'Reverse the order, then explain what meaning stays the same.',reward:25},
 {id:'christmas',icon:'❄',name:'25-Day Christmas Quest',desc:'Make a memory or creative prompt for every day, December 1–25.',reward:10}
];
const CHRISTMAS_PROMPTS = [
 'A star that means something special','A favorite winter memory','A recipe someone remembers','A handwritten holiday note','A story about kindness',
 'A keepsake from the past','A song without reproducing its lyrics','A joyful surprise','A picture worth describing','A letter to the future',
 'An act of generosity','A decoration with a story','A family tradition','A childhood memory','A creative gift idea',
 'A cozy evening scene','A person to thank in writing','A holiday word puzzle','A connection across generations','A favorite seasonal color',
 'A memory from a journey','A promise worth keeping','A fresh winter invention','A beautiful quiet moment','A Christmas story to preserve'
];
function migrateGame(s){const d={xp:0,history:[],completed:{},alphabet:{},christmas:{},lastGame:'spark'};return {...d,...(s||{}),completed:{...d.completed,...(s?.completed||{})},alphabet:{...d.alphabet,...(s?.alphabet||{})},christmas:{...d.christmas,...(s?.christmas||{})},history:Array.isArray(s?.history)?s.history:[]};}
function gameLevel(){return 1+Math.floor((state.game?.xp||0)/100)}
function achievements(){const g=state.game||migrateGame();const names=[];if(state.garage.length>=1)names.push('First Spark');if(state.garage.length>=25)names.push('Idea Collector');if(state.canvas.length>=3)names.push('Page Builder');if(state.events.length>=1)names.push('Time Keeper');if((g.completed.remix||0)>=1)names.push('Remix Maker');if((g.completed.story||0)>=1)names.push('Story Weaver');if(Object.keys(g.alphabet).length>=26)names.push('A–Z Voyager');if(Object.keys(g.christmas).length>=25)names.push('Christmas Keeper');if(Object.keys(g.completed).length>=6)names.push('Six-Game Explorer');return names;}
function award(game,points,detail){state.game.completed[game]=(state.game.completed[game]||0)+1;state.game.xp+=points;state.game.history.unshift({id:uid(),game,points,detail,time:new Date().toISOString()});state.game.history=state.game.history.slice(0,200);persist();renderArcade();}
function archiveIdea(text,mode='story',meta={}){const value=clean(text);if(!value)return null;const o={id:uid(),text:value,mode,input:meta.input??value,createdAt:new Date().toISOString(),status:'unreleased',favorite:false,source:'user/game',...meta};state.garage.unshift(o);state.options=[{id:o.id,text:o.text,mode:o.mode,createdAt:o.createdAt}];state.selectedId=o.id;persist();return o;}
function showMessage(id,message){setStatus(id,message)}
function renderArcade(){
 $('arcade-xp').textContent=state.game.xp;
 $('arcade-level').textContent=gameLevel();
 $('arcade-completions').textContent=Object.values(state.game.completed).reduce((a,b)=>a+Number(b||0),0);
 $('arcade-badges').innerHTML=achievements().length?achievements().map(x=>`<span class="trophy">✦ ${safe(x)}</span>`).join(''):'<span class="muted">Your badges appear as you create.</span>';
 $('game-menu').innerHTML=GAME_MODES.map(m=>`<button class="quest-card ${state.game.lastGame===m.id?'is-active':''}" data-game-choice="${m.id}" aria-pressed="${state.game.lastGame===m.id}"><span class="quest-symbol">${safe(m.icon)}</span><span><strong>${safe(m.name)}</strong><small>${safe(m.desc)}</small></span><span class="quest-points">+${m.reward} XP</span></button>`).join('');
 $('game-panel').innerHTML=gamePanelHTML(state.game.lastGame);
 $('game-history').innerHTML=state.game.history.slice(0,8).map(h=>`<div class="ledger-row"><span>${safe(h.game)} · ${safe(h.detail)}</span><strong>+${Number(h.points)} XP</strong></div>`).join('')||'<p class="help">Completed quests appear here.</p>';
}
function gamePanelHTML(mode){
 const common=`<p class="muted">Your raw entries stay in this project's local archive. Each completed activity awards its displayed XP.</p>`;
 if(mode==='spark')return `<h3>✦ Spark Sprint</h3>${common}<label class="field-label" for="q-seed">Your raw spark</label><textarea id="q-seed" class="compact" placeholder="A family holiday, an old letter, a strange invention..."></textarea><div class="two-fields"><label>Direction<select id="q-mode">${['story','layout','holiday','calendar','phrasing','character','scene'].map(x=>`<option value="${x}">${x}</option>`).join('')}</select></label><label>Number of ideas<select id="q-count"><option>5</option><option selected>7</option><option>12</option></select></label></div><button class="button" data-game-submit="spark">Release ideas & collect XP</button>`;
 if(mode==='remix'){const choices=state.garage.slice(0,200).map(o=>`<option value="${safe(o.id)}">${safe(o.text.slice(0,90))}</option>`).join('');return `<h3>↗ Remix Relay</h3>${common}<p class="help">Select two different saved ideas. Add your own new line to complete the remix.</p><div class="two-fields"><label>Idea one<select id="q-remix-a"><option value="">Choose an idea</option>${choices}</select></label><label>Idea two<select id="q-remix-b"><option value="">Choose an idea</option>${choices}</select></label></div><label class="field-label" for="q-remix-line">Your connecting sentence</label><textarea class="compact" id="q-remix-line" placeholder="Together, these ideas become..."></textarea><button class="button" data-game-submit="remix">Preserve remix</button>`}
 if(mode==='story')return `<h3>≋ Story Ladder</h3>${common}<div class="stack"><label>Beginning<textarea id="q-story-b" class="compact" placeholder="Where does it begin?"></textarea></label><label>Middle<textarea id="q-story-m" class="compact" placeholder="What changes?"></textarea></label><label>Ending<textarea id="q-story-e" class="compact" placeholder="What remains at the end?"></textarea></label></div><button class="button" data-game-submit="story">Save three-part story</button>`;
 if(mode==='alphabet')return `<h3>A–Z Alphabet Adventure</h3>${common}<div class="alphabet-board">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(ch=>`<button class="letter-btn ${state.game.alphabet[ch]?'done':''}" data-game-letter="${ch}" aria-label="Choose letter ${ch}">${ch}</button>`).join('')}</div><p class="help">${Object.keys(state.game.alphabet).length} of 26 letters completed. Select a letter, then write a line that begins with it.</p><div class="two-fields"><label>Letter<input id="q-letter" type="text" maxlength="1" value="${safe(state.currentLetter||'A')}"></label></div><label class="field-label" for="q-letter-line">Your line</label><textarea id="q-letter-line" class="compact" placeholder="Amazing angels... or your own original A-line.">${safe(state.game.alphabet[state.currentLetter||'A']||'')}</textarea><button class="button" data-game-submit="alphabet">Save this letter</button>`;
 if(mode==='mirror')return `<h3>⇄ Mirror Maze</h3>${common}<label class="field-label" for="q-mirror-text">Starting text</label><textarea id="q-mirror-text" class="compact" placeholder="An original sentence or story"></textarea><div class="button-row"><button class="button secondary small" data-mirror-preview="words">Reverse word order</button><button class="button ghost small" data-mirror-preview="characters">Reverse characters</button></div><div class="idea-output" id="mirror-output" aria-live="polite">The reversal appears here.</div><label class="field-label" for="q-mirror-meaning">What meaning or contrast did you discover?</label><textarea id="q-mirror-meaning" class="compact" placeholder="The original idea still matters because..."></textarea><button class="button" data-game-submit="mirror">Preserve mirror version</button>`;
 if(mode==='christmas')return `<h3>❄ 25-Day Christmas Quest</h3>${common}<p class="help">Choose a day to capture a memory, build a story, or make a calendar entry.</p><div class="christmas-board">${Array.from({length:25},(_,i)=>{let d=i+1;return `<button data-christmas-day="${d}" class="letter-btn ${state.game.christmas[d]?'done':''}" aria-label="Choose December ${d}">${d}</button>`}).join('')}</div><p class="help">${Object.keys(state.game.christmas).length} of 25 days preserved.</p><label>December day<input id="q-day" type="number" min="1" max="25" value="${Number(state.currentDay||1)}"></label><p id="q-day-prompt" class="quest-prompt">${safe(CHRISTMAS_PROMPTS[(state.currentDay||1)-1]||CHRISTMAS_PROMPTS[0])}</p><label class="field-label" for="q-day-line">Memory or new creation</label><textarea class="compact" id="q-day-line">${safe(state.game.christmas[state.currentDay||1]||'')}</textarea><button class="button" data-game-submit="christmas">Preserve this day & add to calendar</button>`;
 return '';
}
function changeGame(mode){if(!GAME_MODES.some(x=>x.id===mode))return;state.game.lastGame=mode;persist();renderArcade();}
function reverseString(input,way){return way==='characters'?Array.from(input).reverse().join(''):input.trim().split(/\s+/).reverse().join(' ')}
function finishGame(mode){let value='',points=GAME_MODES.find(x=>x.id===mode)?.reward||0,detail='';
 if(mode==='spark'){
  const seed=clean($('q-seed').value);if(!seed)return showMessage('arcade-status','Add a spark before generating.');
  const m=$('q-mode').value,c=Number($('q-count').value);state.raw=seed;state.mode=m;state.count=c;
  const opts=release(seed,m,c);state.options=opts;state.selectedId=opts[0]?.id;state.garage.unshift(...opts.map(o=>({...o,input:seed,status:'unreleased',source:'game:spark'})));value=seed;detail=`${c} ${m} ideas`;
 }else if(mode==='remix'){
  const a=state.garage.find(o=>o.id===$('q-remix-a').value),b=state.garage.find(o=>o.id===$('q-remix-b').value),line=clean($('q-remix-line').value);
  if(!a||!b||a.id===b.id||!line)return showMessage('arcade-status','Choose two different saved ideas and write a connecting sentence.');
  value=`IDEA ONE: ${a.text}\nIDEA TWO: ${b.text}\nYOUR REMIX: ${line}`;archiveIdea(value,'story',{sources:[a.id,b.id],input:line});detail='Two ideas remixed';
 }else if(mode==='story'){
  const p=['b','m','e'].map(ch=>clean($('q-story-'+ch).value));if(p.some(x=>!x))return showMessage('arcade-status','Complete all three story stages.');
  value=`BEGINNING\n${p[0]}\n\nMIDDLE\n${p[1]}\n\nENDING\n${p[2]}`;archiveIdea(value,'story',{input:p.join('\n')});detail='Three-part story';
 }else if(mode==='alphabet'){
  const letter=clean($('q-letter').value).toUpperCase(),line=clean($('q-letter-line').value);if(!/^[A-Z]$/.test(letter)||!line||line[0].toUpperCase()!==letter)return showMessage('arcade-status','Choose one A–Z letter and write a line that starts with it.');
  const first=!state.game.alphabet[letter];state.game.alphabet[letter]=line;archiveIdea(`${letter} — ${line}`,'phrasing',{input:line});if(!first)points=0;detail=`Letter ${letter} ${first?'saved':'revised'}`;
 }else if(mode==='mirror'){
  const raw=clean($('q-mirror-text').value),why=clean($('q-mirror-meaning').value);if(!raw||!why)return showMessage('arcade-status','Add starting words and describe what you discovered.');
  const reversed=reverseString(raw,state.mirrorMethod||'words');value=`ORIGINAL\n${raw}\n\nREVERSED (${state.mirrorMethod||'words'})\n${reversed}\n\nYOUR MEANING\n${why}`;archiveIdea(value,'phrasing',{input:raw});detail='Reverse and reflect';
 }else if(mode==='christmas'){
  const day=Number($('q-day').value),line=clean($('q-day-line').value);if(!Number.isInteger(day)||day<1||day>25||!line)return showMessage('arcade-status','Choose December 1–25 and write your original line.');
  const first=!state.game.christmas[day];state.game.christmas[day]=line;
  value=`DECEMBER ${day}: ${CHRISTMAS_PROMPTS[day-1]}\n${line}`;archiveIdea(value,'holiday',{input:line});
  const date=`${state.calendarYear}-12-${String(day).padStart(2,'0')}`;
  state.events=state.events.filter(e=>!(e.questDay===day&&e.date===date));state.events.push({id:uid(),date,title:line,kind:'holiday',questDay:day,source:'Christmas Quest'});
  if(!first)points=0;detail=`December ${day} ${first?'saved':'revised'}`;
 }
 award(mode,points,detail);persist();render();showMessage('arcade-status',`${detail} preserved. ${points?`+${points} XP earned.`:'Previously completed; revised without duplicate XP.'}`);
}
function filteredGarage(){const search=clean($('garage-search').value).toLocaleLowerCase(),flt=$('garage-filter').value,sort=$('garage-sort').value;let list=state.garage.filter(o=>(!search||`${o.text} ${o.input||''} ${o.mode} ${(o.tags||[]).join(' ')}`.toLocaleLowerCase().includes(search))&&(flt==='all'||(flt==='favorites'?o.favorite:flt==='unreleased'||flt==='used'?o.status===flt:o.mode===flt)));if(sort==='oldest')list=list.slice().reverse();if(sort==='mode')list=list.slice().sort((a,b)=>a.mode.localeCompare(b.mode));return list;}
function renderGarage(){const list=filteredGarage();$('garage-total').textContent=`${list.length} of ${state.garage.length} ideas`;$('garage-full-list').innerHTML=list.slice(0,state.garageLimit||60).map((o,i)=>`<article class="idea-card"><div class="idea-card-top"><span class="badge">${safe(o.mode)}</span><span class="tiny">${safe((o.createdAt||'').slice(0,10))} · ${safe(o.status||'unreleased')}</span></div><p>${safe(o.text)}</p><div class="button-row"><button data-favorite="${safe(o.id)}" class="button ${o.favorite?'secondary':'ghost'} small" aria-label="${o.favorite?'Unfavorite':'Favorite'} idea">${o.favorite?'★':'☆'} Favorite</button><button class="button ghost small" data-reuse="${safe(o.id)}">Work with it</button><button class="button secondary small" data-garage-canvas="${safe(o.id)}">→ Canvas</button><button class="button ghost small" data-garage-calendar="${safe(o.id)}">→ Calendar</button><button class="button ghost small" data-copy-idea="${safe(o.id)}">Copy</button></div></article>`).join('')||'<div class="empty">No matching ideas. Try another filter or generate something new.</div>';
 $('garage-more').classList.toggle('hidden',list.length<=(state.garageLimit||60));$('garage-favs').textContent=state.garage.filter(o=>o.favorite).length;
}
function renderAcademy(){const saved=state.academy||{};$('academy-raw').value=saved.raw||'';$('academy-style').value=saved.style||'spoken';$('academy-output').textContent=saved.output||'Your communication scaffold will appear here.';$('academy-count').textContent=(saved.history||[]).length;
 $('academy-history').innerHTML=(saved.history||[]).slice(0,12).map((e,i)=>`<article class="garage-row"><span class="badge">${safe(e.style)}</span><p>${safe(e.output)}</p><div class="button-row"><button class="button ghost small" data-academy-reuse="${safe(e.id)}">Load</button><button class="button ghost small" data-academy-canvas="${safe(e.id)}">Canvas</button></div></article>`).join('')||'<p class="help">Your practice entries are preserved here.</p>';
}
function academyTransform(raw,style){const text=String(raw);const t=clean(text);if(!t)return '';
 if(style==='spoken')return `What I mean is:\n${t}\n\nThe central point is:\n${t.split(/[.!?\n]/)[0].trim()}`;
 if(style==='short')return t.split(/\s+/).slice(0,18).join(' ')+(t.split(/\s+/).length>18?'…':'');
 if(style==='outline')return `ORIGINAL WORDS\n${text}\n\n1. SUBJECT — ${t.split(/[.!?\n]/)[0].trim()}\n2. WHY IT MATTERS — [add your reason]\n3. CONCRETE EXAMPLE — [add an example]\n4. WHAT YOU WANT NEXT — [add your request]`;
 if(style==='questions')return `What am I describing?\n${t}\n\nWho is involved?\nWhen does it happen?\nWhich details can be verified?\nWhat should the reader understand?`;
 if(style==='mirror')return `ORIGINAL\n${text}\n\nWORD ORDER REVERSED\n${reverseString(t,'words')}\n\n(Reverse order is a creative transformation, not the original meaning.)`;
 if(style==='acrostic'){const first=t.split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g,'').slice(0,20);return first.split('').map(c=>`${c} — [a word or thought beginning with ${c}]`).join('\n')||`Enter an A–Z word to build an acrostic.`;}
 if(style==='phonetic')return `YOUR ORIGINAL TEXT (UNCHANGED)\n${text}\n\nWRITE IT THE WAY YOU HEAR IT\n[Your own sound-based spelling]\n\nHOW TO SAY IT\n[Your mouth / ear / tongue notes]\n\nThe app does not silently rewrite your spelling.`;
 if(style==='reverse-lines')return text.split('\n').reverse().join('\n');
 return text;
}
function academyRun(){const raw=$('academy-raw').value,style=$('academy-style').value;if(!clean(raw))return showMessage('academy-status','Add your own words before transforming.');const output=academyTransform(raw,style);const entry={id:uid(),raw,style,output,time:new Date().toISOString()};state.academy={raw,style,output,history:[entry,...(state.academy.history||[])].slice(0,200)};persist();renderAcademy();showMessage('academy-status','Your original wording and the derived scaffold are both preserved.');}
function scrapbookPreview(){const skin=state.canvasTheme||'paper',heading=state.canvasTitle||'My No-Scraps Scrapbook';$('paper-preview').dataset.skin=skin;
 $('paper-preview').innerHTML=`<div class="p-head">${safe(state.canvasSticker||'✦')} ${safe(heading)}</div>`+(state.canvas.length?state.canvas.map(b=>b.type==='image'&&/^data:image\/(?:png|jpeg|webp|gif);base64,/.test(b.data||'')?`<article class="image-article"><img src="${safe(b.data)}" alt="${safe(b.alt||'User-added scrapbook image')}" loading="lazy"><p>${safe(b.text)}</p></article>`:`<article class="${safe(b.type||'text')}">${safe(b.text)}</article>`).join(''):'<article>The page begins wherever your imagination begins.</article>')+'<footer>NATHAN AI / ONE · ORIGINAL CREATIVE WORK · LOCAL COPY</footer>';
}
function renderCanvasControls(){ $('canvas-title').value=state.canvasTitle||'My No-Scraps Scrapbook';$('canvas-theme').value=state.canvasTheme||'paper';$('canvas-sticker').value=state.canvasSticker||'✦';scrapbookPreview();}
function monthEvents(date){return state.events.filter(e=>e.date===date || (e.recurring && e.date?.slice(5)===date.slice(5)));}
function renderMonthlyCalendar(){const yr=state.calendarYear,month=Number(state.calendarMonth||11);$('cal-month').value=String(month);const days=new Date(yr,month+1,0).getDate();const offset=new Date(yr,month,1).getDay();const cells=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(s=>`<div class="weekday">${s}</div>`);
 for(let i=0;i<offset;i++)cells.push('<div class="month-cell spacer-cell"></div>');for(let d=1;d<=days;d++){const date=`${yr}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,event=monthEvents(date);cells.push(`<button class="month-cell ${event.length?'with-event':''}" data-cal-date="${date}" aria-label="${date}: ${event.length} events"><strong>${d}</strong>${event.slice(0,2).map(e=>`<span>${safe(e.title.slice(0,30))}</span>`).join('')}${event.length>2?`<small>+${event.length-2}</small>`:''}</button>`)}$('month-grid').innerHTML=cells.join('');
}
function downloadICS(){const escapeICS=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');const output=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nathan AI//Brainstormer//EN','CALSCALE:GREGORIAN'];for(const e of state.events){const compact=e.date?.replaceAll('-','');if(!/^\d{8}$/.test(compact))continue;output.push('BEGIN:VEVENT',`UID:${e.id}@nathan-ai-local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${compact}`,`SUMMARY:${escapeICS(e.title)}`);if(e.recurring)output.push('RRULE:FREQ=YEARLY');output.push('END:VEVENT')}output.push('END:VCALENDAR');download('NathanAI_Creative_Calendar.ics',output.join('\r\n')+'\r\n','text/calendar');setStatus('calendar-status','Calendar .ics exported. Import the file into your calendar app.');}
function refreshGameDay(){const day=Number($('q-day')?.value||1);if(day>=1&&day<=25){state.currentDay=day;$('q-day-prompt').textContent=CHRISTMAS_PROMPTS[day-1];$('q-day-line').value=state.game.christmas[day]||'';}}
// Additive delegated actions, intentionally separated from the original event router.
document.addEventListener('click', e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.gameChoice){changeGame(b.dataset.gameChoice);return}
 if(b.dataset.gameSubmit){finishGame(b.dataset.gameSubmit);return}
 if(b.dataset.gameLetter){state.currentLetter=b.dataset.gameLetter;persist();renderArcade();return}
 if(b.dataset.christmasDay){state.currentDay=Number(b.dataset.christmasDay);persist();renderArcade();return}
 if(b.dataset.mirrorPreview){state.mirrorMethod=b.dataset.mirrorPreview;const input=$('q-mirror-text')?.value||'';$('mirror-output').textContent=input?reverseString(input,state.mirrorMethod):'Enter the original words first.';return}
 if(b.dataset.favorite){const o=state.garage.find(o=>o.id===b.dataset.favorite);if(o){o.favorite=!o.favorite;persist();renderGarage();renderBrain();}return}
 if(b.dataset.garageCalendar){const o=state.garage.find(o=>o.id===b.dataset.garageCalendar);handoffCalendar(o);return}
 if(b.dataset.copyIdea){const o=state.garage.find(o=>o.id===b.dataset.copyIdea);if(o)copyText(o.text,'garage-status');return}
 if(b.dataset.academyReuse){const o=state.academy.history.find(o=>o.id===b.dataset.academyReuse);if(o){state.academy={...state.academy,raw:o.raw,style:o.style,output:o.output};persist();renderAcademy();}return}
 if(b.dataset.academyCanvas){const o=state.academy.history.find(o=>o.id===b.dataset.academyCanvas);if(o)handoffCanvas({id:o.id,text:o.output});return}
 if(b.dataset.calDate){$('event-date').value=b.dataset.calDate;setStatus('calendar-status',`Selected ${b.dataset.calDate}. Add your event above.`);return}
});
$('garage-search').addEventListener('input',renderGarage);
$('garage-filter').addEventListener('change',renderGarage);
$('garage-sort').addEventListener('change',renderGarage);
$('garage-more').addEventListener('click',()=>{state.garageLimit=(state.garageLimit||60)+60;renderGarage()});
$('academy-raw').addEventListener('input',e=>{state.academy.raw=e.target.value;persist()});
$('academy-style').addEventListener('change',e=>{state.academy.style=e.target.value;persist()});
$('academy-run').addEventListener('click',academyRun);
$('academy-save').addEventListener('click',()=>{if(!clean(state.academy.output))return setStatus('academy-status','Generate a scaffold first.');archiveIdea(state.academy.output,'phrasing',{input:state.academy.raw,source:'academy'});renderGarage();renderBrain();setStatus('academy-status','Scaffold preserved in Idea Garage.')});
$('academy-to-canvas').addEventListener('click',()=>{if(!clean(state.academy.output))return setStatus('academy-status','Generate a scaffold first.');handoffCanvas({id:uid(),text:state.academy.output});});
$('academy-copy').addEventListener('click',()=>copyText(state.academy.output||'','academy-status'));
$('canvas-title').addEventListener('input',e=>{state.canvasTitle=e.target.value;persist();scrapbookPreview()});
$('canvas-theme').addEventListener('change',e=>{state.canvasTheme=e.target.value;persist();scrapbookPreview()});
$('canvas-sticker').addEventListener('change',e=>{state.canvasSticker=e.target.value;persist();scrapbookPreview()});
$('add-caption').addEventListener('click',()=>{state.canvas.push({id:uid(),type:'caption',text:'Your caption here',createdAt:new Date().toISOString()});persist();renderWorkspace();renderPackage()});
$('add-quote').addEventListener('click',()=>{state.canvas.push({id:uid(),type:'quote',text:'Your quote here',createdAt:new Date().toISOString()});persist();renderWorkspace();renderPackage()});
$('add-photo').addEventListener('click',()=>$('photo-file').click());
$('photo-file').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>1_500_000){setStatus('workspace-status','Choose a PNG, JPEG, WebP or GIF under 1.5 MB.');e.target.value='';return;}const reader=new FileReader();reader.onload=()=>{state.canvas.push({id:uid(),type:'image',text:file.name,alt:file.name,data:reader.result,createdAt:new Date().toISOString()});persist();renderWorkspace();renderPackage();setStatus('workspace-status','Image stored inside the local project. Export a backup to keep it.');};reader.readAsDataURL(file);e.target.value='';});
$('print-scrapbook').addEventListener('click',()=>{state.activeTab='workspace';render();window.print()});
$('cal-month').addEventListener('change',e=>{state.calendarMonth=Number(e.target.value);persist();renderMonthlyCalendar()});
$('cal-prev').addEventListener('click',()=>{state.calendarMonth=(Number(state.calendarMonth)+11)%12;if(state.calendarMonth===11)state.calendarYear--;persist();renderCalendar();renderMonthlyCalendar()});
$('cal-next').addEventListener('click',()=>{state.calendarMonth=(Number(state.calendarMonth)+1)%12;if(state.calendarMonth===0)state.calendarYear++;persist();renderCalendar();renderMonthlyCalendar()});
$('download-ics').addEventListener('click',downloadICS);
$('calendar-year').addEventListener('change',()=>renderMonthlyCalendar());
$('q-dummy-never')?.addEventListener('change',()=>{});
document.addEventListener('input',e=>{if(e.target?.id==='q-day')refreshGameDay();});
// Canvas editors: existing v001 behavior updates textual content; this preview wrapper
// ensures themes and image media survive edits without touching original text.
$('canvas-blocks').addEventListener('input',e=>{if(e.target.dataset.blockText)queueMicrotask(scrapbookPreview)});

