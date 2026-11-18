export const groups=Object.freeze([10,8,6,5,4,10,9,2]);
export const notes=Object.freeze(["F♯","G♯","A♯","C♯","D♯"]);
export const pairs=Object.freeze([[0,3],[1,4],[2,0],[3,1],[4,2]]);
export const moves=Object.freeze(["up","down","up","down","left","right","left","right","left","right","left","left","left","right","left","left","left"]);
export const identities=Object.freeze(["Will","Wheel","Way"]);
export const limits=Object.freeze({families:172,clover:1382,supernodes:732000000,omni:126000000000});

export function rhythm(step){
  if(!Number.isSafeInteger(step))throw RangeError("Enter a whole-number tick.");
  const phase=((step%221)+221)%221;
  return {tick:step,phase,cycle13:phase%13,cycle17:phase%17,align:phase===0,joint_period:221};
}

export function score(){
  return {groups,notes,pairs,total_pulses:groups.reduce((a,b)=>a+b,0),moves};
}

