import {clamp} from './engine.mjs';
/** Deliberately playable ARCADE physics, not claimed to replicate real-world ball/bag/dart physics. */
export const cartridges=[
  {id:'ten_pin_bowling',label:'Bowling',number:'08',description:'Lane placement, power, late hook'},
  {id:'beanbag_toss',label:'Cornhole',number:'02',description:'Underhand bag toss and board scoring'},
  {id:'pub_darts',label:'Darts',number:'09',description:'Wrist-flip aim, rings, and scoring'},
  {id:'baseball_pitching',label:'Baseball',number:'B',description:'Virtual pitch with a wrist flick or deliberately armed handheld motion'},
  {id:'air_patterns',label:'Air Patterns',number:'A',description:'Trace circles, triangles, figure-eights, and swish-and-flick gestures'},
];
const scores=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
export function evaluateThrow(gameId,g) {
  const power=clamp(g.power,0,1), spin=clamp(g.spin,-1,1);
  if(gameId==='ten_pin_bowling') {
    const x=clamp(g.aimX+.10*spin,0,1);
    const ideal=Math.abs(x-.51);
    const efficiency=Math.min(1,power/.58);
    const pins=clamp(Math.round((10-ideal*24)*efficiency + Math.min(2,Math.abs(spin)*2)),0,10);
    return {x,y:.18+.32*(1-power),score:pins,kind:pins===10?'STRIKE!':`${pins} pins`,
      hint:'Demonstration scoring only; upgrade to rigid-body ball/pin simulation'};
  }
  if(gameId==='beanbag_toss') {
    const x=clamp(g.aimX+spin*.12,0,1);
    const y=clamp(1.05-power*1.05,0,1);
    const dx=(x-.5)*1.35, dy=(y-.28)*1.4;
    const dist=Math.hypot(dx,dy);
    const score=dist<.11?3:dist<.55?1:0;
    return {x,y,score,kind:score===3?'IN THE HOLE':score===1?'ON THE BOARD':'OFF THE BOARD',
      hint:'Illustrative bag placement; independent contact and friction modelling is future work'};
  }
  if(gameId==='baseball_pitching'){
    const x=clamp(g.aimX+.16*spin,0,1);
    const y=clamp(.5+(0.55-power)*.50,0,1);
    const strike=(x>.31&&x<.69&&y>.30&&y<.72);
    return {x,y,score:strike?1:0,kind:strike?'STRIKE ZONE':'BALL',
      hint:'Arcade strike-zone scoring; neither true pitch MPH nor ball flight has been measured'};
  }
  const x=clamp(g.aimX+spin*.13,0,1);
  const y=clamp(.5+(0.54-power)*.65,0,1);
  const dx=x-.5,dy=y-.5,dist=Math.hypot(dx,dy);
  let score=0,kind='MISS';
  if(dist<.034) {score=50;kind='DOUBLE BULL';}
  else if(dist<.07) {score=25;kind='SINGLE BULL';}
  else if(dist<.48) {
    // 20 on top; each wedge spans 18 degrees, clockwise from 12 o'clock.
    const angle=(Math.atan2(dx,-dy)+Math.PI*2)%(Math.PI*2);
    const wedge=Math.floor((angle+Math.PI/20)/(Math.PI/10))%20;
    const base=scores[wedge];
    const multiplier=(dist>.41 && dist<.48)?2:(dist>.235 && dist<.285)?3:1;
    score=base*multiplier;kind=`${multiplier===3?'TRIPLE ':multiplier===2?'DOUBLE ':''}${base}`;
  }
  return {x,y,score,kind,hint:'Illustrative dart trajectory; advanced dart flight/collision remains unimplemented'};
}
