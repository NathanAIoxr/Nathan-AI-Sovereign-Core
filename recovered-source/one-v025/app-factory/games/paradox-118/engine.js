/* Paradox 118 · independent Factory game engine · no external dependencies */
(function(root){
'use strict';
const R=root.Paradox118Roster||(typeof require==='function'?require('./roster.js'):null);
if(!R)throw Error('Load roster.js first.');
const phases=['ABOVE C','BELOW C','THE MIDDLE C'];
const dilemmas=[
['A newcomer has a different view of the parade.','Invite them to speak and agree on fair rules.','Mock their beliefs.','Ban them because their name sounds unusual.'],
['Two characters disagree over a scroll.','Check the words and hear both accounts.','Invent what the scroll said.','Declare the loudest voice correct.'],
['A visitor feels left out of the celebration.','Ask what would help them participate safely.','Say their feelings do not matter.','Make them earn basic kindness.'],
['Someone is frightened by a spooky costume.','Offer reassurance and let them choose distance.','Force them to participate.','Laugh at their fear.'],
['Two legends tell different versions of a myth.','Credit both traditions and compare sources.','Pretend both are verified facts.','Silence the unfamiliar tradition.'],
['An enormous new arrival cannot fit on the stage.','Adapt the stage so everyone can participate.','Remove them from the show.','Blame them for being different.'],
['A participant reports unfair treatment.','Listen carefully and find safe support.','Ignore it to protect appearances.','Assume guilt from a title alone.'],
['An inspector finds a rule that harms small participants.','Review evidence and change the unfair rule.','Keep it because it is old.','Hide the complaint.'],
['A monster wants to make amends for a mistake.','Offer a safe, accountable path to repair harm.','Pretend harm never happened.','Say nobody can ever change.'],
['Two figures both want the same spotlight.','Make a fair schedule and protect everyone.','Reward whoever shouts most.','Start a dangerous fight.'],
['A famous leader makes an unverified claim.','Ask for evidence with respect.','Repeat the claim as certain.','Attack anyone who questions it.'],
['A ruler says the rules only apply to others.','Apply the same fair standard to the ruler.','Exempt powerful people.','Punish people who ask for fairness.'],
['A legend asks for a cultural story to be retold.','Credit the tradition and distinguish myth from history.','Claim to have invented it.','Erase its origins.']
];
const clone=x=>JSON.parse(JSON.stringify(x));
const reverse=s=>Array.from(s).reverse().join('');
const get=id=>R.byId[id]||null;
function words(id){let c=get(id);return c?c.name.split(/\s+/u).filter(x=>/[A-Za-z]/.test(x)&&x!=='THE'):[]}
function challenge(id,stage){
 const c=get(id);if(!c||![0,1,2].includes(stage))throw Error('Unknown game gate');
 const w=words(id);let prompt,right,wrongs,explain;
 if(stage===0){prompt='ABOVE C · Which is the FIRST personality word in this figure’s name?';right=w[0];wrongs=[w[1],w[w.length-1]];explain='Read what is actually written before interpreting the character.'}
 else if(stage===1){const x=w.length>2?w[1]:w[0];prompt='BELOW C · Reverse the spelling of '+x+' letter for letter.';right=reverse(x);wrongs=[x,reverse(w[w.length-1]),x.slice(1)+x[0]];explain='Below C is literal reversal. Reverse twice to recover the same letters.'}
 else{const d=dilemmas[c.groupIndex];prompt='THE MIDDLE C · '+d[0]+' What should '+c.name+' do?';right=d[1];wrongs=[d[2],d[3]];explain='Judge actions fairly: protect dignity, innocence and accountability.'}
 const opts=[right,...wrongs.filter(x=>x!==right)].filter((x,i,a)=>a.indexOf(x)===i);
 while(opts.length<3)opts.push(right+' '+opts.length);
 const offset=(Number(id.slice(-3))+stage)%3;
 const options=offset===0?[opts[1],opts[2],opts[0]]:offset===1?[opts[0],opts[1],opts[2]]:[opts[2],opts[0],opts[1]];
 return {prompt,options,correct:options.indexOf(right),explain,stage};
}
function fresh(id='LINE-001'){if(!get(id))throw Error('Unknown figure');return {version:1,id,stage:0,score:0,tries:0,wrong:0,done:{},message:'Choose an answer to begin.'}}
function valid(s){return s&&s.version===1&&get(s.id)&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=3&&Number.isSafeInteger(s.score)&&s.score>=0&&Number.isSafeInteger(s.tries)&&s.tries>=0&&Number.isSafeInteger(s.wrong)&&s.wrong>=0&&s.done&&typeof s.done==='object'&&!Array.isArray(s.done)}
function progress(s){if(!valid(s))throw Error('Invalid state');const completed=R.characters.filter(c=>s.done[c.id]===true);const badges=[...new Set(completed.map(c=>c.group))];return {figures:completed.length,collections:badges.length,badges,parade:badges.length===13,master:completed.length===118}}
function select(s,id){if(!valid(s)||!get(id))return {accepted:false,state:clone(s)};const r=clone(s);r.id=id;r.stage=r.done[id]===true?3:0;r.message='Figure selected. Complete all three gates.';return {accepted:true,state:r}}
function replay(s){if(!valid(s))throw Error('Invalid state');const r=clone(s);r.stage=0;r.message='Replaying this character. Earned badges remain.';return r}
function answer(s,choice){
 if(!valid(s))throw Error('Invalid state');const r=clone(s);
 if(r.stage===3||!Number.isInteger(choice)||choice<0||choice>2)return {accepted:false,correct:false,state:r};
 const q=challenge(r.id,r.stage);r.tries++;
 if(choice!==q.correct){r.wrong++;r.message='Try again. '+q.explain;return {accepted:true,correct:false,state:r}}
 r.score+=10;r.stage++;r.message='Correct! '+q.explain;
 if(r.stage===3){if(r.done[r.id]!==true){r.done[r.id]=true;r.score+=20};const p=progress(r);r.message='Spotlight cleared! '+p.collections+' of 13 parade badges earned.'+(p.parade?' The Grand Parade is unlocked!':'')+(p.master?' Master Collector!':'')}
 return {accepted:true,correct:true,state:r}
}
function save(s){if(!valid(s))throw Error('Invalid state');return JSON.stringify(s)}
function load(text){let x;try{x=JSON.parse(text)}catch{throw Error('Not valid JSON')}
 if(!valid(x))throw Error('Not a valid 118 Line save');
 const done={};for(const c of R.characters)if(x.done[c.id]===true)done[c.id]=true;
 return {version:1,id:x.id,stage:done[x.id]?3:x.stage===3?0:x.stage,score:x.score,tries:x.tries,wrong:x.wrong,done,message:'Local progress restored.'}
}
const api=Object.freeze({R,phases,reverse,get,words,challenge,fresh,progress,select,replay,answer,save,load});
root.Paradox118Engine=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
