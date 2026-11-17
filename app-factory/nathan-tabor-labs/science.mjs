import field from './field.mjs';

const BASIS = ['00', '01', '10', '11'];
export const SIZE=10000;
export const DIVISIONS=[1,2,4,8];

export function quantum(angle=90, phase=0, seconds=1e-15) {
  const a=Math.cos(angle*Math.PI/360);
  const b=Math.sin(angle*Math.PI/360);
  const phi=phase*Math.PI/180;
  const state=[[a,0],[0,0],[0,0],[b*Math.cos(phi),b*Math.sin(phi)]];
  const z=state.map(([re,im])=>re*re+im*im);
  const x=BASIS.map((_,i)=>(1+(i===0||i===3?1:-1)*2*a*b*Math.cos(phi))/4);
  const sigma=1e-9;
  const mass=9.1093837139e-31;
  return {angle,phase,basis:BASIS,state,probabilities:{Z:z,X:x},width:{initialMeters:sigma,seconds,finalMeters:field.gaussianWidth(sigma,seconds,mass)},
    execution:"Classical simulation of RY, CNOT and relative phase. At 90° and 0° this circuit prepares the Bell state Φ+."};
}

export function chip(a,b,carryIn=0) {
  let carry=carryIn, sum=0;
  const stages=[];
  for(let bit=0;bit<4;bit++){
    const left=(a>>bit)&1,right=(b>>bit)&1;
    const out=left^right^carry, next=(left&right)|(carry&(left^right));
    stages.push({bit,a:left,b:right,carryIn:carry,sum:out,carryOut:next});
    sum|=out<<bit;
    carry=next;
  }
  return {a,b,carryIn,sum,carryOut:carry,value:sum+16*carry,stages,execution:"4T Clover companion · Boolean ripple-carry model"};
}

export function shard(parts,index){
  const start=Math.floor(index*SIZE/parts)+1;
  const end=Math.floor((index+1)*SIZE/parts);
  let sum=0,squares=0;
  for(let n=start;n<=end;n++){
    sum+=n;
    squares+=n*n;
  }
  return {index,parts,start,end,count:end-start+1,sum,squares};
}
export function reduceShards(shards){
  return shards.reduce((totals,x)=>({count:totals.count+x.count,sum:totals.sum+x.sum,squares:totals.squares+x.squares}),{count:0,sum:0,squares:0});
}

export function runChecks() {
  const bell=quantum(), minus=quantum(90,180);
  const expected={count:SIZE,sum:SIZE*(SIZE+1)/2,squares:SIZE*(SIZE+1)*(2*SIZE+1)/6};
  const result=reduceShards(Array.from({length:8},(_,i)=>shard(8,i)));
  const within=(a,b)=>Math.abs(a-b)<1e-12;
  const checks=[
    {name:"Bell-state Z populations",passed:[0.5,0,0,0.5].every((p,i)=>within(bell.probabilities.Z[i],p))},
    {name:"X-basis phase reversal",passed:within(bell.probabilities.X[0],0.5)&&within(minus.probabilities.X[1],0.5)},
    {name:"Gaussian packet broadens",passed:bell.width.finalMeters>bell.width.initialMeters && quantum(90,0,0).width.finalMeters===bell.width.initialMeters},
    {name:"All 512 four-bit adder inputs",passed:Array.from({length:512},(_,index)=>{
      const a=index&15,b=(index>>4)&15,c=index>>8;
      return chip(a,b,c).value===a+b+c;
    }).every(Boolean)},
    {name:"Eight shards match independent formulas",passed:Object.keys(expected).every(k=>result[k]===expected[k])}
  ];
  return {checks,expected,mapReduce:result,bellZ:bell.probabilities.Z,chipExample:chip(15,15,1).value,passed:checks.every(x=>x.passed)};
}
