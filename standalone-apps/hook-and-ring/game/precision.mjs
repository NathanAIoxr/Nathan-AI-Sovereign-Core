const surface = .78;
const start = {x:.10,y:.73};

export const EVENTS = [
  {id:'horseshoes', name:'Horseshoes', slot:'Toss · Land', kind:'arc', target:[.73,surface], gravity:.74, wind:-.035, prop:'Horseshoe', tip:'Drop a ringer at the stake. Check how the wind changes the arc.'},
  {id:'wrap', name:'Bolas & Chain-Whips', slot:'Swing · Wrap', kind:'wrap', target:[.71,.5], gravity:.61, motion:.052, prop:'Loop', tip:'Give the loop enough spin to wrap the moving post.'},
  {id:'underwater', name:'Harpoons & Spearfishing', slot:'Cast · Catch', kind:'water', target:[.69,.52], gravity:.34, drag:1.1, current:.026, motion:.045, prop:'Bubble marker', tip:'Water slows the bubble marker. Aim for the solid beacon using the offset echo as a clue.'},
  {id:'bank', name:'Boomerangs & Chakrams', slot:'Bank · Curve', kind:'bank', target:[.78,.46], gravity:.64, prop:'Curved token', tip:'Bank around the block. Spin bends the route as the token travels.'},
  {id:'skip', name:'Skip-Stones', slot:'Flick · Skip', kind:'skip', target:[.78,.72], gravity:.8, prop:'Skipping stone', tip:'Land the first bounce before the ring. More spin keeps the stone skipping.'},
  {id:'disc', name:'Frisbee Chains', slot:'Sling · Drop', kind:'disc', target:[.81,.56], gravity:.67, wind:.035, prop:'Flying disc', tip:'Spin holds the disc up. Drop it into the chain basket from above.'},
  {id:'roman', name:'Ancient Naval Warfare', slot:'Grapple · Reel', kind:'wrap', target:[.72,.52], gravity:.66, wind:-.03, motion:.073, prop:'Anchor token', tip:'Latch onto the empty training barge as its ring rises and falls.'},
  {id:'kaginawa', name:'Castle Walls', slot:'Cast · Latch', kind:'arc', target:[.72,.34], gravity:.63, prop:'Rope token', tip:'Reach the glowing lantern ring high above the arcade wall.'},
  {id:'frontier', name:'Wild West Frontier', slot:'Lasso · Snag', kind:'wrap', target:[.78,.59], gravity:.71, motion:.087, prop:'Lasso token', tip:'Loop the ring on the rolling stagecoach prop as it crosses the lane.'},
  {id:'rescue', name:'Modern Rescue', slot:'Thread · Reel', kind:'bank', target:[.80,.39], gravity:.61, prop:'Rescue line', tip:'Thread the line around the ledge and reach the rescue dummy’s anchor.'},
];

export const SEASONS = {
  classic:{name:'Classic', sky:'#253344', floor:'#13252a', accent:'#e3ef9a', mark:''},
  winter:{name:'Winter / Christmas', sky:'#294b65', floor:'#d4e3e5', accent:'#ffd1c8', mark:'❄'},
  valentine:{name:'Valentine’s Day', sky:'#4d263c', floor:'#321525', accent:'#ffb2cf', mark:'♥'},
  halloween:{name:'Halloween', sky:'#36274f', floor:'#241936', accent:'#ffb16b', mark:'✦'},
  july:{name:'4th of July', sky:'#192e56', floor:'#3b2541', accent:'#ffdf95', mark:'✶'},
};

export const OBSTACLE = {left:.43,right:.57,top:.39,bottom:.67};
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

export function targetAt(event,time) {
  const [x,y] = event.target;
  const motion = (event.motion ?? 0) * Math.sin(time * 3.6);
  return event.id === 'frontier' ? {x:x+motion,y} : {x,y:y+motion};
}

export function simulate(event,{angle,force,spin,wild=0}) {
  const strength = force / 100;
  const rotation = spin / 100;
  const aim = angle * Math.PI / 180;
  const rate = .025;
  const gust = (event.wind ?? 0) + wild;
  const drag = event.drag ?? .06;
  const supportsBounce = event.kind === 'skip' && rotation >= .25;
  const gravity = event.gravity * (event.kind === 'disc' ? 1-.62*rotation : 1);
  let x = start.x, y = start.y;
  let vx = Math.cos(aim)*strength*(event.kind === 'water'?1.62:1.02);
  let vy = -Math.sin(aim)*strength*1.02;
  let bounce = 0, miss = 'The toss missed the target.';
  const points = [{...start,time:0}];
  for(let frame=1; frame<=160; frame++){
    const time=frame*rate;
    const target=targetAt(event,time);
    const previousY=y;
    const curve=event.kind === 'bank' ? -.72*rotation*(1-time*.9) : 0;
    vx+=(gust - drag*vx)*rate;
    vy+=(gravity + curve + (event.current ?? 0)*Math.sin(time*5) - drag*vy)*rate;
    x+=vx*rate;
    y+=vy*rate;
    if(event.kind==='bank' && x>OBSTACLE.left && x<OBSTACLE.right && y>OBSTACLE.top && y<OBSTACLE.bottom){
      miss='Hit the obstacle. Try a higher arc or change the spin.';
      points.push({x,y,time});
      break;
    }
    const near=Math.hypot(x-target.x,(y-target.y)*.86);
    const grounded=event.id==='horseshoes';
    const land=grounded ? y>=surface && previousY<surface && Math.abs(x-target.x)<.066 : near<(event.kind==='water'?.054:.047);
    const aligned=event.kind!=='wrap'||rotation>=.35;
    const dropping=event.kind!=='disc'||vy>.025;
    if(land && aligned && dropping && (event.kind!=='skip'||bounce>0)){
      points.push({x,y,time});
      return {points, success:true, message:event.kind==='wrap'?'Wrapped the post!':event.kind==='disc'?'Caught by the chains!':'Target caught!'};
    }
    if(land && !aligned) miss='The loop reached the post. Add more spin to wrap it.';
    if(y>=surface && vy>0){
      if (!supportsBounce || bounce>=2 || vy<.075){
        points.push({x,y:surface,time});
        break;
      }
      bounce++;
      y=surface;
      vy*=-.45-.29*rotation;
      vx*=.87;
    }
    points.push({x,y,time});
    if(x>1.03||x<0||y<-.55) break;
  }
  return {points,success:false,message:miss};
}
