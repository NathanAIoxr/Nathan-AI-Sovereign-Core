const $=id=>document.getElementById(id);
const PLAYER_KEY='grapple-it-daily-player';
const ALIAS_KEY='grapple-it-daily-alias';
let current,readAbort,posting=false;
let player,alias='';
try {
  player=localStorage.getItem(PLAYER_KEY);
  alias=localStorage.getItem(ALIAS_KEY)??'';
} catch {}
if(!/^[a-f\d]{32}$/.test(player??'')){
  player=globalThis.crypto?.randomUUID?.().replaceAll('-','');
  if(player)try{localStorage.setItem(PLAYER_KEY,player);}catch{}
}
$('daily-alias').value=alias;
const say=text=>{$('daily-board-status').textContent=text;};
export function setRankedRun(run){
  current=run;
  updateActions();
}
function updateActions(){
  $('daily-submit').disabled=posting||!current||!player;
  $('daily-refresh').disabled=posting;
}
export async function loadDailyBoard(message){
  readAbort?.abort();
  const active=new AbortController();
  readAbort=active;
  say('Loading the online rankings…');
  try{
    const answer=await fetch('./api/daily',{cache:'no-store',signal:active.signal});
    const data=await answer.json();
    if(active.signal.aborted)return;
    if(!answer.ok)throw Error(data.error);
    $('daily-board-rows').replaceChildren(...data.scores.map(score=>{
      const row=document.createElement('li');
      row.textContent=score.alias+' · '+score.medal+' · '+(score.ms/1000).toFixed(2)+' s';
      return row;
    }));
    say(message??(data.scores.length?'Ranked by medal, then fastest finish.':'No scores posted for '+data.day+' UTC.'));
  }catch(error){
    if(!active.signal.aborted)say(message??(navigator.onLine?'Rankings unavailable. Try Refresh.':'You’re offline. Local play is ready.'));
  }
}
$('daily-refresh').onclick=()=>loadDailyBoard();
$('daily-form').onsubmit=async event=>{
  event.preventDefault();
  if(!current||!player||$('daily-submit').disabled)return;
  const submitted=current;
  readAbort?.abort();posting=true;updateActions();
  say('Checking the input replay…');
  try{
    const alias=$('daily-alias').value.trim();
    const response=await fetch('./api/daily',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...submitted,alias,player})});
    const data=await response.json();
    if(!response.ok)throw Error(data.error);
    try{localStorage.setItem(ALIAS_KEY,alias);}catch{}
    if(submitted!==current)return;
    await loadDailyBoard(data.improved?'Posted '+data.accepted.medal+' · '+(data.accepted.ms/1000).toFixed(2)+' s.':'Run verified. Your better result is already on the board.');
  }catch(error){
    if(current===submitted)say(navigator.onLine?error.message:'You’re offline. This run can be posted while this round is open.');
  }finally{
    posting=false;updateActions();
  }
};

window.addEventListener('grapple-view',event=>{if(event.detail!=='daily')readAbort?.abort();});
