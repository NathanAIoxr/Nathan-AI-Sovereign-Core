const NODES=16;
// Equal-distance pin constraints with a 240 Hz Verlet update.
export function makeRope(pivot, end, length) {
  const nodes=Array.from({length:NODES},(_,i)=>{
    const f=i/(NODES-1),x=pivot[0]+(end[0]-pivot[0])*f,y=pivot[1]+(end[1]-pivot[1])*f;
    return {x,y,oldX:x,oldY:y};
  });
  return {nodes,length};
}
export function stepRope(rope,pivot,end,dt) {
  const {nodes,length}=rope;
  const last=nodes.length-1;
  const span=Math.max(length,Math.hypot(end[0]-pivot[0],end[1]-pivot[1]))/last;
  [nodes[0].x,nodes[0].y]=pivot;[nodes[last].x,nodes[last].y]=end;
  for(let i=1;i<last;i++){
    const node=nodes[i],{x,y}=node;
    node.x+=(x-node.oldX)*.985;
    node.y+=(y-node.oldY)*.985+dt*dt*.54;
    node.oldX=x;node.oldY=y;
  }
  for(let pass=0;pass<7;pass++){
    for(let i=0;i<last;i++){
      const a=nodes[i],b=nodes[i+1], dx=b.x-a.x,dy=b.y-a.y, gap=Math.hypot(dx,dy);
      if(gap<1e-8)continue;
      const drag=(gap-span)/gap, first=i===0?0:i===last-1?1:.5,second=1-first;
      a.x+=dx*drag*first;a.y+=dy*drag*first;
      b.x-=dx*drag*second;b.y-=dy*drag*second;
    }
  }
}
