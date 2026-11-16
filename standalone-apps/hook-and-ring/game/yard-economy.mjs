import {rewardState,playRewards,rankReward,awardReward} from './rewards.mjs';
import {throwBreakState,countThrow,settleThrowBreak,acknowledgeBreak,THANKS_COINS,HOUSE_GIFT_COINS} from './throw-breaks.mjs';
import {dayKey} from './physics.mjs';

const key='yard-darts-progress-v1';
const items=[
  {id:'tail',name:'Gold Dart Flights',cost:300,color:'#ffd469'},
  {id:'finish',name:'Moonstone Dart Finish',cost:600,color:'#d8caff'},
  {id:'court',name:'Blue Hour Court',cost:1200,color:'#9cbdff'},
];
let saved={};
try{saved=JSON.parse(localStorage.getItem(key))??{};}catch{}
let rewards=rewardState(saved.rewards);
let breaks=throwBreakState(saved.breaks);
let owned=Array.isArray(saved.owned)?saved.owned:[];
let selected=saved.selected??{};
let tutorialComplete=saved.tutorialComplete===true;
const $=id=>document.getElementById(id);
const shop=$('yard-shop');
function persist(){
  try{localStorage.setItem(key,JSON.stringify({rewards,breaks,owned,selected,tutorialComplete}));}catch{}
}
function show(){
  $('yard-coins').textContent=rewards.coins+' Coins';
  $('yard-shop-coins').textContent=rewards.coins+' Coins';
  for(const button of $('yard-items').children){
    const {id}=button.dataset;
    const item=items.find(item=>item.id===id);
    const equipped=selected[id]===true;
    button.textContent=item.name+' · '+(equipped?'Equipped':owned.includes(id)?'Equip':item.cost+' Coins');
    button.disabled=!owned.includes(id)&&rewards.coins<item.cost;
    button.setAttribute('aria-pressed',String(equipped));
  }
  $('yard-history').replaceChildren(...rewards.history.slice(0,10).map(entry=>{
    const el=document.createElement('li');
    el.textContent=entry.name+' · +'+entry.coins+' Coins';
    return el;
  }));
}
export function yardCosmetic(id){
  return selected[id] ? items.find(item=>item.id===id)?.color : undefined;
}
export function yardRewardThrow({points,mode,fromCpu,player}){
  if(fromCpu||player!==0)return;
  const played=playRewards(rewards,{mode,outcome:points===5?'catch':'miss',ended:false,versus:false});
  rewards=played.state;
  breaks=countThrow(breaks);
  if(played.notices.length) $('yard-reward').textContent=played.notices.map(gift=>gift.name+' +'+gift.coins).join(' · ');
  persist();show();
}
export function yardRewardRound({mode,complete=true,rankedDay}={}){
  const date=rankedDay?new Date(rankedDay+'T12:00:00Z'):new Date();
  const day=dayKey(date);
  if(complete&&mode==='daily')rewards=rankReward(rewards,date);
  const firstTutorial=complete&&mode==='practice'&&!tutorialComplete;
  if(firstTutorial){
    tutorialComplete=true;
    rewards=awardReward(rewards,day,'tutorial',{name:'First Practice completed',coins:250},[]);
  }
  if(complete&&mode==='local'&&rewards.lastLocalDay!==day){
    rewards=awardReward({...rewards,lastLocalDay:day},day,'local:'+day,{name:'Thanks for playing together',coins:75},[]);
  }
  const result=settleThrowBreak(breaks,complete?'match-ended':'session-ended');
  breaks=result.state;
  for(const number of result.gifts){
    rewards=awardReward(rewards,day,'house:'+number,{name:'On the House',coins:HOUSE_GIFT_COINS},[]);
  }
  if(result.slot!==null){
    rewards=awardReward(rewards,day,'slot:'+result.slot,{name:'Thanks for hanging out',coins:THANKS_COINS},[]);
    breaks=acknowledgeBreak(breaks,result.slot);
  }
  if(result.gifts.length||result.slot!==null) $('yard-reward').textContent=result.gifts.length?'On the House · +'+result.gifts.length*HOUSE_GIFT_COINS+' Coins':'Thanks for hanging out · +'+THANKS_COINS+' Coins';
  else if(firstTutorial) $('yard-reward').textContent='First Practice completed · +250 Coins';
  else if(complete&&mode==='daily') $('yard-reward').textContent='Daily Tournament score saved.';
  persist();show();
}
for(const item of items){
  const button=document.createElement('button');
  button.type='button';button.className='btn';button.dataset.id=item.id;
  button.onclick=()=>{
    if(!owned.includes(item.id)){
      if(rewards.coins<item.cost)return;
      rewards={...rewards,coins:rewards.coins-item.cost};owned=[...owned,item.id];
    }
    selected={...selected,[item.id]:!selected[item.id]};
    persist();show();
  };
  $('yard-items').append(button);
}
$('yard-shop-open').onclick=()=>{show();shop.showModal();};
$('yard-shop-close').onclick=()=>shop.close();
show();
