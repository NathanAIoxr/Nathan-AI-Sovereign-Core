import {GEAR,REWARD,TIERS,EXPEDITIONS} from './roster.mjs';
const clamp = (n,low=0,high=1)=>Math.max(low,Math.min(high,n));
export function newArcade({mode='classic',id='brass-ring',mission=null}={}){
  const expedition=EXPEDITIONS.find(x=>x.id===mission);
  const selected=GEAR.get(expedition?.gear??id);
  if(!selected)throw Error('Unknown game gear.');
  const tournament=mode==='solo-bracket'||mode==='team-bracket';
  return {mode,gear:selected,expedition,tournament,time:0,phase:'ready',receipts:[],reeling:false,
    charge:0,progress:0,stress:.2,second:0,result:null,notice:'Read the target window before your release.'};
}
export function turn(s){
  const count=s.receipts.length, series=s.tournament;
  return {round:series?Math.floor(count/4):0, attempt:series?count%4:count,
    team:series?count%2:0, player:s.mode==='team-bracket'?Math.floor(count%4/2)+1:1};
}
const members = ['Grape','Apple'];
export function actor(s){
  const t=turn(s);
  if(!s.tournament)return 'Player';
  if(s.mode==='solo-bracket'&&t.team===1)return 'Nathan AI 🚀';
  return members[t.team]+(s.mode==='team-bracket'?' '+t.player:'');
}
export function shotBoard(s){
  const {gear:g}=s, {round,attempt}=turn(s);
  const chaos=s.mode==='pk-chaos'?2:s.mode==='pk-wild'?1:0;
  const full=s.mode==='nathan-full'?1:0;
  const t=s.time*g.tier.tempo*(1+.075*round+.14*full+.14*chaos);
  const wind=g.tier.wind*Math.sin(1.32*t+attempt*1.37);
  const shift=(s.expedition?.layout??0)+(chaos?.058*chaos*Math.sin(t*2.6+attempt):0);
  const movingTarget=.50+shift+(g.rule==='latch'||g.rule==='tether'?.091*Math.sin(t*.81):0);
  const swung=.5+.40*Math.sin(t*1.82+attempt*.24);
  const triangle=1-Math.abs(((t*.61+.11)%2)-1);
  const pos=clamp((g.rule==='bounce'?.08+triangle*.84:swung)+wind);
  const rotation=Math.sin(t*3.32+.38);
  const returning=Math.cos(t*1.82+attempt*.24)<0;
  const margin=g.timing*(s.mode==='coach'?1.26:1-.16*full-.095*chaos-.06*round);
  const target=s.phase==='second'?clamp(movingTarget+(attempt%2?-.12:.12),.16,.84):clamp(movingTarget,.15,.85);
  const spinOK=g.rule!=='spin'||Math.abs(rotation)<=.86||Math.abs(pos-target)<margin*.35;
  return {pos,target,margin,rotation,returning,spinOK,wind};
}
function finesse(s,b){
  const distance=Math.abs(b.pos-b.target);
  if(distance>b.margin||!b.spinOK||(s.gear.rule==='return'&&!b.returning))return 0;
  return clamp((1-distance/b.margin)*.86+.14);
}
export function scores(s){
  const teams=[0,0], rounds=Array.from({length:s.tournament?3:1},()=>[0,0]);
  for(const item of s.receipts){teams[item.team]+=item.score;rounds[item.round][item.team]+=item.score;}
  return {teams,rounds};
}
function resolve(s,score,success,note){
  if(s.phase==='done')return;
  const t=turn(s);
  s.receipts.push({...t,actor:actor(s),score,success,note});
  s.notice=note;s.reeling=false;s.time=0;s.charge=0;s.progress=0;s.stress=.2;
  if(s.receipts.length<(s.tournament?12:3)){s.phase='ready';return;}
  const {teams,rounds}=scores(s);
  const target=s.expedition?.goal??({'nathan-full':225,'pk-chaos':210,'pk-wild':170,coach:130}[s.mode]??145);
  const hits=s.receipts.filter(x=>x.success).length;
  const won=s.tournament?(s.mode==='team-bracket'?teams[0]!==teams[1]:teams[0]>teams[1]):teams[0]>=target&&(!s.expedition||hits>=2);
  s.result={teams,rounds,hits,target,won,tie:s.tournament&&teams[0]===teams[1],
    grade:s.tournament?(won?'Gold':''):won?(teams[0]>=250?'Gold':teams[0]>=205?'Silver':'Bronze'):''};
  s.phase='done';
}
export function stepArcade(s,dt){
  if(s.phase==='done'||!Number.isFinite(dt)||dt<=0)return;
  s.time+=dt;
  if(s.phase==='charge'){s.charge=clamp(s.charge+dt*.95*s.gear.force);return;}
  if(s.phase==='second'){
    s.second-=dt;
    if(s.second<=0)resolve(s,0,false,'The second window closed.');
    return;
  }
  if(s.phase!=='reel')return;
  const rough=s.gear.rule==='tether'?.14:.065;
  const chaos=s.mode==='pk-chaos'?.15:s.mode==='pk-wild'?.075:0;
  const wave=(1+Math.sin(s.time*3.8))*.5*(rough+chaos);
  s.stress=clamp(s.stress+dt*(s.reeling?.34/s.gear.force+wave:-.41));
  if(s.stress>=1){resolve(s,0,false,'The line snapped. Ease sooner on the next cast.');return;}
  if(s.reeling&&s.stress>=.23&&s.stress<=.8)s.progress=clamp(s.progress+dt*.48*s.gear.force);
  if(s.progress>=1)resolve(s,55+Math.round(45*s.latchQuality),true,'Anchor latched and retrieved.');
}
export function isNathanTurn(s){return s.tournament&&s.mode==='solo-bracket'&&turn(s).team===1;}
export function readyToRelease(s){
  const board=shotBoard(s);
  return finesse(s,board)>=.49;
}
export function actionArcade(s){
  if(s.phase==='done')return;
  if(s.phase==='reel'){s.reeling=!s.reeling;return;}
  const b=shotBoard(s), quality=finesse(s,b), rule=s.gear.rule;
  if(s.phase==='second'){
    const combined=(quality+s.firstQuality)/2;
    resolve(s,quality===0?0:58+Math.round(42*combined),quality>0,quality>0?'Both targets caught.':'The second target slipped away.');
    return;
  }
  if(rule==='heavy'&&s.phase==='ready'){s.phase='charge';s.notice='Charge to 55% or more, then release in the window.';return;}
  if(rule==='heavy'&&s.charge<.55){resolve(s,0,false,'The throw was undercharged.');return;}
  if(quality===0){resolve(s,0,false,rule==='spin'?'The spin or position was out of alignment.':'Release missed the window.');return;}
  if(rule==='latch'||rule==='tether'){
    s.latchQuality=quality;s.phase='reel';s.notice='Latched. Reel in green, then ease as tension rises.';return;
  }
  if(rule==='chain'){s.firstQuality=quality;s.phase='second';s.second=2.2;s.notice='Primary hit. Catch the second window.';return;}
  resolve(s,55+Math.round(45*quality),true,'Clean '+(rule==='bounce'?'bank shot.':'hit.'));
}
export function assistNathan(s){
  if(!isNathanTurn(s)||s.time<.3)return;
  if(s.phase==='reel'){if(s.stress>.63)s.reeling=false;if(s.stress<.33)s.reeling=true;return;}
  if(s.gear.rule==='heavy'&&s.phase==='ready'){actionArcade(s);return;}
  if(s.phase==='charge'&&s.charge<.60)return;
  if(readyToRelease(s)||s.time>6)actionArcade(s);
}
export function cleanProgress(data={}){
  const record=(max)=>Object.fromEntries(Object.entries(data?.records??{}).filter(([k,v])=>
    (GEAR.has(k)||EXPEDITIONS.some(x=>x.id===k)||['coach','nathan-full','pk-wild','pk-chaos'].includes(k))&&
    Number.isSafeInteger(v)&&v>0&&v<=max));
  const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(9999999,n):0;
  return {form:data?.form==='female'?'female':'male', coins:count(data?.coins), wins:count(data?.wins), records:record(300),
    tournamentWins:count(data?.tournamentWins), reunion:data?.reunion===true};
}
export function unlockedTier(profile){return TIERS.reduce((unlocked,tier,i)=>
  i===unlocked&&tier.gear.some(g=>profile.records[g.id]>=145)?Math.min(i+1,TIERS.length-1):unlocked,0);}
export function completeArcade(profile,s,session){
  if(!s.result?.won||s.rewarded)return 0;
  s.rewarded=true;
  if(s.tournament){profile.tournamentWins++;session.nathan=false;profile.coins=Math.min(9999999,profile.coins+125);return 125;}
  const key=s.expedition?.id??(s.mode==='classic'?s.gear.id:s.mode);
  const prior=profile.records[key]??0;
  profile.records[key]=Math.max(prior,s.result.teams[0]);
  let award=prior?20:80;
  profile.wins++;
  if(s.mode==='pk-chaos'&&session.nathan&&!profile.reunion){
    profile.reunion=true;award+=REWARD.coins;
  }
  session.nathan=s.mode==='nathan-full';
  profile.coins=Math.min(9999999,profile.coins+award);
  return award;
}
