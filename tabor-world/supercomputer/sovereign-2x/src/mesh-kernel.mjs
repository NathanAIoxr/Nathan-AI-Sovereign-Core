export const kernel="fp64-dot-lcg32-v1";
export const maxTerms=16384;
export const maxShards=4;
export const validSeed=seed=>Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff;
const multiplier=1664525;
const increment=1013904223;

export function jump(seed,steps) {
  let mul=multiplier,add=increment,a=1,b=0;
  for(let remaining=steps;remaining>0;remaining=Math.floor(remaining/2)) {
    if(remaining%2){
      a=Math.imul(a,mul)>>>0;
      b=(Math.imul(b,mul)+add)>>>0;
    }
    add=Math.imul(add,(mul+1)>>>0)>>>0;
    mul=Math.imul(mul,mul)>>>0;
  }
  return (Math.imul(a,seed)+b)>>>0;
}

export function partition(seed,terms,shards) {
  if(!validSeed(seed)||!Number.isInteger(terms)||terms<64||terms>maxTerms||
    !Number.isInteger(shards)||shards<1||shards>maxShards) {
    throw RangeError("Use an unsigned 32-bit seed, 64–16,384 terms and 1–4 shards.");
  }
  return Array.from({length:shards},(_,index)=>{
    const offset=Math.floor(index*terms/shards);
    const count=Math.floor((index+1)*terms/shards)-offset;
    return {index,offset,count,start:jump(seed,2*offset),slot:(seed+index)%320};
  });
}

export function fp64(start,count) {
  let state=start, result=0;
  for(let i=0;i<count;i++){
    state=(Math.imul(state,multiplier)+increment)>>>0;
    const left=(state>>>22)/1024;
    state=(Math.imul(state,multiplier)+increment)>>>0;
    result+=left*((state>>>22)/1024);
  }
  return result*1048576;
}

// Each operand is a 10-bit integer divided by 2^10. The replay works in exact integer units of 2^-20.
export function replay(start,count) {
  let state=start, scaled=0;
  for(let i=0;i<count;i++){
    state=(state*1664525+1013904223)>>>0;
    const left=state>>>22;
    state=(state*1664525+1013904223)>>>0;
    scaled+=left*(state>>>22);
  }
  return scaled;
}
