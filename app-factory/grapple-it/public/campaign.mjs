
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const ERAS=[
 {id:'naval',name:'Ancient Naval Warfare',place:'Roman harbor',target:'Training barge',zone:.12,speed:1.1,amplitude:.15,drift:.10,load:.19,tension:.20,slack:.23,ink:'#cbe586',water:'#254a58',tip:'Wait until the barge ring enters the center bracket. Cast, then alternate Reel and Ease to keep the line in the green.'},
 {id:'castle',name:'Castle Walls',place:'Lantern court',target:'Lantern ring',zone:.095,speed:1.45,amplitude:.20,drift:.13,load:.17,tension:.25,slack:.21,ink:'#ffe09e',water:'#40354e',tip:'The lantern swings faster than the barge. Watch for the center bracket to light up.'},
 {id:'frontier',name:'Wild West Frontier',place:'Frontier track',target:'Stagecoach prop',zone:.085,speed:1.65,amplitude:.27,drift:.15,load:.20,tension:.31,slack:.23,ink:'#ffc993',water:'#65413c',tip:'Loop the stagecoach prop and reel in short bursts. Ease early to avoid breaking the line.'},
 {id:'rescue',name:'Modern Rescue',place:'Cliff rescue course',target:'Rescue sled',zone:.075,speed:1.8,amplitude:.28,drift:.18,load:.20,tension:.34,slack:.23,ink:'#bcefff',water:'#284a42',tip:'Secure the rescue sled. Watch the tension meter when the load shifts.'},
];
const mission=(era,id,name,place,target,extra)=>({...era,id,name,place,target,chapter:era.id,...extra});
export const MISSIONS=[
 ERAS[0],
 mission(ERAS[0],'trireme','Trireme Tow','Ancient oared harbor','Trireme', {speed:1.55,amplitude:.23,load:.22,drift:.20,tip:'Two vessels roll in the waves. Time the cast, then bring the empty trireme alongside in short pulls.'}),
 mission(ERAS[0],'corvus','Corvus Crossing','First Punic War gallery','Roman boarding bridge', {mechanic:'bridge',action:'Lower bridge',ready:'Decks aligned. Lower the bridge when the marker reaches gold.', tip:'Close the gap, then time the arcade bridge drop. The corvus exhibit is a separate Roman boarding device.'}),
 ERAS[1],
 mission(ERAS[1],'stone-wall','Stone Wall Ascent','Kaginawa climbing court','Stone parapet', {mechanic:'climb',action:'Climb',zone:.10,load:.26,tip:'Latch onto the parapet. Toggle Climb to ascend or Rest to steady the rope.'}),
 mission(ERAS[1],'moat','Moat Swing','Castle crossing','Far-bank lantern', {mechanic:'swing',action:'Release swing',ready:'Swing ready. Release as the marker passes center.',load:.31,tip:'Grapple the lantern anchor, take up the slack, then release at the center of the swing.'}),
 ERAS[2],
 mission(ERAS[2],'chandelier','Saloon Chandelier','Frontier saloon','Swinging chandelier', {mechanic:'swing',action:'Release swing',ready:'The chandelier is swinging. Release as the marker passes center.',speed:2.2,load:.29,tip:'Snag the chandelier, gather the line, and release above the landing mark.'}),
 mission(ERAS[2],'cattle','Runaway Cattle','Frontier ranch','Runaway steer', {mechanic:'lasso',action:'Guide',load:.30,tip:'Lasso the runaway steer. Guide it toward the gate and ease before tension peaks.'}),
 ERAS[3],
 mission(ERAS[3],'skyline','Skyscraper Gap','Rooftop crossing','Rooftop anchor', {mechanic:'swing',action:'Cross gap',ready:'Line secured. Cross when the marker reaches gold.',zone:.095,load:.27,tip:'Make the arcade rescue line reach the opposite rooftop, then time the crossing.'}),
 mission(ERAS[3],'hiker','Cliff Hiker Rescue','Cliff ledge','Hiker’s rescue sled', {mechanic:'rescue',action:'Lift',load:.26,tip:'Attach to the rescue sled. Lift in short bursts and keep tension in the narrower green band.'}),
 {id:'salvage-pier',name:'Salvage Pier',place:'Working pier',target:'Floating cargo ring',zone:.087,speed:1.3,amplitude:.24,drift:.20,load:.18,tension:.24,slack:.23,ink:'#b8eee4',water:'#255357',tip:'Cast through the tide. Start reeling when the line enters the green band.'},
 {id:'night-market',name:'Night Market',chapter:'after-hours',place:'Lantern market',target:'Banner ring',zone:.079,speed:2.05,amplitude:.25,drift:.11,load:.23,tension:.26,slack:.20,ink:'#e7c1ff',water:'#403858',tip:'The banner moves quickly. Wait for its next pass and release while the ring is centered.'},
 {id:'floodgate',name:'Floodgate',chapter:'after-hours',place:'River waterworks',target:'Gate buoy',zone:.074,speed:1.63,amplitude:.27,drift:.26,load:.18,tension:.29,slack:.26,ink:'#aeeeff',water:'#24506b',tip:'Read the tension between surges. Ease before the meter reaches red.'},
 {id:'hog-wild',name:'Hog Wild',chapter:'after-hours',place:'PK’s barn',target:'Swinging feed bucket',zone:.071,speed:1.90,amplitude:.28,drift:.21,load:.22,tension:.31,slack:.25,ink:'#ffb996',water:'#614039',tip:'Catch the bucket inside the bracket. Alternate short reels and longer rests.'},
];
export const PK_LINE='PK .. that’s the wild card .. that boy ain’t rite …';
export function dailyCourse(day){
 const n=[...day].reduce((value,char)=>(Math.imul(31,value)+char.charCodeAt(0))>>>0,17);
 const base=ERAS[n%ERAS.length];
 return {...base,id:'daily',name:'Daily Grapple',zone:base.zone*.95,offset:(n%314)/100};
}
export function freshLine(course,pk=false){
 return {course,pk,t:0,phase:'aim',distance:1,stress:.20,casts:0,breaks:0,hold:false,actionMisses:0};
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
 const [low,high]=tensionBand(c);
 if(s.hold&&s.stress>=low&&s.stress<=high)s.distance-=c.load*dt;
 if(c.mechanic==='lasso'&&!s.hold)s.distance=Math.min(1,s.distance+.023*dt);
 if(s.distance<=0){
  s.hold=false;s.distance=0;
  if(c.ready){s.phase='action';s.actionFrom=s.t;return c.ready;}
  s.phase='won';
  return c.target+' secured.';
 }
 return null;
}
export function tensionBand(course){
 if(course.mechanic==='rescue')return [.29,.64];
 if(course.mechanic==='climb')return [.24,.70];
 return [.26,.78];
}
export function actionMarker(s){
 return .5+.38*Math.sin((s.t-s.actionFrom)*3.4-1.3);
}
export function doAction(s){
 if(s.phase!=='action')return null;
 if(Math.abs(actionMarker(s)-.5)>.095){
  s.actionMisses++;
  return 'Missed the mark. Time the pass through gold.';
 }
 s.phase='won';
 return s.course.action+' complete.';
}
export function medal(s){
 return s.casts===1&&s.breaks===0&&s.actionMisses===0?'Gold':s.breaks===0?'Silver':'Bronze';
}
