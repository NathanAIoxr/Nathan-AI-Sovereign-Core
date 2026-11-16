export const FIRST_BREAK = 45;
export const BREAK_INTERVAL = 30;
export const GIFT_INTERVAL = 60;
export const THANKS_COINS = 50;
export const HOUSE_GIFT_COINS = 150;

export function throwBreakState(saved) {
  return { total:0, nextBreak:FIRST_BREAK, queued:null, gifts:[], ...saved };
}

export function countThrow(state) {
  const total=state.total+1;
  if(total%GIFT_INTERVAL===0){
    return {...state,total,nextBreak:total+BREAK_INTERVAL,queued:null,gifts:[...state.gifts,total]};
  }
  return {...state,total,queued:state.queued??(total>=state.nextBreak?total:null)};
}

const SAFE_BREAKS=new Set(['match-ended','session-ended','bracket-round-ended']);
export function settleThrowBreak(state,boundary) {
  if(!SAFE_BREAKS.has(boundary)) return {state,gifts:[],slot:null};
  const gifts=state.gifts;
  if(gifts.length) return {state:{...state,gifts:[]},gifts,slot:null};
  return {state,gifts:[],slot:state.queued};
}

export function acknowledgeBreak(state,slot) {
  if(slot===null||state.queued!==slot) return state;
  return {...state,queued:null,nextBreak:state.total+BREAK_INTERVAL};
}
