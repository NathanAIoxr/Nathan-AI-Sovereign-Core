import {GAMES,DEMO_ROSTER,normalizeRoster,makeRound} from './engine.mjs';
import {publishScore,saveScore,readScores} from './bridge.mjs';
const el=id=>document.getElementById(id);
function safeStorage(){try{return window.localStorage;}catch{return null;}}
let roster=[...DEMO_ROSTER],rounds=0,tickets=0,best=0,locked=false;
let target={x:.5,y:.45};
const mode=()=>GAMES.find(g=>g.id===el('game').value);
function renderRoster(){
 const selected=el('character').value;
 const q=el('search').value.trim().toLowerCase();
 const list=roster.filter(r=>[r.name,r.office,r.state].join(' ').toLowerCase().includes(q));
 const select=el('character');select.replaceChildren();
 for(const item of list){const option=new Option(item.name+(item.office?' · '+item.office:'')+(item.state?' · '+item.state:''),item.id);select.add(option);}
 if(list.some(x=>x.id===selected))select.value=selected;
 el('pin-button').disabled=list.length===0;
 el('roster-status').textContent=list.length+' visible of '+roster.length+' '+(roster.length===DEMO_ROSTER.length?'demo':'owner-imported')+' roster entries. Not verified as a live government directory.';
}
function renderGame(){
 const g=mode();el('game-heading').textContent=g.title;
 el('instructions').textContent=g.id==='pin_donkey_on_tail'
   ?'Tap, click, or flick to put the cartoon donkey on the giant tail. For keyboard play, adjust the sliders and select PIN IT!'
   :'Tap, click, or flick to place a silly tail on the cartoon ASS. For keyboard play, adjust the sliders and select PIN IT!';
 el('target-art').textContent=g.id==='pin_donkey_on_tail'?'🪶':'🫏';
 el('pin').textContent=g.marker;nextRound();
}
function renderStats(){
 el('rounds').textContent=String(rounds);el('tickets').textContent=String(tickets);el('best').textContent=String(best);
}
function nextRound(){
 locked=false;target={x:.18+Math.random()*.64,y:.18+Math.random()*.64};
 el('target').style.left=(target.x*100)+'%';
 el('target').style.top=(target.y*100)+'%';
 el('pin').hidden=true;el('result').textContent='Aim for the 🎯 target. You get one placement per round.';
}
function place(x,y){
 if(locked||!el('character').value)return;
 locked=true;
 const round=makeRound({gameId:mode().id,characterId:el('character').value,x,y,targetX:target.x,targetY:target.y});
 rounds++;tickets+=round.tickets;best=Math.max(best,round.points);
 el('pin').style.left=(x*100)+'%';el('pin').style.top=(y*100)+'%';el('pin').hidden=false;
 el('result').textContent=round.points+' / 100 points · +'+round.tickets+' carnival tickets. Choose Next round to try again.';
 renderStats();saveScore(round,safeStorage());publishScore(round,window);
}
const board=el('board');
board.addEventListener('pointerdown',e=>{if(board.setPointerCapture)board.setPointerCapture(e.pointerId)});
board.addEventListener('pointerup',e=>{
 const r=board.getBoundingClientRect();
 const x=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));
 el('aim-x').value=String(Math.round(x*100));el('aim-y').value=String(Math.round(y*100));place(x,y);
});
el('pin-button').addEventListener('click',()=>place(Number(el('aim-x').value)/100,Number(el('aim-y').value)/100));
el('next').addEventListener('click',nextRound);
el('search').addEventListener('input',renderRoster);
el('game').addEventListener('change',renderGame);
el('import').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>250000)throw Error('File exceeds 250 KB.');
  const value=JSON.parse(await file.text()),next=normalizeRoster(value);
  if(!next.length)throw Error('The file contains no characters.');
  roster=next;el('search').value='';renderRoster();nextRound();
  el('roster-status').textContent='Loaded '+roster.length+' owner-imported entries locally. Names and offices have not been verified.';
 }catch(err){el('roster-status').textContent='Roster import failed: '+err.message;}
 e.target.value='';
});
el('share').addEventListener('click',async()=>{
 const msg='I scored '+best+'/100 on Nathan Tabor’s Political Carnival — '+GAMES[0].title+' / '+GAMES[1].title+'! '+location.href;
 try{if(navigator.share){await navigator.share({text:msg});return;}if(navigator.clipboard){await navigator.clipboard.writeText(msg);el('result').textContent='Score and game link copied.';return;}}
 catch{el('result').textContent='Sharing canceled or blocked.';return;}
 el('result').textContent=msg;
});
renderRoster();renderGame();
const prior=readScores(safeStorage());
if(prior.length)el('result').textContent='Ready to play. '+prior.length+' recent round receipts are on this browser.';
