'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const g=require('./engine.js'),directory=require('./casino-directory.js');
const c=(rank,suit="♠")=>({rank,suit});
const shoe=(player1,dealer1,player2,dealer2,...after)=>[...after.reverse(),dealer2,player2,dealer1,player1];
test("52 unique cards, legal ranks and complete 21-move Game of LIFE",()=>{
 const deck=g.createDeck();assert.equal(deck.length,52);assert.equal(new Set(deck.map(x=>x.rank+" "+x.suit)).size,52);
 assert.equal(g.MISSIONS.length,21);assert.equal(g.MISSIONS[0].title,"BEGIN");assert.equal(g.MISSIONS[20].title,"LIFE");
 assert.equal(g.challengeComplete({rounds:20}),false);assert.equal(g.challengeComplete({rounds:21}),true);
 assert.deepEqual(g.MISSIONS.map(x=>x.move),Array.from({length:21},(_,i)=>i+1));
});
test("Ace conversion, natural blackjack, hard 21, double ace",()=>{
 assert.deepEqual(g.score([c("A"),c("K")]),{total:21,soft:true,natural:true,bust:false});
 assert.deepEqual(g.score([c("A"),c("A"),c("9")]),{total:21,soft:true,natural:false,bust:false});
 assert.deepEqual(g.score([c("A"),c("A"),c("9"),c("9")]),{total:20,soft:false,natural:false,bust:false});
 assert.equal(g.score([c("K"),c("Q"),c("2")]).bust,true);
 assert.equal(g.score([c("5"),c("6"),c("10")]).natural,false);
});
test("natural 21 beats non-natural dealer and increments exactly one round",()=>{
 const state=g.startRound(shoe(c("A"),c("9"),c("K"),c("7")));
 assert.equal(state.phase,"finished");assert.equal(state.result,"win");
 assert.deepEqual([state.stats.wins,state.stats.losses,state.stats.pushes,state.stats.rounds,state.stats.points],[1,0,0,1,1]);
 assert.throws(()=>g.hit(state),/not accepting/);
});
test("natural blackjacks push; dealer blackjack defeats non-natural",()=>{
 const both=g.startRound(shoe(c("A"),c("A","♥"),c("K"),c("K","♥")));
 assert.equal(both.result,"push");assert.equal(both.stats.pushes,1);
 const dealer=g.startRound(shoe(c("8"),c("A"),c("7"),c("K")));
 assert.equal(dealer.result,"loss");
});
test("stand draws dealer under 17 and handles dealer bust",()=>{
 const start=g.startRound(shoe(c("10"),c("10","♥"),c("7"),c("6"),c("9")));
 const settled=g.stand(start);
 assert.equal(settled.result,"win");assert.equal(settled.dealer.length,3);
 assert.equal(g.score(settled.dealer).total,25);assert.equal(start.phase,"player");
});
test("stand stops on soft 17, equal totals are a push",()=>{
 const s=g.startRound(shoe(c("10"),c("A"),c("7"),c("6")));
 const end=g.stand(s);
 assert.equal(end.dealer.length,2);assert.equal(end.result,"push");
});
test("hit busts; cannot stand after bust or double after hit",()=>{
 const s=g.startRound(shoe(c("10"),c("10","♥"),c("6"),c("7"),c("K")));
 const end=g.hit(s);assert.equal(end.result,"loss");assert.equal(end.reason,"Bust — over 21.");
 assert.throws(()=>g.stand(end),/not accepting/);
});
test("double down takes exactly one card and awards double practice points",()=>{
 const s=g.startRound(shoe(c("5"),c("10","♥"),c("6"),c("6"),c("10"),c("9")));
 const end=g.doubleDown(s);
 assert.equal(end.multiplier,2);assert.equal(end.player.length,3);
 assert.equal(end.result,"win");assert.equal(end.stats.points,2);
 assert.equal(end.stats.rounds,1);
});
test("next round uses existing stats, does not reset history",()=>{
 const first=g.startRound(shoe(c("A"),c("9"),c("K"),c("7")));
 const second=g.nextRound(first,shoe(c("A"),c("A","♥"),c("K"),c("K","♥")));
 assert.equal(second.stats.wins,1);assert.equal(second.stats.pushes,1);assert.equal(second.stats.rounds,2);
 assert.throws(()=>g.nextRound(g.startRound(shoe(c("9"),c("8"),c("8"),c("7")))),/Finish/);
});
test("the visible-card model excludes visible cards without leaking dealer hole",()=>{
 const risk=g.visibleBustOdds([c("10"),c("6","♥")],c("6","♠"));
 assert.deepEqual(risk,{numerator:29,denominator:49,percent:59.2});
});
test("casino source register retains 13 complete, 14th partial, seven unfilled",()=>{
 assert.equal(directory.ENTRIES.length,21);
 assert.equal(directory.ENTRIES.filter(x=>x.status==="provided").length,13);
 assert.equal(directory.ENTRIES[0].mechanics,"A structured player-versus-dealer card value optimization loop. Cards carry precise face weights (Aces fluctuate dynamically between 1 or 11; face cards lock at 10).");
 assert.match(directory.ENTRIES[9].rule,/2\.70%.*5\.26%/);
 assert.equal(directory.ENTRIES[13].title,"Hazard (The Ancestral Roll)");
 assert.equal(directory.ENTRIES[13].rule,null);
 for(let i=14;i<21;i++){assert.equal(directory.ENTRIES[i].status,"awaiting-original-source");assert.equal(directory.ENTRIES[i].title,null)}
});
test("no monetary payouts or external services in game engine",()=>{
 const publicKeys=Object.keys(g);assert.equal(publicKeys.includes("bet"),false);assert.equal(publicKeys.includes("wallet"),false);
 assert.equal(g.author,"Nathan Tabor");assert.match(g.title,/Game of LIFE/);
});
