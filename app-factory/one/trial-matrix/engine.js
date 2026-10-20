/* ONE — The 33 Trial Matrix / Epoch I: deterministic local gameplay engine.
 * By Nathan Tabor. No analytics, tracking pixels, medical or IQ inferences.
 * User-authored mechanics are retained; unresolved structural counts and build choices are documented.
 */
(function(root,factory){'use strict';const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.OneTrialMatrix=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const GLYPHS=[
 ['△','○','□','◇'],
 ['Ⅰ','Ⅱ','Ⅲ','Ⅳ'],
 ['◆','♦','⬟','✦'],
 ['∿','♪','♮','♬'],
 ['⚒','◉','⌁','▱']
];
const LEVELS=Object.freeze([
 {id:1,name:'THE MONOLITH',tagline:'The illusion of simplicity. One dimension, infinite consequences.',epoch:'I',geometry:'1 × 33',goal:7,moveLimit:25,metric:'Symmetry Delta',detail:'Left swap auto-mirrors right; compass at slot 17 never moves.'},
 {id:2,name:'BABYLON’S GATE',tagline:'The turning wheels of deterministic fate.',epoch:'I',geometry:'18 outer + 12 inner + 3 core',goal:6,moveLimit:35,metric:'Rotational Accuracy Index',detail:'Align core-to-outer axes. Each match counter-rotates the geared rings.'},
 {id:3,name:'THE RHOMBUS OF UR',tagline:'Slicing reality along the diagonal.',epoch:'I',geometry:'7 × 7 / 49 addresses / 4 corner-tip voids',goal:8,moveLimit:35,metric:'Misclick Vector',detail:'Only 45° diagonal neighboring swaps; pieces flow along sloped diagonals.'},
 {id:4,name:'EPIDAURUS ACOUSTIC',tagline:'The kinetic echo of structural collapse.',epoch:'I',geometry:'6-row funnel / 12 to 3',goal:3,moveLimit:35,metric:'Chain Potential Realization',detail:'Match the 3-cell input bed; the upward shockwave amplifies across wider rows.'},
 {id:5,name:'ARCHIMEDES’ SPIRAL',tagline:'Racing the drain of chronological entropy.',epoch:'I',geometry:'1 × 64 path in 8 × 8',goal:12,moveLimit:null,metric:'Panic Shift Delta',detail:'1 new tile at the outer lip every 2 seconds; entering slot 64 fails.'}
]);
const FUNNEL=[12,10,8,6,4,3];
const RHOMBUS_VOID=[0,6,42,48]; // four outer tips of rotated 7x7 matrix: all four corners
function rng(s){s.randomState=(Math.imul(1664525,s.randomState>>>0)+1013904223)>>>0;return s.randomState>>>24;}
function token(s){return rng(s)%4;}
function ms(v,defaultValue=0){return Number.isFinite(v)&&v>=0?Math.round(v):defaultValue;}
function record(s,type,data,at){if(!s.telemetryEnabled)return; if(s.events.length<3000)s.events.push({type,at:ms(at)-s.startedAt,...data});}
function initial(level=1,seed=8291973,telemetryEnabled=false,at=0){
 const def=LEVELS[level-1];if(!def||!Number.isInteger(level))throw Error('Epoch I includes levels 1–5');
 const s={schema:'one.33trial.session.v1',level,status:'playing',seed:seed>>>0,randomState:seed>>>0,startedAt:ms(at),lastAt:ms(at),moves:0,progress:0,score:0,penalties:0,feedback:'',telemetryEnabled:!!telemetryEnabled,events:[],stats:{valid:0,invalid:0,progressMoves:0,blockageMoves:0,neutralMoves:0,planningMs:[],symmetryDeltasMs:[],cardinalAttemptsFirstMinute:0,cardinalAttemptsLater:0,cprCombos:0,cprTopTiles:0,shockwaves:0,calm:{actions:0,success:0},near:{actions:0,success:0}},board:null};
 if(level===1){const left=Array.from({length:16},()=>token(s));s.board=[...left,-1,...left.slice().reverse()];}
 if(level===2)s.board={outer:Array.from({length:18},()=>token(s)),inner:Array.from({length:12},()=>token(s)),core:Array.from({length:3},()=>token(s)),locked:0,gears:0};
 if(level===3)s.board=Array.from({length:49},(_,i)=>RHOMBUS_VOID.includes(i)?null:token(s));
 if(level===4)s.board=FUNNEL.map(n=>Array.from({length:n},()=>token(s)));
 if(level===5)s.board={chain:Array.from({length:18},()=>token(s)),ticks:0};
 return s;
}
function assertPlaying(s){if(!s||s.schema!=='one.33trial.session.v1')throw Error('Unsupported save state');if(s.status!=='playing')return false;return true;}
function complete(s,at){if(s.progress>=LEVELS[s.level-1].goal){s.status='won';s.feedback='Epoch I trial completed.';record(s,'win',{progress:s.progress},at);}else if(LEVELS[s.level-1].moveLimit!==null&&s.moves>=LEVELS[s.level-1].moveLimit){s.status='failed';s.feedback='The move budget is exhausted.';record(s,'failed',{reason:'move_budget'},at);}}
function invalid(s,why,at,cardinal=false){s.stats.invalid++;if(cardinal){if(ms(at)-s.startedAt<=60000)s.stats.cardinalAttemptsFirstMinute++;else s.stats.cardinalAttemptsLater++;}s.feedback=why;record(s,'invalid',{reason:why,cardinal},at);return s;}
function success(s,amount,at){s.progress+=amount;s.stats.progressMoves++;s.score+=100*amount;s.feedback=amount+' structural match'+(amount===1?'':'es')+' completed.';record(s,'progress',{amount},at);}
function handle1(s,a,b,at,planStartMs){
 if(!Number.isInteger(a)||!Number.isInteger(b)||a===b||a<0||b<0||a>15||b>15)return invalid(s,'Select two distinct LEFT-wing tiles; slot 17 is immutable.',at);
 [s.board[a],s.board[b]]=[s.board[b],s.board[a]];
 [s.board[32-a],s.board[32-b]]=[s.board[32-b],s.board[32-a]];
 s.moves++;s.stats.valid++;if(Number.isFinite(planStartMs))s.stats.planningMs.push(Math.max(0,ms(at)-ms(planStartMs)));
 // Right symmetry happens atomically by the Ripple Law. It is not an independent cognitive latency measure.
 s.stats.symmetryDeltasMs.push(0);
 const cleared=new Set();let groups=0;
 for(let i=0;i<16;){let j=i+1;while(j<16&&s.board[j]===s.board[i])j++;if(j-i>=3){groups++;for(let k=i;k<j;k++)cleared.add(k);}i=j;}
 if(groups){
  const kept=[];for(let i=0;i<16;i++)if(!cleared.has(i))kept.push(s.board[i]);
  const newLeft=Array.from({length:16-kept.length},()=>token(s)).concat(kept);
  s.board=[...newLeft,-1,...newLeft.slice().reverse()];
  success(s,groups,at);
 }else{s.stats.neutralMoves++;s.feedback='Mirrored swap completed. No simultaneous symmetrical triple.';}
 complete(s,at);record(s,'ripple_swap',{a,b,clearedGroups:groups},at);return s;
}
function rotate(array,dir){if(dir===1)array.unshift(array.pop());else array.push(array.shift());}
function axes(s){const b=s.board;return [0,1,2].filter(i=>b.core[i]===b.inner[i*4]&&b.inner[i*4]===b.outer[i*6]);}
function handle2(s,ring,direction,at){
 const b=s.board;
 if(b.locked>0){b.locked--;s.moves++;s.penalties++;s.stats.blockageMoves++;s.feedback='Cascade trap: gear locked this turn.';record(s,'lock_penalty',{ring},at);complete(s,at);return s;}
 if(!['outer','inner'].includes(ring)||![-1,1].includes(direction))return invalid(s,'Rotate the outer or inner ring one slot.',at);
 rotate(b[ring],direction);s.moves++;s.stats.valid++;
 const aligned=axes(s),total=aligned.length;
 if(total){for(const axis of aligned){b.core[axis]=token(s);b.inner[axis*4]=token(s);b.outer[axis*6]=token(s);}
  // Deterministic Counter-Rotation Gear following a qualifying radial match.
  const readyBefore=axes(s);rotate(b.outer,1);rotate(b.inner,-1);b.gears++;
  const now=axes(s);if(readyBefore.some(i=>!now.includes(i))){b.locked=1;s.penalties++;s.stats.blockageMoves++;record(s,'cascade_trap',{axes:readyBefore},at);}
  success(s,total,at);s.feedback='Radial path aligned; outer ↻ / inner ↺.';
 }else{s.stats.neutralMoves++;s.feedback='Gear moved. Align matching core → inner → outer symbols.';}
 complete(s,at);record(s,'ring_action',{ring,direction,aligned:total},at);return s;
}
function diagonalGroups(board){const hit=new Set();let count=0;
 for(let r=0;r<7;r++)for(let c=0;c<7;c++)for(const dc of [-1,1]){
  const value=board[r*7+c];if(value===null)continue;
  if(r>0&&c-dc>=0&&c-dc<7&&board[(r-1)*7+c-dc]===value)continue;
  let rr=r,cc=c,seq=[];while(rr<7&&cc>=0&&cc<7&&board[rr*7+cc]===value){seq.push(rr*7+cc);rr++;cc+=dc;}
  if(seq.length>=3){count++;seq.forEach(i=>hit.add(i));}
 }
 return {hit,count};
}
function slopeRefill(s,hits){for(const i of hits)s.board[i]=undefined;
 for(let pass=0;pass<9;pass++){let changed=false;
  for(let r=6;r>=0;r--)for(let c=0;c<7;c++){const i=r*7+c;if(s.board[i]!==undefined)continue;
   const choices=[c-1,c+1].filter(k=>k>=0&&k<7&&s.board[(r-1)*7+k]!==undefined&&s.board[(r-1)*7+k]!==null&&r>0);
   if(choices.length){const src=(r-1)*7+choices[rng(s)%choices.length];s.board[i]=s.board[src];s.board[src]=undefined;changed=true;}
   else if(r===0){s.board[i]=token(s);changed=true;}
  }
  if(!changed)break;
 }
 for(let i=0;i<49;i++)if(s.board[i]===undefined)s.board[i]=token(s);
 for(const i of RHOMBUS_VOID)s.board[i]=null;
}
function handle3(s,a,b,at){
 if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=49||b>=49||s.board[a]===null||s.board[b]===null)return invalid(s,'Choose two active diamond tiles.',at);
 const dr=Math.abs(Math.floor(a/7)-Math.floor(b/7)),dc=Math.abs(a%7-b%7);
 if(dr!==1||dc!==1)return invalid(s,dr+dc===1?'Cardinal swipe blocked: diagonal movement only.':'Only adjacent 45-degree diagonal swaps are valid.',at,dr+dc===1);
 [s.board[a],s.board[b]]=[s.board[b],s.board[a]];s.moves++;s.stats.valid++;
 const {hit,count}=diagonalGroups(s.board);
 if(hit.size){slopeRefill(s,hit);success(s,count,at);}
 else{s.stats.neutralMoves++;s.feedback='Diagonal shift completed; seek a three-gem diagonal.';}
 complete(s,at);record(s,'diagonal_swap',{a,b,matches:count},at);return s;
}
function rowCombos(row,v){let n=0;for(let i=0;i<row.length;){let j=i+1;while(j<row.length&&row[j]===row[i])j++;if(row[i]===v&&j-i>=3)n++;i=j;}return n;}
function handle4(s,a,b,at){const valid=p=>p&&Number.isInteger(p.r)&&Number.isInteger(p.c)&&p.r>=0&&p.r<6&&p.c>=0&&p.c<s.board[p.r].length;
 if(!valid(a)||!valid(b)||(a.r===b.r&&a.c===b.c))return invalid(s,'Choose two different tiles in the funnel.',at);
 [s.board[a.r][a.c],s.board[b.r][b.c]]=[s.board[b.r][b.c],s.board[a.r][a.c]];s.moves++;s.stats.valid++;
 const bottom=s.board[5],isTrigger=bottom[0]===bottom[1]&&bottom[1]===bottom[2];let amount=0;
 if(isTrigger){const v=bottom[0],combos=s.board.slice(0,5).reduce((n,row)=>n+rowCombos(row,v),0);let topTiles=0;
  for(let r=0;r<5;r++)for(let c=0;c<s.board[r].length;c++)if(s.board[r][c]===v){topTiles++;s.board[r][c]=token(s);}
  for(let i=0;i<3;i++)bottom[i]=token(s);
  s.stats.cprCombos+=combos;s.stats.cprTopTiles+=topTiles;s.stats.shockwaves++;amount=1;success(s,amount,at);
  s.feedback='Bottom trigger fired! Upward shockwave hit '+topTiles+' upper tiles.';
 }else{
  let topMatch=false;for(const row of s.board.slice(0,1))for(let i=0;i+2<row.length;i++)if(row[i]===row[i+1]&&row[i]===row[i+2])topMatch=true;
  if(topMatch){s.penalties++;s.stats.blockageMoves++;for(let r=1;r<6;r++){const row=s.board[r];row.splice(Math.floor(row.length/2),0,row.shift());}s.feedback='Top compression cost: lower rows shifted inward.';record(s,'compression_cost',{},at);}
  else{s.stats.neutralMoves++;s.feedback='Swap made. Set up a triple in the narrow bottom bed.';}
 }
 complete(s,at);record(s,'funnel_swap',{a,b,shockwave:isTrigger},at);return s;
}
function spiral(){const coords=[];let top=0,bottom=7,left=0,right=7;while(top<=bottom&&left<=right){for(let x=left;x<=right;x++)coords.push([top,x]);top++;for(let y=top;y<=bottom;y++)coords.push([y,right]);right--;if(top<=bottom){for(let x=right;x>=left;x--)coords.push([bottom,x]);bottom--;}if(left<=right){for(let y=bottom;y>=top;y--)coords.push([y,left]);left++;}}return coords;}
const SPIRAL=spiral();
function groups5(chain){const pairs=[];for(let i=0;i<chain.length;){let j=i+1;while(j<chain.length&&chain[j]===chain[i])j++;if(j-i>=3)pairs.push([i,j]);i=j;}return pairs;}
function move5(s,a,b,at){const chain=s.board.chain;
 if(!Number.isInteger(a)||!Number.isInteger(b)||Math.abs(a-b)!==1||a<0||b<0||a>=chain.length||b>=chain.length)return invalid(s,'Swap adjacent occupied positions on the spiral path.',at);
 const near=chain.length>=59,group=near?s.stats.near:s.stats.calm;group.actions++;[chain[a],chain[b]]=[chain[b],chain[a]];s.moves++;s.stats.valid++;
 const matches=groups5(chain);if(matches.length){for(let i=matches.length-1;i>=0;i--){const [start,end]=matches[i];chain.splice(start,end-start);}group.success++;success(s,matches.length,at);s.feedback='Matched segments siphoned out; chain contracted away from the void.';}
 else{s.stats.neutralMoves++;s.feedback='Swap committed. The entropy feed continues.';}
 complete(s,at);record(s,'spiral_swap',{a,b,nearVoid:near,groups:matches.length,chainLength:chain.length},at);return s;
}
function tick5(s,at){s.board.chain.unshift(token(s));s.board.ticks++;if(s.board.chain.length>=64){s.status='failed';s.feedback='Structural lock: a tile entered slot 64 / the entropy void.';record(s,'failed',{reason:'entropy_void',length:s.board.chain.length},at);}
 else{s.feedback='Feed injected at slot 1 ('+s.board.chain.length+'/64 occupied).';record(s,'injection',{length:s.board.chain.length},at);}return s;}
function step(s,act,at=0){if(!assertPlaying(s))return s;at=ms(at,s.lastAt);s.lastAt=at;
 if(!act||typeof act.type!=='string')return invalid(s,'Unrecognized action.',at);
 if(s.level===1&&act.type==='swap')return handle1(s,act.a,act.b,at,act.planStartMs);
 if(s.level===2&&act.type==='rotate')return handle2(s,act.ring,act.direction,at);
 if(s.level===3&&act.type==='swap')return handle3(s,act.a,act.b,at);
 if(s.level===4&&act.type==='swap')return handle4(s,act.a,act.b,at);
 if(s.level===5&&act.type==='swap')return move5(s,act.a,act.b,at);
 if(s.level===5&&act.type==='tick')return tick5(s,at);
 return invalid(s,'Action not available on this stage.',at);
}
function metrics(s){const v=s.stats,div=(a,b)=>b?a/b:null;
 const base={schema:'one.33trial.telemetry.v1',trialId:s.level,trialName:LEVELS[s.level-1].name,gameplayOnly:true,notStandardizedIQTest:true,consentOptIn:s.telemetryEnabled,moves:s.moves,progress:s.progress,penalties:s.penalties,invalidActions:v.invalid,elapsedMs:Math.max(0,s.lastAt-s.startedAt),outcome:s.status};
 if(s.level===1)return {...base,symmetryDeltaMs:0,interpretation:'Mechanically fixed at zero by automatic mirror; NOT an independently measured IQ trait.',avgPlanningMs:div(v.planningMs.reduce((a,b)=>a+b,0),v.planningMs.length)};
 if(s.level===2)return {...base,rotationalAccuracyIndex:div(v.progressMoves,v.progressMoves+v.blockageMoves),progressMoves:v.progressMoves,blockageMoves:v.blockageMoves};
 if(s.level===3)return {...base,misclickVector:{cardinalAttemptsFirst60s:v.cardinalAttemptsFirstMinute,cardinalAttemptsAfter60s:v.cardinalAttemptsLater}};
 if(s.level===4)return {...base,chainPotentialRealization:{topCombosRealized:v.cprCombos,upperTilesDetonated:v.cprTopTiles,shockwaves:v.shockwaves,combosPerShockwave:div(v.cprCombos,v.shockwaves)}};
 const calm=div(v.calm.success,v.calm.actions),near=div(v.near.success,v.near.actions);
 return {...base,panicShiftDelta:calm===null||near===null?null:near-calm,calmAccuracy:calm,nearVoidAccuracy:near,nearVoidThresholdSlots:5,interpretation:'Observed success-rate difference by proximity. Not a clinical composure score.'};
}
function save(s){if(!s||s.schema!=='one.33trial.session.v1')throw Error('Invalid trial');const data={schema:'one.33trial.save.v1',exportedAt:new Date().toISOString(),game:'The 33 Trial Matrix',author:'Nathan Tabor',session:JSON.parse(JSON.stringify(s)),metrics:s.telemetryEnabled?metrics(s):null,telemetryEvents:s.telemetryEnabled?s.events:[],privacy:'Private local session, exported only by explicit user action; no personal IQ assessment.'};return data;}
function restore(data){if(!data||data.schema!=='one.33trial.save.v1'||!data.session||data.session.schema!=='one.33trial.session.v1')throw Error('Unknown save-file schema');const s=data.session;
 if(!LEVELS[s.level-1]||!Number.isInteger(s.randomState)||!Array.isArray(s.events)||s.events.length>3000||!s.stats||!Number.isInteger(s.moves)||s.moves<0)throw Error('Malformed trial save');
 if(s.level===1&&(!Array.isArray(s.board)||s.board.length!==33||s.board[16]!==-1))throw Error('Invalid monolith geometry');
 if(s.level===2&&(!s.board||s.board.outer?.length!==18||s.board.inner?.length!==12||s.board.core?.length!==3))throw Error('Invalid Babylon rings');
 if(s.level===3&&(!Array.isArray(s.board)||s.board.length!==49||!RHOMBUS_VOID.every(i=>s.board[i]===null)))throw Error('Invalid diamond topology');
 if(s.level===4&&(!Array.isArray(s.board)||!FUNNEL.every((n,i)=>s.board[i]?.length===n)))throw Error('Invalid funnel geometry');
 if(s.level===5&&(!Array.isArray(s.board?.chain)||s.board.chain.length>64||s.board.chain.length<0))throw Error('Invalid entropy chain');
 return JSON.parse(JSON.stringify(s));
}
return Object.freeze({LEVELS,GLYPHS,FUNNEL,RHOMBUS_VOID,SPIRAL,initial,step,metrics,save,restore,diagonalGroups,axes,groups5});
});