/* NATHAN TABOR OCTOPUS — original, dependency-free arena game logic.
   Fictional game powers, not representations of operational physical devices. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OctopusArsenal=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='1.0.0',MAX_WAVE=15,CORE={x:.5,y:.53};
const AREAS=Object.freeze([
 {id:'void',title:'VOID FOLD',place:'The Nothing Sea',color:'#789dff',brief:'Fold incoming rifts before they reach the sanctuary.'},
 {id:'bite',title:'BARK & BITE',place:'The Fire Frontier',color:'#ff9b53',brief:'Hold the line with disciplined plasma and pressure.'},
 {id:'mind',title:'MIND TO MATTER',place:'The Signal Garden',color:'#8ee8e4',brief:'Protect the signal from noise and uncertainty.'},
 {id:'gravity',title:"GRAVITY'S GOT NOTHING",place:'The Gravity Reef',color:'#c59eff',brief:'Balance motion and preserve the center.'},
 {id:'paradox',title:'THE PARADOX LEDGER',place:'The Middle C',color:'#f3d583',brief:'Solve the final collision without losing innocence.'}
]);
const WEAPONS=Object.freeze([
 {id:'void-wall',name:'THE VOID WALL',family:'void',formula:'f(r) = [tanh(s(r+R)) − tanh(s(r−R))] / [2 tanh(sR)]',description:'Pushes approaching rifts away from the core.',energy:24,cooldown:3.1,damage:10,color:'#7ea6ff',symbol:'◯',gate:'warp-wall',power:'repulse'},
 {id:'fire-column',name:'THE FIRE COLUMN',family:'bite',formula:'I² = 8πNk_B(T_e + T_i)/μ₀',description:'A focused imaginary energy lance strikes in a line.',energy:17,cooldown:1.2,damage:37,color:'#ff9b5b',symbol:'✦',gate:'fire-column',power:'beam'},
 {id:'backoff-gate',name:'THE BACK-OFF GATE',family:'bite',formula:'fₚ = √(nₑe²/(ε₀mₑ))/(2π)',description:'A local area bubble knocks rift drones back.',energy:21,cooldown:2.5,damage:19,color:'#76e4fc',symbol:'⬡',gate:'frequency-gate',power:'pulse'},
 {id:'fading-wall',name:'THE FADING WALL',family:'bite',formula:'δ = c/[2πf√((fₚ/f)²−1)]',description:'A cloud of imagined attenuation slows a cluster.',energy:20,cooldown:3.0,damage:8,color:'#96e6f7',symbol:'≈',gate:'wave-fade',power:'mist'},
 {id:'field-pressure',name:'PRESSURE WITHOUT A HAND',family:'mind',formula:'P = B²/(2μ₀)',description:'An expanding field displaces nearby rift drones.',energy:20,cooldown:2.4,damage:19,color:'#f7c580',symbol:'◎',gate:'field-pressure',power:'shock'},
 {id:'moment-bender',name:'MOMENT BENDER',family:'void',formula:'γ = 1/√(1−(v/c)²)',description:'Temporarily slows all enemy movement in the arena.',energy:26,cooldown:6.2,damage:0,color:'#b69aff',symbol:'◷',gate:'clock-bender',power:'slow'},
 {id:'quiet-coil',name:'THE QUIET COIL',family:'gravity',formula:'|emf| = NA|dB/dt|',description:'A simulated chain arc jumps across nearby drones.',energy:17,cooldown:1.65,damage:29,color:'#f0d07e',symbol:'ϟ',gate:'quiet-coil',power:'chain'},
 {id:'mirror-pair',name:'THE MIRROR PAIR',family:'paradox',formula:'P(match) = (1+visibility)/2',description:'A chosen target and its mirror both take game damage.',energy:21,cooldown:1.85,damage:32,color:'#b6a5ff',symbol:'∞',gate:'pair-mirror',power:'mirror'}
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function rand(s){let x=s.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x>>>0;return s.seed/4294967296}
function newCareer(){return {version:VERSION,tokens:35,levels:Array(8).fill(1),bestWave:0,bestScore:0,victories:0,calibrations:0};}
function validateCareer(raw){const d=newCareer();if(!raw||typeof raw!=='object')return d;const safeInt=(v,lo,hi,f)=>Number.isInteger(v)?clamp(v,lo,hi):f;return {version:VERSION,tokens:safeInt(raw.tokens,0,1000000,d.tokens),levels:d.levels.map((v,i)=>safeInt(raw.levels?.[i],1,5,v)),bestWave:safeInt(raw.bestWave,0,MAX_WAVE,0),bestScore:safeInt(raw.bestScore,0,1e9,0),victories:safeInt(raw.victories,0,1000000,0),calibrations:safeInt(raw.calibrations,0,1000000,0)};}
function create(seed=20261015,career=newCareer()){return {version:VERSION,seed:(Number(seed)>>>0)||1,career:validateCareer(career),mode:'ready',wave:0,elapsed:0,energy:100,hull:100,score:0,kills:0,spawnLeft:0,spawnTimer:0,enemyId:0,enemies:[],visuals:[],clouds:[],slowTimer:0,cooldowns:Array(8).fill(0),selected:1,notice:'Protect the innocent center. Select a tentacle to begin.',noticeTime:5,clearBonus:0};}
function level(s,i){return s.career.levels[i]||1;}
function currentArea(s){return AREAS[Math.min(4,Math.floor((Math.max(1,s.wave)-1)/3))];}
function spawn(s,boss=false){
 const angle=rand(s)*Math.PI*2, r=0.49, wave=Math.max(1,s.wave),type=boss?'warden':(rand(s)<.27?'dart':rand(s)<.15?'armored':'rift');
 const base=type==='warden'?200+wave*13:type==='armored'?56+wave*5:type==='dart'?25+wave*2:39+wave*3;
 const x=CORE.x+Math.cos(angle)*r,y=CORE.y+Math.sin(angle)*r;
 const e={id:++s.enemyId,x,y,type,health:base,maxHealth:base,speed:(type==='warden'?.016:type==='dart'?.049:type==='armored'?.023:.031)+wave*.0013,slow:0,flash:0,size:type==='warden'?.035:type==='armored'?.025:.018,points:type==='warden'?125:type==='armored'?28:15};
 s.enemies.push(e);return e;
}
function toast(s,text){s.notice=text;s.noticeTime=2.8;}
function start(s){if(s.mode!=='ready'&&s.mode!=='between')return false;if(s.wave>=MAX_WAVE)return false;
 s.wave++;s.mode='playing';s.spawnLeft=4+2*s.wave+(s.wave%3===0?1:0);s.spawnTimer=.15;s.slowTimer=0;s.clouds=[];s.energy=Math.min(100,s.energy+30);s.hull=Math.min(100,s.hull+Math.max(2,8-Math.floor(s.wave/4)));s.career.bestWave=Math.max(s.career.bestWave,s.wave);toast(s,'WAVE '+s.wave+' • '+currentArea(s).title);return true;}
function award(s,e){s.score+=e.points;s.kills++;s.career.tokens=clamp(s.career.tokens+(e.type==='warden'?24:e.type==='armored'?5:2),0,1000000);
 s.career.bestScore=Math.max(s.career.bestScore,s.score);
 s.visuals.push({kind:'burst',x:e.x,y:e.y,t:.38,color:e.type==='warden'?'#ffd995':'#80f1e0'});
}
function damage(s,e,n){if(e.health<=0)return;if(!Number.isFinite(n)||n<=0)return;e.health-=n;e.flash=.16;if(e.health<=0)award(s,e)}
function push(e,f){const dx=e.x-CORE.x,dy=e.y-CORE.y,d=Math.max(.001,Math.hypot(dx,dy));e.x+=dx/d*f;e.y+=dy/d*f;}
function visual(s,kind,x,y,more={}){s.visuals.push({kind,x,y,t:.36,...more})}
function fire(s,index,target){
 if(s.mode!=='playing')return {ok:false,reason:'Start or resume the encounter.'};
 if(!Number.isInteger(index)||index<0||index>=WEAPONS.length)return {ok:false,reason:'Choose one of the eight tentacles.'};
 const w=WEAPONS[index],cost=Math.max(8,w.energy-(level(s,index)-1)*1.5);
 if(s.cooldowns[index]>0)return {ok:false,reason:'Tentacle recharging.'};
 if(s.energy<cost)return {ok:false,reason:'Need more Root energy.'};
 const t={x:clamp(Number(target?.x??.5),0,1),y:clamp(Number(target?.y??.5),0,1)};
 if(!Number.isFinite(t.x+t.y))return {ok:false,reason:'Bad target coordinates.'};
 const attack=w.damage*(1+(level(s,index)-1)*.24);s.energy-=cost;s.cooldowns[index]=Math.max(.35,w.cooldown-(level(s,index)-1)*.12);s.selected=index;
 const alive=()=>s.enemies.filter(e=>e.health>0);
 const near=(p,r)=>alive().filter(e=>dist(e,p)<=r);
 const nearest=(p=CORE)=>alive().slice().sort((a,b)=>dist(a,p)-dist(b,p))[0];
 let hits=0;
 switch(w.power){
 case 'repulse':for(const e of near(CORE,.36)){damage(s,e,attack);push(e,.13);e.slow=Math.max(e.slow,1.6);hits++}visual(s,'ring',CORE.x,CORE.y,{radius:.36,color:w.color});break;
 case 'beam':{
  const aim=Math.atan2(t.y-CORE.y,t.x-CORE.x),ux=Math.cos(aim),uy=Math.sin(aim);
  for(const e of alive()){const dx=e.x-CORE.x,dy=e.y-CORE.y,along=dx*ux+dy*uy,cross=Math.abs(dx*uy-dy*ux);
   if(along>0&&along<.7&&cross<.046){damage(s,e,attack);hits++}}
  visual(s,'beam',CORE.x,CORE.y,{x2:CORE.x+ux*.7,y2:CORE.y+uy*.7,color:w.color});break;}
 case 'pulse':for(const e of near(t,.24)){damage(s,e,attack);push(e,.065);hits++}visual(s,'ring',t.x,t.y,{radius:.24,color:w.color});break;
 case 'mist':s.clouds.push({x:t.x,y:t.y,r:.24,time:4.6});for(const e of near(t,.24)){damage(s,e,attack);e.slow=Math.max(e.slow,4.6);hits++}visual(s,'ring',t.x,t.y,{radius:.24,color:w.color});break;
 case 'shock':for(const e of near(t,.28)){damage(s,e,attack);push(e,.1);hits++}visual(s,'ring',t.x,t.y,{radius:.28,color:w.color});break;
 case 'slow':s.slowTimer=Math.max(s.slowTimer,3.0+.55*(level(s,index)-1));visual(s,'ring',CORE.x,CORE.y,{radius:.49,color:w.color});hits=alive().length;break;
 case 'chain':{
  let p=nearest(t);const visited=new Set();
  for(let k=0;k<4&&p;k++){visited.add(p.id);damage(s,p,attack*Math.pow(.7,k));visual(s,'beam',k===0?CORE.x:t.x,k===0?CORE.y:t.y,{x2:p.x,y2:p.y,color:w.color});hits++;
    t.x=p.x;t.y=p.y;p=alive().filter(e=>!visited.has(e.id)&&dist(e,t)<=.26).sort((a,b)=>dist(a,t)-dist(b,t))[0];}break;
 }
 case 'mirror':{
  const first=nearest(t);if(first){damage(s,first,attack);hits++;visual(s,'beam',CORE.x,CORE.y,{x2:first.x,y2:first.y,color:w.color});
   const echo={x:1-first.x,y:2*CORE.y-first.y},second=alive().filter(e=>e.id!==first.id).sort((a,b)=>dist(a,echo)-dist(b,echo))[0];
   if(second){damage(s,second,attack*.82);hits++;visual(s,'beam',first.x,first.y,{x2:second.x,y2:second.y,color:w.color})}}break;}
 }
 s.enemies=s.enemies.filter(e=>e.health>0);toast(s,w.name+(hits?' • '+hits+' contacts':' • field deployed'));
 return {ok:true,hits,cost,weapon:w.name};
}
function step(s,dt){
 if(s.mode!=='playing')return s;const t=clamp(Number(dt)||0,0,.07);s.elapsed+=t;s.energy=clamp(s.energy+t*(10.5+Math.max(0,level(s,5)-1)*.4),0,100);
 s.slowTimer=Math.max(0,s.slowTimer-t);s.noticeTime=Math.max(0,s.noticeTime-t);
 for(let i=0;i<8;i++)s.cooldowns[i]=Math.max(0,s.cooldowns[i]-t);
 for(const v of s.visuals)v.t-=t;s.visuals=s.visuals.filter(v=>v.t>0);
 for(const c of s.clouds)c.time-=t;s.clouds=s.clouds.filter(c=>c.time>0);
 if(s.spawnLeft>0){s.spawnTimer-=t;if(s.spawnTimer<=0){const boss=s.wave%3===0&&s.spawnLeft===1;spawn(s,boss);s.spawnLeft--;s.spawnTimer=clamp(.77-s.wave*.018,.34,.77)}}
 for(const e of s.enemies){e.flash=Math.max(0,e.flash-t);e.slow=Math.max(0,e.slow-t);if(s.clouds.some(c=>dist(c,e)<=c.r))e.slow=Math.max(e.slow,.11);
  const damp=(s.slowTimer>0?.36:1)*(e.slow>0?.4:1),d=dist(e,CORE)||1;
  e.x+=(CORE.x-e.x)/d*e.speed*t*damp;e.y+=(CORE.y-e.y)/d*e.speed*t*damp;
  if(dist(e,CORE)<.07){e.health=0;s.hull=Math.max(0,s.hull-(e.type==='warden'?19:e.type==='armored'?11:7));visual(s,'burst',CORE.x,CORE.y,{color:'#fb9098'});toast(s,'A rift struck the Sanctuary!')}}
 s.enemies=s.enemies.filter(e=>e.health>0);
 if(s.hull<=0){s.mode='lost';toast(s,'The sanctuary needs repairs. Try again.')}
 else if(s.spawnLeft===0&&s.enemies.length===0){const reward=10+3*s.wave;s.career.tokens=clamp(s.career.tokens+reward,0,1000000);
 if(s.wave===MAX_WAVE){s.mode='won';s.career.victories++;toast(s,'CHECKMATE • Innocence protected.')}else{s.mode='between';toast(s,'WAVE COMPLETE • +'+reward+' Root tokens.')}
 s.career.bestScore=Math.max(s.career.bestScore,s.score);}
 return s;
}
function upgrade(s,index){if(!Number.isInteger(index)||index<0||index>=8)return {ok:false,reason:'Unknown tentacle'};if(s.mode==='playing')return {ok:false,reason:'Upgrade between encounters.'};let l=level(s,index);if(l>=5)return {ok:false,reason:'Max level reached.'};const cost=15+l*12;if(s.career.tokens<cost)return {ok:false,reason:'Need '+cost+' Root tokens.'};s.career.tokens-=cost;s.career.levels[index]++;return {ok:true,cost,level:l+1};}
function grantCalibration(s){if(s.mode==='playing')return false;if(s.career.calibrations>=1000000)return false;s.career.calibrations++;s.career.tokens=clamp(s.career.tokens+4,0,1000000);return true;}
function status(s){return {mode:s.mode,wave:s.wave,zone:currentArea(s).title,energy:Math.round(s.energy),hull:Math.round(s.hull),score:s.score,kills:s.kills,hostiles:s.enemies.length+s.spawnLeft,tokens:s.career.tokens};}
function simulate(seed,seconds=60,delta=.05){const s=create(seed);start(s);for(let t=0;t<seconds&&s.mode==='playing';t+=delta){step(s,delta);if(s.enemies.length&&t%1<delta)fire(s,1,s.enemies[0]);}return status(s)}
return Object.freeze({VERSION,MAX_WAVE,CORE,AREAS,WEAPONS,create,newCareer,validateCareer,start,step,fire,spawn,upgrade,grantCalibration,currentArea,status,simulate});
});