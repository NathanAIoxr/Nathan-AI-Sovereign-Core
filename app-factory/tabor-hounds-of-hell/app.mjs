import {missions, fresh, act, adjacent, tileAt, tiles, actions} from './campaign.mjs';
import {books} from './series.mjs';

const $ = id => document.getElementById(id);
const storageKey = 'tabor-hounds-seven-sanctuaries-v1';
function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    const selected = value => Array.isArray(value) ? missions.map(m=>m.id).filter(id=>value.includes(id)) : [];
    return {won:selected(saved?.won), read:selected(saved?.read)};
  } catch {
    return {won:[], read:[]};
  }
}
const progress = readProgress();
function bank(bucket,id) {
  if (!progress[bucket].includes(id)) progress[bucket].push(id);
  try {localStorage.setItem(storageKey,JSON.stringify(progress));} catch {
    $('status').dataset.temporary = 'true';
  }
}
const route = (tab,id,chapter) => '#' + [tab,id,chapter].filter(value=>value!==undefined).join('/');
const firstPending = () => missions.find(m=>!progress.won.includes(m.id)) ?? missions[0];
const el = (tag,className,text) => {
  const node=document.createElement(tag);
  if (className) node.className=className;
  if (text !== undefined) node.textContent=text;
  return node;
};
function link(text,href,className) {
  const a=el('a',className,text);
  a.href=href;
  return a;
}

let mission=missions[0];
let game=fresh(mission);
let mode='move';
let flipped=false;
let unseen=false;
let currentPage='';
const attempts=new Map();
const symbol={'.':'·','#':'','G':'╫','~':'≈','S':'✦','X':'⬡','@':'·'};
const style={'.':'path','#':'wall','G':'gate','~':'hazard','S':'spark','X':'sanctuary','@':'path'};
const instructions={move:'Choose a square directly beside you.',release:'Choose an iron gate directly beside you.',ward:'Choose a hazard directly beside you.'};

function home() {
  const sparks=missions.reduce((total,m)=>total+m.sparkCount,0);
  $('site-count').textContent=progress.won.length+' / '+missions.length;
  $('spark-count').textContent=missions.filter(m=>progress.won.includes(m.id)).reduce((total,m)=>total+m.sparkCount,0)+' / '+sparks;
  $('book-count').textContent=progress.read.length+' / '+books.length;
  $('start').href=route('play',firstPending().id);
  const startText=progress.won.length===missions.length ? 'Replay campaign' : progress.won.length ? 'Continue campaign' : 'Start campaign';
  $('start').firstChild.textContent=startText+' ';
  $('mission-cards').replaceChildren(...missions.map((m,i)=>{
    const won=progress.won.includes(m.id);
    const card=link('',route('play',m.id),'mission-card');
    card.style.setProperty('--tone',m.color);
    card.append(el('span','card-region',String(i+1).padStart(2,'0')+' / '+m.region),el('span','card-title',m.title));
    const foot=el('span','card-floor');
    foot.append(el('span','',m.place),el('span',won?'complete':'',won?'Protected ✓':'Play'));
    card.append(foot);
    return card;
  }));
}

