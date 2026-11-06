/* Free local progression. Coins/gems are earned game counters, never purchased. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TrialProfile=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const tactics=typeof module==='object'&&module.exports?require('./strategy.js'):globalThis.TrialStrategy;
function initial(){return {schema:'one.33trial.profile.v1',starterGift:true,coins:100,gems:3,stars:{},completed:[],bestScores:{},completedMoves:{},mastery:{}};}
function validate(p){
 if(!p||p.schema!=='one.33trial.profile.v1'||p.starterGift!==true)throw Error('Unknown progress file');
 for(const key of ['coins','gems'])if(!Number.isSafeInteger(p[key])||p[key]<0)throw Error('Invalid earned balance');
 if(!Array.isArray(p.completed)||p.completed.length>33||new Set(p.completed).size!==p.completed.length||!p.completed.every(v=>Number.isInteger(v)&&v>=1&&v<=33))throw Error('Invalid completion list');
 for(const key of ['stars','bestScores','completedMoves']){
  if(!p[key]||typeof p[key]!=='object'||Array.isArray(p[key])||Object.keys(p[key]).length>33)throw Error('Invalid progress records');
  for(const [level,value] of Object.entries(p[key]))if(!/^(?:[1-9]|[12][0-9]|3[0-3])$/.test(level)||!p.completed.includes(Number(level))||!Number.isSafeInteger(value)||value<0||(key==='stars'&&(value<1||value>3)))throw Error('Invalid level record');
  if(!p.completed.every(level=>Object.hasOwn(p[key],level)))throw Error('Missing completion record');
 }
 const result=JSON.parse(JSON.stringify(p));result.mastery=result.mastery||{};
 if(typeof result.mastery!=='object'||Array.isArray(result.mastery)||Object.keys(result.mastery).length>33)throw Error('Invalid mastery records');
 for(const [level,record] of Object.entries(result.mastery))if(!/^(?:[1-9]|[12][0-9]|3[0-3])$/.test(level)||!p.completed.includes(Number(level))||!record||!Number.isInteger(record.rank)||record.rank<1||record.rank>3||!Number.isSafeInteger(record.turns)||record.turns<1||typeof record.contract!=='boolean')throw Error('Invalid mastery medal');
 return result;
}
function award(p,s,d){
 if(s.status!=='won')return {earned:false,coins:0,gems:0};
 const moves=s.strategy?.heroTurns??s.moves,limit=s.strategy?.limit??d.moveLimit;
 const first=!p.completed.includes(s.level),stars=limit===null?3:moves<=Math.ceil(limit/3)?3:moves<=Math.ceil(limit*2/3)?2:1;
 if(s.strategy){
  p.mastery=p.mastery||{};const rank={story:1,tactician:2,grandmaster:3}[s.strategy.difficulty],old=p.mastery[s.level],g=s.strategy;
  const definition=tactics.GUIDES[s.level-1],contract=tactics.contractValue(s)>=definition.target;
  if(!old||rank>old.rank)p.mastery[s.level]={rank,turns:moves,contract};
  else if(rank===old.rank)p.mastery[s.level]={rank,turns:Math.min(moves,old.turns),contract:contract||old.contract};
 }

 p.stars[s.level]=Math.max(p.stars[s.level]||0,stars);p.bestScores[s.level]=Math.max(p.bestScores[s.level]||0,s.score);p.completedMoves[s.level]=Math.min(p.completedMoves[s.level]??Infinity,moves);
 if(!first)return {earned:false,coins:0,gems:0};
 p.completed.push(s.level);p.completed.sort((a,b)=>a-b);p.coins+=100;
 const start=Math.floor((s.level-1)/11)*11+1,epochDone=Array.from({length:11},(_,i)=>start+i).every(level=>p.completed.includes(level));
 const gems=epochDone?5:1;p.gems+=gems;return {earned:true,coins:100,gems};
}
function next(p){return Array.from({length:33},(_,i)=>i+1).find(i=>!p.completed.includes(i))||33;}
return Object.freeze({initial,validate,award,next});
});
