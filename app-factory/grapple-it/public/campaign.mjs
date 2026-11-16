
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const ERAS=[
 {id:'naval',name:'Ancient Naval Warfare',place:'Roman harbor',target:'Training barge',zone:.12,speed:1.1,amplitude:.15,drift:.10,load:.19,tension:.20,slack:.23,ink:'#cbe586',water:'#254a58',tip:'Wait until the barge ring enters the center bracket. Cast, then alternate Reel and Ease to keep the line in the green.'},
 {id:'castle',name:'Castle Walls',place:'Lantern court',target:'Lantern ring',zone:.095,speed:1.45,amplitude:.20,drift:.13,load:.17,tension:.25,slack:.21,ink:'#ffe09e',water:'#40354e',tip:'The lantern swings faster than the barge. Watch for the center bracket to light up.'},
 {id:'frontier',name:'Wild West Frontier',place:'Frontier track',target:'Stagecoach prop',zone:.085,speed:1.65,amplitude:.27,drift:.15,load:.20,tension:.31,slack:.23,ink:'#ffc993',water:'#65413c',tip:'Loop the stagecoach prop and reel in short bursts. Ease early to avoid breaking the line.'},
 {id:'rescue',name:'Modern Rescue',place:'Cliff rescue course',target:'Rescue sled',zone:.075,speed:1.8,amplitude:.28,drift:.18,load:.20,tension:.34,slack:.23,ink:'#bcefff',water:'#284a42',tip:'Secure the rescue sled. Watch the tension meter when the load shifts.'},
];
export const PK_LINE='PK .. that’s the wild card .. that boy ain’t rite …';
export function dailyCourse(day){
 const n=[...day].reduce((value,char)=>(Math.imul(31,value)+char.charCodeAt(0))>>>0,17);
 const base=ERAS[n%ERAS.length];
 return {...base,id:'daily',name:'Daily Grapple',zone:base.zone*.95,offset:(n%314)/100};
}
export function freshLine(course,pk=false){
 return {course,pk,t:0,phase:'aim',distance:1,stress:.20,casts:0,breaks:0,hold:false};
}
export function ringX(s){
 const {course,t,pk}=s;
 const wobble=pk?.055*Math.sin(t*4.17):0;
 return .54+course.amplitude*Math.sin(t*course.speed+(course.offset??0))+wobble;
}
export function linedUp(s){return Math.abs(ringX(s)-.5)<=s.course.zone;}
export function castLine(s){
 if(s.phase!=='aim')return;
 s.casts++;
 if(linedUp(s)){s.phase='reel';s.stress=.20;return 'Latched onto '+s.course.target+'. Reel in green, then ease.';}
 return 'Miss. Wait for the center bracket to light up.';
}
export function advanceLine(s,dt){
 if(s.phase==='won')return null;
 s.t+=dt;
 if(s.phase!=='reel')return null;
 const c=s.course;
 const surge=(1+Math.sin(s.t*3.7))*.5*c.drift+(s.pk?(1+Math.sin(s.t*5.1))*.045:0);
 s.stress=clamp(s.stress+(s.hold?c.tension+surge:-c.slack)*dt,0,1);
 if(s.stress>=1){
  s.phase='aim';s.hold=false;s.breaks++;s.distance=1;
  return 'Line snapped. Cast again.';
 }
 if(s.hold&&s.stress>=.26&&s.stress<=.78)s.distance-=c.load*dt;
 if(s.distance<=0){
  s.phase='won';s.hold=false;s.distance=0;
  return c.target+' secured.';
 }
 return null;
}
export function medal(s){
 return s.casts===1&&s.breaks===0?'Gold':s.breaks===0?'Silver':'Bronze';
}
