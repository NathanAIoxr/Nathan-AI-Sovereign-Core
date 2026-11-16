import { dayKey, hashSeed } from './physics.mjs';

export const GIFT_RINGS = [
  { id:'sunset', name:'Porch Sunset', color:'#ff925f' },
  { id:'moonstone', name:'Moonstone', color:'#c7bdff' },
  { id:'wildflower', name:'Wildflower', color:'#f2a8c8' },
  { id:'sea-glass', name:'Sea Glass', color:'#8ff5dc' },
];
export const BOARDS = [
  {id:'original',name:'Original porch',price:0,palette:['#452719','#775037','#2d190f']},
  {id:'evening',name:'Blue Hour',price:200,palette:['#19233d','#485677','#131925']},
  {id:'garden',name:'Garden Porch',price:350,palette:['#203424','#56654b','#1c2518']},
  {id:'ember',name:'Glowing Embers',price:500,palette:['#54261f','#93503a','#301612']},
];
const WELCOME = [
  { name:'Welcome to the porch', coins:150, ring:'sunset' },
  { name:'First clean catch', coins:50 },
  { name:'Something for your next swing', coins:75 },
  { name:'Welcome back', coins:100, ring:'moonstone' },
  { name:'A little extra for sticking with it', coins:125, ring:'wildflower' },
  { name:'You showed up', coins:100, ring:'sea-glass' },
];
const DAY_REWARDS = [40,60,80,100,120,150,200];

export function rewardState(saved) {
  return { coins:0, throws:0, days:0, lastDay:null, lastDropDay:null, lastRankedDay:null, lastLocalDay:null,
    unlocks:[], boards:['original'], ring:null, board:'original', history:[], ...saved };
}
export function awardReward(state, day, id, gift, notices) {
  if(state.history.some(row=>row.id===id)) return state;
  const ring=gift.ring&&!state.unlocks.includes(gift.ring)?gift.ring:null;
  const coins=gift.coins+(gift.ring&&!ring?50:0);
  const entry={id,day,name:gift.name,coins,ring};
  if(gift.surprise) notices.push(entry);
  return {...state,coins:state.coins+coins,unlocks:ring?[...state.unlocks,ring]:state.unlocks,
    history:[entry,...state.history].slice(0,60)};
}
export function rankReward(saved,date=new Date()) {
  const day=dayKey(date);
  if(saved.lastRankedDay===day) return saved;
  return awardReward({...saved,lastRankedDay:day},day,'daily:'+day,
    {name:'Daily Tournament completed',coins:75},[]);
}
export function playRewards(saved, {mode, outcome, ended, versus, localCompleted=ended&&versus, date = new Date()}) {
  const day=dayKey(date), notices=[];
  let state={...saved,throws:saved.throws+1};
  const give=(id,gift,surprise=true)=>{state=awardReward(state,day,id,{...gift,surprise},notices);};
  if(state.throws===1) give('welcome',WELCOME[0]);
  if(saved.lastDay!==day){
    state.days++;
    state.lastDay=day;
    const slot=(state.days-1)%DAY_REWARDS.length;
    give('play:'+day,{name:'Play day '+(slot+1),coins:DAY_REWARDS[slot]},false);
    if(state.days===2) give('return',WELCOME[3]);
    if(slot===6) give('week:'+day,WELCOME[5]);
  }
  if(outcome==='catch'&&!saved.firstCatch){
    state.firstCatch=true;
    give('first-catch',WELCOME[1]);
  }
  if(state.throws===5) give('fifth',WELCOME[2]);
  if(state.throws===15) give('fifteenth',WELCOME[4]);
  if(ended&&mode==='trick'&&!saved.tricks){
    state.tricks=true; give('tricks',{name:'Trick-shot round finished',coins:100});
  }
  if(localCompleted&&state.lastLocalDay!==day) {
    state.lastLocalDay=day;
    give('local:'+day,{name:'Thanks for playing together',coins:75});
  }
  const dropAt=7+hashSeed('porch:'+day)%7;
  if(state.lastDropDay!==day&&state.throws>16&&(state.throws+hashSeed(day)%13)%17===dropAt){
    state.lastDropDay=day;
    give('surprise:'+day,{name:'A surprise from the porch',coins:50+25*(hashSeed('gift:'+day)%3)});
  }
  return {state,notices};
}
export function buyBoard(state,id) {
  const board=BOARDS.find(item=>item.id===id);
  if(!board||state.boards.includes(id)||state.coins<board.price) return state;
  return {...state,coins:state.coins-board.price,boards:[...state.boards,id],board:id};
}
