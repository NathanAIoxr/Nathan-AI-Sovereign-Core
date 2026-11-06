/* Seeded 7-row × 5-lane combat; isolated from settlement/economy state. */
(function(root,factory){'use strict';const api=factory(typeof module==='object'&&module.exports?require('./catalog.js'):root.RealmCatalog,typeof module==='object'&&module.exports?require('./tabor.js'):root.TaborDecimal);if(typeof module==='object'&&module.exports)module.exports=api;else root.RealmCombat=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C,T){'use strict';
const COLS=5,ROWS=7,SIZE=35,clone=x=>JSON.parse(JSON.stringify(x));
function random(s,n){s.randomState=(Math.imul(s.randomState,1664525)+1013904223)>>>0;return Math.floor(s.randomState/4294967296*n);}
function adjacent(a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<SIZE&&b<SIZE&&Math.abs(Math.floor(a/COLS)-Math.floor(b/COLS))+Math.abs(a%COLS-b%COLS)===1;}
function matches(board){const groups=[];for(let i=0;i<SIZE;i++)for(const stride of [1,COLS]){const connected=(a,b)=>a>=0&&b<SIZE&&(stride!==1||Math.floor(a/COLS)===Math.floor(b/COLS));if(connected(i-stride,i)&&board[i-stride]===board[i])continue;const line=[i];let j=i+stride;while(connected(j-stride,j)&&board[j]===board[i]){line.push(j);j+=stride;}if(line.length>=3)groups.push(line);}return [...new Set(groups.flat())].sort((a,b)=>a-b);}
function moves(s){
 if(s.status!=='playing')return [];const result=[];
 for(let a=0;a<SIZE;a++)for(const b of [a+1,a+COLS])if(adjacent(a,b)){
  const board=s.board.slice();[board[a],board[b]]=[board[b],board[a]];const hits=matches(board);if(!hits.length)continue;
  let damage=0,ghost=0,mana=0;for(const i of hits){const hero=s.heroes[i%COLS],target=laneTarget(s,i%COLS);if(hero.health>0&&target.enemy)damage+=Math.max(1,Math.round(Math.ceil(hero.attack*C.multiplier(board[i],target.enemy.element)/5)*(target.enemy.broken?1.35:target.enemy.guard?.6:1)));if(target.ghost)ghost++;if(hero.health>0&&hero.element===board[i])mana+=target.ghost?2:1;}
  result.push({a,b,hits,tiles:hits.length,damage,ghost,mana,rank:damage+hits.length*2+mana*5});
 }
 return result.sort((a,b)=>b.rank-a.rank||a.a-b.a||a.b-b.b);
}
function fillStable(s){s.board=[];for(let i=0;i<SIZE;i++){const blocked=new Set();if(i%COLS>=2&&s.board[i-1]===s.board[i-2])blocked.add(s.board[i-1]);if(i>=COLS*2&&s.board[i-COLS]===s.board[i-COLS*2])blocked.add(s.board[i-COLS]);const allowed=[0,1,2,3,4].filter(x=>!blocked.has(x));s.board.push(allowed[random(s,allowed.length)]);}}
function recover(s){if(!matches(s.board).length&&moves(s).length)return false;for(let n=0;n<80;n++){fillStable(s);if(moves(s).length){s.reshuffles++;return true;}}throw Error('Unable to recover board');}
function laneEnemy(s,column){return s.enemies.find(e=>e.health>0&&column===e.from)||null;}
function laneTarget(s,column){const direct=laneEnemy(s,column);if(direct)return {enemy:direct,ghost:false};const living=s.enemies.filter(e=>e.health>0).sort((a,b)=>Math.abs(a.from-column)-Math.abs(b.from-column)||a.from-b.from);return {enemy:living[0]||null,ghost:true};}
function note(s,message){s.log.push(message);s.log=s.log.slice(-14);}
function spawn(s){const stage=C.STAGES[s.stage-1];s.enemies=Array.from({length:3},(_,i)=>{const health=65+s.stage*2+s.wave*12+(stage.boss&&s.wave===stage.waves?30:0);return {id:s.wave+'-'+i,name:['Road Sentinel','Cipher Warden','Echo Seer'][(s.stage+i)%3],kind:(s.stage+i)%3,element:(stage.element+i+s.wave-1)%5,health,maxHealth:health,attack:5+Math.floor(s.stage/7)+s.wave,from:[0,2,4][i],to:[0,2,4][i],broken:0,guard:false};});s.target=s.enemies[0].id;note(s,'Wave '+s.wave+'/'+stage.waves+' · '+stage.terrain+'.');}
function initial(stage,heroes,seed,id=1,items={heal:0,mana:0,volley:0}){if(!Number.isInteger(stage)||stage<1||stage>33||!Number.isInteger(seed)||seed<0||seed>4294967295||heroes.length!==5)throw Error('Invalid expedition settings');const s={schema:'one.v025.realm.battle.v1',config:{stage,heroes:clone(heroes),seed,id,items:{...items}},id,stage,seed,randomState:seed,status:'playing',wave:1,turn:0,budget:60,board:[],heroes:clone(heroes).map(h=>({...h,health:h.maxHealth,mana:0,shield:0,used:false})),enemies:[],target:null,items:{...items},itemUsed:false,reshuffles:0,score:0,log:[],last:{cleared:[],damage:0,ghost:0,cascades:0},actions:[]};spawn(s);fillStable(s);recover(s);return s;}
function hit(s,enemy,amount){const damage=Math.max(1,Math.round(amount*(enemy.broken>0?1.35:enemy.guard?.6:1))),taken=Math.min(enemy.health,damage);enemy.health-=taken;s.last.damage+=taken;if(!enemy.health)note(s,enemy.name+' defeated; lanes '+(enemy.from+1)+'–'+(enemy.to+1)+' now yield double mana.');return taken;}
function damageHero(s,hero,amount){const shield=Math.min(hero.shield,amount);hero.shield-=shield;hero.health=Math.max(0,hero.health-amount+shield);if(!hero.health){hero.mana=0;note(s,C.HEROES.find(h=>h.id===hero.id).name+' is down.');}}
function intent(s,e){const cycle=(s.turn+1+e.kind)%3;return cycle===0&&e.kind===1?{kind:'guard',text:'Guard · reduce incoming damage'}:cycle===0&&e.kind===2?{kind:'heal',text:'Mend · restore 12 health to allies'}:{kind:'attack',text:'Strike · '+e.attack+' damage'};}
function enemyTurn(s){for(const e of s.enemies.filter(e=>e.health>0)){const plan=intent({...s,turn:s.turn-1},e);e.guard=false;if(e.broken>0)e.broken--;if(plan.kind==='guard'){e.guard=true;note(s,e.name+' raises guard.');}else if(plan.kind==='heal'){s.enemies.filter(x=>x.health>0).forEach(x=>{x.health=Math.min(x.maxHealth,x.health+12);});note(s,e.name+' mends its allies.');}else{const living=s.heroes.filter(h=>h.health>0);if(!living.length)break;const hero=living[(s.turn+e.from)%living.length];damageHero(s,hero,e.attack);}}}
function outcome(s){if(T.fold(s.heroes.map(h=>h.health>0?1:0))===0){s.status='failed';note(s,'The party fell. Retry freely.');return;}if(T.fold(s.enemies.map(e=>e.health>0?1:0))===0){if(s.wave>=C.STAGES[s.stage-1].waves){s.status='won';note(s,'Expedition complete. Return to the settlement for earned rewards.');return;}s.wave++;spawn(s);}if(s.turn>=s.budget){s.status='failed';note(s,'The 60-move expedition budget ended. Retry with a new plan.');}}
function refill(s,hits){hits.forEach(i=>{s.board[i]=null;});for(let c=0;c<COLS;c++){const kept=[];for(let r=0;r<ROWS;r++)if(s.board[r*COLS+c]!==null)kept.push(s.board[r*COLS+c]);const column=Array.from({length:ROWS-kept.length},()=>random(s,5)).concat(kept);for(let r=0;r<ROWS;r++)s.board[r*COLS+c]=column[r];}}
function record(s,action){if(s.actions.length<1000)s.actions.push(clone(action));}
function swap(s,a,b){if(s.status!=='playing')return false;if(!adjacent(a,b))return false;[s.board[a],s.board[b]]=[s.board[b],s.board[a]];let hits=matches(s.board);if(!hits.length){[s.board[a],s.board[b]]=[s.board[b],s.board[a]];return false;}record(s,{type:'swap',a,b});s.last={cleared:[],damage:0,ghost:0,cascades:0};
 for(let depth=1;hits.length&&depth<=24;depth++){
  s.last.cascades++;s.last.cleared.push(...hits);s.score+=hits.length*10*depth;
  for(const i of hits){const element=s.board[i],hero=s.heroes[i%COLS],{enemy,ghost}=laneTarget(s,i%COLS);if(hero.health>0&&hero.element===element)hero.mana=Math.min(hero.maxMana,hero.mana+(ghost?4:2));if(ghost)s.last.ghost++;if(enemy&&hero.health>0)hit(s,enemy,Math.ceil(hero.attack*C.multiplier(element,enemy.element)*Math.min(2,1+(depth-1)*.2)/5));}
  refill(s,hits);hits=matches(s.board);
 }
 s.turn++;s.itemUsed=false;s.heroes.forEach(h=>{h.used=false;});const damage=s.last.damage,ghost=s.last.ghost;note(s,'Move '+s.turn+' · '+damage+' damage · '+s.last.cascades+' cascades'+(ghost?' · '+ghost+' ghost tiles':''));
 // A cleared wave advances without granting its fresh enemies a free attack.
 const cleared=T.fold(s.enemies.map(e=>e.health>0?1:0))===0;if(!cleared)enemyTurn(s);outcome(s);if(s.status==='playing')recover(s);return true;
}
function skill(s,id){if(s.status!=='playing')return false;const hero=s.heroes.find(h=>h.id===id);if(!hero||hero.health===0||hero.mana<hero.maxMana||hero.used)return false;const template=C.HEROES.find(h=>h.id===id),target=s.enemies.find(e=>e.id===s.target&&e.health>0)||s.enemies.find(e=>e.health>0);if(!target)return false;record(s,{type:'skill',hero:id});hero.mana=0;hero.used=true;s.last={cleared:[],damage:0,ghost:0,cascades:0};
 if(template.role==='healer')s.heroes.filter(h=>h.health>0).forEach(h=>{h.health=Math.min(h.maxHealth,h.health+Math.ceil(h.maxHealth*.35));});
 else if(template.role==='warden')s.heroes.filter(h=>h.health>0).forEach(h=>{h.shield=Math.min(60,h.shield+30);});
 else if(template.role==='chain')s.enemies.filter(e=>e.health>0).forEach(e=>hit(s,e,hero.attack*1.8*C.multiplier(hero.element,e.element)));
 else{hit(s,target,hero.attack*(template.role==='breaker'?2.5:4)*C.multiplier(hero.element,target.element));if(template.role==='breaker'&&target.health>0){target.broken=3;target.guard=false;}}
 note(s,template.name+' uses '+template.skill+'.');outcome(s);if(s.status==='playing')recover(s);return true;
}
function item(s,id){if(s.status!=='playing'||s.itemUsed||!s.items[id])return false;record(s,{type:'item',item:id});s.items[id]--;s.itemUsed=true;s.last={cleared:[],damage:0,ghost:0,cascades:0};if(id==='heal'){const hero=s.heroes.filter(h=>h.health>0).sort((a,b)=>a.health/a.maxHealth-b.health/b.maxHealth)[0];hero.health=Math.min(hero.maxHealth,hero.health+70);}else if(id==='mana')s.heroes.filter(h=>h.health>0).forEach(h=>{h.mana=Math.min(h.maxMana,h.mana+5);});else s.enemies.filter(e=>e.health>0).forEach(e=>{const taken=Math.min(e.health,25);e.health-=taken;s.last.damage+=taken;});note(s,C.ITEMS[id].name+' used.');outcome(s);if(s.status==='playing')recover(s);return true;}
function action(s,a){if(s.status!=='playing'||!a||s.actions.length>=1000)return false;if(a.type==='flee'){record(s,a);s.status='failed';note(s,'Expedition ended. Unused supplies return; no rewards are granted.');return true;}if(a.type==='swap')return swap(s,a.a,a.b);if(a.type==='skill')return skill(s,a.hero);if(a.type==='item')return item(s,a.item);if(a.type==='target'){if(!s.enemies.some(e=>e.id===a.enemy&&e.health>0))return false;if(s.target===a.enemy)return true;s.target=a.enemy;record(s,a);return true;}return false;}
function validate(s){
 const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 if(!s||s.schema!=='one.v025.realm.battle.v1'||!integer(s.id,1,1e9)||!integer(s.stage,1,33)||!integer(s.seed,0,4294967295)||!integer(s.randomState,0,4294967295)||!['playing','won','failed'].includes(s.status)||!integer(s.turn,0,60)||s.budget!==60||!integer(s.wave,1,C.STAGES[s.stage-1].waves)||!integer(s.score,0,1e9)||!integer(s.reshuffles,0,10000))throw Error('Invalid expedition state');
 if(!Array.isArray(s.board)||s.board.length!==SIZE||!s.board.every(x=>integer(x,0,4)))throw Error('Invalid battle board');
 if(!Array.isArray(s.heroes)||s.heroes.length!==5||new Set(s.heroes.map(h=>h.id)).size!==5||new Set(s.heroes.map(h=>h.element)).size!==5)throw Error('Invalid party');
 for(const h of s.heroes){const template=C.HEROES.find(x=>x.id===h.id);if(!template||h.element!==template.element||!integer(h.attack,1,200)||!integer(h.maxHealth,1,500)||!integer(h.health,0,h.maxHealth)||h.maxMana!==template.mana||!integer(h.mana,0,h.maxMana)||!integer(h.shield,0,60)||typeof h.used!=='boolean')throw Error('Invalid hero battle stats');}
 if(!Array.isArray(s.enemies)||s.enemies.length!==3)throw Error('Invalid enemy formation');
 for(const [i,e] of s.enemies.entries())if(e.id!==s.wave+'-'+i||typeof e.name!=='string'||e.name.length>60||!integer(e.kind,0,2)||!integer(e.element,0,4)||!integer(e.maxHealth,1,500)||!integer(e.health,0,e.maxHealth)||!integer(e.attack,1,50)||e.from!==[0,2,4][i]||e.to!==[0,2,4][i]||!integer(e.broken,0,3)||typeof e.guard!=='boolean')throw Error('Invalid enemy');
 if(!s.enemies.some(e=>e.id===s.target)||typeof s.itemUsed!=='boolean'||!s.items||Object.keys(s.items).length!==3||!Object.keys(C.ITEMS).every(k=>integer(s.items[k],0,20)))throw Error('Invalid battle inventory or target');
 if(!Array.isArray(s.log)||s.log.length>14||!s.log.every(x=>typeof x==='string'&&x.length<300)||!Array.isArray(s.actions)||s.actions.length>1000)throw Error('Invalid battle record');
 for(const a of s.actions){if(!a||!['swap','skill','item','target','flee'].includes(a.type)||a.type==='swap'&&!adjacent(a.a,a.b)||a.type==='skill'&&!s.heroes.some(h=>h.id===a.hero)||a.type==='item'&&!Object.hasOwn(C.ITEMS,a.item)||a.type==='target'&&typeof a.enemy!=='string')throw Error('Invalid replay action');}
 if(!s.config||s.config.stage!==s.stage||s.config.seed!==s.seed||s.config.id!==s.id||!Array.isArray(s.config.heroes)||s.config.heroes.length!==5||!s.config.heroes.every((h,i)=>['id','element','attack','maxHealth','maxMana'].every(key=>h[key]===s.heroes[i][key]))||!s.config.items||!Object.keys(C.ITEMS).every(k=>integer(s.config.items[k],0,20)&&s.items[k]<=s.config.items[k])||s.actions.filter(a=>a.type==='swap').length!==s.turn)throw Error('Invalid replay configuration');
 if(!s.last||!Array.isArray(s.last.cleared)||s.last.cleared.length>840||!s.last.cleared.every(i=>integer(i,0,34))||!integer(s.last.damage,0,10000)||!integer(s.last.ghost,0,840)||!integer(s.last.cascades,0,24))throw Error('Invalid turn result');
 if(s.status==='won'&&(s.wave!==C.STAGES[s.stage-1].waves||s.enemies.some(e=>e.health>0))||s.status==='playing'&&(s.turn>=s.budget||T.fold(s.heroes.map(h=>h.health>0?1:0))===0||T.fold(s.enemies.map(e=>e.health>0?1:0))===0||matches(s.board).length||!moves(s).length))throw Error('Inconsistent battle outcome');
 return clone(s);
}
function replay(config,actions){if(!config||!Array.isArray(actions)||actions.length>1000)throw Error('Invalid replay');const s=initial(config.stage,config.heroes,config.seed,config.id,config.items);validate(s);for(const a of actions)if(!action(s,a))throw Error('Replay contains an unavailable action');return validate(s);}
function plan(s,preferences={}){
 if(s.status!=='playing')return null;const living=s.enemies.filter(e=>e.health>0),target=preferences.lowest?living.slice().sort((a,b)=>a.health-b.health||a.from-b.from)[0]:living.find(e=>e.id===s.target)||living[0];
 if(target&&target.id!==s.target)return {type:'target',enemy:target.id};
 if(!preferences.boss||s.wave===C.STAGES[s.stage-1].waves){
  for(const h of s.heroes){if(h.health===0||h.used||h.mana<h.maxMana)continue;const hero=C.HEROES.find(x=>x.id===h.id),allies=s.heroes.filter(x=>x.health>0);
   if(hero.role==='healer'&&!allies.some(x=>x.health/x.maxHealth<.65))continue;
   if(hero.role==='warden'&&(!allies.some(x=>x.shield<15)||!living.some(e=>intent(s,e).kind==='attack')))continue;
   return {type:'skill',hero:h.id};
  }
 }
 const move=moves(s).find(m=>!preferences.central||m.hits.every(i=>i%COLS>=1&&i%COLS<=3));
 return move?{type:'swap',a:move.a,b:move.b}:{type:'blocked',reason:'No opening clear is confined to lanes 2–4. Change the filter or play manually.'};
}
return Object.freeze({COLS,ROWS,initial,adjacent,matches,moves,laneEnemy,laneTarget,intent,action,validate,replay,plan});
});
