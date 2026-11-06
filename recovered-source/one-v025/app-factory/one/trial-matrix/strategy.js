/* Private ONE v025 — visible-information strategy campaign. No service calls. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TrialStrategy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SYMBOLS=['△','○','□','◇'];
const DIFFICULTIES=Object.freeze({
 story:{name:'Explorer',rank:1,health:220,guardian:60,attack:.65,cadence:2,turns:90},
 tactician:{name:'Tactician',rank:2,health:150,guardian:100,attack:1,cadence:1,turns:75},
 grandmaster:{name:'Grandmaster',rank:3,health:110,guardian:150,attack:1.25,cadence:1,turns:60}
});
// Each contract is optional: winning always requires the board objective AND the guardian.
const CONTENT=[
 ['The Counterweight','productive',4,'Make four productive mirrored swaps.','Build repeated values near the anchor before committing a mirrored clear.','A wide clear is valuable, but keeping a second triple ready maintains pressure.'],
 ['The Gatekeeper','rings',2,'Score using both outer and inner ring controls.','Choose one core symbol and count how far both rings must travel.','The biggest immediate radial clear can expose a stronger guardian alignment.'],
 ['The Surveyor','productive',4,'Make four productive diagonal swaps.','Read the diagonal lanes, not the visual horizontal rows.','A lower clear changes two sloping supply lanes; inspect both before choosing.'],
 ['The Echo','shockwaves',3,'Fire three root-bed shockwaves.','Choose the bottom-bed symbol by the number of matching tiles above it.','Bank upper combinations before firing; an early small shockwave can waste setup.'],
 ['The Maw','siphons',5,'Clear five matching spiral segments.','Keep matching opportunities near the outer feed.','A large clear buys time. Three separated copies can be compressed with setup swaps; fewer than three copies need another feed.'],
 ['The Sluicekeeper','orientations',2,'Clear both a horizontal and a vertical match.','Eastern gravity can create follow-up rows without vertical falling.','Compare the guardian’s marked cells with the lane you are about to drain.'],
 ['The Clocksmith','sectors',2,'Clear matches in both calendars.','Plan where the counter-rotation will place your remaining pairs.','A short clear on the quiet calendar can deny the guardian a large one.'],
 ['The Archivist','hidden',2,'Make two productive moves while symbols are hidden.','Study a move, hide the board, then execute your plan from memory.','Study is always free. Rebuild your mental map after a cascade changes the board.'],
 ['The Scribe','keys',3,'Score under three different cipher keys.','Use the visible key to read the current board, then anticipate row shifts.','An apparent letter pair can stop being a pair after the next row-dependent change.'],
 ['The Minotaur','rooms',9,'Complete all nine rooms.','Leave completed rooms and search for an unvisited room first.','A room already solved can still supply combat damage while you prepare another room.'],
 ['The Three Tongues','scripts',3,'Clear tiles from all three scripts.','Use the legend to translate values before comparing neighboring rows.','This guardian is an epoch boss: its visible shield symbol changes as its health falls.'],
 ['The Counterfall','top',3,'Clear three tiles from the top row.','Refill comes from below: top-row opportunities are the destination, not the source.','The guardian shares the board; denying its best upper match can be stronger than raw damage.'],
 ['The Overseer','long',2,'Make two opening matches of four or more.','Look beyond the conveyor’s current row: movement creates the next opening.','Long lines charge focus faster, but the shifted row may hand a line to your opponent.'],
 ['The Automaton','gravities',4,'Score under all four programmed gravity directions.','Read the next gravity before choosing the source of a cascade.','Guardian moves also advance the shared mechanism. Its turn can change your next direction.'],
 ['The Cipherwright','rotors',3,'Score while three different rotor columns are next.','Watch the announced rotor column, then compare possible lines after its shift.','Do not value a pair solely by its current value when the rotor will change it.'],
 ['The Alchemist','valuable',6,'Clear six opening tiles currently worth at least three.','Compare value per clear, not only the number of cleared tiles.','Focus and damage come from a productive turn; high-value objectives still decide the board win.'],
 ['The Alternator','gravities',2,'Score with both gravity polarities.','Think in two-turn supply lines: gravity reverses after every shared-board move.','Denying a guardian turn can preserve a polarity that would otherwise reverse.'],
 ['The Predictor','targets',3,'Make three productive target-symbol moves.','Leave a supply of the next target rather than emptying one symbol indiscriminately.','Large off-target clears can win a combat exchange while delaying the board objective.'],
 ['The Gamekeeper','disrupts',3,'Disrupt three announced guardian moves.','Use the intent marker to decide which match to take away.','Industrial guardians can adapt to a disrupted plan, but their replacement attack is weaker.'],
 ['The Noise','horizontal',15,'Clear fifteen opening tiles in horizontal lines.','Vertical clears can rebuild the board, but only horizontal groups transmit progress.','A vertical denial move may be correct even when it yields no objective points.'],
 ['The Navigator','gravities',3,'Score under three guidance directions.','The guidance cycle skips a direction every third shared turn.','Use the current announcement, not a memorized four-step cycle.'],
 ['The Negotiator','sectors',2,'Score from both sectors.','Protect the less-developed sector; the completed half cannot finish the board for you.','This boss contests high-value matches. Defensive stance preserves time to restore balance.'],
 ['The Observer','phases',2,'Score in both light and dark states.','Read both values before moving a tile; both travel together.','Changing phase reveals different openings for free; the guardian can still return to its committed phase.'],
 ['The Fold','planes',4,'Clear tiles from all four projected planes.','Cross-plane swaps move one coordinate while preserving the other three.','A remote counterpart can complete a line that ordinary grid adjacency cannot reach.'],
 ['The Contradiction','symbols',4,'Clear all four printed words.','Say the printed word internally before choosing; ink is a deliberate distraction.','The analysis describes values, never assumes that the ink color is the matching value.'],
 ['The Silent Mass','heavy',4,'Clear four opening tiles with weight four.','Inspect freely, then choose whether a heavy group or a denial move is more valuable.','Unknown weights are not exposed by the public-information analysis.'],
 ['The Sentinel','columns',3,'Clear tiles from three movable columns.','Fixed pillars split falling lanes and cannot be removed by an ability.','An isolated column needs vertical preparation rather than a horizontal rescue.'],
 ['The Twin','productive',4,'Make four productive synchronized moves.','Read both chambers before swapping; only corresponding matched positions clear.','Transmutation changes both counterparts together, preserving the stage’s symmetry.'],
 ['The Demon','targets',3,'Make three productive gate-symbol moves.','Prepare the next gate symbol before consuming the current one.','Off-target damage is allowed, but it cannot substitute for the gate’s objective.'],
 ['The Timekeeper','reserve',3,'Clear three tiles from the released reserve row.','Use the first two moves to prepare the row above the reserve.','The reserve remains protected until its rule opens it; abilities cannot bypass it.'],
 ['The Threadcutter','bridges',1,'Make a productive swap across a published bridge.','Read the bridge endpoints as neighbors even though they look separated.','Bridges permit swaps, not gravity; supply still stops at structural voids.'],
 ['The Chorus','contributors',2,'Have both local players make a productive move.','Discuss the shared target, then let the other player execute their own turn.','The guardian makes echo strikes here without taking a board turn, so human roles keep alternating.'],
 ['The Null King','forecasts',3,'Make three correct symbol forecasts.','Reduce the seals while managing focus and reading the boss’s changing shield.','A win requires all seals gone and the guardian defeated. Finish one objective while maintaining the other.']
];
const GUIDES=CONTENT.map((row,i)=>Object.freeze({level:i+1,guardian:row[0],kind:row[1],target:row[2],contract:row[3],opening:row[4],advanced:row[5],boss:[11,22,33].includes(i+1),temperament:['Collector','Saboteur','Architect','Echo'][i%4]}));
const clone=x=>JSON.parse(JSON.stringify(x));
const guide=s=>GUIDES[s.level-1];
function key(a){if(!a)return '';return a.type==='rotate'?a.ring+':'+a.direction:JSON.stringify([a.a,a.b,a.phase??0]);}
function actionText(a){
 if(!a)return 'No matching move announced.';
 if(a.type==='rotate')return a.ring+' ring '+(a.direction===1?'clockwise':'counterclockwise');
 const p=v=>typeof v==='object'?'row '+(v.r+1)+', column '+(v.c+1):'slot '+(v+1);
 return p(a.a)+' ↔ '+p(a.b)+(a.phase===1?' (dark state)':'');
}
function legacyOptions(s,api){
 const out=[],actions=[],board=s.board;
 if(s.level===1)for(let a=0;a<16;a++)for(let b=a+1;b<16;b++)actions.push({type:'swap',a,b});
 if(s.level===2&&!board.locked)for(const ring of ['outer','inner'])for(const direction of [-1,1])actions.push({type:'rotate',ring,direction});
 if(s.level===3)for(let a=0;a<49;a++)for(const n of [6,8])if(a+n<49&&Math.abs(a%7-(a+n)%7)===1&&board[a]!==null&&board[a+n]!==null)actions.push({type:'swap',a,b:a+n});
 if(s.level===4){const positions=board.flatMap((row,r)=>row.map((_,c)=>({r,c})));for(let a=0;a<positions.length;a++)for(let b=a+1;b<positions.length;b++)actions.push({type:'swap',a:positions[a],b:positions[b]});}
 if(s.level===5)for(let a=0;a+1<board.chain.length;a++)actions.push({type:'swap',a,b:a+1});
 for(const action of actions){const b=clone(board),symbols=[0,0,0,0];let hits=[],groups=0,maxRun=3;
  if(s.level===1){[b[action.a],b[action.b]]=[b[action.b],b[action.a]];for(let i=0;i<16;){let j=i+1;while(j<16&&b[j]===b[i])j++;if(j-i>=3){groups++;maxRun=Math.max(maxRun,j-i);for(let k=i;k<j;k++){hits.push(k);symbols[b[k]]+=2;}}i=j;}}
  if(s.level===2){if(action.direction===1)b[action.ring].unshift(b[action.ring].pop());else b[action.ring].push(b[action.ring].shift());const axes=api.axes({board:b});groups=axes.length;for(const axis of axes){hits.push(axis);symbols[b.core[axis]]+=3;}}
  if(s.level===3){[b[action.a],b[action.b]]=[b[action.b],b[action.a]];const match=api.diagonalGroups(b);groups=match.count;hits=[...match.hit];hits.forEach(i=>symbols[b[i]]++);}
  if(s.level===4){const {a,c}= {a:action.a,c:action.b};[b[a.r][a.c],b[c.r][c.c]]=[b[c.r][c.c],b[a.r][a.c]];const v=b[5][0];if(b[5].every(x=>x===v)){groups=1;for(let r=0;r<6;r++)for(let c=0;c<b[r].length;c++)if(b[r][c]===v){hits.push(r*100+c);symbols[v]++;}}}
  if(s.level===5){const chain=b.chain;[chain[action.a],chain[action.b]]=[chain[action.b],chain[action.a]];const matches=api.groups5(chain);groups=matches.length;for(const [start,end] of matches){maxRun=Math.max(maxRun,end-start);for(let i=start;i<end;i++){hits.push(i);symbols[chain[i]]++;}}}
  if(groups)out.push({action,hits,symbols,tiles:symbols.reduce((a,b)=>a+b,0),groups,maxRun,horizontal:0,vertical:0,objective:groups});
 }
 return out;
}
function options(s,api,reveal=false){if(s.level===8&&reveal&&!s.board.revealed){const copy=clone(s);copy.board.revealed=true;return api.expansion.analyze(copy);}return s.level>=6?api.expansion.analyze(s):legacyOptions(s,api);}
function dominant(move){return move?move.symbols.indexOf(Math.max(...move.symbols)):-1;}
function addUnique(t,name,values){for(const value of values)if(!t.collections[name].includes(value))t.collections[name].push(value);}
function contractValue(s){const t=s.strategy,g=guide(s);if(Object.hasOwn(t.counts,g.kind))return t.counts[g.kind];return t.collections[g.kind]?.length||0;}
function contractGain(s,move){
 if(!move)return 0;const t=s.strategy,g=guide(s),b=s.board,missing=(name,values)=>values.filter(v=>!t.collections[name].includes(v)).length;
 switch(g.kind){
 case 'symbols':return missing('symbols',move.symbols.map((n,i)=>n?i:-1).filter(i=>i>=0));
 case 'phases':return missing('phases',[move.action.phase??b.phase]);
 case 'planes':return missing('planes',[...new Set(move.hits.map(i=>Math.floor(Math.floor(i/b.cols)/4)*2+Math.floor((i%b.cols)/4)))]);
 case 'columns':return missing('columns',[...new Set(move.hits.map(i=>i%b.cols))]);
 case 'orientations':return missing('orientations',[move.horizontal?'horizontal':null,move.vertical?'vertical':null].filter(Boolean));
 case 'sectors':return missing('sectors',[...new Set(move.hits.map(i=>Math.floor((i%b.cols)/(b.cols/2))))]);
 case 'long':return move.maxRun>=4?1:0;
 case 'bridges':return b.bridges.some(([a,c])=>a===move.action.a&&c===move.action.b||c===move.action.a&&a===move.action.b)?1:0;
 case 'targets':return move.objective>0?1:0;
 default:return 0;
 }
}
function guardianScore(s,move){
 const kind=guide(s).temperament;
 if(kind==='Collector')return move.tiles*3+(move.objective||0);
 if(kind==='Saboteur')return (move.objective||0)*4+move.tiles+contractGain(s,move)*12;
 if(kind==='Architect')return move.maxRun*10+move.groups*8+move.tiles;
 const symbol=s.strategy.lastSymbol??((s.level-1)%4);return move.symbols[symbol]*5+move.tiles*2;
}
function chooseGuardian(s,api){
 if(s.strategy.guardianHealth<=0)return null;const candidates=options(s,api,true);if(!candidates.length)return null;
 candidates.sort((a,b)=>guardianScore(s,b)-guardianScore(s,a)||key(a.action).localeCompare(key(b.action)));
 return clone(candidates[0]);
}

function analyze(s,api){
 const moves=options(s,api),t=s.strategy;
 for(const move of moves){
  move.contractGain=t?contractGain(s,move):0;
  move.denies=!!(t?.intent&&(key(move.action)===key(t.intent.action)||move.hits.some(i=>t.intent.hits.includes(i))));
  move.rank=(move.objective||0)*8+move.tiles*2+move.contractGain*16+(move.denies?20:0);
 }
 return moves.sort((a,b)=>b.rank-a.rank||key(a.action).localeCompare(key(b.action)));
}
function hint(s,api){if(s.status!=='playing')return null;return analyze(s,api)[0]?.action||(s.level===8&&!s.board.revealed?null:api.hint(s));}
function attach(s,options,api){
 const difficulty=options.difficulty||'tactician',d=DIFFICULTIES[difficulty];if(!d)throw Error('Unknown campaign difficulty');
 const g=guide(s),boss=g.boss;
 s.strategy={schema:'one.33trial.strategy.v1',difficulty,daily:options.daily||null,heroTurns:0,guardianTurns:0,health:d.health,maxHealth:d.health,guardianHealth:d.guardian+(boss?30:0),guardianMax:d.guardian+(boss?30:0),shield:0,focus:3,stance:'balanced',forecast:null,gambit:false,abilityUsed:false,lastSymbol:null,intent:null,limit:d.turns,counts:{productive:0,shockwaves:0,siphons:0,hidden:0,top:0,long:0,valuable:0,targets:0,disrupts:0,horizontal:0,heavy:0,reserve:0,bridges:0,forecasts:0},collections:{rings:[],orientations:[],sectors:[],keys:[],rooms:[],scripts:[],gravities:[],rotors:[],phases:[],planes:[],symbols:[],columns:[],contributors:[]},log:[],lastDamage:0,lastIncoming:0};
 s.strategy.intent=chooseGuardian(s,api);note(s,'Face '+g.guardian+'. Complete the board and defeat the guardian.');return s;
}
function note(s,text){s.strategy.log.push(text);s.strategy.log=s.strategy.log.slice(-8);}
function absorb(s,damage){const t=s.strategy,blocked=Math.min(t.shield,damage);t.shield-=blocked;t.health=Math.max(0,t.health-damage+blocked);t.lastIncoming=damage-blocked;return damage-blocked;}
function collect(s,before,move,productive,api){
 const t=s.strategy,b=before.board;if(!productive)return;
 t.counts.productive++;
 if(s.level===2)addUnique(t,'rings',[move?.action.ring].filter(Boolean));
 if(s.level===4)t.counts.shockwaves+=Math.max(0,s.stats.shockwaves-before.stats.shockwaves);
 if(s.level===5)t.counts.siphons+=Math.max(0,s.progress-before.progress);
 if(s.level<6)return;
 addUnique(t,'gravities',[api.expansion.gravity(before)]);addUnique(t,'phases',[move?.action.phase??b.phase]);addUnique(t,'keys',[b.key]);addUnique(t,'rotors',[b.turn%b.cols]);
 if(!b.revealed)t.counts.hidden++;
 if(move){
  const hits=move.hits;addUnique(t,'orientations',[move.horizontal?'horizontal':null,move.vertical?'vertical':null].filter(Boolean));
  addUnique(t,'symbols',move.symbols.map((n,i)=>n?i:-1).filter(i=>i>=0));addUnique(t,'columns',hits.map(i=>i%b.cols));
  addUnique(t,'sectors',hits.map(i=>Math.floor((i%b.cols)/(b.cols/2))));addUnique(t,'scripts',hits.map(i=>Math.floor(i/b.cols)%3));addUnique(t,'planes',hits.map(i=>Math.floor(Math.floor(i/b.cols)/4)*2+Math.floor((i%b.cols)/4)));
  if(s.level===10)addUnique(t,'rooms',s.board.visited);
  if(s.level===32)addUnique(t,'contributors',[b.turn%2]);
  t.counts.top+=hits.filter(i=>i<b.cols).length;t.counts.reserve+=b.turn>=2?hits.filter(i=>i>=b.cols*(b.rows-1)).length:0;
  t.counts.long+=move.maxRun>=4?1:0;t.counts.horizontal+=move.horizontal;
  t.counts.valuable+=hits.filter(i=>1+((b.phase?b.alternate[i]:b.cells[i])+b.turn)%4>=3).length;t.counts.heavy+=hits.filter(i=>b.weights[i]===4).length;
  if(move.objective>0)t.counts.targets++;
  if(s.level===31&&b.bridges.some(([a,c])=>a===move.action.a&&c===move.action.b||c===move.action.a&&a===move.action.b))t.counts.bridges++;
 }
}
function phase(s){const t=s.strategy;return Math.min(3,1+Math.floor((t.guardianMax-t.guardianHealth)*3/t.guardianMax));}
function guardianTurn(s,api,at){
 const t=s.strategy,d=DIFFICULTIES[t.difficulty];if(t.guardianHealth<=0||t.heroTurns%d.cadence!==0)return;
 let candidates=options(s,api,true),move=candidates.find(m=>key(m.action)===key(t.intent?.action)),adapted=false;
 const epoch=Math.floor((s.level-1)/11);
 if(!move&&t.intent){t.counts.disrupts++;note(s,'Intent disrupted: the announced match is gone.');}
 if((t.difficulty==='grandmaster'||epoch===2&&phase(s)===3)){move=chooseGuardian(s,api);adapted=false;}else if(epoch>=1&&!move){move=chooseGuardian(s,api);adapted=true;}
 if(!move){note(s,'Guardian regroups. No matching strike.');return;}
 const copy=clone(s);delete copy.strategy;copy.status='playing';copy.telemetryEnabled=false;copy.events=[];
 if(move.action.phase!==undefined&&s.level===23)copy.board.phase=move.action.phase;
 const oldMoves=copy.moves;api.step(copy,move.action,at);
 if(copy.moves===oldMoves||copy.score<=s.score){note(s,'Guardian’s opening closed.');return;}
 // Concordia preserves alternating human turns. Its guardian makes an echo
 // strike calculated from a legal move, without consuming a shared-board move.
 if(s.level!==32){s.board=copy.board;s.randomState=copy.randomState;s.moves=copy.moves;t.guardianTurns++;}
if(s.level===10)s.progress=s.board.visited.length;
 if(s.level===22)s.progress=s.board.contributions.reduce((a,b)=>a+b,0);
 if(s.level===33)s.progress=33-s.board.seals.filter(Boolean).length;
 const incoming=Math.max(1,Math.round((4+Math.min(12,move.tiles/2))*d.attack*(adapted?.7:1)*(t.gambit?1.35:1)));
 const taken=absorb(s,incoming);note(s,(adapted?'Guardian adapts: ':'Guardian strikes: ')+actionText(move.action)+' · '+taken+' damage after shield.');
}
function ability(s,a,api){const t=s.strategy;
 if(t.abilityUsed){s.feedback='One focus ability per player turn. Make a board move first.';return s;}
 const costs={ward:3,gambit:2,transmute:3},cost=costs[a.name];
 if(!cost||t.focus<cost){s.feedback='Not enough focus for this ability.';return s;}
 if(a.name==='transmute'){
  if(s.level<6||!api.expansion.transmute(s,a.slot)){s.feedback='Choose a movable tile in an expanded stage to transmute.';return s;}
  note(s,'Transmutation: slot '+(a.slot+1)+' advances one symbol.');
 }
 if(a.name==='ward'){t.shield=Math.min(36,t.shield+16);note(s,'Ward raised: +16 shield, up to 36.');}
 if(a.name==='gambit'){t.gambit=true;note(s,'Gambit committed: +50% outgoing damage and +35% incoming damage for the next turn.');}
 t.focus-=cost;t.abilityUsed=true;s.feedback=t.log.at(-1);return s;
}
function perform(s,a,at,api){
 const t=s.strategy;if(s.status!=='playing')return s;
 if(a?.type==='ability')return ability(s,a,api);
 if(a?.type==='stance'){
  if(!['balanced','precision','cascade','fortify'].includes(a.stance)){s.feedback='Unknown stance.';return s;}
  t.stance=a.stance;s.feedback='Stance: '+a.stance+'.';return s;
 }
 if(a?.type==='forecast'){
  if(!Number.isInteger(a.symbol)||a.symbol<0||a.symbol>3){s.feedback='Choose a valid forecast symbol.';return s;}
  if(t.forecast!==null){s.feedback='Forecast already committed until your next board move.';return s;}
  t.forecast=a.symbol;s.feedback='Forecast committed: '+SYMBOLS[a.symbol]+'. Most frequent opening-clear symbol wins; ties follow the legend.';return s;
 }
 if(a?.type==='tick')return api.step(s,a,at);
 const isMove=['swap','rotate'].includes(a?.type);if(!isMove)return api.step(s,a,at);
 const before=clone(s),move=options(s,api,true).find(m=>key(m.action)===key(s.level===23?{...a,phase:s.board.phase}:a));
 api.step(s,a,at);if(s.moves===before.moves)return s;
 const feedback=s.feedback,entropy=s.level===5&&s.board.chain.length>=64;
 t.heroTurns++;t.lastDamage=0;t.lastIncoming=0;const productive=s.score>before.score;
 collect(s,before,move,productive,api);
 if(move&&productive)t.lastSymbol=dominant(move);
 let damage=productive?Math.min(24,6+Math.floor(Math.sqrt(s.score-before.score))):0;
 if(t.stance==='precision')damage=move?.maxRun>=4?Math.round(damage*1.3):Math.round(damage*.9);
 if(t.stance==='cascade')damage=s.score-before.score>(s.level>=6?(move?.tiles||0)*10:(move?.groups||0)*100)?Math.round(damage*1.25):Math.round(damage*.8);
 if(t.stance==='fortify'){damage=Math.round(damage*.75);t.shield=Math.min(36,t.shield+5);}
 if(productive)t.focus=Math.min(6,t.focus+1+(move?.maxRun>=4?1:0));
 if(t.forecast!==null){
  if(move&&dominant(move)===t.forecast){t.counts.forecasts++;damage+=5;t.focus=Math.min(6,t.focus+1);note(s,'Forecast correct: +5 damage and +1 focus.');}
  else{t.focus=Math.max(0,t.focus-1);note(s,'Forecast missed: −1 focus.');}
 }
 if(t.gambit)damage=Math.round(damage*1.5);
 if(guide(s).boss&&move){const shield=(s.level+phase(s)-1)%4;if(dominant(move)===shield){damage=Math.ceil(damage*.5);note(s,'Boss shield absorbed half the '+SYMBOLS[shield]+' attack.');}}
 t.lastDamage=damage;t.guardianHealth=Math.max(0,t.guardianHealth-damage);
 note(s,'Turn '+t.heroTurns+': '+(productive?'productive match':'setup move')+' · '+damage+' guardian damage.');
 s.status='playing';
 if(!entropy)guardianTurn(s,api,at);
 t.forecast=null;t.gambit=false;t.abilityUsed=false;
 if(entropy){s.status='failed';s.feedback='The entropy void was reached. Retry freely.';}
 else if(t.health<=0){s.status='failed';s.feedback='Guardian prevailed. Retry, change stance, or use Explorer difficulty.';}
 else if(s.progress>=api.levels[s.level-1].goal&&t.guardianHealth===0){s.status='won';s.feedback='Campaign victory — board complete and '+guide(s).guardian+' defeated.';}
 else if(t.heroTurns>=t.limit){s.status='failed';s.feedback='Campaign turn limit reached. Retry freely.';}
 else{
  if(s.level>=6)api.expansion.prepare(s);
  s.feedback=feedback+' · Guardian −'+damage+' · You −'+t.lastIncoming;
 }
 if(s.status==='playing')t.intent=chooseGuardian(s,api);else t.intent=null;
 return s;
}
function validate(s){const t=s.strategy;if(!t)return;
 const d=DIFFICULTIES[t.difficulty];if(t.schema!=='one.33trial.strategy.v1'||!d)throw Error('Unknown campaign save');
 for(const name of ['heroTurns','guardianTurns','health','maxHealth','guardianHealth','guardianMax','shield','focus','limit','lastDamage','lastIncoming'])if(!Number.isSafeInteger(t[name])||t[name]<0)throw Error('Invalid campaign counter');
 if(t.health>t.maxHealth||t.maxHealth!==d.health||t.guardianMax!==d.guardian+(guide(s).boss?30:0)||t.guardianHealth>t.guardianMax||t.focus>6||t.shield>36||t.limit!==d.turns||t.heroTurns+t.guardianTurns!==s.moves||t.heroTurns>t.limit||t.guardianTurns>t.heroTurns)throw Error('Invalid campaign limits');
 if(!['balanced','precision','cascade','fortify'].includes(t.stance)||(t.forecast!==null&&(!Number.isInteger(t.forecast)||t.forecast<0||t.forecast>3))||typeof t.gambit!=='boolean'||typeof t.abilityUsed!=='boolean')throw Error('Invalid campaign choice');
 if(t.lastSymbol!==null&&(!Number.isInteger(t.lastSymbol)||t.lastSymbol<0||t.lastSymbol>3))throw Error('Invalid last symbol');
 if(t.daily!==null&&(typeof t.daily!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.daily)))throw Error('Invalid daily seed date');
 const template={counts:['productive','shockwaves','siphons','hidden','top','long','valuable','targets','disrupts','horizontal','heavy','reserve','bridges','forecasts'],collections:['rings','orientations','sectors','keys','rooms','scripts','gravities','rotors','phases','planes','symbols','columns','contributors']};
 if(!t.counts||!t.collections)throw Error('Missing campaign contract');
 for(const name of template.counts)if(!Number.isSafeInteger(t.counts[name])||t.counts[name]<0||t.counts[name]>100000)throw Error('Invalid contract count');
 for(const name of template.collections)if(!Array.isArray(t.collections[name])||t.collections[name].length>81||new Set(t.collections[name]).size!==t.collections[name].length||!t.collections[name].every(v=>typeof v==='string'&&v.length<=20||Number.isInteger(v)&&v>=0&&v<=80))throw Error('Invalid contract collection');
 if(!Array.isArray(t.log)||t.log.length>8||!t.log.every(v=>typeof v==='string'&&v.length<500))throw Error('Invalid campaign log');
 if(t.intent!==null){
  const m=t.intent;
  if(!m||!Array.isArray(m.hits)||m.hits.length>81||new Set(m.hits).size!==m.hits.length||!m.hits.every(v=>Number.isInteger(v)&&v>=0&&v<=511)||!Array.isArray(m.symbols)||m.symbols.length!==4||!m.symbols.every(v=>Number.isInteger(v)&&v>=0&&v<=162)||!Number.isSafeInteger(m.tiles)||m.tiles<0||m.tiles>162||m.symbols.reduce((a,b)=>a+b,0)!==m.tiles||!m.action||!['swap','rotate'].includes(m.action.type))throw Error('Invalid guardian intent');
  const a=m.action;
  if(a.type==='rotate'){if(s.level!==2||!['outer','inner'].includes(a.ring)||![-1,1].includes(a.direction))throw Error('Invalid guardian ring action');}
  else if(s.level===4){const valid=p=>p&&Number.isInteger(p.r)&&p.r>=0&&p.r<6&&Number.isInteger(p.c)&&p.c>=0&&p.c<[12,10,8,6,4,3][p.r];if(!valid(a.a)||!valid(a.b))throw Error('Invalid guardian funnel action');}
  else{const n=s.level>=6?s.board?.cells?.length:s.level===1?16:s.level===3?49:s.board?.chain?.length;if(!Number.isInteger(a.a)||!Number.isInteger(a.b)||a.a<0||a.b<0||a.a>=n||a.b>=n||a.a===a.b||(a.phase!==undefined&&![0,1].includes(a.phase)))throw Error('Invalid guardian swap action');}
 }

}
function dailySeed(date,level,difficulty){let hash=2166136261;for(const c of 'ONE025|'+date+'|'+level+'|'+difficulty){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}
return Object.freeze({GUIDES,DIFFICULTIES,SYMBOLS,attach,perform,analyze,hint,validate,contractValue,actionText,dailySeed,guardianScore,phase});
});
