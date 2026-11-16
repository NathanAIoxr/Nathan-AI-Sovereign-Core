import { HOOK, heldPoint, hashSeed } from './physics.mjs';

export function createScene(canvas) {
  const cx = canvas.getContext('2d');
  let width = 0, height = 0, wall, view = false, ratio = 1, theme;
  const flecks = Array.from({length: 380}, (_, i) => {
    const f = hashSeed(`grain:${i}`);
    return [(f & 1023)/1023, ((f >>> 10)&1023)/1023, ((f >>> 20)&255)/255];
  });
  function setSize(flat, board) {
    const box = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    if (box.width === width && box.height === height && flat === view && ratio === scale && theme===board) return;
    width = box.width; height = box.height; view = flat; ratio = scale; theme=board;
    canvas.width = Math.max(1, Math.round(width*scale)); canvas.height = Math.max(1, Math.round(height*scale));
    cx.setTransform(scale,0,0,scale,0,0);
    wall = document.createElement('canvas');
    wall.width = canvas.width; wall.height = canvas.height;
    const p = wall.getContext('2d');
    p.scale(scale,scale);
    backdrop(p);
  }
  function world(p) {
    if (view) {
      return { x:width/2 + p.x * width * .40, y:height*(.67-.36*p.z/1.47), scale:height*.69 };
    }
    const s = height*3.75/(5.5+p.z);
    const focalY = height*.30;
    return { x:width/2+p.x*s, y:focalY - (p.y + 1.37)*s + height*.105*(1.47-p.z), scale:s };
  }
  function line(p, points, color, size) {
    p.beginPath(); p.moveTo(...points[0]);
    points.slice(1).forEach(pt => p.lineTo(...pt));
    p.strokeStyle = color; p.lineWidth = size; p.stroke();
  }
  function backdrop(p) {
    const gradients = p.createLinearGradient(0,0,width,height);
    gradients.addColorStop(0,theme.palette[0]); gradients.addColorStop(.49,theme.palette[1]); gradients.addColorStop(1,theme.palette[2]);
    p.fillStyle = gradients; p.fillRect(0,0,width,height);
    const sill = height*.81;
    for (let i=0;i<12;i++) {
      const x = i*width/12;
      line(p,[[x,0],[x,sill]],'#1d100a91',2.3);
      line(p,[[x+2,0],[x+2,sill]],'#c48b5438',1);
    }
    for (const [a,b,f] of flecks) {
      const x = a*width, y = b*sill;
      p.beginPath(); p.moveTo(x,y);
      p.bezierCurveTo(x+f*5,y+height*.02,x-f*4,y+height*.045,x+f*3,y+height*(.047+f*.17));
      p.strokeStyle = f>.5 ? '#d6aa7a29' : '#210f0b37'; p.lineWidth=.45+f;
      p.stroke();
    }
    const floor = p.createLinearGradient(0,sill,0,height);
    floor.addColorStop(0,'#402718'); floor.addColorStop(1,'#21140d');
    p.fillStyle=floor; p.fillRect(0,sill,width,height-sill);
    line(p,[[0,sill],[width,sill]],'#201108',5);
    line(p,[[0,sill+3],[width,sill+3]],'#9967465e',1.3);
    for (let i=-7;i<=7;i++) line(p,[[width/2+i*width/12,sill],[width/2+i*width/7,height]],'#201209b8',1.3);
    for (const y of [.86,.94]) line(p,[[0,height*y],[width,height*y]],'#2a190ee8',1.3);
    const light = p.createRadialGradient(width*.5,height*.21,4,width*.5,height*.3,Math.max(width*.64,height*.61));
    light.addColorStop(0,'#ffcd773d'); light.addColorStop(.48,'#f7a95b10'); light.addColorStop(1,'#080402ab');
    p.fillStyle=light; p.fillRect(0,0,width,height);
    const h = world(HOOK);
    const boardW = Math.min(width*.44,height*.43), boardH = height*.27;
    const bx = h.x-boardW/2, by = h.y-boardH*.5;
    p.save(); p.shadowColor='#130a05'; p.shadowBlur=19; p.shadowOffsetY=8;
    p.beginPath(); p.roundRect(bx,by,boardW,boardH, Math.max(8,height*.023));
    const board=p.createLinearGradient(0,by,boardW,by+boardH);
    board.addColorStop(0,'#55301e'); board.addColorStop(.6,'#8d5230'); board.addColorStop(1,'#5b3320');
    p.fillStyle=board; p.fill(); p.restore();
    p.strokeStyle='#bb84557d'; p.lineWidth=2; p.stroke();
    for (let y = by+9; y < by+boardH-8; y+=4) {
      const inset = 9+hashSeed(Math.round(y))%12;
      line(p,[[bx+inset,y],[bx+boardW-inset,y]],y%3<1?'#efb47533':'#42251836',.65);
    }
    for(let i=0;i<4;i++){
      const x=bx+(i%2?boardW-12:12), y=by+(i>1?boardH-12:12);
      p.beginPath();p.arc(x,y,2.5,0,Math.PI*2);p.fillStyle='#211711';p.fill();
      line(p,[[x-1.4,y+1],[x+1.4,y-1]],'#c59a69',.65);
    }
    p.beginPath();p.arc(h.x,h.y,12,0,Math.PI*2);p.fillStyle='#37251b';p.fill();p.strokeStyle='#c89e71';p.lineWidth=1.7;p.stroke();
    p.strokeStyle='#c39257';p.lineWidth=5;p.lineCap='round';
    p.beginPath();p.moveTo(h.x,h.y-9);p.lineTo(h.x,h.y+4);p.bezierCurveTo(h.x,h.y+15,h.x+12,h.y+14,h.x+11,h.y+5);p.stroke();
    p.strokeStyle='#ffdb9b';p.lineWidth=1.5;p.stroke();p.lineCap='butt';
    if (view) {
      p.font='600 12px system-ui';p.textAlign='center';p.fillStyle='#e5c99a';p.fillText('HOOK',h.x,h.y-boardH*.26);
      const y = height*.74;
      line(p,[[width*.29,y],[width*.71,y]],'#e7b28046',1);
      p.fillText('RELEASE LINE',width/2,y+18);
    }
  }
  function draw({ point, phase, color, flat, guide, board }) {
    setSize(flat,board);
    if (!width || !height) return;
    cx.clearRect(0,0,width,height);
    cx.drawImage(wall,0,0,width,height);
    const start = {x:width/2,y:Math.max(6,height*.018)};
    const end = world(point);
    const radius = Math.max(11,end.scale*.105);
    if (guide) {
      const h=world(HOOK);
      cx.save(); cx.setLineDash([3,7]);
      line(cx,[[h.x,h.y+25],[end.x,end.y-radius-11]],'#ffe2ad75',1.2);
      cx.restore();
    }
    const sx=end.x+(end.x-start.x)*.06, sy=end.y+radius*1.72;
    cx.beginPath();cx.ellipse(sx,sy,radius*1.05,radius*.28,0,0,Math.PI*2);
    cx.fillStyle='#170d0790';cx.fill();
    line(cx,[[start.x+2,start.y],[end.x+2,end.y-radius+2]],'#1a100bc5',5);
    line(cx,[[start.x,start.y],[end.x,end.y-radius]],'#d0aa73',3.1);
    cx.save();cx.setLineDash([1.2,3.1]);line(cx,[[start.x,start.y],[end.x,end.y-radius]],'#755131',1);cx.restore();
    cx.beginPath();cx.ellipse(start.x,start.y,11,4,0,0,Math.PI*2);cx.fillStyle='#1e160f';cx.fill();cx.strokeStyle='#a7794c';cx.lineWidth=1;cx.stroke();
    cx.beginPath();cx.arc(end.x,end.y-radius,3.4,0,Math.PI*2);cx.fillStyle='#dfba83';cx.fill();
    const g=cx.createLinearGradient(end.x-radius,end.y-radius,end.x+radius,end.y+radius);
    g.addColorStop(0,'#fff4d2');g.addColorStop(.35,color);g.addColorStop(.74,'#926031');g.addColorStop(1,color);
    cx.beginPath();cx.ellipse(end.x,end.y,radius*(view?1:.91),radius,.10,0,Math.PI*2);
    cx.strokeStyle='#211207';cx.lineWidth=radius*.29+3;cx.stroke();
    cx.strokeStyle=g;cx.lineWidth=Math.max(3,radius*.24);cx.stroke();
    if(phase==='ready'||phase==='held'){
      cx.save();cx.setLineDash([4,7]);cx.beginPath();cx.arc(end.x,end.y,radius+10,0,Math.PI*2);
      cx.strokeStyle='#ffdc99a8';cx.lineWidth=1;cx.stroke();cx.restore();
    }
    return {x:end.x,y:end.y,r:radius};
  }
  return { draw, hit(point, x, y) {
    const s=world(point ?? heldPoint());
    return Math.hypot(x-s.x,y-s.y)<=Math.max(42,s.scale*.105+22);
  }};
}
