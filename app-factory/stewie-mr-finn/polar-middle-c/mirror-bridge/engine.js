/* Stewart & Mr. Finn • Mirror Bridge
 * Original PAWS ↔ SWAP word play and introductory rotational mechanics.
 * Reuses the already-published Middle C character reversal utility.
 * No third-party characters, franchise brands, artwork, or media.
 */
(function(root,factory){
  'use strict';
  const api=factory(root.MiddleCGame || (typeof require==='function'?require('../../../middle-c/game.js'):null));
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PawMirrorBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(middleC){
 'use strict';
 if(!middleC||typeof middleC.reverse!=='function'||typeof middleC.hash!=='function')throw Error('Middle C core required');
 const MAX=1000000000;
 const WORDS=Object.freeze([
  {word:'PAWS',meaning:'Animal feet with pads and often claws'},
  {word:'SWAP',meaning:'To exchange one thing for another'},
  {word:'HO',meaning:'A playful exclamation or greeting'},
  {word:'OH',meaning:'An exclamation of realization or surprise'},
  {word:'STEWIE',meaning:'The nickname of Stewart, our patchwork cat'},
  {word:'FINN',meaning:'Stewart’s complementary-pattern cat friend'},
  {word:'NORTH',meaning:'The direction toward the geographic North Pole'},
  {word:'SOUTH',meaning:'The direction toward the geographic South Pole'},
  {word:'KIND',meaning:'Showing consideration and care for others'},
  {word:'BARK',meaning:'A canine vocalization or tree covering, by context'},
  {word:'ECHO',meaning:'A sound heard again after reflection'},
  {word:'STAR',meaning:'A luminous astronomical body or a celebrated person'}
 ]);
 const PHASES=Object.freeze(['ABOVE C • Meaning','BELOW C • Mirror','MIDDLE C • Balance']);
 function validLevel(n){if(!Number.isSafeInteger(n)||n<1||n>MAX)throw RangeError('Invalid bridge number');return n}
 function wordFor(level){return WORDS[(validLevel(level)-1)%WORDS.length]}
 function uniqueOptions(answer,wrongs,seed){
  const values=[answer,...wrongs.filter(v=>v!==answer)];
  const distinct=[...new Set(values)].slice(0,4);
  if(distinct.length!==4)throw Error('Four distinct answers required');
  const result=distinct.map((label,i)=>({id:'option-'+i,label}));
  return result.sort((a,b)=>(middleC.hash(seed+':'+a.label)-middleC.hash(seed+':'+b.label))||a.id.localeCompare(b.id))
 }
 function reverse(word){return middleC.reverse(String(word))}
 function invariant(before,after){const a=[...String(before)],b=[...String(after)];return {
  lengthBefore:a.length,lengthAfter:b.length,
  sameLength:a.length===b.length,
  sameCharacters:a.slice().sort().join('')===b.slice().sort().join(''),
  doubleReverse:reverse(reverse(before))===before,
  exactMirror:reverse(before)===after
 }}
 function mechanics(left,right,inertia=2,seconds=2,initialOmega=0){
   const nums=[left,right,inertia,seconds,initialOmega];
   if(!nums.every(Number.isFinite)||Math.abs(left)>1000||Math.abs(right)>1000||inertia<=0||inertia>10000||seconds<0||seconds>10000||Math.abs(initialOmega)>10000)
      throw RangeError('Invalid mechanics inputs');
   const netTorque=left+right,angularAcceleration=netTorque/inertia;
   const angularVelocity=initialOmega+angularAcceleration*seconds;
   const angle=initialOmega*seconds+0.5*angularAcceleration*seconds*seconds;
   return {left,right,inertia,seconds,initialOmega,netTorque,angularAcceleration,angularVelocity,angle,
       balanced:Math.abs(netTorque)<1e-10,atRest:Math.abs(angularVelocity)<1e-10};
 }
 function puzzle(level,phase){
   validLevel(level);
   if(!Number.isInteger(phase)||phase<0||phase>2)throw RangeError('Invalid phase');
   const w=wordFor(level),reversed=reverse(w.word);
   let title,symbol,question,answer,wrong,explanation,evidence;
   if(phase===0){
     title=PHASES[0];symbol=w.word;
     question='What does “'+w.word+'” mean in this story or ordinary English?';
     answer=w.meaning;
     wrong=[1,4,7].map(shift=>WORDS[(WORDS.indexOf(w)+shift)%WORDS.length].meaning);
     explanation='Read or hear the word with context. Letters alone cannot prove an invented meaning or a connection across historical languages.';
     evidence='English meaning / character canon';
   }else if(phase===1){
     title=PHASES[1];symbol=w.word+' ⇄ ?';
     question='Which answer exactly reverses every letter of '+w.word+'?';
     answer=reversed;
     wrong=[w.word,w.word.slice(1)+w.word[0],reverse(w.word.slice(1))+'X',reversed+'X','X'+reversed];
     explanation='Exact reversal: '+w.word+' ↔ '+reversed+'. Its letters and counts remain invariant; their order changes. Reversing twice returns the original.';
     evidence='Deterministic character reversal';
   }else{
     title=PHASES[2];const force=1+((level-1)%8);
     symbol='+'+force+' N·m    ↔    ?';
     question='Stewie turns a shared axle with +'+force+' N·m of torque. Which opposing torque makes its angular acceleration zero?';
     answer='−'+force+' N·m';
     wrong=['+'+force+' N·m','0 N·m','−'+(force+1)+' N·m'];
     explanation='Opposing torques on the same axis add: +'+force+' + (−'+force+') = 0 N·m. With a positive moment of inertia, angular acceleration is zero. An already-spinning axle can still keep rotating.';
     evidence='Στ = Iα for a fixed axis, simplified introductory model';
   }
   const choices=uniqueOptions(answer,wrong,level+':'+phase);
   return {level,phase,word:w.word,mirror:reversed,title,symbol,question,answer,choices,correctId:choices.find(c=>c.label===answer).id,explanation,evidence};
 }
 function newGame(level=1){validLevel(level);return {schema:'mammal.mirror-bridge.v1',level,phase:0,answered:false,choiceId:null,correctCount:0,stars:0,history:[]}}
 function validate(s){if(!s||s.schema!=='mammal.mirror-bridge.v1'||!Number.isSafeInteger(s.level)||s.level<1||s.level>MAX||![0,1,2].includes(s.phase)||typeof s.answered!=='boolean'||!Number.isSafeInteger(s.correctCount)||s.correctCount<0||!Number.isSafeInteger(s.stars)||s.stars<0||!Array.isArray(s.history))throw Error('Invalid progress');return s}
 function choose(state,id){
   const s={...validate(state),history:[...state.history]},p=puzzle(s.level,s.phase);
   if(s.answered)throw Error('This phase is already answered');
   const option=p.choices.find(c=>c.id===id);if(!option)throw Error('Invalid option');
   const correct=id===p.correctId;
   s.answered=true;s.choiceId=id;if(correct){s.correctCount++;if(s.phase===2)s.stars++}
   s.history.push({level:s.level,phase:s.phase,correct,selected:option.label});
   if(s.history.length>90)s.history.shift();
   return {state:s,correct,correctAnswer:p.answer,explanation:p.explanation}
 }
 function next(state){
   const s={...validate(state),history:[...state.history]};
   if(!s.answered)throw Error('Answer the phase before moving on');
   if(s.phase<2)s.phase++;else{if(s.level===MAX)throw RangeError('Maximum indexed bridge reached');s.level++;s.phase=0}
   s.answered=false;s.choiceId=null;return s
 }
 function inspect(text){
   const word=String(text||'').trim();
   if(!word||[...word].length>80)throw Error('Enter 1 to 80 characters');
   const flipped=reverse(word);
   return {word,reversed:flipped,...invariant(word,flipped),
      note:'Mirrored spelling preserves character counts; it does not on its own prove an etymology, intention, or physical symmetry.'}
 }
 return Object.freeze({WORDS,PHASES,MAX,reverse,invariant,mechanics,puzzle,newGame,validate,choose,next,inspect});
});