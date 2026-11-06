/* Settlement and economy orchestrator. Local-only, transactional dispatch. */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports,api=factory(node?require('./catalog.js'):root.RealmCatalog,node?require('./combat.js'):root.RealmCombat,node?require('./tabor.js'):root.TaborDecimal);if(node)module.exports=api;else root.RealmWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C,B,T){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),KEY='one.private.v025.realm.v1';
function initial(at=Date.now()){
 if(!Number.isSafeInteger(at)||at<0)throw Error('Invalid settlement time');
 return {schema:'one.v025.realm.world.v1',tabor:T.policy(),resources:{food:500,iron:400,insight:10,relics:2},buildings:Object.fromEntries(C.BUILDINGS.map(b=>[b.id,1])),production:{farm:{at,carry:0},mine:{at,carry:0}},heroes:Object.fromEntries(C.HEROES.filter(h=>!h.unlock).map(h=>[h.id,{level:1,talent:null}])),team:C.HEROES.slice(0,5).map(h=>h.id),troops:[1,1,1,1,1],items:{heal:3,mana:2,volley:2},completed:[],records:{},nextRun:1,battle:null,lastOutcome:null,inbox:[],nextInbox:1,lastVisitAt:at,onboarding:{step:0,done:false},blueprint:{name:'Raiding pack',counts:{heal:10,mana:5,volley:0}},preferences:{contrast:false,notifications:false,auto:{boss:true,lowest:true,central:false}}};
}
function capacity(w){return T.ceiling(w.buildings.store*1000,w.tabor).spendable;}
function retention(w,key,incoming){return T.absorb(w.resources[key],incoming,w.buildings.store*1000,w.tabor);}
function production(w,id,at){if(!['farm','mine'].includes(id)||!Number.isSafeInteger(at)||at<0)throw Error('Invalid production request');const p=w.production[id],elapsed=Math.max(0,Math.min(12*3600000,at-p.at)),rate=w.buildings[id]*(id==='farm'?60:45),units=p.carry+elapsed*rate/3600000;return {earned:Math.floor(units),carry:units-Math.floor(units),at:Math.max(p.at,at),rate};}
function overflow(w,food,iron,at,reason){if(!food&&!iron)return;const box={id:w.nextInbox++,food,iron,expiresAt:at+48*3600000,reason};if(w.inbox.length>=200){const old=w.inbox.shift();box.food+=old.food;box.iron+=old.iron;box.expiresAt=Math.max(box.expiresAt,old.expiresAt);}w.inbox.push(box);}
function collect(w,at){let total=0,extra={food:0,iron:0};for(const id of ['farm','mine']){const p=production(w,id,at),resource=id==='farm'?'food':'iron';const receipt=retention(w,resource,p.earned);w.resources[resource]=receipt.retained;extra[resource]=receipt.diverted;w.production[id]={at:p.at,carry:p.carry};total+=p.earned;}overflow(w,extra.food,extra.iron,at,'Production');return total;}
function claimInbox(w){for(const box of w.inbox)for(const key of ['food','iron']){const receipt=retention(w,key,box[key]);w.resources[key]=receipt.retained;box[key]=receipt.diverted;}w.inbox=w.inbox.filter(b=>b.food||b.iron);}
function blueprintCost(w,counts){const discount=1-(w.buildings.forge-1)*.1;return {food:Object.entries(counts).reduce((n,[id,count])=>n+Math.ceil(C.ITEMS[id].food*discount)*count,0),iron:Object.entries(counts).reduce((n,[id,count])=>n+Math.ceil(C.ITEMS[id].iron*discount)*count,0)};}
function buildingCost(w,id){const level=w.buildings[id];if(!level)throw Error('Unknown building');return {food:60*level*level,iron:45*level*level};}
function heroCost(w,id){const h=w.heroes[id];if(!h)throw Error('Hero is not recruited');const next=h.level+1;return {food:25*next,iron:0,insight:1,relics:next===4?1:next===7?2:0};}
function canAfford(w,cost){return T.fold(Object.entries(cost).map(([key,n])=>w.resources[key]>=n?1:0),'REQUIRE_AND')===1;}
function spend(w,cost){if(!canAfford(w,cost))throw Error('Earn more resources on expeditions or collect production.');for(const [key,n] of Object.entries(cost))w.resources[key]-=n;}
function party(w){return w.team.map(id=>{const template=C.HEROES.find(h=>h.id===id),stats=C.stats(template,w.heroes[id],w.troops[template.element],w.tabor?.segmentBps??null);return {id,element:template.element,attack:stats.attack,maxHealth:stats.health,maxMana:template.mana};});}
function reward(stage,first){return {food:first?90+stage*5:35+stage*2,iron:first?65+stage*3:25+stage,insight:first?3:1,relics:first?([11,22,33].includes(stage)?3:1):0};}
function finish(w,at){const battle=w.battle;if(!battle||battle.status==='playing')return;const won=battle.status==='won',first=won&&!w.completed.includes(battle.stage),earned=won?reward(battle.stage,first):{food:0,iron:0,insight:0,relics:0},credited={...earned},excess={food:0,iron:0},unlocked=[];
 for(const [id,n] of Object.entries(battle.items))w.items[id]=Math.min(20,w.items[id]+n);
 if(won){for(const [key,n] of Object.entries(earned)){const accepted=['food','iron'].includes(key)?retention(w,key,n).accepted:n;w.resources[key]+=accepted;credited[key]=accepted;if(key in excess)excess[key]=n-accepted;}
  if(first){w.completed.push(battle.stage);w.completed.sort((a,b)=>a-b);}const old=w.records[battle.stage];w.records[battle.stage]={wins:(old?.wins||0)+1,bestTurns:Math.min(old?.bestTurns??Infinity,battle.turn),bestScore:Math.max(old?.bestScore||0,battle.score)};
  for(const h of C.HEROES)if(h.unlock&&w.completed.includes(h.unlock)&&!w.heroes[h.id]){w.heroes[h.id]={level:1,talent:null};unlocked.push(h.id);}
 }
 overflow(w,excess.food,excess.iron,at,'Expedition '+battle.stage);w.lastOutcome={run:battle.id,stage:battle.stage,won,first,turns:battle.turn,score:battle.score,earned:credited,overflow:excess,unlocked,replay:{config:battle.config,actions:battle.actions,claimedState:clone(battle)}};w.battle=null;
}
function apply(w,a,at){
 if(!a||typeof a.type!=='string')throw Error('Unknown settlement action');
 if(a.type==='battle-action'){if(!w.battle)throw Error('No active expedition');if(!B.action(w.battle,a.action))throw Error('That action is not available. Normal swaps must make a match.');finish(w,at);return;}
 if(a.type==='abandon'){if(!w.battle)throw Error('No active expedition');B.action(w.battle,{type:'flee'});finish(w,at);return;}
 if(a.type==='preferences'){if(a.contrast!==undefined)w.preferences.contrast=a.contrast;if(a.notifications!==undefined)w.preferences.notifications=a.notifications;if(a.auto)w.preferences.auto={...w.preferences.auto,...a.auto};return;}
 if(w.battle)throw Error('Finish or abandon the current expedition before changing the settlement.');
 if(a.type==='tabor-policy'){w.tabor=T.validatePolicy(a.policy);const cap=capacity(w),food=Math.max(0,w.resources.food-cap),iron=Math.max(0,w.resources.iron-cap);w.resources.food-=food;w.resources.iron-=iron;overflow(w,food,iron,at,'Tabor capacity adjustment');return;}
 if(a.type==='collect'){collect(w,at);return;}
 if(a.type==='claim-inbox'){claimInbox(w);return;}
 if(a.type==='welcome'){collect(w,at);claimInbox(w);return;}
 if(a.type==='tutorial-step'){w.onboarding.step=Math.min(3,w.onboarding.step+1);w.onboarding.done=w.onboarding.step===3;return;}
 if(a.type==='skip-tutorial'){w.onboarding={step:3,done:true};return;}
 if(a.type==='blueprint'){if(!a.name||typeof a.name!=='string'||a.name.length>40||!a.counts||Object.keys(a.counts).length!==3||!Object.keys(C.ITEMS).every(k=>Number.isInteger(a.counts[k])&&a.counts[k]>=0&&a.counts[k]<=20)||!Object.values(a.counts).some(Boolean))throw Error('Choose a name and between 1 and 20 of at least one item');w.blueprint={name:a.name,counts:{...a.counts}};return;}
 if(a.type==='craft-pack'){const counts=w.blueprint.counts;if(!Object.entries(counts).every(([id,n])=>w.items[id]+n<=20))throw Error('The full pack must fit; each item can hold at most 20');spend(w,blueprintCost(w,counts));for(const [id,n] of Object.entries(counts))w.items[id]+=n;return;}
 if(a.type==='upgrade-building'){
  if(!C.BUILDINGS.some(b=>b.id===a.id))throw Error('Unknown building');const level=w.buildings[a.id];if(level>=5)throw Error('Building is fully upgraded');if(a.id!=='keep'&&level>=w.buildings.keep)throw Error('Upgrade Rootkeep first');
  const cost=buildingCost(w,a.id);if(!canAfford(w,cost))throw Error('Earn more resources before upgrading');collect(w,at);spend(w,cost);w.buildings[a.id]++;return;
 }
 if(a.type==='train-hero'){
  const h=w.heroes[a.id];if(!h||h.level>=10)throw Error('Hero cannot train further');const next=h.level+1;if(next===4&&w.buildings.academy<2||next===7&&w.buildings.academy<3)throw Error('Upgrade the Memory Academy before ascension');spend(w,heroCost(w,a.id));h.level++;return;
 }
 if(a.type==='train-party'){const eligible=w.team.filter(id=>w.heroes[id].level<10&&(w.heroes[id].level!==3||w.buildings.academy>=2)&&(w.heroes[id].level!==6||w.buildings.academy>=3));if(!eligible.length)throw Error('No equipped hero can train');const cost=eligible.reduce((total,id)=>{for(const [key,n] of Object.entries(heroCost(w,id)))total[key]=(total[key]||0)+n;return total;},{});spend(w,cost);eligible.forEach(id=>{w.heroes[id].level++;});return;}
 if(a.type==='talent'){const h=w.heroes[a.id];if(!h||h.level<5||!['force','guard'].includes(a.talent))throw Error('Talents open at hero level 5');h.talent=a.talent;return;}
 if(a.type==='equip'){const h=C.HEROES.find(h=>h.id===a.id);if(!h||!w.heroes[h.id])throw Error('Hero is not recruited');w.team[h.element]=h.id;return;}
 if(a.type==='train-troop'){if(!Number.isInteger(a.element)||a.element<0||a.element>4)throw Error('Unknown troop element');const level=w.troops[a.element];if(level>=5||level>=w.buildings.barracks+1)throw Error('Upgrade the barracks to train this troop');spend(w,{iron:50*level,insight:1});w.troops[a.element]++;return;}
 if(a.type==='craft'){const recipe=C.ITEMS[a.item];if(!recipe||w.items[a.item]>=20)throw Error('Item cannot be crafted');const discount=1-(w.buildings.forge-1)*.1;spend(w,{food:Math.ceil(recipe.food*discount),iron:Math.ceil(recipe.iron*discount)});w.items[a.item]++;return;}
 if(a.type==='start'){
  if(!Number.isInteger(a.stage)||a.stage<1||a.stage>33)throw Error('Choose a stage from 1 to 33');const packed={};for(const key of Object.keys(C.ITEMS)){packed[key]=Math.min(2,w.items[key]);w.items[key]-=packed[key];}const seed=a.seed??C.STAGES[a.stage-1].seed;w.battle=B.initial(a.stage,party(w),seed,w.nextRun++,packed);w.lastOutcome=null;return;
 }
 throw Error('Unknown settlement action');
}
function validate(w){
 if(w?.tabor!==undefined)T.validatePolicy(w.tabor);
 const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 if(!w||w.schema!=='one.v025.realm.world.v1'||!w.resources||!['food','iron','insight','relics'].every(k=>integer(w.resources[k],0,1e9))||Object.keys(w.resources).length!==4)throw Error('Invalid settlement resources');
 if(!w.buildings||Object.keys(w.buildings).length!==7||!C.BUILDINGS.every(b=>integer(w.buildings[b.id],1,5)&&w.buildings[b.id]<=w.buildings.keep)||w.resources.food>capacity(w)||w.resources.iron>capacity(w))throw Error('Invalid settlement buildings/storage');
 for(const id of ['farm','mine']){const p=w.production?.[id];if(!p||!integer(p.at,0,Number.MAX_SAFE_INTEGER)||!Number.isFinite(p.carry)||p.carry<0||p.carry>=1)throw Error('Invalid production clock');}
 if(!w.heroes||typeof w.heroes!=='object'||Array.isArray(w.heroes)||Object.keys(w.heroes).length>10)throw Error('Invalid roster');
 for(const [id,h] of Object.entries(w.heroes))if(!C.HEROES.some(x=>x.id===id)||!h||!integer(h.level,1,10)||![null,'force','guard'].includes(h.talent)||h.talent&&h.level<5||h.level>=4&&w.buildings.academy<2||h.level>=7&&w.buildings.academy<3)throw Error('Invalid hero progression');
 if(!C.HEROES.slice(0,5).every(h=>w.heroes[h.id])||!Array.isArray(w.team)||w.team.length!==5||!w.team.every((id,i)=>w.heroes[id]&&C.HEROES.find(h=>h.id===id)?.element===i))throw Error('Invalid equipped party');
 if(!Array.isArray(w.troops)||w.troops.length!==5||!w.troops.every(x=>integer(x,1,5)&&x<=w.buildings.barracks+1)||!w.items||Object.keys(w.items).length!==3||!Object.keys(C.ITEMS).every(k=>integer(w.items[k],0,20)))throw Error('Invalid support inventory');
 if(!Array.isArray(w.completed)||w.completed.length>33||new Set(w.completed).size!==w.completed.length||!w.completed.every(x=>integer(x,1,33))||!w.records||Array.isArray(w.records)||Object.keys(w.records).length!==w.completed.length)throw Error('Invalid expedition progress');
 for(const stage of Object.keys(w.records)){const record=w.records[stage];if(!/^(?:[1-9]|[12][0-9]|3[0-3])$/.test(stage)||!w.completed.includes(Number(stage))||!record||!integer(record.wins,1,1e9)||!integer(record.bestTurns,0,60)||!integer(record.bestScore,0,1e9))throw Error('Invalid expedition record');}
 for(const hero of C.HEROES.filter(h=>h.unlock))if(!!w.heroes[hero.id]!==w.completed.includes(hero.unlock))throw Error('Invalid earned recruitment');
 if(!integer(w.nextRun,1,1e9))throw Error('Invalid expedition counter');
 if(!integer(w.nextInbox,1,1e9)||!integer(w.lastVisitAt,0,Number.MAX_SAFE_INTEGER)||!Array.isArray(w.inbox)||w.inbox.length>200||new Set(w.inbox.map(b=>b.id)).size!==w.inbox.length||!w.inbox.every(b=>integer(b.id,1,w.nextInbox-1)&&integer(b.food,0,1e9)&&integer(b.iron,0,1e9)&&(b.food||b.iron)&&integer(b.expiresAt,0,Number.MAX_SAFE_INTEGER)&&typeof b.reason==='string'&&b.reason.length<100))throw Error('Invalid overflow inbox');
 if(!w.onboarding||!integer(w.onboarding.step,0,3)||w.onboarding.done!==(w.onboarding.step===3)||!w.preferences||typeof w.preferences.contrast!=='boolean'||typeof w.preferences.notifications!=='boolean'||!w.preferences.auto||!['boss','lowest','central'].every(k=>typeof w.preferences.auto[k]==='boolean'))throw Error('Invalid onboarding or preferences');
 if(!w.blueprint||typeof w.blueprint.name!=='string'||w.blueprint.name.length<1||w.blueprint.name.length>40||!w.blueprint.counts||Object.keys(w.blueprint.counts).length!==3||!Object.keys(C.ITEMS).every(k=>integer(w.blueprint.counts[k],0,20))||!Object.values(w.blueprint.counts).some(Boolean))throw Error('Invalid crafting blueprint');
 if(w.battle!==null){const b=B.validate(w.battle);if(b.status!=='playing'||b.id!==w.nextRun-1||!Object.values(b.config.items).every(n=>n<=2))throw Error('Unsettled expedition');const expected=party(w);if(!b.heroes.every((h,i)=>['id','element','attack','maxHealth','maxMana'].every(key=>h[key]===expected[i][key])))throw Error('Battle loadout differs from roster');}
 if(w.lastOutcome!==null){const x=w.lastOutcome;if(!x||!integer(x.run,1,w.nextRun-1)||!integer(x.stage,1,33)||typeof x.won!=='boolean'||typeof x.first!=='boolean'||x.first&&!x.won||!integer(x.turns,0,60)||!integer(x.score,0,1e9)||!x.earned||!['food','iron','insight','relics'].every(k=>integer(x.earned[k],0,1000))||!x.overflow||!['food','iron'].every(k=>integer(x.overflow[k],0,1000))||!Array.isArray(x.unlocked)||x.unlocked.length>5||!x.unlocked.every(id=>w.heroes[id]&&C.HEROES.some(h=>h.id===id&&h.unlock===x.stage))||x.won&&!w.completed.includes(x.stage)||!x.replay||!x.replay.config||!Array.isArray(x.replay.actions))throw Error('Invalid expedition receipt');const final=B.validate(x.replay.claimedState);if(final.id!==x.run||final.stage!==x.stage||final.turn!==x.turns||final.score!==x.score||final.status!==(x.won?'won':'failed')||JSON.stringify(final.config)!==JSON.stringify(x.replay.config)||JSON.stringify(final.actions)!==JSON.stringify(x.replay.actions))throw Error('Invalid receipt replay');}
 return clone(w);
}
function dispatch(w,a,at=Date.now()){if(!Number.isSafeInteger(at)||at<0)throw Error('Invalid action time');const next=validate(w);if(!next.tabor&&!next.battle)next.tabor=T.policy();next.inbox=next.inbox.filter(b=>b.expiresAt>at);apply(next,a,at);if(!next.tabor&&!next.battle)next.tabor=T.policy();next.lastVisitAt=Math.max(next.lastVisitAt,at);return validate(next);}
function save(w){return {schema:'one.v025.realm.save.v1',world:validate(w)};}
function restore(data){if(data?.schema!=='one.v025.realm.save.v1')throw Error('Unknown realm save');return validate(data.world);}
function summary(w,at){return {food:production(w,'farm',at).earned,iron:production(w,'mine',at).earned,inboxFood:w.inbox.filter(b=>b.expiresAt>at).reduce((n,b)=>n+b.food,0),inboxIron:w.inbox.filter(b=>b.expiresAt>at).reduce((n,b)=>n+b.iron,0),activeBattle:w.battle?.stage||null};}
function reminders(w,at){
 const result=[];
 for(const id of ['farm','mine']){const key=id==='farm'?'food':'iron',p=w.production[id],rate=w.buildings[id]*(id==='farm'?60:45),needed=Math.max(0,capacity(w)-w.resources[key]-p.carry),fillAt=p.at+needed/rate*3600000,capAt=p.at+12*3600000,capped=fillAt>capAt;
  result.push({id:'storage-'+key+'-'+p.at,kind:capped?'production-cap':'storage-full',dueAt:Math.min(fillAt,capAt),message:capped?(id==='farm'?'Your gardens have reached the 12-hour holding limit. Collect production.':'Your foundry has reached the 12-hour holding limit. Collect production.'):(id==='farm'?'Your food storage is ready to fill. Collect production or spend food.':'Your iron storage is ready to fill. Collect production or spend iron.')});
 }
 for(const box of w.inbox)if(box.expiresAt>at)result.push({id:'inbox-'+box.id,kind:'inbox-expiry',dueAt:box.expiresAt-10*60000,message:'An overflow bag expires in 10 minutes. Make storage room and claim it.'});return result;
}
function signalNodes(w){
 const buildings={keep:[0,0,0,0,.4,0,0],farm:[1,0,0,0,0,0,0],mine:[0,1,0,0,0,0,0],store:[.4,.4,0,0,0,0,0],academy:[0,0,.3,.2,0,.4,0],barracks:[0,0,.6,0,.2,0,0],forge:[0,0,.2,.4,0,.2,0]};
 const nodes=C.BUILDINGS.map(b=>({label:b.name,vector:buildings[b.id],view:'hub',selector:'[data-building="'+b.id+'"]'}));
 for(const h of C.HEROES.filter(h=>w.heroes[h.id])){const role=h.role;nodes.push({label:h.name,vector:[0,0,role==='striker'?1:role==='chain'?.9:.25,role==='healer'?1:0,role==='warden'?1:0,h.manaSpeed==='FAST'?.4:.2,0],view:'roster',selector:'[data-hero="'+h.id+'"]'});}
 nodes.push({label:C.ITEMS.heal.name,vector:[0,0,0,.85,0,0,0],view:'hub',selector:'[data-recipe="heal"]'},{label:C.ITEMS.mana.name,vector:[0,0,0,0,0,1,0],view:'hub',selector:'[data-recipe="mana"]'},{label:C.ITEMS.volley.name,vector:[0,0,.8,0,0,0,0],view:'hub',selector:'[data-recipe="volley"]'});
 if(w.battle)for(const enemy of w.battle.enemies.filter(e=>e.health>0))nodes.push({label:enemy.name,vector:[0,0,0,0,0,0,1],view:'battle',selector:'[data-enemy="'+enemy.id+'"]'});
 return nodes;
}
function lookupPurpose(w,query){
 if(typeof query!=='string'||query.length>120)throw Error('Use a short purpose to search');
 const words=query.toLowerCase().split(/[^a-z]+/),aliases=[['food','farm','gardens'],['iron','mine','foundry'],['attack','damage','strike'],['heal','healing','healer','health'],['shield','defense','guard'],['mana','focus','charge'],['threat','danger','enemy']];
 const probe=aliases.map(group=>group.some(word=>words.includes(word))?1:0),nodes=signalNodes(w),match=T.lookup(nodes,probe);
 return match&&match.resonance>0?{...match,...nodes[match.position-1],probe}:null;
}
function taborReport(w,at=w.lastVisitAt){
 const p=w.tabor||T.policy(),loadout=party(w),segments=T.segments(w.team.map(id=>{const hero=C.HEROES.find(h=>h.id===id),raw=C.stats(hero,w.heroes[id],w.troops[hero.element]);return {label:hero.name,basePotency:raw.baseAttack};}),p.segmentBps),living=w.battle?w.battle.heroes.map(h=>h.health>0?1:0):[1,1,1,1,1],field=w.battle?.board.map(value=>value===0?1:0)||Array(35).fill(0),next=T.localStep(field,7,5),pending=w.inbox.filter(box=>box.expiresAt>at);
 return {schema:'one.v025.tabor.report.v1',name:T.NAME,author:T.AUTHOR,active:!!w.tabor,binary:{states:living,reinforced:T.fold(living),sameStateCollision:T.gate(1,1,'COLLISION_XOR')},segments:segments.map((s,i)=>({...s,appliedAttack:loadout[i].attack})),signals:{dimensions:['food','iron','attack','healing','shield','mana','threat'],nodes:signalNodes(w),activeCells:field.reduce((a,b)=>a+b,0),nextActiveCells:next.reduce((a,b)=>a+b,0),previewOnly:true},capacity:T.ceiling(w.buildings.store*1000,p),policy:{...p},retained:{food:w.resources.food,iron:w.resources.iron},refundBuffer:{food:pending.reduce((n,b)=>n+b.food,0),iron:pending.reduce((n,b)=>n+b.iron,0)},distribution:'Local 48-hour inbox; no network recipients connected'};
}
return Object.freeze({KEY,initial,capacity,production,buildingCost,heroCost,blueprintCost,canAfford,party,reward,dispatch,validate,save,restore,summary,reminders,signalNodes,lookupPurpose,taborReport});
});
