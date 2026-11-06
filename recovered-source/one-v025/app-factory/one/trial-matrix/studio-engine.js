/* Private ONE v025 — original 8×8 Match-3 workbench, no third-party code. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StudioMatch3=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SIZE=8,COLORS=6,POWERS=[null,'row','column','blast','spectrum'];
const clone=x=>JSON.parse(JSON.stringify(x));
function random(s,n){s.randomState=(Math.imul(s.randomState>>>0,1664525)+1013904223)>>>0;return Math.floor(s.randomState/4294967296*n);}
function tile(s,value=random(s,COLORS)){return {id:s.nextId++,value,power:null};}
function adjacent(a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&a<64&&b>=0&&b<64&&Math.abs(Math.floor(a/8)-Math.floor(b/8))+Math.abs(a%8-b%8)===1;}
function groups(board){
 const result=[];
 for(let i=0;i<64;i++)for(const stride of [1,8]){
  const t=board[i];if(!t||t.power==='spectrum')continue;
  const connected=(a,b)=>a>=0&&b<64&&(stride!==1||Math.floor(a/8)===Math.floor(b/8));
  const equal=j=>board[j]&&board[j].power!=='spectrum'&&board[j].value===t.value;
  if(connected(i-stride,i)&&equal(i-stride))continue;
  let j=i+stride,line=[i];while(connected(j-stride,j)&&equal(j)){line.push(j);j+=stride;}
  if(line.length>=3)result.push({cells:line,value:t.value,direction:stride===1?'row':'column'});
 }
 return result;
}
function components(matches){const sets=[];
 for(const match of matches){let joined={cells:new Set(match.cells),groups:[match]};
  for(let i=sets.length-1;i>=0;i--)if([...sets[i].cells].some(x=>joined.cells.has(x))){sets[i].cells.forEach(x=>joined.cells.add(x));joined.groups.push(...sets[i].groups);sets.splice(i,1);}
  sets.push(joined);
 }
 return sets;
}
function creations(board,matches,preferred){const result=[];
 for(const set of components(matches)){
  const long=set.groups.find(g=>g.cells.length>=5),four=set.groups.find(g=>g.cells.length>=4),cross=[...set.cells].find(i=>set.groups.filter(g=>g.cells.includes(i)).length>1);
  const power=long?'spectrum':cross!==undefined?'blast':four?four.direction:null;if(!power)continue;
  const choices=[cross,...preferred,...set.cells].filter(i=>i!==undefined&&set.cells.has(i)&&!board[i].power);
  if(choices.length)result.push({slot:choices[0],power});
 }
 return result;
}
function effects(board,initial,handled=new Set()){const hits=new Set(initial),triggered=[],queue=[...hits],seen=new Set();
 for(let p=0;p<queue.length;p++){
  const i=queue[p],t=board[i];if(!t?.power||seen.has(i))continue;seen.add(i);triggered.push({slot:i,power:t.power});
  const add=j=>{if(j>=0&&j<64&&!hits.has(j)){hits.add(j);queue.push(j);}};
  if(t.power==='row')for(let c=0;c<8;c++)add(Math.floor(i/8)*8+c);
  if(t.power==='column')for(let r=0;r<8;r++)add(r*8+i%8);
  if(t.power==='blast')for(let r=Math.max(0,Math.floor(i/8)-1);r<=Math.min(7,Math.floor(i/8)+1);r++)for(let c=Math.max(0,i%8-1);c<=Math.min(7,i%8+1);c++)add(r*8+c);
  if(t.power==='spectrum'&&!handled.has(i)){
   const counts=Array(COLORS).fill(0);board.forEach(x=>{if(x&&x.power!=='spectrum')counts[x.value]++;});const value=counts.indexOf(Math.max(...counts));board.forEach((x,j)=>{if(x?.value===value)add(j);});
  }
 }
 return {hits,triggered};
}
function swapCells(board,a,b){[board[a],board[b]]=[board[b],board[a]];}
function powerSwap(board,a,b){
 const x=board[a],y=board[b];if(!x.power&&!y.power)return null;
 if(x.power==='spectrum'&&y.power==='spectrum')return {hits:new Set(Array.from({length:64},(_,i)=>i)),skipSpectrum:new Set([a,b])};
 if(x.power==='spectrum'||y.power==='spectrum'){
  const rainbow=x.power==='spectrum'?x:y,other=rainbow===x?y:x,hits=new Set([a,b]);
  board.forEach((t,i)=>{if(t.value===other.value&&t.power!=='spectrum'){hits.add(i);if(other.power)t.power=other.power;}});return {hits,skipSpectrum:new Set([rainbow===x?a:b])};
 }
 return {hits:new Set([a,b]),skipSpectrum:new Set()};
}
function settle(s,hits){const b=s.board;for(const i of hits)b[i]=null;
 for(let c=0;c<8;c++){const kept=[];for(let r=0;r<8;r++)if(b[r*8+c])kept.push(b[r*8+c]);const fresh=Array.from({length:8-kept.length},()=>tile(s)),column=fresh.concat(kept);for(let r=0;r<8;r++)b[r*8+c]=column[r];}
}
function stableFill(s){
 for(let i=0;i<64;i++){
  const blocked=new Set();if(i%8>=2&&s.board[i-1].power!=='spectrum'&&s.board[i-2].power!=='spectrum'&&s.board[i-1].value===s.board[i-2].value)blocked.add(s.board[i-1].value);
  if(i>=16&&s.board[i-8].power!=='spectrum'&&s.board[i-16].power!=='spectrum'&&s.board[i-8].value===s.board[i-16].value)blocked.add(s.board[i-8].value);
  const allowed=Array.from({length:COLORS},(_,v)=>v).filter(v=>!blocked.has(v));s.board[i].value=allowed[random(s,allowed.length)];
 }
}
function moves(s){if(s.status!=='playing')return [];const result=[];
 for(let a=0;a<64;a++)for(const b of [a+1,a+8])if(adjacent(a,b)){
  const board=clone(s.board);swapCells(board,a,b);const matches=groups(board),forced=powerSwap(board,a,b);
  if(!matches.length&&!forced)continue;
  const made=creations(board,matches,[b,a]),clear=effects(board,forced?.hits||matches.flatMap(g=>g.cells),forced?.skipSpectrum),protectedSlots=new Set(made.map(m=>m.slot));
  result.push({a,b,tiles:[...clear.hits].filter(i=>!protectedSlots.has(i)).length,powers:made.map(m=>m.power),activations:clear.triggered.length,rank:clear.hits.size*10+made.length*35+clear.triggered.length*15});
 }
 return result.sort((a,b)=>b.rank-a.rank||a.a-b.a||a.b-b.b);
}
function recover(s){if(moves(s).length&&groups(s.board).length===0)return false;
 for(let attempt=0;attempt<100;attempt++){
  for(let i=63;i>0;i--){const j=random(s,i+1);swapCells(s.board,i,j);}
  if(groups(s.board).length===0&&moves(s).length){s.stats.reshuffles++;return true;}
 }
 stableFill(s);if(!moves(s).length){
  // Guaranteed adjacent-swap pattern in the corner; no free initial triple.
  s.board[0].value=0;s.board[1].value=1;s.board[2].value=0;s.board[9].value=0;
  if(groups(s.board).length)stableFill(s);
 }
 if(!moves(s).length)throw Error('Could not recover a playable workbench');s.stats.reshuffles++;return true;
}
function initial(seed=8291973,settings={}){
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Invalid studio seed');
 const goal=settings.goal??1200,budget=settings.budget??30;
 if(!Number.isSafeInteger(goal)||goal<1||goal>10000000||!Number.isInteger(budget)||budget<1||budget>500)throw Error('Invalid studio target');
 const s={schema:'one.v025.studio.session.v1',seed,randomState:seed,nextId:1,board:[],score:0,moves:0,goal,budget,status:'playing',stats:{invalid:0,cascades:0,bestCascade:0,powersMade:0,powersActivated:0,reshuffles:0},lastTurn:null};
 s.board=Array.from({length:64},()=>tile(s));stableFill(s);recover(s);return s;
}
function signature(board){return board.map(t=>t.id+':'+t.value+':'+(t.power||'-')).join('|');}
function swap(s,a,b){
 if(s.status!=='playing')return false;
 const before=signature(s.board);
 if(!adjacent(a,b)){s.stats.invalid++;s.lastTurn={accepted:false,reason:'not_adjacent',before,after:before,frames:[]};return false;}
 const old=clone(s.board);swapCells(s.board,a,b);let matching=groups(s.board),forced=powerSwap(s.board,a,b);
 if(!matching.length&&!forced){s.board=old;s.stats.invalid++;s.lastTurn={accepted:false,reason:'no_match',before,after:signature(s.board),frames:[]};return false;}
 s.moves++;let depth=0,cleared=0,made=0,activated=0,frames=[];const openingScore=s.score;
 while((matching.length||forced)&&depth<32){
  const start=clone(s.board),create=creations(s.board,matching,depth===0?[b,a]:[]),effect=effects(s.board,forced?.hits||matching.flatMap(g=>g.cells),forced?.skipSpectrum);
  for(const item of create)effect.hits.delete(item.slot);
  create.forEach(item=>{s.board[item.slot].power=item.power;});
  const hits=[...effect.hits];s.score+=hits.length*10*(depth+1)+effect.triggered.length*25;
  cleared+=hits.length;made+=create.length;activated+=effect.triggered.length;settle(s,effect.hits);
  if(frames.length<8)frames.push({before:start,after:clone(s.board),cleared:hits,created:create,activated:effect.triggered});
  forced=null;matching=groups(s.board);depth++;
 }
 s.stats.cascades+=depth;s.stats.bestCascade=Math.max(s.stats.bestCascade,depth);s.stats.powersMade+=made;s.stats.powersActivated+=activated;
 if(s.score>=s.goal)s.status='won';else if(s.moves>=s.budget)s.status='failed';
 // Even terminal exports contain a stable filled board.
 const status=s.status;s.status='playing';const shuffled=recover(s);s.status=status;
 s.lastTurn={accepted:true,a,b,cleared,cascades:depth,powersMade:made,powersActivated:activated,scoreGained:s.score-openingScore,reshuffled:shuffled,before,after:signature(s.board),frames};return true;
}
function validate(s){
 if(!s||s.schema!=='one.v025.studio.session.v1'||!['playing','won','failed'].includes(s.status))throw Error('Unknown studio session');
 for(const k of ['seed','randomState'])if(!Number.isInteger(s[k])||s[k]<0||s[k]>4294967295)throw Error('Invalid studio seed');
 for(const k of ['nextId','score','moves','goal','budget'])if(!Number.isSafeInteger(s[k])||s[k]<0)throw Error('Invalid studio counters');
 if(s.goal<1||s.goal>10000000||s.budget<1||s.budget>500||s.moves>s.budget||s.nextId<65)throw Error('Invalid studio budget');
 const validBoard=b=>Array.isArray(b)&&b.length===64&&new Set(b.map(t=>t?.id)).size===64&&b.every(t=>t&&Number.isSafeInteger(t.id)&&t.id>0&&t.id<s.nextId&&Number.isInteger(t.value)&&t.value>=0&&t.value<COLORS&&POWERS.includes(t.power));
 if(!validBoard(s.board)||groups(s.board).length)throw Error('Invalid or unsettled studio board');
 for(const k of ['invalid','cascades','bestCascade','powersMade','powersActivated','reshuffles'])if(!Number.isSafeInteger(s.stats?.[k])||s.stats[k]<0)throw Error('Invalid studio statistics');
 if(s.status==='won'&&s.score<s.goal||s.status==='failed'&&(s.moves<s.budget||s.score>=s.goal)||s.status==='playing'&&(s.moves>=s.budget||s.score>=s.goal))throw Error('Studio outcome disagrees with score/budget');
 if(s.lastTurn!==null){const t=s.lastTurn;if(!t||typeof t.accepted!=='boolean'||!Array.isArray(t.frames)||t.frames.length>8||typeof t.before!=='string'||typeof t.after!=='string'||t.before.length>10000||t.after.length>10000)throw Error('Invalid studio turn record');
  if(t.after!==signature(s.board))throw Error('Studio turn signature disagrees with board');
  if(!t.accepted&&(t.before!==t.after||t.frames.length||!['not_adjacent','no_match'].includes(t.reason)))throw Error('Invalid rollback trace');
  if(t.accepted){for(const name of ['cleared','cascades','powersMade','powersActivated','scoreGained'])if(!Number.isSafeInteger(t[name])||t[name]<0)throw Error('Invalid turn result');if(t.cascades<1||t.cascades>32||!adjacent(t.a,t.b)||typeof t.reshuffled!=='boolean')throw Error('Invalid accepted turn');}
  for(const f of t.frames){
   if(!validBoard(f.before)||!validBoard(f.after)||!Array.isArray(f.cleared)||f.cleared.length>64||new Set(f.cleared).size!==f.cleared.length||!f.cleared.every(i=>Number.isInteger(i)&&i>=0&&i<64))throw Error('Invalid studio animation trace');
   for(const name of ['created','activated'])if(!Array.isArray(f[name])||f[name].length>64||!f[name].every(p=>Number.isInteger(p.slot)&&p.slot>=0&&p.slot<64&&p.power!==null&&POWERS.includes(p.power)))throw Error('Invalid power animation trace');
  }
 }
 if(s.status==='playing'&&!moves(s).length)throw Error('Studio save has no legal move');return true;
}
function save(s){validate(s);return {schema:'one.v025.studio.save.v1',session:clone(s)};}
function restore(data){if(data?.schema!=='one.v025.studio.save.v1')throw Error('Unknown studio save');validate(data.session);return clone(data.session);}
return Object.freeze({SIZE,COLORS,POWERS,initial,adjacent,groups,moves,recover,swap,save,restore,validate,signature});
});
