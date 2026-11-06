/* THE 33 — Epochs I–III. Local deterministic match-3 rules; no network services. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TrialExpansion=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
// Names 6–32 are implementation titles based on the supplied epoch themes,
// not recovered titles from the unavailable private v023 package.
const rows=[
 [6,'NILE WATERWAYS','canals','6 × 7 waterways','Clear horizontal or vertical triples; refill flows east along each canal.'],
 [7,'MAYAN CALENDARS','calendar','6 × 8 / two calendars','Swap within each four-column calendar. After each successful move the left calendar advances and the right reverses.'],
 [8,'MNEMOSYNE’S MEMORY','memory','6 × 6 memory board','Study the symbols, then hide them voluntarily. Selected tiles and free Study remain available; match by symbol.'],
 [9,'CAESAR’S CIPHER','cipher','6 × 6 cipher','Symbols are encoded by a visible rotating key. After each successful move the key advances and each row shifts its symbol values by its row number.'],
 [10,'KNOSSOS LABYRINTH','rooms','9 × 9 / nine rooms','Each 3 × 3 room is isolated: swaps, matches and gravity stay inside it. Clear matches in all nine rooms.'],
 [11,'ROSETTA TRILINGUAL','rosetta','6 × 6 / three scripts','Rows use three different scripts for the same four values. Match by value across scripts using the legend.'],
 [12,'NEWTON’S INVERSION','up','7 × 7 inverted gravity','After a match tiles rise and refill from below.'],
 [13,'ARKWRIGHT’S ASSEMBLY','conveyor','6 × 8 assembly line','After cascades, the selected row advances one slot on the conveyor.'],
 [14,'BABBAGE’S ENGINE','program','7 × 7 programmed gravity','Gravity follows the published cycle: down, left, up, right, then repeats each move.'],
 [15,'ENIGMA ROTORS','enigma','7 × 7 rotating cipher','After each successful move, the next rotor column advances its values by one. Rotor position is shown.'],
 [16,'MENDELEEV’S TABLE','values','6 × 7 weighted values','Clear matching symbols. Values change each turn: the target is earned value, with every cleared symbol worth 1–4 points.'],
 [17,'TESLA’S ALTERNATOR','alternator','7 × 7 alternating gravity','Odd moves pull downward, even moves pull upward. The displayed current predicts the next fall.'],
 [18,'TURING’S FEEDBACK','feedback','7 × 7 feedback loop','A symbol from the final cascade becomes the target for your next move. The first move accepts any symbol; other clears score but do not advance the target.'],
 [19,'VON NEUMANN’S RIVAL','rival','7 × 7 local strategy','Reach 36 cleared tiles before the visible deterministic rival reaches 60. The rival gains 1–4 points after your move.'],
 [20,'SHANNON’S CHANNEL','channel','6 × 7 channel','Only rows of at least three transmit progress. Vertical clears still score and refill but carry no progress.'],
 [21,'APOLLO GUIDANCE','guidance','7 × 7 guided gravity','Gravity follows the next visible guidance direction. Every third move skips one direction in the cycle.'],
 [22,'NASH EQUILIBRIUM','balance','6 × 8 / balanced sectors','Clear at least 15 tiles from each half. Progress counts each half up to 15 so one sector cannot substitute for the other.'],
 [23,'SCHRÖDINGER’S TILES','dual','7 × 7 dual-state tiles','Every tile has a light and dark value. Choose the active state before swapping; matches use that state. Both states travel together.'],
 [24,'TESSERACT PROJECTION','tesseract','4 × 4 × 2 × 2 / four planes','Four visible 4 × 4 planes represent x,y,z,w. Swap one step on any axis, including cross-plane counterparts; triples run along x or y within a plane.'],
 [25,'STROOP INTERFERENCE','stroop','6 × 7 word / ink board','Match the printed word, ignoring its deliberately different ink color. There is no flashing or hidden timing test.'],
 [26,'ARCHIMEDES’ HIDDEN WEIGHTS','weights','7 × 7 weighted board','Each tile carries a fixed weight of 1–4. Weights travel with tiles; Inspect reveals them freely. Progress counts cleared weight, not tile count.'],
 [27,'PILLARS OF CONSTANTINOPLE','pillars','7 × 7 / immutable columns','Columns 3 and 5 cannot be swapped or cleared. Make matches in the remaining vertical channels.'],
 [28,'HUYGENS’ RESONANCE','resonance','6 × 8 paired chambers','Swap in the left chamber and the counterpart swap occurs in the right. Only matches with matching positions in both chambers clear.'],
 [29,'MAXWELL’S GATE','gate','7 × 7 sorting gate','Only the visible gate symbol advances progress. The gate changes after a qualifying move; other symbols still clear and score.'],
 [30,'CHRONOS RESERVE','reserve','7 × 7 / reserve row','The bottom row is reserved and cannot be swapped or cleared until you have made two successful moves. Then it opens permanently.'],
 [31,'ARIADNE’S BRIDGES','bridges','7 × 7 / crossing bridges','Structural voids divide the board. Swap adjacent tiles or use the four published bridge links to cross the gaps.'],
 [32,'CONCORDIA COOPERATION','cooperation','6 × 8 / local two-player','Two local players share the board and alternate successful moves. Each must clear 15 tiles; the turn and both contributions remain visible.'],
 [33,'ZENITH ZERO','zenith','7 × 7 / 33 seals','Clear all 33 marked seals through matches. Cleared seals stay gone while tiles refill. Reduce the seal count to zero.']
];
const LEVELS=rows.map(([id,name,mode,geometry,detail])=>Object.freeze({id,name,mode,geometry,detail,epoch:id<=11?'I':id<=22?'II':'III',tagline:detail,goal:mode==='rooms'?9:mode==='zenith'?33:mode==='balance'||mode==='cooperation'?30:mode==='weights'?100:mode==='values'?90:mode==='rival'?36:36,moveLimit:mode==='zenith'?70:mode==='rooms'?50:45,metric:'Match efficiency and objective progress',implementationTitle:id!==33}));
const byId=new Map(LEVELS.map(d=>[d.id,d]));
const GLYPHS=['△','○','□','◇'];
function random(s,n){s.randomState=(Math.imul(1664525,s.randomState>>>0)+1013904223)>>>0;return Math.floor((s.randomState/4294967296)*n);}
const def=s=>byId.get(s.level);
function dims(d){if(d.mode==='rooms')return [9,9];if(d.mode==='tesseract')return [8,8];if(['calendar','conveyor','balance','resonance','cooperation'].includes(d.mode))return [6,8];if(['memory','cipher','rosetta'].includes(d.mode))return [6,6];if(['canals','values','channel','stroop'].includes(d.mode))return [6,7];return [7,7];}
function coord(b,i){return [Math.floor(i/b.cols),i%b.cols];}
function room(b,i){const [r,c]=coord(b,i);return Math.floor(r/3)*3+Math.floor(c/3);}
function plane(b,i){const [r,c]=coord(b,i);return Math.floor(r/4)*2+Math.floor(c/4);}
function segment(s,i){const b=s.board,m=def(s).mode;if(m==='rooms')return room(b,i);if(m==='calendar'||m==='resonance')return Math.floor((i%b.cols)/4);if(m==='tesseract')return plane(b,i);return 0;}
function locked(s,i){const b=s.board,m=def(s).mode;return b.cells[i]===null||(m==='pillars'&&[2,4].includes(i%b.cols))||(m==='reserve'&&b.turn<2&&Math.floor(i/b.cols)===b.rows-1);}
function value(s,i){const b=s.board;return b.phase?b.alternate[i]:b.cells[i];}
function adjacent(s,a,b){const board=s.board,[ar,ac]=coord(board,a),[br,bc]=coord(board,b),m=def(s).mode;
 if(m==='tesseract'){
  const x=[ar%4,ac%4,Math.floor(ar/4),Math.floor(ac/4)],y=[br%4,bc%4,Math.floor(br/4),Math.floor(bc/4)];
  return x.reduce((n,v,i)=>n+Math.abs(v-y[i]),0)===1;
 }
 if(m==='bridges'&&board.bridges.some(([x,y])=>(a===x&&b===y)||(a===y&&b===x)))return true;
 return Math.abs(ar-br)+Math.abs(ac-bc)===1&&segment(s,a)===segment(s,b);
}
function groups(s){const b=s.board,out=[];
 for(let i=0;i<b.cells.length;i++)if(!locked(s,i))for(const stride of [1,b.cols]){
  const p=i-stride;
  const connected=(a,c)=>a>=0&&c<b.cells.length&&!locked(s,a)&&!locked(s,c)&&segment(s,a)===segment(s,c)&&(stride!==1||Math.floor(a/b.cols)===Math.floor(c/b.cols));
  if(connected(p,i)&&value(s,p)===value(s,i))continue;
  const line=[i];let next=i+stride;
  while(connected(next-stride,next)&&value(s,next)===value(s,i)){line.push(next);next+=stride;}
  if(line.length>=3)out.push({cells:line,value:value(s,i),horizontal:stride===1});
 }
 if(def(s).mode==='resonance'){
  const hits=new Set(out.flatMap(g=>g.cells));return out.map(g=>({...g,cells:g.cells.filter(i=>hits.has(i+(i%b.cols<4?4:-4)))})).filter(g=>g.cells.length>=3);
 }
 return out;
}
function swap(s,a,b){const x=s.board;for(const key of ['cells','alternate','weights'])if(x[key])[x[key][a],x[key][b]]=[x[key][b],x[key][a]];}
function actionSwap(s,a,b){swap(s,a,b);if(def(s).mode==='resonance')swap(s,a+4,b+4);}
function candidates(s){const b=s.board,out=[];for(let a=0;a<b.cells.length;a++)if(!locked(s,a))for(let c=a+1;c<b.cells.length;c++)if(!locked(s,c)&&adjacent(s,a,c)&&(def(s).mode!=='resonance'||(a%b.cols<4&&c%b.cols<4)))out.push([a,c]);return out;}
function objective(s,gs){const m=def(s).mode,b=s.board,hit=[...new Set(gs.flatMap(g=>g.cells))];
 if(m==='rooms')return new Set(hit.map(i=>room(b,i)).filter(i=>!b.visited.includes(i))).size;
 if(m==='zenith')return hit.filter(i=>b.seals[i]).length;
 if(m==='channel')return new Set(gs.filter(g=>g.horizontal).flatMap(g=>g.cells)).size;
 if(m==='gate'||m==='feedback')return hit.filter(i=>b.target===null||value(s,i)===b.target).length;
 if(m==='weights')return hit.reduce((n,i)=>n+b.weights[i],0);
 if(m==='values')return hit.reduce((n,i)=>n+1+(value(s,i)+b.turn)%4,0);
 if(m==='balance')return [0,1].reduce((n,half)=>n+Math.min(Math.max(0,15-b.contributions[half]),hit.filter(i=>Math.floor((i%b.cols)/(b.cols/2))===half).length),0);
 if(m==='cooperation')return Math.min(Math.max(0,15-b.contributions[b.turn%2]),hit.length);
 return hit.length;
}
function hint(s){if(s.status!=='playing')return null;let best=null;
 for(const phase of def(s).mode==='dual'?[0,1]:[s.board.phase]){
  const old=s.board.phase;s.board.phase=phase;
  for(const [a,b] of candidates(s)){actionSwap(s,a,b);const gs=groups(s);if(gs.length){const rank=objective(s,gs)*100+new Set(gs.flatMap(g=>g.cells)).size;if(!best||rank>best.rank)best={type:'swap',a,b,phase,rank};}actionSwap(s,a,b);}
  s.board.phase=old;
 }
 return best;
}
// Public-board analysis: no refill simulation and no access to future random values.
function analyze(s){
 if(s.status!=='playing'||def(s).mode==='memory'&&!s.board.revealed)return [];
 const result=[],b=s.board,old=b.phase;
 for(const phase of def(s).mode==='dual'?[0,1]:[old]){
  b.phase=phase;
  for(const [a,c] of candidates(s)){
   actionSwap(s,a,c);const gs=groups(s),hits=[...new Set(gs.flatMap(g=>g.cells))];
   if(gs.length){const symbols=[0,0,0,0];hits.forEach(i=>symbols[value(s,i)]++);
    result.push({action:{type:'swap',a,b:c,phase},hits,symbols,tiles:hits.length,groups:gs.length,maxRun:Math.max(...gs.map(g=>g.cells.length)),horizontal:gs.filter(g=>g.horizontal).reduce((n,g)=>n+g.cells.length,0),vertical:gs.filter(g=>!g.horizontal).reduce((n,g)=>n+g.cells.length,0),objective:def(s).mode==='weights'&&!b.inspect?null:objective(s,gs)});
   }
   actionSwap(s,a,c);
  }
 }
 b.phase=old;return result;
}
function prepare(s){if(s.status==='playing')return ensureMove(s);return false;}
function transmute(s,i){
 if(!Number.isInteger(i)||i<0||i>=s.board.cells.length||locked(s,i)||def(s).mode==='resonance'&&i%s.board.cols>=4)return false;
 const key=s.board.phase?'alternate':'cells';s.board[key][i]=(s.board[key][i]+1)%4;
 if(def(s).mode==='resonance')s.board[key][i+4]=(s.board[key][i+4]+1)%4;
 prepare(s);return true;
}
function fill(s,i){const b=s.board;b.cells[i]=random(s,4);if(b.alternate)b.alternate[i]=random(s,4);b.weights[i]=1+random(s,4);}
function noInitialMatches(s){
 const b=s.board;
 // Construction, rather than a retry loop, avoids pre-existing triples.
 for(let i=0;i<b.cells.length;i++)if(!locked(s,i)){
  for(const key of b.alternate?['cells','alternate']:['cells']){
   const forbidden=new Set();
   if(i%b.cols>=2&&segment(s,i)===segment(s,i-2)&&b[key][i-1]===b[key][i-2])forbidden.add(b[key][i-1]);
   if(i>=2*b.cols&&segment(s,i)===segment(s,i-2*b.cols)&&b[key][i-b.cols]===b[key][i-2*b.cols])forbidden.add(b[key][i-b.cols]);
   if(forbidden.has(b[key][i]))b[key][i]=[0,1,2,3].find(v=>!forbidden.has(v));
  }
 }
 if(def(s).mode==='resonance')for(let i=0;i<b.cells.length;i++)if(i%b.cols<4)b.cells[i+4]=b.cells[i];
}
function ensureMove(s){
 const usable=()=>{const h=hint(s);return h&&(!(def(s).mode==='rooms'&&s.board.visited.length<9||def(s).mode==='zenith'&&s.board.seals.some(Boolean)||def(s).mode==='balance'&&s.board.contributions.some(n=>n<15))||h.rank>=100);};
 if(usable())return false;
 const b=s.board;
 for(let attempt=0;attempt<100;attempt++){
  for(let i=0;i<b.cells.length;i++)if(!locked(s,i))fill(s,i);
  noInitialMatches(s);if(usable()){b.reshuffles++;return true;}
 }
 throw Error('Unable to prepare a playable board');
}
function initial(s){const d=def(s),[rows,cols]=dims(d);s.board={rows,cols,cells:Array(rows*cols).fill(0),alternate:null,weights:Array(rows*cols).fill(1),phase:0,turn:0,target:d.mode==='gate'?0:null,visited:[],contributions:[0,0],rival:0,key:0,revealed:true,inspect:false,seals:Array(rows*cols).fill(false),reshuffles:0,lastCleared:[],gravity:'down',bridges:[]};
 const b=s.board;if(d.mode==='dual')b.alternate=Array(rows*cols).fill(0);
 if(d.mode==='bridges'){for(const i of [3,10,17,21,22,23,25,26,27,31,38,45])b.cells[i]=null;b.bridges=[[2,4],[16,18],[30,32],[44,46]];}
 for(let i=0;i<b.cells.length;i++)if(b.cells[i]!==null)fill(s,i);
 if(d.mode==='zenith'){const indices=Array.from({length:rows*cols},(_,i)=>i);for(let k=0;k<33;k++){const j=k+random(s,indices.length-k);[indices[k],indices[j]]=[indices[j],indices[k]];b.seals[indices[k]]=true;}}
 noInitialMatches(s);ensureMove(s);return s;
}
function gravity(s){const b=s.board,m=def(s).mode;if(m==='canals')return 'right';if(m==='up')return 'up';if(m==='alternator')return b.turn%2?'up':'down';if(m==='program')return ['down','left','up','right'][b.turn%4];if(m==='guidance')return ['down','left','up','right'][(b.turn+Math.floor(b.turn/3))%4];return 'down';}
function refill(s,hits){const b=s.board,direction=gravity(s),vertical=['up','down'].includes(direction);b.gravity=direction;
 for(const i of hits)b.cells[i]=undefined;
 const starts=vertical?b.cols:b.rows,size=vertical?b.rows:b.cols;
 for(let line=0;line<starts;line++){
  let run=[];const flush=()=>{
   if(!run.length)return;
   const kept=run.filter(i=>b.cells[i]!==undefined).map(i=>({v:b.cells[i],alt:b.alternate?.[i],w:b.weights[i]}));
   const count=run.length-kept.length,empties=Array.from({length:count},()=>null),ordered=['down','right'].includes(direction)?empties.concat(kept):kept.concat(empties);
   run.forEach((i,j)=>{const tile=ordered[j];if(tile){b.cells[i]=tile.v;if(b.alternate)b.alternate[i]=tile.alt;b.weights[i]=tile.w;}else fill(s,i);});run=[];
  };
  for(let n=0;n<size;n++){const i=vertical?n*b.cols+line:line*b.cols+n;if(locked(s,i)){flush();continue;}if(run.length&&segment(s,i)!==segment(s,run[0]))flush();run.push(i);}flush();
 }
}
function resolve(s,at){const b=s.board,m=def(s).mode;let depth=0,total=0;const all=new Set();
 while(depth<32){const gs=groups(s);if(!gs.length)break;const hit=[...new Set(gs.flatMap(g=>g.cells))],amount=objective(s,gs);s.progress+=amount;s.score+=hit.length*10*(depth+1);total+=hit.length;
  hit.forEach(i=>all.add(i));
  if(m==='rooms')b.visited=[...new Set(b.visited.concat(hit.map(i=>room(b,i))))];
  if(m==='zenith')hit.forEach(i=>{b.seals[i]=false;});
  if(m==='balance')hit.forEach(i=>{const h=Math.floor((i%b.cols)/(b.cols/2));b.contributions[h]=Math.min(15,b.contributions[h]+1);});
  if(m==='cooperation')b.contributions[b.turn%2]=Math.min(15,b.contributions[b.turn%2]+hit.length);
  if(m==='feedback')b.nextTarget=gs[0].value;
  refill(s,hit);depth++;
 }
 // Cap pathological cascades with a stable board without awarding unperformed clears.
 if(groups(s).length){noInitialMatches(s);s.feedback='Cascade limit reached; board stabilized.';}
 b.lastCleared=[...all];return {total,cascades:depth};
}
function shiftRow(s,row,dir,left=0,right=s.board.cols){const b=s.board,indices=Array.from({length:right-left},(_,i)=>row*b.cols+left+i);for(const key of ['cells','alternate','weights'])if(b[key]){const v=indices.map(i=>b[key][i]);if(dir>0)v.unshift(v.pop());else v.push(v.shift());indices.forEach((i,j)=>{b[key][i]=v[j];});}}
function invalid(s,message){s.stats.invalid++;s.feedback=message;return s;}
function step(s,a,at){const b=s.board,d=def(s),m=d.mode;if(s.status!=='playing')return s;
 if(a.type==='study'&&m==='memory'){b.revealed=!b.revealed;s.feedback=b.revealed?'Study the board. Hide when ready.':'Symbols hidden; selections reveal their values.';return s;}
 if(a.type==='inspect'&&m==='weights'){b.inspect=!b.inspect;return s;}
 if(a.type==='phase'&&m==='dual'){if(a.phase!==0&&a.phase!==1)return invalid(s,'Choose light or dark state.');b.phase=a.phase;s.feedback='Active state: '+(b.phase?'dark':'light');return s;}
 if(a.type!=='swap')return invalid(s,'Choose two adjacent active tiles.');
 const {a:x,b:y}=a;
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=b.cells.length||y>=b.cells.length||x===y||locked(s,x)||locked(s,y)||!adjacent(s,x,y)||(m==='resonance'&&(x%b.cols>=4||y%b.cols>=4)))return invalid(s,'Swap neighboring active tiles using this stage’s connections.');
 actionSwap(s,x,y);
 if(!groups(s).length){actionSwap(s,x,y);return invalid(s,'No match — swap returned. No move spent.');}
 s.moves++;s.stats.valid++;const before=s.progress;let {total,cascades}=resolve(s,at);
 if(m==='feedback')b.target=b.nextTarget??b.target;
 if(m==='gate'&&s.progress>before)b.target=(b.target+1)%4;
 if(m==='rival')b.rival+=1+(b.turn%4);
 if(m==='conveyor')shiftRow(s,Math.floor(x/b.cols),1);
 if(m==='calendar')for(let r=0;r<b.rows;r++){shiftRow(s,r,1,0,4);shiftRow(s,r,-1,4,8);}
 if(m==='cipher'){b.key=(b.key+1)%4;b.cells=b.cells.map((v,i)=>v===null?null:(v+Math.floor(i/b.cols))%4);}
 if(m==='enigma'){const column=b.turn%b.cols;b.cells=b.cells.map((v,i)=>i%b.cols===column?(v+1)%4:v);}
 b.turn++;
 // Resolve movement-triggered cascades under the same player's turn/objective.
 // Cooperation has no post-move modifier and therefore never credits the next player.
 if(['conveyor','calendar','cipher','enigma','reserve'].includes(m)){const previous=b.lastCleared.slice(),extra=resolve(s,at);total+=extra.total;cascades+=extra.cascades;b.lastCleared=[...new Set(previous.concat(b.lastCleared))];}
 if(s.progress>before)s.stats.progressMoves++;else s.stats.neutralMoves++;
 s.feedback=total+' tiles cleared · '+cascades+' cascade'+(cascades===1?'':'s')+'.';
 if(s.progress>=d.goal){s.progress=d.goal;s.status='won';s.feedback='Trial complete. Objective reached.';}
 else if((m==='rival'&&b.rival>=60)||s.moves>=d.moveLimit){s.status='failed';s.feedback=m==='rival'&&b.rival>=60?'The rival reached 60. Retry freely.':'Move budget reached. Retry freely.';}
 else if(ensureMove(s))s.feedback+=' No moves remained; free reshuffle applied.';
 if(s.telemetryEnabled&&s.events.length<3000)s.events.push({type:'match_swap',at:Math.max(0,at-s.startedAt),a:x,b:y,tiles:total,cascades,progress:s.progress});
 return s;
}
function status(s){const b=s.board,m=def(s).mode;let extra='Next gravity: '+gravity(s)+'.';
 if(m==='calendar')extra='Left calendar ↻ · right calendar ↺';
 if(m==='cipher')extra='Cipher key: '+b.key;
 if(m==='enigma')extra='Next rotor column: '+(b.turn%b.cols+1);
 if(m==='gate'||m==='feedback')extra='Target: '+(b.target===null?'any symbol':GLYPHS[b.target]);
 if(m==='rival')extra='You: '+s.progress+'/36 · Rival: '+b.rival+'/60';
 if(m==='rooms')extra='Rooms cleared: '+b.visited.map(i=>i+1).join(', ');
 if(m==='balance')extra='Left: '+b.contributions[0]+'/15 · Right: '+b.contributions[1]+'/15';
 if(m==='cooperation')extra='Player '+(b.turn%2+1)+' to move · Player 1: '+b.contributions[0]+'/15 · Player 2: '+b.contributions[1]+'/15';
 if(m==='zenith')extra='Seals remaining: '+b.seals.filter(Boolean).length;
 if(m==='reserve')extra=b.turn<2?'Reserve opens after '+(2-b.turn)+' more successful moves.':'Reserve row is open.';
 if(m==='tesseract')extra='Top-left: z0/w0 · top-right: z0/w1 · bottom-left: z1/w0 · bottom-right: z1/w1';
 if(m==='bridges')extra='Bridges (slots): '+b.bridges.map(([a,c])=>(a+1)+'↔'+(c+1)).join(' · ');
 if(m==='rosetta')extra='Same values: △ / A / Ⅰ · ○ / B / Ⅱ · □ / C / Ⅲ · ◇ / D / Ⅳ';
 return extra;
}
function presentation(s,i,selected=false){const b=s.board,m=def(s).mode,v=value(s,i);let text=GLYPHS[v],ink=null;
 if(m==='memory'&&!b.revealed&&!selected)text='?';
 if(m==='cipher')text=['A','B','C','D'][(v+b.key)%4];
 if(m==='rosetta')text=[GLYPHS,['A','B','C','D'],['Ⅰ','Ⅱ','Ⅲ','Ⅳ']][Math.floor(i/b.cols)%3][v];
 if(m==='stroop'){text=['RED','BLUE','GOLD','GREEN'][v];ink=['#ff9a9a','#99caff','#ffe39c','#9ce4b8'][(v+1+i%3)%4];}
 if(m==='weights')text+=(b.inspect?' '+b.weights[i]:' ?');
 if(m==='values')text+=' '+(1+(v+b.turn)%4);
 if(m==='dual')text=GLYPHS[v]+' / '+GLYPHS[b.phase?b.cells[i]:b.alternate[i]];
 if(m==='zenith'&&b.seals[i])text='◈ '+text;
 return {text,ink,disabled:locked(s,i)||(m==='resonance'&&i%b.cols>=4),void:b.cells[i]===null};
}
function validate(s){const d=def(s);if(!d)throw Error('Unknown expanded stage');const b=s.board,[rows,cols]=dims(d),tile=v=>Number.isInteger(v)&&v>=0&&v<4;
 if(!b||b.rows!==rows||b.cols!==cols||!Array.isArray(b.cells)||b.cells.length!==rows*cols||!b.cells.every((v,i)=>d.mode==='bridges'&&[3,10,17,21,22,23,25,26,27,31,38,45].includes(i)?v===null:tile(v)))throw Error('Invalid stage board');
 if(!Array.isArray(b.weights)||b.weights.length!==b.cells.length||!b.weights.every(v=>Number.isInteger(v)&&v>=1&&v<=4)||![0,1].includes(b.phase)||!Number.isInteger(b.turn)||b.turn!==s.moves||!Number.isInteger(b.key)||b.key<0||b.key>3)throw Error('Invalid stage modifiers');
 if(d.mode==='dual'&&(!Array.isArray(b.alternate)||b.alternate.length!==b.cells.length||!b.alternate.every(tile)))throw Error('Invalid dual state');
 if(d.mode!=='dual'&&(b.alternate!==null||b.phase!==0))throw Error('Unexpected alternate board');
 if(!Array.isArray(b.seals)||b.seals.length!==b.cells.length||!b.seals.every(v=>typeof v==='boolean')||!Array.isArray(b.visited)||!b.visited.every(v=>Number.isInteger(v)&&v>=0&&v<9)||!Array.isArray(b.contributions)||b.contributions.length!==2||!b.contributions.every(v=>Number.isInteger(v)&&v>=0&&v<=15)||!Number.isInteger(b.rival)||b.rival<0||(b.target!==null&&!tile(b.target))||typeof b.revealed!=='boolean'||typeof b.inspect!=='boolean')throw Error('Invalid objective state');
 if(!Array.isArray(b.bridges)||JSON.stringify(b.bridges)!==JSON.stringify(d.mode==='bridges'?[[2,4],[16,18],[30,32],[44,46]]:[]))throw Error('Invalid bridge links');
 return true;
}
return Object.freeze({LEVELS,initial,step,hint,analyze,prepare,transmute,groups,status,presentation,validate,gravity,adjacent,locked});
});