function board(focusTarget) {
  const squareIndices=Array.from(mission.cells,(_,i)=>i);
  if (flipped) squareIndices.reverse();
  $('board').classList.toggle('unseen',unseen);
  $('board').style.setProperty('--columns',mission.width);
  $('board').replaceChildren(...squareIndices.map(index=>{
    const tile=tileAt(mission,game,index);
    const isPlayer=index===game.position;
    const className=['tile',style[tile],isPlayer&&'player',adjacent(mission,game.position,index)&&'adjacent',
      game.dispatch?.to===index&&'dispatch',game.warded.includes(index)&&'warded'].filter(Boolean).join(' ');
    const text=isPlayer?'◆':game.dispatch?.to===index?'🐾':game.warded.includes(index)?'✧':symbol[tile];
    const square=el('button',className,text);
    square.type='button';
    square.dataset.index=index;
    square.tabIndex=index===(focusTarget??game.position)?0:-1;
    const name=game.warded.includes(index)?'Warded crossing':tiles[tile];
    const visualIndex=flipped?mission.cells.length-1-index:index;
    square.setAttribute('aria-label',(isPlayer?'You, ':'')+name+', row '+(Math.floor(visualIndex/mission.width)+1)+', column '+(visualIndex%mission.width+1));
    square.setAttribute('aria-disabled',String(game.outcome!=='playing'||tile==='#'));
    return square;
  }));
  if (focusTarget!==undefined) $('board').querySelector('[data-index="'+focusTarget+'"]')?.focus({preventScroll:true});
}
function display(focusTarget) {
  $('mission-region').textContent=mission.region+' · '+mission.place;
  $('mission-title').textContent=mission.title;
  $('mission-book').href=route('books',mission.id,1);
  $('briefing').textContent=mission.briefing;
  $('steps').textContent=mission.limit-game.steps;
  $('sparks').textContent=game.sparks.length+' / '+mission.sparkCount;
  $('wards').textContent=mission.ward-game.warded.length;
  for (const action of actions) {
    $('mode-'+action).disabled=game.outcome!=='playing'||(action==='ward'&&game.warded.length>=mission.ward);
    $('mode-'+action).setAttribute('aria-pressed',String(mode===action));
  }
  $('view').textContent=flipped?'Unscene':'Scene';
  $('view').setAttribute('aria-pressed',String(flipped));
  $('layer').textContent=unseen?'Show Seen':'Show Unseen';
  $('layer').setAttribute('aria-pressed',String(unseen));
  $('analysis').hidden=!unseen;
  $('known').textContent=game.sparks.length+' secured · '+game.cleared.length+' gates cleared · '+game.warded.length+' hazards warded.';
  $('unknown').textContent=mission.clue;
  $('action-help').textContent=instructions[mode];
  const saved=progress.won.includes(mission.id);
  $('status').textContent=game.message+(game.outcome==='won'?(saved?' 1+1=2 · BUILD recorded.':''):'');
  if ($('status').dataset.temporary && game.outcome==='won') $('status').textContent+=' Progress cannot be saved on this device.';
  $('status').dataset.outcome=game.outcome;
  const following=missions[missions.indexOf(mission)+1];
  $('next-mission').hidden=game.outcome!=='won';
  $('next-mission').href=following?route('play',following.id):route('home');
  $('next-mission').firstChild.textContent=following?'Next mission ':'Return to campaign ';
  board(focusTarget);
}
function perform(index,focus) {
  game=act(mission,game,mode,index);
  if (game.outcome==='won') bank('won',mission.id);
  if (game.dispatch||mode==='ward'&&game.warded.includes(index)) mode='move';
  attempts.set(mission.id,game);
  display(focus?game.position:undefined);
}
for (const action of actions) $('mode-'+action).addEventListener('click',()=>{
  mode=action;
  display();
});
$('board').addEventListener('click',event=>{
  const square=event.target.closest('[data-index]');
  if (square) perform(Number(square.dataset.index),document.activeElement===square);
});
$('board').addEventListener('keydown',event=>{
  const key=event.key.toLowerCase();
  const shortcuts={m:'move',r:'release',w:'ward'};
  if (shortcuts[key]) {
    const command=$('mode-'+shortcuts[key]);
    if (!command.disabled) {
      mode=shortcuts[key];
      display(game.position);
    }
    event.preventDefault();
    return;
  }
  const delta={arrowleft:-1,arrowright:1,arrowup:-mission.width,arrowdown:mission.width}[key];
  if (!delta) return;
  event.preventDefault();
  perform(game.position+delta*(flipped?-1:1),true);
});
$('view').addEventListener('click',()=>{flipped=!flipped;display();});
$('layer').addEventListener('click',()=>{unseen=!unseen;display();});
$('clear').addEventListener('click',()=>{
  game=fresh(mission);
  game.message='1-1=0 · Attempt cleared. '+mission.briefing;
  mode='move';
  attempts.set(mission.id,game);
  display();
});

