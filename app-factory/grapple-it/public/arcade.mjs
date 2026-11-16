
export const CHASSIS = {
 arc: {name:'Trajectory & Arc', hint:'Drag to set direction and power. The dotted flight path accounts for drift.'},
 spin: {name:'Spin & Stick', hint:'Aim at the landing pad and release when the rotation dial is green.'},
 rope: {name:'Pendulum, Rope & Buoyancy', hint:'Release as the pendulum lines up with the target. A clean catch adds a bonus.'},
 rhythm: {name:'Clash, Parry & Rhythm', hint:'Tap on the beat as the pulse crosses the gold marker.'},
 craft: {name:'Precision Craft & Carve', hint:'Trace the lit checkpoints in order with one continuous stroke.'}
};

export const ERAS = [
 ['Backyard & Bar',[
  ['brass','Brass Ring','rope','Brass peg'],['rope','Rope','rope','Rope post'],
  ['horseshoes','Horseshoes','arc','Stakes'],['darts','Pub Darts','arc','Dartboard']]],
 ['County Fair & Wild West',[
  ['ducks','Spinning Duck Hooks','spin','Duck carousel'],['lasso','Cowboys’ Lasso','rope','Moving fence post'],
  ['reel','Fishing-Rod Reel','rope','Floating ring']]],
 ['Worksite & Lumberyard',[
  ['hammer','Framing Hammer','craft','Pegboard pattern'],['sledge','Heavy Sledgehammer','rhythm','Fairground bell'],
  ['axe','Throwing Axe','spin','Timber scoring disc']]],
 ['Feudal Shadow Arsenal',[
  ['stars','Throwing Stars','spin','Star-shaped tile'],['hairpins','Kanzashi Hairpins','craft','Ornament pattern'],
  ['kaginawa','Kaginawa Grapple','rope','Lantern ring']]],
 ['Ancient Naval & Siege',[
  ['corvus','Roman Corvus Boarding Grapple','rope','Training barge'],['harpoon','Harpoon','arc','Floating buoy'],
  ['crossbow','Crossbow','arc','Shipyard target'],['wristbow','Wrist-Bow','arc','Bobbing marker']]],
 ['PK’s Secret Junkyard · Hog Wild',[
  ['fireworks','Firework Rings','spin','Carnival spark pad'],['boomerang','Boomerangs','arc','Return hoop'],
  ['candy','Holiday Candy-Cane Hooks','rope','Peppermint peg'],['chicken','Rubber Chickens','rhythm','Squeaky bell'],
  ['skillet','Cast-Iron Skillet & Bacon Hook','spin','Breakfast griddle'],['lucky','Lucky Horseshoe','arc','Barn-door peg'],
  ['paint','The “Sunday Best” Paint Can','craft','Paint trim']]]
];

export const CARTRIDGES = ERAS.flatMap(([era,games],tier)=>games.map(([id,title,chassis,target],slot)=>
 ({id,title,chassis,target,era,tier,seed:(tier+1)*7+slot*3, drift:(slot%2===0?1:-1)*(.024+tier*.008),window:.105-tier*.006})));
export const GRAPPLE_WORDS='GRAPPLE = GRAPE 🍇 APE 🦍 LE ☸️ APPLE 🍎 = EL 🧟♂️ APP ♌️ EL 🎶 EPA ☢️ EP 🔮 AR 🔫 G 🪐';
export const PK_ORIGIN='He came from the pig 🐽 farmer and the sow (my momma) haha 🤣';
export const FORMS = [
 {id:'male',label:'Male 🍇',color:'#b889f1'},
 {id:'female',label:'Female 🍎',color:'#ff9ca5'}
];
const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
const cycle=(x)=>((x%1)+1)%1;

export function arena(game,time,round,wild=false){
 const phase=round*.85+game.seed*.08;
 const pulse=cycle(time*(.65+game.tier*.08)+phase*.13);
 const swing=.5+Math.sin(time*(1.55+game.tier*.16)+phase)*.35;
 const x=.48+Math.sin(phase)*.18+Math.sin(time*1.6+phase)*(wild?.105:.025);
 const y=.33+Math.cos(phase)*.10;
 const drift=game.drift+(wild ? Math.sin(phase)*.045 : 0);
 return {x,y,drift,pulse,swing,rotation:cycle(time*(.73+game.tier*.09)+phase),window:game.window};
}

export function flight(x,y,drift,returning=false){
 x=clamp(x,.04,.96);
 y=clamp(y,.08,.90);
 const curve=returning?.16:0;
 return Array.from({length:13},(_,i)=>{
  const t=i/12;
  return [.5+(x-.5)*t+drift*t*t+curve*Math.sin(Math.PI*t), .87+(y-.87)*t-.20*Math.sin(Math.PI*t)];
 });
}

export function checkpoints(game,round){
 const offset=(game.seed%5-2)*.017;
 const turn=round%2===0?1:-1;
 return [[.25+offset,.62],[.40+offset,.41+turn*.10],[.56+offset,.56],[.70+offset,.32+turn*.08],[.80+offset,.55]];
}

export function tracePoint(points,index,x,y){
 if(index>=points.length) return index;
 return Math.hypot(x-points[index][0],y-points[index][1])<=.075?index+1:index;
}

const distanceFrom=(value,target)=>Math.min(Math.abs(value-target),1-Math.abs(value-target));
const graded=(distance,window)=>distance<=window*.36?100:distance<=window*.75?75:distance<=window*1.2?45:distance<=window*1.65?20:0;

export function scoreChallenge(game,time,round,aim={x:.5,y:.5},wild=false,caught=0){
 const board=arena(game,time,round,wild);
 if(game.chassis==='craft')return Math.min(100,caught*20);
 if(game.chassis==='rhythm')return graded(distanceFrom(board.pulse,.72),board.window);
 if(game.chassis==='rope')return graded(Math.abs(board.swing-board.x),board.window);
 const [x,y]=flight(aim.x,aim.y,board.drift,game.id==='boomerang').at(-1);
 const error=Math.hypot(x-board.x,y-board.y);
 if(game.chassis==='spin')return graded(error+distanceFrom(board.rotation,.50)*.28,board.window);
 return graded(error,board.window);
}

export function arcadeGrade(total){return total>=270?'Gold':total>=205?'Silver':total>=150?'Bronze':null;}
export function openTier(records,index){
 return index===0||CARTRIDGES.some(game=>game.tier===index-1&&Object.hasOwn(records,game.id));
}
export function sanitizeExpansion(raw){
 const games={}, swings={};
 if(raw?.games&&typeof raw.games==='object'){
  for(const game of CARTRIDGES){
   const score=raw.games[game.id];
   if(Number.isInteger(score)&&score>=150&&score<=300)games[game.id]=score;
  }
 }
 if(raw?.swings&&typeof raw.swings==='object'){
  for(const level of [0,1,2,3,4,5]){
   const score=raw.swings[level];
   if(Number.isInteger(score)&&score>0&&score<=3600000)swings[level]=score;
  }
 }
 return {games,swings,form:FORMS.some(form=>form.id===raw?.form)?raw.form:'male'};
}
