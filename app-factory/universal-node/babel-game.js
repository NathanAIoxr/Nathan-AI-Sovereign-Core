/* Babel × Inferno: original non-violent educational puzzle game.
  18 levels = nine rising Babel stages + nine mirrored descending Inferno stages.
  Source inspirations are fiction/literature/metaphors. Not medical diagnostics.
*/
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BabelInfernoGame=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const themes=[
 ['Vanity of the Crown','Humility','People are worth more than rank'],
 ['Brick and Burden','Dignity','Workers are people, never replaceable tools'],
 ['Fear of Difference','Curiosity','Different language is not a lesser voice'],
 ['Walls of Control','Consent','Power must respect each sovereign person'],
 ['False Signals','Truth','Compare a claim to evidence'],
 ['Noise and Babble','Listening','Listen before drawing a conclusion'],
 ['Division','Cooperation','Different strengths can join without erasure'],
 ['The Mirror of Blame','Accountability','Correct mistakes without scapegoating'],
 ['The Summit of Pride','Compassion','Choose restoration over domination']
];
function stages(){const stages=[];for(const realm of ['babel','inferno'])for(let i=0;i<9;i++){const q=realm==='babel'?i:8-i;stages.push({id:realm+'-'+(i+1),realm,depth:i+1,title:themes[q][0],virtue:themes[q][1],lesson:themes[q][2],frozen:realm==='inferno'&&i===8,mirrorOf:realm==='babel'?'inferno-'+(9-i):'babel-'+(9-i)})}return stages}
const STAGES=Object.freeze(stages());
function seedFrom(value){return String(value).split('').reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261)}
function shuffle(arr,seed){const a=[...arr];let n=seed>>>0;for(let i=a.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function board(stage){if(!STAGES.some(s=>s.id===stage.id))throw Error('Unknown stage');let tiles=shuffle(['restore','restore','restore','trap','trap','trap','empty','empty','empty'],seedFrom(stage.id));if(stage.realm==='inferno')tiles=tiles.map((_,i)=>tiles[8-i]);return tiles.map((kind,i)=>({id:i,kind,revealed:false}))}
function newGame(){return {schema:'tabor.babel-inferno.game.v1',stageIndex:0,health:7,maxHealth:7,shield:2,score:0,restored:0,turns:0,finished:false,history:[],tiles:board(STAGES[0]),seen:[]}}
function validate(s){if(!s||s.schema!=='tabor.babel-inferno.game.v1'||!Number.isInteger(s.stageIndex)||s.stageIndex<0||s.stageIndex>=18||!Array.isArray(s.tiles)||s.tiles.length!==9||!Number.isInteger(s.health)||s.health<0||s.health>s.maxHealth||!Number.isInteger(s.restored)||s.restored<0||s.restored>3||!Array.isArray(s.history))throw Error('Bad game state');return s}
function getStage(s){validate(s);return STAGES[s.stageIndex]}
function action(state,tileId){const s=structuredClone(validate(state));if(s.finished||s.health<=0)return {state:s,event:'ended'};if(!Number.isInteger(tileId)||tileId<0||tileId>8)throw Error('Invalid tile');const tile=s.tiles[tileId];if(tile.revealed)return {state:s,event:'already-opened'};tile.revealed=true;s.turns++;
 let event;if(tile.kind==='restore'){s.restored++;s.score+=10;event='restoration';}else if(tile.kind==='trap'){if(s.shield>0){s.shield--;event='shield-protected';}else{s.health--;event='challenge';}}else {s.score+=2;event='discovery';}
 s.history.push({stageId:getStage(s).id,tileId,event});if(s.history.length>1000)s.history.shift();
 if(s.restored===3){s.score+=25;s.seen.push(getStage(s).id);event='stage-restored';if(s.stageIndex===17){s.finished=true;event='victory';} }
 return {state:s,event}}
function next(state){const s=structuredClone(validate(state));if(s.restored!==3||s.stageIndex>=17||s.finished)throw Error('Stage not ready');s.stageIndex++;s.tiles=board(STAGES[s.stageIndex]);s.restored=0;s.shield=Math.min(3,s.shield+1);s.health=Math.min(s.maxHealth,s.health+1);return s}
function restartStage(state){const s=structuredClone(validate(state));s.tiles=board(STAGES[s.stageIndex]);s.restored=0;s.health=Math.max(3,s.health);s.shield=Math.max(1,s.shield);return s}
function inspect(s){return {stage:getStage(s),cleared:s.restored,remaining:3-s.restored,health:s.health,shield:s.shield,score:s.score,finished:s.finished,totalStages:18}}
function cipher(input){const source=String(input);return {literal:source,reverse:[...source].reverse().join(''),digitToLetter:[...source].map(ch=>/^[0-9]$/.test(ch)?({0:'O',4:'H',5:'S'}[ch]||ch):ch).join(''),note:'4↔H, 5↔S, 0↔O are optional artistic mappings, not universally valid letter/number identities.'}}
return Object.freeze({STAGES,board,newGame,getStage,action,next,restartStage,inspect,cipher,validate});
});