function reader(index,chapterIndex) {
  const book=books[index];
  const m=missions[index];
  const [title,prose]=book.chapters[chapterIndex];
  const ordinal=chapterIndex+1;
  $('shelf').replaceChildren(...books.map((b,i)=>{
    const item=link('',route('books',missions[i].id,1));
    item.append(el('small','',('BOOK '+String(i+1).padStart(2,'0'))+(progress.read.includes(missions[i].id)?' · FINISHED':'') ),document.createTextNode(b.title));
    if (i===index) item.setAttribute('aria-current','page');
    return item;
  }));
  const controls=el('div','reader-actions');
  if (ordinal>1) controls.append(link('← Previous chapter',route('books',m.id,ordinal-1),'secondary'));
  if (ordinal<book.chapters.length) {
    controls.append(link('Next chapter →',route('books',m.id,ordinal+1),'primary'));
  } else if (!progress.read.includes(m.id)) {
    const finish=el('button','primary','Finish book');
    finish.type='button';
    finish.addEventListener('click',()=>{bank('read',m.id);reader(index,chapterIndex);$('reader').focus();});
    controls.append(finish);
  } else if (index+1<books.length) {
    controls.append(link('Next book →',route('books',missions[index+1].id,1),'primary'));
  } else {
    controls.append(el('span','complete','Book finished ✓'));
  }
  controls.append(link('Play this mission',route('play',m.id),'secondary'));
  $('reader').tabIndex=-1;
  $('reader').replaceChildren(el('p','overline','BOOK '+String(index+1).padStart(2,'0')+' · CHAPTER '+ordinal+' OF '+book.chapters.length),
    el('h2','',book.title),el('h3','',title),el('p','prose',prose),controls);
}

function navigate(initial=false) {
  const [view,id,number]=location.hash.slice(1).split('/');
  if (view==='main') {
    $('main').focus();
    return;
  }
  const viewId=['play','books','arcade'].includes(view)?view:'home';
  for (const panel of ['home','play','books','arcade']) $(panel).hidden=panel!==viewId;
  for (const item of document.querySelectorAll('[data-nav]')) {
    if (item.dataset.nav===(['home','play'].includes(viewId)?'campaign':viewId)) item.setAttribute('aria-current','page');
    else item.removeAttribute('aria-current');
  }
  if (viewId==='home') home();
  if (viewId==='play') {
    const chosen=missions.find(m=>m.id===id)??missions[0];
    if (currentPage!=='play'||mission!==chosen) {
      mission=chosen;
      game=attempts.get(mission.id)??fresh(mission);
      mode='move';
      flipped=false;
      unseen=false;
    }
    display();
  }
  if (viewId==='books') {
    const index=Math.max(0,missions.findIndex(m=>m.id===id));
    const chapter=Math.max(1,Math.min(Number.parseInt(number,10)||1,books[index].chapters.length))-1;
    reader(index,chapter);
  }
  if (viewId==='arcade'&&!$('arcade-frame').getAttribute('src')) $('arcade-frame').src='./track-baller.html';
  currentPage=viewId;
  if (!initial) {
    window.scrollTo({top:0,behavior:'instant'});
    $('main').focus({preventScroll:true});
  }
}
window.addEventListener('hashchange',()=>navigate());
navigate(true);
if ('serviceWorker' in navigator&&location.protocol==='https:') navigator.serviceWorker.register('./offline.js').catch(()=>{});
let installer;
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installer=event;
  $('install').hidden=false;
});
$('install').addEventListener('click',async()=>{
  if (!installer) return;
  const prompt=installer;
  installer=null;
  $('install').hidden=true;
  try {await prompt.prompt();} catch {}
});
