/* Original companion RPG content. Shared definitions; no commercial assets. */
(function(root,factory){'use strict';const api=factory(typeof module==='object'&&module.exports?require('../engine.js'):root.OneTrialMatrix,typeof module==='object'&&module.exports?require('./tabor.js'):root.TaborDecimal);if(typeof module==='object'&&module.exports)module.exports=api;else root.RealmCatalog=api;})(typeof globalThis!=='undefined'?globalThis:this,function(trials,T){'use strict';
const ELEMENTS=[
 {id:'ember',name:'Ember',mark:'▲',color:'#ff987d',beats:1,weak:2},
 {id:'grove',name:'Grove',mark:'♧',color:'#8de1ac',beats:2,weak:0},
 {id:'tide',name:'Tide',mark:'◆',color:'#83d8ef',beats:0,weak:1},
 {id:'aether',name:'Aether',mark:'✦',color:'#f4d78b',beats:4,weak:null},
 {id:'umbra',name:'Umbra',mark:'☾',color:'#d3b1ff',beats:3,weak:null}
];
const HEROES=[
 ['lyra','Lyra of the Kiln',0,'L','striker','Solar Lance','Strike the chosen enemy for 4× attack.',18,150,0],
 ['sylva','Sylva Reedkeeper',1,'S','healer','Living Spring','Restore 35% maximum health to each living ally.',16,165,0],
 ['neris','Neris the Tidewright',2,'N','warden','Tidal Aegis','Give each living ally 30 shield (maximum 60).',17,175,0],
 ['oriel','Oriel Dawnreader',3,'O','breaker','Revelation','Strike for 2.5× attack and break the target’s guard for three moves.',18,150,0],
 ['vesper','Vesper Nightglass',4,'V','chain','Nightfall','Strike every living enemy for 1.8× attack.',17,155,0],
 ['ignis','Ignis Ashbound',0,'I','chain','Cinderstorm','Strike every living enemy for 1.8× attack.',24,160,3],
 ['rowan','Rowan Mossguard',1,'R','warden','Rootwall','Give each living ally 30 shield (maximum 60).',20,195,9],
 ['thal','Thal of the Deep',2,'T','breaker','Undertow','Strike for 2.5× attack and break the target’s guard for three moves.',24,175,15],
 ['solenne','Solenne Waykeeper',3,'W','healer','Daybreak','Restore 35% maximum health to each living ally.',20,190,21],
 ['nyx','Nyx Starless',4,'X','striker','Eclipse','Strike the chosen enemy for 4× attack.',28,160,27]
].map((h,i)=>{const speed=['AVERAGE','FAST','AVERAGE','FAST','SLOW'][h[2]];return Object.freeze({id:h[0],name:h[1],element:h[2],mark:h[3],role:h[4],skill:h[5],description:h[6],attack:h[7],health:h[8],unlock:h[9],rarity:i<5?3:4,manaSpeed:speed,mana:{VERY_FAST:13,FAST:16,AVERAGE:20,SLOW:24,VERY_SLOW:27}[speed]});});
const MANA_SPEED_CHARGES=Object.freeze({VERY_FAST:6.5,FAST:8,AVERAGE:10,SLOW:12,VERY_SLOW:13.5});
const BUILDINGS=[
 {id:'keep',name:'Rootkeep',mark:'♜',purpose:'Raises the maximum level of every building.'},
 {id:'farm',name:'Sun Gardens',mark:'♧',purpose:'Produce food. Each level yields 60 food per hour.'},
 {id:'mine',name:'Deep Foundry',mark:'⚒',purpose:'Produce iron. Each level yields 45 iron per hour.'},
 {id:'store',name:'Storehouse',mark:'▣',purpose:'Holds 1,000 food and iron per level.'},
 {id:'academy',name:'Memory Academy',mark:'◈',purpose:'Train heroes; level 2/3 supports ascension at hero level 4/7.'},
 {id:'barracks',name:'Wayfarer Barracks',mark:'⚑',purpose:'Train elemental support troops for stronger tile attacks.'},
 {id:'forge',name:'Resonance Forge',mark:'⚙',purpose:'Craft healing, mana and volley items. Higher levels lower costs.'}
];
const ITEMS={heal:{name:'Spring draught',description:'Heal the weakest living hero by 70 health.',food:40,iron:0},mana:{name:'Focus flask',description:'Give each living hero 5 mana.',food:0,iron:35},volley:{name:'Signal volley',description:'Deal 25 true damage to each enemy.',food:0,iron:60}};
const STAGES=trials.LEVELS.map((level,i)=>Object.freeze({id:level.id,name:level.name,epoch:level.epoch,boss:[11,22,33].includes(level.id),waves:[11,22,33].includes(level.id)?3:2,element:i%5,terrain:['Open roads','Guarded crossing','Gathering storm'][i%3],seed:(Math.imul(level.id,2654435761)+25033)>>>0}));
function multiplier(attack,defense){return ELEMENTS[attack].beats===defense?2:ELEMENTS[attack].weak===defense?.5:1;}
function stats(hero,progress,troop=1,segmentBps=null){const baseAttack=hero.attack+(progress.level-1)*3+(progress.talent==='force'?6:0)+2*(troop-1);return {baseAttack,attack:segmentBps===null?baseAttack:T.potency(baseAttack,hero.element+1,segmentBps),health:hero.health+(progress.level-1)*14+(progress.talent==='guard'?40:0)};}
return Object.freeze({ELEMENTS,HEROES,BUILDINGS,ITEMS,STAGES,MANA_SPEED_CHARGES,multiplier,stats});
});
