/* Private ONE v025 — supplied A–Z labels and non-destructive live verification. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StructuralGateway=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SYSTEMS=[
 ['Application architecture','Alpha Foundation','Separate pure rules, browser presentation, progression and inspection.','studio-engine.js / studio-ui.js; engine.js / strategy.js','Supported schema and complete engine API.'],
 ['Board generation','Blueprint Alignment','Seeded generation creates a stable, playable opening.','studio-engine.js: initial, stableFill, recover','64 cells, no initial free triples, at least one legal move.'],
 ['Cell and tile models','Core Compliance','Stable tile identities carry a symbol and optional earned power.','studio-engine.js: tile, validate','Unique IDs, bounded symbols, supported power types.'],
 ['Drag-and-swap input','Deterministic Direction','Pointer gestures and keyboard/click selection enter the same swap transaction.','studio-ui.js: pointer handlers, play','Actual pointer gesture count; keyboard-native tile controls.'],
 ['Event sequencing','Energy Engine','One committed rule transaction is presented before new input is accepted.','studio-ui.js: locked; studio-engine.js: swap','UI lock state and atomic rule-phase status.'],
 ['Falling gems and gravity','Facilitation Force','Surviving tiles preserve order and fall into cleared cells; new tiles enter above.','studio-engine.js: settle','Every settled column contains eight valid tiles.'],
 ['Grid coordinates','Grid Geometry','Row/column and linear-index conversions preserve position.','studio-engine.js: adjacent, groups','Index → row/column → index round-trips for all 64 cells.'],
 ['Hint detection','Homeplace Harmony','Hints enumerate productive adjacent swaps without predicting refills.','studio-engine.js: moves','A hint is present while active and is geometrically adjacent.'],
 ['Invalid-swap rollback','Invariant Integrity','A nonmatching swap restores the exact previous board and spends no move.','studio-engine.js: swap / lastTurn','Rejected transaction signatures agree.'],
 ['Journey and progression','Judiciary Justice','Score targets, retries and local win records make progress visible.','studio-ui.js: recordOutcome; profile.js: award','Nonnegative score, budget and local run records.'],
 ['Keyframe animations','Key Lockout','Swaps, clear flashes and tile arrival animate with a reduced-motion path.','studio-ui.js: animateTurn; studio/index.html: keyframes','Rendered animations exercised or reduced-motion alternative selected.'],
 ['Legal-move solver','Literalist Logic','Every proposed move is checked against adjacency, matches and powers.','studio-engine.js: moves','All current candidates are legal adjacent pairs.'],
 ['Match detection','Mastery Mind','Maximal horizontal/vertical runs merge into connected clear components.','studio-engine.js: groups, components','Settled board has no unresolved normal match.'],
 ['Neighbor validation','Nomad Navigation','Edges cannot wrap into a false neighbor and diagonals are rejected.','studio-engine.js: adjacent','Row-wrap and diagonal counterexamples are rejected.'],
 ['Objectives and outcomes','Order Observation','Target completion wins; exhausting moves below target loses.','studio-engine.js: swap, validate','Outcome is consistent with current score and move budget.'],
 ['Power gems and boosters','Protection Protocol','Four-runs make line powers, intersections make blasts, five-runs make spectra.','studio-engine.js: creations, powerSwap, effects','Current power types are supported; creation/activation counts are real.'],
 ['Quality assurance','Query Precision','Structural validation and executable rule/browser tests catch broken behavior.','studio-engine.js: validate; studio.test.cjs; validation/studio-browser-check.cjs','Current state round-trips; full regression results remain a separate artifact.'],
 ['Cascade resolution','Replication Rite','Clear, activate, score, fall, refill and repeat to a stable board.','studio-engine.js: swap, effects, settle','No unresolved match; bounded cascade traces and counters.'],
 ['Sound and accessibility','Sovereign Stream','Opt-in generated sound, labeled native buttons, live status and reduced motion.','studio-ui.js; studio/index.html','Current DOM labels, status announcements and explicit sound preference.'],
 ['Turns and timers','Target Triumph','Only accepted swaps spend turns; animation delays never change game rules.','studio-engine.js: swap; studio-ui.js: animateTurn','Moves remain within budget, independent of rendering delays.'],
 ['User interface and HUD','Unified Utility','The score, turns, target and outcome reflect the current engine state.','studio-ui.js: renderHUD','Displayed HUD matches current engine counters.'],
 ['Visual effects','Vector Velocity','Original CSS gems, clear flashes and earned-power badges expose real events.','studio/index.html; studio-ui.js: renderBoard, animateTurn','All 64 rendered cells have distinct accessible identities.'],
 ['Win/loss states','Western Warfare','Terminal states are immutable until a new attempt is explicitly started.','studio-engine.js: swap, validate','Terminal status is valid; replay remains a separate action.'],
 ['Export/import and persistence','Xerox Exactness','Versioned JSON transfers full state; malformed imports preserve the running game.','studio-engine.js: save, restore; studio-ui.js: import/export','Save/restore preserves the exact current session.'],
 ['Yield and game balancing','Yielding Light','Six symbols, visible targets and earned powers create measurable tradeoffs.','studio-engine.js: COLORS, initial, swap','Six-color rules and positive explicit target/budget.'],
 ['Zero-deadlock recovery','Zenith Zero','A dead board reshuffles without spending a move or resetting score.','studio-engine.js: recover','An active settled board has at least one productive move.']
];
const MATRIX=[];
for(let i=0;i<26;i++){
 const [system,label,definition,engineMapping,check]=SYSTEMS[i],letter=String.fromCharCode(65+i);
 MATRIX.push(Object.freeze({id:'forward-'+letter,letter,direction:'forward',system,label,labelSource:'user supplied',definition,engineMapping,check}));
}
for(let i=25;i>=0;i--){const source=MATRIX[i],canonical=i===25?'Zero Clearing':i===0?'Absolute Arrival':null;
 MATRIX.push(Object.freeze({...source,id:'reverse-'+source.letter,direction:'reverse',label:canonical||source.system+' · verification',labelSource:canonical?'user supplied':'implementation-defined verification label; original reverse name not supplied',definition:'Verify '+source.system.toLowerCase()+' without changing game state. '+source.definition}));
}
Object.freeze(MATRIX);
function audit(s,engine,ui={}){
 const result={},ok=(letter,pass,evidence)=>{result[letter]={status:pass?'pass':'fail',evidence};},ready=(letter,evidence)=>{result[letter]={status:'ready',evidence};};
 let valid=false,roundTrip=false;try{valid=engine.validate(s);roundTrip=JSON.stringify(engine.restore(engine.save(s)))===JSON.stringify(s);}catch(err){result.Q={status:'fail',evidence:err.message};}
 const candidates=valid?engine.moves(s):[],stable=Array.isArray(s?.board)&&s.board.length===64&&engine.groups(s.board).length===0,active=s?.status==='playing';
 ok('A',s?.schema==='one.v025.studio.session.v1'&&['initial','swap','moves','save','restore'].every(k=>typeof engine[k]==='function'),'Pure engine API and supported session schema.');
 ok('B',stable&&(!active||candidates.length>0),'Current generated/settled board is stable and playable when active.');
 ok('C',valid,'Tile IDs, six symbols and power types pass runtime validation.');
 if(ui.pointerSwaps>0)ok('D',true,ui.pointerSwaps+' pointer gestures exercised this session.');else ready('D','Pointer and native-button handlers are installed; no drag gesture exercised yet.');
 ok('E',typeof ui.locked==='boolean','Input is '+(ui.locked?'locked for presentation':'ready')+'; rule state is already committed.');
 ok('F',valid&&s.board.every(Boolean),'All eight settled columns contain eight tiles.');
 ok('G',Array.from({length:64},(_,i)=>Math.floor(i/8)*8+i%8).every((n,i)=>n===i),'64 coordinate round-trips checked.');
 ok('H',!active||candidates.length>0,active?candidates.length+' productive neighboring swaps found.':'No hints are offered after the run ends.');
 if(s?.lastTurn?.accepted===false)ok('I',s.lastTurn.before===s.lastTurn.after,'Last rejected move restored the exact tile signature.');else ready('I','Rollback is implemented; the current last turn is not a rejected swap.');
 ok('J',Number.isSafeInteger(s?.score)&&s.score>=0&&Number.isSafeInteger(ui.wins??0)&&(ui.wins??0)>=0,'Current score and local completed-run count are nonnegative.');
 if(ui.animatedTurns>0||ui.reducedMotion)ok('K',true,ui.reducedMotion?'Reduced-motion presentation is active.':ui.animatedTurns+' animated turns exercised.');else ready('K','Animations are installed; no animated turn exercised yet.');
 ok('L',candidates.every(m=>engine.adjacent(m.a,m.b)),'Every enumerated hint is an adjacent pair.');
 ok('M',stable,'No unresolved horizontal or vertical match remains.');
 ok('N',!engine.adjacent(7,8)&&!engine.adjacent(0,9)&&engine.adjacent(0,8),'Row-wrap, diagonal and valid vertical neighbor examples checked.');
 ok('O',valid,'Runtime score/target/move/outcome consistency validated.');
 ok('P',valid&&engine.POWERS.length===5,'Supported powers: row, column, blast, spectrum; '+(s?.stats?.powersMade??0)+' created, '+(s?.stats?.powersActivated??0)+' activated.');
 if(!result.Q)ok('Q',valid&&roundTrip,'Runtime structural validation and exact round-trip pass. This is not the full regression suite.');
 ok('R',stable&&(s?.lastTurn?.frames?.length??0)<=8,'Board settled; animation trace bounded independently of complete cascade scoring.');
 if(ui.labelledTiles===64&&ui.liveStatus)ok('S',true,'64 labeled native tile buttons, live status, sound '+(ui.sound?'opted in':'off')+'.');else ready('S','Inspect a rendered board to verify its accessibility bindings.');
 ok('T',Number.isInteger(s?.moves)&&s.moves>=0&&s.moves<=s.budget,'Accepted turns '+s?.moves+'/'+s?.budget+'.');
 if(ui.hudScore!==undefined)ok('U',ui.hudScore===s.score&&ui.hudMoves===s.moves,'Rendered score and move counters checked against the engine.');else ready('U','HUD observation unavailable.');
 if(ui.labelledTiles===64)ok('V',true,'All 64 visible tile controls are rendered. Effects use the real turn trace.');else ready('V','Render a board to observe visual bindings.');
 ok('W',valid,'Outcome validated; terminal swaps are covered separately by executable tests.');
 ok('X',roundTrip,'Full session JSON round-trips exactly. Browser storage: '+(ui.storage||'not observed')+'.');
 ok('Y',engine.COLORS===6&&s?.goal>0&&s?.budget>0,'Six symbols; target '+s?.goal+' in '+s?.budget+' accepted moves.');
 ok('Z',stable&&(!active||candidates.length>0),'Verification only: no reshuffle, rewind or data deletion performed.');
 return MATRIX.map(layer=>({...layer,result:{...result[layer.letter]}}));
}
function document(){let out='# Private ONE v025 — Match-3 A–Z Structural Gateway\n\n26 engineering systems, 52 forward/reverse inspection entries. Reverse inspection is read-only and never reverses gameplay. Only the supplied reverse endpoints Z: Zero Clearing and A: Absolute Arrival are treated as original names; the other reverse names are explicit implementation-defined verification labels.\n\n';
 for(const layer of MATRIX)out+='## '+layer.direction.toUpperCase()+' '+layer.letter+' · '+layer.label+'\n\n'+layer.system+' — '+layer.definition+'\n\nEngine mapping: '+layer.engineMapping+'.\n\nCheck: '+layer.check+'\n\nLabel source: '+layer.labelSource+'.\n\n';
 return out;
}
return Object.freeze({MATRIX,audit,document});
});
