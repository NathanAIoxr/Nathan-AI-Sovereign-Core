import {TAU,clamp,project} from "./track-baller.mjs";
import {dialTargets,guardOpen,getSwordTarget,potteryTargets,pockets,globeTargets,vortexFor} from "./games.mjs";

export const colors={storm:"#77efd0",whirl:"#76ceff",sword:"#ffd191",ball:"#d8f98e",magic:"#c5a5ff",
  dj:"#f7a4d8",forge:"#ffc075",globe:"#87e3bb",dial:"#e3da9c",pottery:"#ffb5a4",lift:"#9bd3ff",fish:"#a0e4c5"};
export const pins=q=>globeTargets.map(p=>project(q,p));
const amber="#ffc980", white="#e9f4ef";
const mesh=[];
for(let i=-2;i<=2;i++){
  mesh.push(Array.from({length:73},(_,j)=>{
    const lat=i*Math.PI/7,a=j*TAU/72;
    return [Math.cos(lat)*Math.cos(a),Math.sin(lat),Math.cos(lat)*Math.sin(a)];
  }));
}
for(let i=0;i<6;i++){
  mesh.push(Array.from({length:73},(_,j)=>{
    const a=j*TAU/72, lon=i*Math.PI/6;
    return [Math.cos(a)*Math.cos(lon),Math.sin(a),Math.cos(a)*Math.sin(lon)];
  }));
}
export function makeRenderer(canvas){
  const c=canvas.getContext("2d");
  let width=0,height=0,scale=1;
  function fit(){
    const box=canvas.getBoundingClientRect();
    const ratio=Math.min(devicePixelRatio||1,2);
    if(width===box.width&&height===box.height&&canvas.width===Math.round(width*ratio)) return;
    width=box.width;height=box.height;scale=Math.min(width,height);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    c.setTransform(ratio,0,0,ratio,0,0);
  }
  function pos(x,y){return [width/2+x*scale,height/2+y*scale];}
  function circle(x,y,r,fill,stroke,size=1){
    c.beginPath();c.arc(x,y,r,0,TAU);
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=size;c.stroke();}
  }
  function disc(x,y,r,fill,stroke,size=1){circle(...pos(x,y),r*scale,fill,stroke,size);}
  function stroke(points,color,size=2,mapped=true){
    if(points.length<2) return;
    const toXY=mapped?([x,y])=>pos(x,y):p=>p;
    c.beginPath();c.moveTo(...toXY(points[0]));
    for(let i=1;i<points.length;i++) c.lineTo(...toXY(points[i]));
    c.strokeStyle=color;c.lineWidth=size;c.stroke();
  }
  function label(text,x,y,color=white,size=13){
    c.fillStyle=color;c.font="700 "+size+"px monospace";c.textAlign="center";c.textBaseline="middle";
    c.fillText(text,...pos(x,y));
  }
  function arc(x,y,r,a,b,color,size=2){
    c.beginPath();c.arc(...pos(x,y),r*scale,a,b,b<a);c.strokeStyle=color;c.lineWidth=size;c.stroke();
  }
  function sphere(q,x,y,r,a,showPins=false){
    const [px,py]=pos(x,y),rr=r*scale;
    const light=c.createRadialGradient(px-rr*.32,py-rr*.34,rr*.03,px,py,rr);
    light.addColorStop(0,"#425c64");light.addColorStop(.68,"#233743");light.addColorStop(1,"#0c171d");
    circle(px,py,rr+5,"#0c191e",a+"42");
    circle(px,py,rr,light,a+"cd",2);
    for(const ring of mesh){
      let visible=[];
      for(const p of ring){
        const [u,v,z]=project(q,p);
        if(z>=0) visible.push([px+u*rr,py+v*rr]);
        else {stroke(visible,a+"66",1,false);visible=[];}
      }
      stroke(visible,a+"66",1,false);
    }
    const marks=showPins?pins(q):[project(q,[.55,-.13,.825])];
    marks.forEach(([u,v,z])=>{if(z>=0) circle(px+u*rr,py+v*rr,Math.max(3,rr*.052),showPins?amber:a);});
  }
  function vortex(v,time,a){
    for(let k=0;k<5;k++){
      const points=Array.from({length:68},(_,j)=>{
        const f=j/67, theta=k*TAU/5+v.sign*(f*5.8+time*3.5);
        return [v.x+Math.cos(theta)*v.radius*f,v.y+Math.sin(theta)*v.radius*f];
      });
      stroke(points,a,2);
    }
  }
  function meter(labelText,value,x,y,w,a,range){
    label(labelText,x,y-.058,a,12);
    stroke([[x-w/2,y],[x+w/2,y]],"#37525d",12);
    if(range) stroke([[x+(range[0]-.5)*w,y],[x+(range[1]-.5)*w,y]],"#458962",12);
    disc(x+(clamp(value,0,1)-.5)*w,y,.017,a,white);
  }
  function ticks(x,y,r,color){
    for(let i=0;i<24;i++){
      const a=i*TAU/24;
      stroke([[x+Math.cos(a)*(r-.018),y+Math.sin(a)*(r-.018)],[x+Math.cos(a)*r,y+Math.sin(a)*r]],color,i%6===0?3:1);
    }
  }
  function draw(game,q,live,trace,replaying,reduced){
    if(!scale) return;
    const a=colors[game.id], time=reduced?0:game.time;
    const background=c.createRadialGradient(width/2,height/2,10,width/2,height/2,Math.max(width,height)*.65);
    background.addColorStop(0,"#223940");background.addColorStop(1,"#0a161e");
    c.fillStyle=background;c.fillRect(0,0,width,height);c.lineCap="round";c.lineJoin="round";
    for(let x=15;x<width;x+=25) for(let y=15;y<height;y+=25) circle(x,y,.8,"#93bcc233");

    switch(game.id){
      case "storm":case "whirl":
        for(const r of [.17,.25,.33,.41]) disc(0,0,r,null,a+"28");
        sphere(q,0,0,.115,a);
        for(const d of game.debris) if(d.active) disc(d.x,d.y,.011,game.id==="whirl"?"#fce8b7":amber);
        if(game.vortex) vortex(game.vortex,time,a+"95");
        if(live){const v=vortexFor(game,live);if(v) vortex(v,time,a+"bb");}
        if(game.id==="whirl") label(game.progress%2?"↶":"↷",0,.39,a,28);
        break;
      case "sword":{
        const target=getSwordTarget(game), a0=target.angle;
        disc(target.x,target.y,.084,"#362d27",a,2);
        disc(target.x,target.y,.057,null,a+"75");
        const tip=[target.x+Math.cos(a0)*.15,target.y+Math.sin(a0)*.15];
        stroke([[target.x-Math.cos(a0)*.14,target.y-Math.sin(a0)*.14],tip],a,3);
        for(const side of [-.58,.58]) stroke([tip,[tip[0]-Math.cos(a0+side)*.044,tip[1]-Math.sin(a0+side)*.044]],a,3);
        const guard=guardOpen(game.clock);
        disc(.25,.29,.061,guard?"#33594d":null,guard?"#98f8b3":a+"56",2);
        arc(.25,.29,.061,-Math.PI/2,TAU*(game.clock%2.6/2.6)-Math.PI/2,guard?"#b1ffc7":a,3);
        label("GUARD",.25,.29,guard?"#c4ffcb":a,10);
        if(game.spark) disc(0,0,.1+(.45-game.spark)*.15,null,a+"8c",3);
        break;
      }
      case "ball":
        pockets.forEach((x,i)=>{
          disc(x,-.30,.067,"#0a171a",a,2);
          label(i===1?"100":"60",x,-.3,a);
          stroke([[x,-.218],[x,.25]],a+"3a",1);
        });
        sphere(q,game.shot?.x??0,game.shot?.y??.36,.065,a);
        break;
      case "magic":{
        for(const x of [-.15,.15]) disc(x,0,.15,null,a+"65",2);
        if(game.spark){
          for(const n of [.095,.145,.185]) disc(0,0,n+Math.sin(time*5)*.016,null,a,3);
          label(game.spark>.69?"PORTAL":"WARD",0,0,white);
        }else label("∞",0,0,a,43);
        break;
      }
      case "dj":
        sphere(q,0,0,.18,a);ticks(0,0,.26,a);
        disc(0,0,.225,null,a+"80");
        arc(0,0,.247,-Math.PI/2,TAU*(game.clock%.6/.6)-Math.PI/2,a,4);
        if(game.spark) disc(0,0,.285,null,a+"a0",2);
        label("100 BPM",0,.34,a);break;
      case "forge":
        for(let i=0;i<11;i++){
          const x=(i%6-.5*5)*.047,y=.16+(i>5?.05:0);
          disc(x,y,.027,"#69442e",a+"83",2);
        }
        for(let i=0;i<10;i++){
          const x=(i-4.5)*.03,y=.14-game.heat*(.12+((i*7)%5)*.035)*(reduced?1:.87+Math.sin(time*6+i)*.13);
          stroke([[x,.14],[x-.015,y+.044],[x,y]],i%2?"#ff8c65":a,Math.max(1,game.heat*5));
        }
        meter("FORGE HEAT",game.heat,0,.34,.55,a,[.72,1]);break;
      case "globe":
        sphere(q,0,0,.305,a,true);
        disc(0,0,.058,null,white,2);
        label(game.landmarks.size+" / "+globeTargets.length+" LANDMARKS",0,.39,a);
        break;
      case "dial":{
        const target=dialTargets[game.progress%dialTargets.length], reading=live?.dial??game.dial;
        sphere(q,0,0,.14,a);ticks(0,0,.265,a+"b5");
        disc(0,0,.224,null,a+"56",1);
        const targetAngle=-Math.PI/2+target*TAU;
        disc(Math.cos(targetAngle)*.246,Math.sin(targetAngle)*.246,.015,a,white,2);
        arc(0,0,.222,-Math.PI/2,-Math.PI/2+reading,a,4);
        label((target>0?"↷ ":"↶ ")+Math.round(Math.abs(target)*360)+"°",0,.34,a);
        break;
      }
      case "pottery":{
        const ys=[-.22,0,.22];
        const shape=game.clay.flatMap((r,i)=>[[-r*.125,ys[i]-.055],[-r*.125,ys[i]+.055]]);
        shape.push(...game.clay.flatMap((r,i)=>[[r*.125,ys[i]-.055],[r*.125,ys[i]+.055]]).reverse(),shape[0]);
        c.beginPath();c.moveTo(...pos(...shape[0]));
        for(const p of shape.slice(1)) c.lineTo(...pos(...p));
        c.fillStyle="#7a4e45";c.fill();
        stroke(shape,a,2);
        ys.forEach((y,i)=>{
          const r=potteryTargets[i]*.125;
          if(game.band===i) stroke([[-.265,y],[.265,y]],a+"5b",26);
          c.setLineDash([4,5]);stroke([[-r,y],[r,y]],white,2);c.setLineDash([]);
          disc(-.25,y,.013,game.band===i?a:"#6f6461");
        });
        break;
      }
      case "lift":{
        const y=.33-game.height*.67;
        stroke([[.27,-.23],[.27,-.015]],"#59b583",10);
        stroke([[.27,-.34],[.27,.33]],a+"70",1);
        disc(.27,y,.021,a,white);
        const propOffset=reduced?.15:Math.cos(time*(2+game.lift*38))*.15;
        stroke([[-propOffset,y-.049],[propOffset,y-.049]],a,4);
        stroke([[0,y-.045],[0,y]],a,3);
        disc(0,y,.045,"#243f57",a,2);
        meter("LIFT",game.lift,0,.387,.52,a);break;
      }
      case "fish":{
        const ix=.26*(1-game.reel);
        for(let i=0;i<4;i++) stroke([[-.32,-.15+i*.088],[-.03,-.16+i*.088],[.32,-.14+i*.088]],a+"40",1);
        sphere(q,-.18,.08,.087,a);
        stroke([[-.16,.025],[-.06,-.17],[ix,-.05]],a,2);
        disc(ix,-.05,.023,amber,white);
        meter("LINE TENSION",game.tension,0,.31,.56,a,[.32,.76]);break;
      }
    }
    if(trace.length>1){
      const path=trace.map(({x,y})=>[x,y]);
      stroke(path,a+(replaying?"45":"28"),8);stroke(path,a+(live||replaying?"ed":"77"),2);
    }
  }
  return {fit,draw};
}
