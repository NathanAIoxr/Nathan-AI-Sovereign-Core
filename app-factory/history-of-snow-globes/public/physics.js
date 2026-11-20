export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function evaluate(mode,v,shaken=false){
  switch(mode){
    case 'kiln': {
      const lime=100-v.silica-v.soda;
      return {ok:v.silica>=68&&v.silica<=76&&v.soda>=12&&v.soda<=20&&lime>=7&&lime<=15&&v.heat>=68&&v.heat<=91,
        text:'Lime remainder '+lime+'%. Aim for 68–76% silica, 12–20% soda, 7–15% lime and 68–91% virtual heat.'};
    }
    case 'solar':
    case 'candle': {
      const focus=29/(v.index-1), ideal=mode==='candle'?-4:0, offset=v.tilt-ideal;
      return {ok:Math.abs(focus-v.distance)<4&&Math.abs(offset)<3,focus,offset,
        text:'Focus '+focus.toFixed(1)+' mm · target '+v.distance+' mm · offset '+offset+'°. Adjust until both distances and the center line match.'};
    }
    case 'pressure': {
      const difference=v.pressure-101+(v.fill-55)*0.55;
      return {ok:Math.abs(difference)<2.5&&v.fill>=45&&v.fill<=66,difference,
        text:'Chamber difference '+difference.toFixed(1)+' kPa · optical index '+v.index.toFixed(2)+'. Aim for near-zero difference with 45–66% fill.'};
    }
    case 'weather': {
      const crystals=clamp((25-v.temp)/22,0,1);
      const float=clamp((1.02-(v.temp-14)*0.0015-v.density)*19,-1,1);
      return {ok:crystals>=0.55&&Math.abs(v.pressure-1013)<=5,crystals,float,
        text:Math.round(crystals*100)+'% crystal display · barometer '+v.pressure+' hPa · bulb '+(float>0.02?'rising':float<-.02?'sinking':'balanced')+'.'};
    }
    case 'snow': {
      const seconds=clamp(1.9*v.viscosity/(v.density*v.size*v.size),0.25,45);
      return {ok:seconds>=8&&shaken,seconds,text:'Estimated settling time '+seconds.toFixed(1)+' s. Smaller, less dense flakes and thicker fluid settle more slowly.'};
    }
    case 'lava': {
      const circulation=clamp((v.temp-37-v.density*4)/(18+2*v.viscosity),0,1);
      return {ok:circulation>=.5,circulation,text:'Circulation '+Math.round(circulation*100)+'%. Warm droplets rise. Cooling at the top turns them back down.'};
    }
    default: throw Error('Unknown experiment: '+mode);
  }
}
export function advance(p,dt,mode,v,measure){
  const drag=Math.exp(-dt*(2+0.29*(v.viscosity||1)));
  if(mode==='lava'){
    p.y+=dt*p.direction*(.07+measure.circulation*.37);
    if(p.y<=-.78||p.y>=.78){p.y=clamp(p.y,-.78,.78);p.direction*=-1;}
    p.x=clamp(p.x+Math.sin(p.y*8+p.phase)*dt*.11,-.53,.53);
    return;
  }
  p.vx*=drag;
  p.vy*=drag;
  p.x+=p.vx*dt;
  p.y+=(p.vy+.48/(measure.seconds+.45))*dt;
  const d=Math.hypot(p.x,p.y);
  if(d>.94){
    const nx=p.x/d, ny=p.y/d;
    p.x=nx*.94; p.y=ny*.94;
    const outward=p.vx*nx+p.vy*ny;
    if(outward>0){p.vx-=1.3*outward*nx;p.vy-=1.3*outward*ny;}
    if(p.y>0)p.x*=1-dt*.5;
  }
}
