/* BLACKJACK!!! — The Way to WIN the Game of LIFE by Nathan Tabor
 * Standalone, offline practice game. Not BlackjackSync or an authentication system.
 * No money, chips redeemable for value, banking, probability manipulation, or guaranteed wins.
 */
(function(root){"use strict";
const SUITS=Object.freeze(["♠","♥","♦","♣"]);
const RANKS=Object.freeze(["A","2","3","4","5","6","7","8","9","10","J","Q","K"]);
const MISSIONS=Object.freeze([
["BEGIN","Start with 0 and 1. One decision starts a path."],
["BUILD","1+1=2 — build from what you know."],
["CLEAR","1−1=0 — clear a move without deleting the record."],
["TRUTH","Yes is Yes — No is No. Choose what is clear."],
["CHOICE","Decide before seeing the next card."],
["CONSENT","Respect a person's right to choose."],
["BOUNDARY","A limit protects the game and the player."],
["INNOCENCE","Protect innocence without harming people."],
["COURAGE","Act with purpose, not certainty."],
["HUMILITY","One win is not mastery; one loss is not identity."],
["KNOWLEDGE","Learn the rule before making the move."],
["PATIENCE","Standing can be a deliberate decision."],
["RISK","Know that chance is not a promise."],
["ACCOUNTABILITY","Keep the result; learn from it."],
["MERCY","Treat other people with dignity."],
["JUSTICE","Seek fair rules and consistent treatment."],
["SERVICE","Use the outcome to help, not to dominate."],
["REST","When the hand ends, pause before the next."],
["REBUILD","Return to 1+1=2 without erasing the past."],
["REVIEW","Look at every decision, not just the score."],
["LIFE","WIN means finish the journey with agency, truth, and care."]
].map(([title,lesson],i)=>Object.freeze({move:i+1,title,lesson,kind:"new game adaptation; not a verbatim quote unless otherwise identified"})));
const DEFAULT_STATS=Object.freeze({wins:0,losses:0,pushes:0,points:0,rounds:0});
function createDeck(){return SUITS.flatMap(suit=>RANKS.map(rank=>({suit,rank})))}
function shuffle(deck,random=Math.random){
 const a=deck.map(c=>({suit:c.suit,rank:String(c.rank)}));
 for(let i=a.length-1;i>0;i--){let r=random();if(!(r>=0&&r<1))throw RangeError("Random must be in [0,1)");const j=Math.floor(r*(i+1));[a[i],a[j]]=[a[j],a[i]]}
 return a
}
function value(card){if(card.rank==="A")return 1;if(["J","Q","K"].includes(card.rank))return 10;const n=Number(card.rank);if(!Number.isInteger(n)||n<2||n>10)throw RangeError("Invalid card");return n}
function score(cards){
 let total=0,aces=0;
 for(const c of cards){total+=value(c);if(c.rank==="A")aces++}
 let soft=false;if(aces>0&&total+10<=21){total+=10;soft=true}
 return {total,soft,natural:cards.length===2&&total===21,bust:total>21}
}
function take(shoe){const card=shoe.pop();if(!card)throw Error("Empty shoe");return card}
function defaultStats(stats={}){return {...DEFAULT_STATS,...stats}}
function settle(session,result,reason){
 const stats={...session.stats,rounds:session.stats.rounds+1};
 if(result==="win"){stats.wins++;stats.points+=session.multiplier}
 if(result==="loss"){stats.losses++;stats.points-=session.multiplier}
 if(result==="push")stats.pushes++;
 return {...session,phase:"finished",result,reason,stats}
}
function startRound(shoe=shuffle(createDeck()),stats=DEFAULT_STATS){
 const deck=shoe.map(c=>({...c})),player=[],dealer=[];
 player.push(take(deck));dealer.push(take(deck));player.push(take(deck));dealer.push(take(deck));
 const state={deck,player,dealer,phase:"player",result:null,reason:"Hit, stand or double down.",multiplier:1,stats:defaultStats(stats)};
 const p=score(player),d=score(dealer);
 if(p.natural&&d.natural)return settle(state,"push","Both have a natural blackjack.");
 if(p.natural)return settle(state,"win","BLACKJACK! Natural 21.");
 if(d.natural)return settle(state,"loss","Dealer has a natural blackjack.");
 return state
}
function assertActive(s){if(s.phase!=="player")throw Error("Round is not accepting moves")}
function hit(s){
 assertActive(s);const state={...s,deck:[...s.deck],player:[...s.player],dealer:[...s.dealer]};
 state.player.push(take(state.deck));const p=score(state.player);
 if(p.bust)return settle(state,"loss","Bust — over 21.");
 if(p.total===21)return stand(state);
 return {...state,reason:"Card drawn. Hit or stand."}
}
function stand(s){
 assertActive(s);
 const state={...s,deck:[...s.deck],player:[...s.player],dealer:[...s.dealer]};
 const p=score(state.player);
 if(p.bust)return settle(state,"loss","Bust — over 21.");
 while(score(state.dealer).total<17)state.dealer.push(take(state.deck)); // Dealer stands on soft 17.
 const d=score(state.dealer);
 if(d.bust)return settle(state,"win","Dealer busts.");
 if(p.total>d.total)return settle(state,"win","Your total beats the dealer.");
 if(p.total<d.total)return settle(state,"loss","Dealer total is higher.");
 return settle(state,"push","Equal totals — push.")
}
function doubleDown(s){
 assertActive(s);if(s.player.length!==2)throw Error("Double down only on your first two cards.");
 const state={...s,deck:[...s.deck],player:[...s.player],dealer:[...s.dealer],multiplier:2};
 state.player.push(take(state.deck));
 if(score(state.player).bust)return settle(state,"loss","Double down bust.");
 return stand(state)
}
function nextRound(s,shoe=shuffle(createDeck())){if(s.phase!=="finished")throw Error("Finish the round first");return startRound(shoe,s.stats)}
function lifeMove(stats){return MISSIONS[Math.min(Math.max(stats.rounds,0),MISSIONS.length-1)]}
function challengeComplete(stats){return stats.rounds>=21}
function visibleBustOdds(cards,upcard){
 const seen=[...cards,upcard];
 const counts=new Map();
 for(const c of createDeck()){const k=c.suit+":"+c.rank;counts.set(k,(counts.get(k)||0)+1)}
 for(const c of seen){const k=c.suit+":"+c.rank;const remaining=counts.get(k)||0;if(!remaining)throw Error("Invalid visible cards");counts.set(k,remaining-1)}
 let busts=0,remaining=0;
 for(const c of createDeck()){const n=counts.get(c.suit+":"+c.rank)||0;remaining+=n;if(score([...cards,c]).bust)busts+=n}
 return remaining?{numerator:busts,denominator:remaining,percent:Math.round(1000*busts/remaining)/10}:{numerator:0,denominator:0,percent:0}
}
const API=Object.freeze({title:"BLACKJACK!!! — The Way to WIN the Game of LIFE",author:"Nathan Tabor",SUITS,RANKS,MISSIONS,DEFAULT_STATS,createDeck,shuffle,value,score,startRound,hit,stand,doubleDown,nextRound,lifeMove,challengeComplete,visibleBustOdds});
root.NathanBlackjackLife=API;
if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof globalThis!=="undefined"?globalThis:this);
