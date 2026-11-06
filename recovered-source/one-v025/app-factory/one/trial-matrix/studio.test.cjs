'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const e=require('./studio-engine.js'),az=require('./architecture.js');
function fixture(){const s=e.initial(123);s.board.forEach((t,i)=>{t.value=(Math.floor(i/8)*2+i%8)%6;t.power=null;});s.lastTurn=null;return s;}
function firstFrame(s){assert.ok(s.lastTurn.accepted);return s.lastTurn.frames[0];}
test('Studio generation is seeded, stable, legal and six-color across 50 seeds',()=>{
 for(let seed=0;seed<50;seed++){const s=e.initial(seed);assert.deepEqual(s,e.initial(seed));assert.equal(s.board.length,64);assert.equal(new Set(s.board.map(t=>t.id)).size,64);assert.equal(e.groups(s.board).length,0);assert.ok(e.moves(s).length);assert.equal(e.validate(s),true);}
});
test('all 64 cells use Manhattan neighbors without row wrap or diagonals',()=>{
 assert.equal(e.adjacent(7,8),false);assert.equal(e.adjacent(0,9),false);assert.equal(e.adjacent(0,8),true);assert.equal(e.adjacent(63,64),false);assert.equal(e.adjacent(4,4),false);assert.equal(e.adjacent(1.1,2.1),false);
});
test('an invalid swap restores IDs, colors, powers, RNG, score and moves exactly',()=>{
 const s=fixture(),before=structuredClone(s);assert.equal(e.swap(s,0,1),false);assert.deepEqual(s.board,before.board);assert.equal(s.randomState,before.randomState);assert.equal(s.moves,0);assert.equal(s.score,0);assert.equal(s.lastTurn.before,s.lastTurn.after);assert.equal(s.stats.invalid,1);
 assert.equal(e.swap(s,7,8),false);assert.equal(s.moves,0);
});
test('a four-run earns an oriented line power and protects its creation tile',()=>{
 const s=fixture();for(const i of [24,25,27,18])s.board[i].value=2;s.board[26].value=1;
 assert.equal(e.groups(s.board).length,0);assert.equal(e.swap(s,18,26),true);const f=firstFrame(s);assert.deepEqual(f.created.find(p=>p.slot===26),{slot:26,power:'row'});assert.ok(!f.cleared.includes(26));assert.ok(s.stats.powersMade>=1);assert.equal(e.validate(s),true);
});
test('a five-run earns a spectrum instead of a line power',()=>{
 const s=fixture();for(const i of [24,25,27,28,18])s.board[i].value=3;s.board[26].value=1;
 e.swap(s,18,26);assert.ok(firstFrame(s).created.some(p=>p.power==='spectrum'));assert.equal(e.validate(s),true);
});
test('a T/L intersection earns a blast at the intersection',()=>{
 const s=fixture();for(const i of [25,26,19,35,28])s.board[i].value=4;s.board[27].value=1;
 assert.equal(e.groups(s.board).length,0);e.swap(s,28,27);assert.ok(firstFrame(s).created.some(p=>p.slot===27&&p.power==='blast'));assert.equal(e.validate(s),true);
});
test('row and column powers clear their entire actual lane',()=>{
 for(const [power,a,b,indices] of [['row',0,1,Array.from({length:8},(_,i)=>i)],['column',0,8,Array.from({length:8},(_,i)=>i*8)]]){const s=fixture();s.board[a].power=power;e.swap(s,a,b);const frame=firstFrame(s);assert.ok(indices.every(i=>frame.cleared.includes(i)));assert.ok(frame.activated.some(p=>p.power===power));assert.equal(e.validate(s),true);}
});
test('a corner blast clips its 3×3 footprint at the board edge',()=>{
 const s=fixture();s.board[0].power='blast';e.swap(s,0,1);assert.deepEqual(firstFrame(s).cleared.slice().sort((a,b)=>a-b),[0,1,2,8,9,10]);
});
test('spectrum + normal clears the chosen symbol, not an unrelated frequent symbol',()=>{
 const s=fixture();s.board[0].power='spectrum';const expected=new Set([0,1]);s.board.forEach((t,i)=>{if(i!==0&&i!==1&&t.value===s.board[1].value)expected.add(i);});
 e.swap(s,0,1);assert.deepEqual(new Set(firstFrame(s).cleared),expected);assert.equal(e.validate(s),true);
});
test('spectrum + spectrum clears all 64 cells once; each power activates once',()=>{
 const s=fixture();s.board[0].power=s.board[1].power='spectrum';e.swap(s,0,1);const f=firstFrame(s);assert.equal(f.cleared.length,64);assert.equal(new Set(f.cleared).size,64);assert.equal(f.activated.length,2);assert.equal(e.validate(s),true);
});
test('spectrum + row power converts the symbol and chains across the board',()=>{
 const s=fixture();s.board[0].power='spectrum';s.board[1].power='row';e.swap(s,0,1);const f=firstFrame(s);assert.equal(f.cleared.length,64);assert.ok(f.activated.filter(p=>p.power==='row').length>1);assert.equal(e.validate(s),true);
});
test('power + power combines both lanes and gravity preserves survivors’ order',()=>{
 const s=fixture();s.board[0].power='row';s.board[1].power='column';const before=structuredClone(s.board);e.swap(s,0,1);const f=firstFrame(s);assert.equal(f.cleared.length,15);assert.equal(f.activated.length,2);
 for(let c=1;c<8;c++)for(let r=1;r<8;r++)assert.equal(f.after[r*8+c].id,before[r*8+c].id,'unremoved column survivors retain order');
});
test('legal-move analysis is non-destructive and never reads future random state',()=>{
 for(let seed=0;seed<10;seed++){const s=e.initial(seed),before=structuredClone(s),moves=e.moves(s);assert.deepEqual(s,before);s.randomState^=12345;assert.deepEqual(e.moves(s),moves);}
});
test('dead-board recovery keeps score, budget, moves, tile IDs and powers',()=>{
 const s=fixture();assert.equal(e.groups(s.board).length,0);assert.equal(e.moves(s).length,0);const ids=s.board.map(t=>t.id).sort((a,b)=>a-b);s.score=100;
 assert.equal(e.recover(s),true);assert.equal(s.score,100);assert.equal(s.moves,0);assert.equal(s.budget,30);assert.deepEqual(s.board.map(t=>t.id).sort((a,b)=>a-b),ids);assert.ok(e.moves(s).length);assert.equal(e.groups(s.board).length,0);assert.equal(e.validate(s),true);
});
test('25 full seeded runs finish with genuine score targets and exact per-turn save/restore',()=>{
 let wins=0;for(let seed=0;seed<25;seed++){const s=e.initial(seed);while(s.status==='playing'){const hint=e.moves(s)[0];assert.ok(e.swap(s,hint.a,hint.b));assert.equal(e.groups(s.board).length,0);assert.deepEqual(e.restore(e.save(s)),s);}
  if(s.status==='won'){wins++;assert.ok(s.score>=s.goal);}else{assert.equal(s.moves,s.budget);assert.ok(s.score<s.goal);}
  const final=structuredClone(s);assert.equal(e.swap(s,0,1),false);assert.deepEqual(s,final);
 }assert.ok(wins>=20,'greedy visible-board solver wins most seeds without guaranteeing every run');
});
test('loss and last-move win follow score-first outcome ordering',()=>{
 const fail=e.initial(123,{goal:1000000,budget:1}),h=e.moves(fail)[0];e.swap(fail,h.a,h.b);assert.equal(fail.status,'failed');assert.equal(fail.moves,1);
 const win=e.initial(123,{goal:1,budget:1}),p=e.moves(win)[0];e.swap(win,p.a,p.b);assert.equal(win.status,'won');assert.equal(win.moves,1);
});
test('malformed saves reject invalid IDs, colors, powers, outcomes and animation traces',()=>{
 for(const mutate of [s=>{s.board[0].id=s.board[1].id;},s=>{s.board[0].value=9;},s=>{s.board[0].power='fake';},s=>{s.status='won';},s=>{s.budget=-1;}]){const payload=e.save(e.initial(123));mutate(payload.session);assert.throws(()=>e.restore(payload));}
 const played=e.initial(123),h=e.moves(played)[0];e.swap(played,h.a,h.b);const payload=e.save(played);payload.session.lastTurn.frames[0].created='bad';assert.throws(()=>e.restore(payload));
});
test('architecture has exactly 26 forward and 26 reverse entries with supplied endpoint provenance',()=>{
 assert.equal(az.MATRIX.length,52);assert.equal(new Set(az.MATRIX.map(l=>l.id)).size,52);assert.equal(az.MATRIX.filter(l=>l.direction==='forward').length,26);assert.equal(az.MATRIX[0].label,'Alpha Foundation');assert.equal(az.MATRIX[25].label,'Zenith Zero');assert.equal(az.MATRIX[26].label,'Zero Clearing');assert.equal(az.MATRIX.at(-1).label,'Absolute Arrival');assert.equal(az.MATRIX.filter(l=>l.labelSource.startsWith('implementation-defined')).length,24);
});
test('all 52 live inspection results are read-only and distinguish observed checks from unexercised features',()=>{
 const s=e.initial(123),before=structuredClone(s),ui={locked:false,labelledTiles:64,liveStatus:true,hudScore:s.score,hudMoves:s.moves,storage:'available',wins:0};const results=az.audit(s,e,ui);assert.deepEqual(s,before);assert.equal(results.length,52);assert.ok(!results.some(l=>l.result.status==='fail'));assert.equal(results.find(l=>l.id==='forward-D').result.status,'ready');assert.equal(results.find(l=>l.id==='forward-Q').result.status,'pass');
 for(const forward of results.filter(l=>l.direction==='forward'))assert.deepEqual(forward.result,results.find(l=>l.id==='reverse-'+forward.letter).result);
 const dead=fixture(),copy=structuredClone(dead);const reverse=az.audit(dead,e,ui).filter(l=>l.direction==='reverse');assert.equal(reverse.find(l=>l.letter==='Z').result.status,'fail');assert.deepEqual(dead,copy,'reverse verification must not reshuffle a dead board');
});
test('blueprint preserves every named engineering system and reverse provenance',()=>{
 const doc=az.document();for(const row of az.MATRIX){assert.ok(doc.includes(row.label));assert.ok(doc.includes(row.engineMapping));}assert.match(doc,/never reverses gameplay/);assert.match(doc,/implementation-defined/);
});
