import {hashSeed} from './physics.mjs';

export const YARD_SHOTS=10;
export const YARD_LIMIT_MS=120000;
export const YARD_FLIGHT_MS=780;
export const YARD_RESET_MS=950;
const yardClamp=(value,min,max)=>Math.min(max,Math.max(min,value));
function fraction(seed,key){
  let value=hashSeed(seed+':'+key);
  value^=value<<13;
  value^=value>>>17;
  value^=value<<5;
  return (value>>>0)/4294967296;
}
export function yardRound(seed,round){
  return {x:158+107*fraction(seed,round+':x'),y:190+85*fraction(seed,round+':y'),
    r:67,wind:Math.round((-3.2+6.4*fraction(seed,round+':wind'))*10)/10};
}
export function yardImpact(x,y,wind,jitter,jitterY){
  return {x:yardClamp(x+wind*5.1+jitter,12,408),y:yardClamp(y+jitterY,90,386)};
}
export function yardPoints(target,x,y){
  const d=Math.hypot(x-target.x,y-target.y);
  return d<=20?5:d<=46?3:d<=target.r?1:0;
}
export function rankedYardImpact(seed,index,x,y){
  const target=yardRound(seed,Math.floor(index/3)+1);
  return yardImpact(x,y,target.wind,16*fraction(seed,index+':dx')-8,14*fraction(seed,index+':dy')-7);
}
export function verifyYardShots(shots,seed,elapsed){
  if(!Array.isArray(shots)||shots.length===0||shots.length>YARD_SHOTS)return null;
  let score=0,durationMs=0;
  for(const [index,shot] of shots.entries()){
    const {x,y,releasedMs}=shot??{};
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<30||x>390||y<95||y>380)return null;
    const earliest=index===0?0:durationMs+YARD_RESET_MS;
    if(!Number.isInteger(releasedMs)||releasedMs<Math.max(0,earliest-30)||releasedMs>=YARD_LIMIT_MS||releasedMs>elapsed+400)return null;
    const hit=rankedYardImpact(seed,index,x,y);
    score+=yardPoints(yardRound(seed,Math.floor(index/3)+1),hit.x,hit.y);
    durationMs=releasedMs+YARD_FLIGHT_MS;
  }
  return durationMs<=elapsed+850?{score,durationMs}:null;
}
