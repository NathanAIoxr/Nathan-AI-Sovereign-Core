
// Two independent air jets from the handheld water toy.
export const TOY_COURSES=[
 {id:'pegs',name:'Ring & Pegs',prop:'Ring',symbol:'○',flow:.055,color:'#244b6e',targets:[
  {name:'Center peg',x:.50,y:.48,amp:0},{name:'Upper peg',x:.63,y:.22,amp:0}]},
 {id:'salvage',name:'Sunken Treasure',prop:'Grappling hook',symbol:'J',flow:.085,color:'#245f5b',targets:[
  {name:'Treasure chest',x:.34,y:.61,amp:0},{name:'Treasure chest',x:.68,y:.35,amp:0}]},
 {id:'sub',name:'Mini-Sub Chase',prop:'Anchor',symbol:'⚓',flow:.105,color:'#344467',targets:[
  {name:'Moving mini-sub',x:.52,y:.53,amp:.15},{name:'Moving mini-sub',x:.48,y:.27,amp:.19}]},
 {id:'seahooks',name:'Swinging Sea Hooks',prop:'Grappling hook',symbol:'J',flow:.125,color:'#43416b',targets:[
  {name:'Swinging sea hook',x:.34,y:.64,amp:.12,swing:true},{name:'Swinging sea hook',x:.66,y:.44,amp:.16,swing:true},{name:'Swinging sea hook',x:.5,y:.22,amp:.18,swing:true}]},
];
const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
export function startToy(course){
 return {course,x:.5,y:.89,vx:0,vy:0,t:0,next:0,jets:0,wait:0,lastJet:{left:-1,right:-1},done:false};
}
export function toyTarget(course,index,t){
 const target=course.targets[index];
 const wave=t*(target.swing?2.15:1.5)+index*1.2;
 return {...target,x:target.x+target.amp*Math.sin(wave),y:target.y+(target.swing?.048*(1-Math.cos(wave)):0)};
}
export function blowJet(s,side){
 if(s.done||s.wait>0||s.t-s.lastJet[side]<.18)return false;
 s.lastJet[side]=s.t;s.jets++;
 s.vy=Math.max(-.60,s.vy-.39);
 s.vx=clamp(s.vx+(side==='left'?.19:-.19),-.37,.37);
 return true;
}
export function stepToy(s,dt){
 if(s.done)return;
 s.t+=dt;
 if(s.wait>0){s.wait=Math.max(0,s.wait-dt);return;}
 s.vx=(s.vx+Math.sin(s.t*2.3)*s.course.flow*dt)*Math.exp(-1.8*dt);
 s.vy=clamp(s.vy+.35*dt,-.60,.48);
 s.x=clamp(s.x+s.vx*dt,.07,.93);
 s.y=clamp(s.y+s.vy*dt,.065,.89);
 if(s.y===.89&&s.vy>0||s.y===.065&&s.vy<0)s.vy=0;
}
export function grappleToy(s){
 if(s.done||s.wait>0)return null;
 const target=toyTarget(s.course,s.next,s.t);
 if(Math.hypot(1.07*(s.x-target.x),s.y-target.y)>.105)return {hit:false,message:'Get closer to '+target.name.toLowerCase()+' before you grapple.'};
 s.next++;s.done=s.next===s.course.targets.length;s.wait=.28;
 s.x=target.x;s.y=Math.min(.89,target.y+.13);s.vx=0;s.vy=0;
 return {hit:true,message:(s.done?'Course cleared. ':'')+target.name+' caught.'};
}
