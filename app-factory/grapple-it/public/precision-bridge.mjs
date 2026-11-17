// Universal Bridge adapter for a bottom-screen sequence and any top cartridge.
const PATTERNS=[[0,2,1],[2,0,1],[1,0,2]];
export function newBridge(){
  return {ammo:1,buff:0,shield:0,hits:0,integrity:3,round:0,step:0,sequence:0};
}
export function pattern(state){return PATTERNS[state.sequence%PATTERNS.length];}
export function bridgeInput(state,index){
  if(state.hits>=150||state.integrity<=0||state.round>=3)return 'Round complete.';
  if(pattern(state)[state.step]!==index){
    state.step=0;
    if(state.shield){state.shield--;return 'Shield absorbed the miss.';}
    state.integrity--;
    return state.integrity?'Sequence missed. Start this sequence again.':'Integrity lost. Restart the round.';
  }
  state.step++;
  if(state.step<3)return 'Next tile.';
  state.step=0;state.sequence++;
  state.ammo=Math.min(3,state.ammo+1);
  state.buff=Math.min(2,state.buff+1);
  state.shield=Math.min(2,state.shield+1);
  return 'Sequence clear · +1 shot, buff and shield.';
}
export function bridgeShot(state,points){
  if(state.hits>=150||!state.integrity||!state.ammo||state.round>=3)return null;
  state.round++;state.ammo--;
  const bonus=points&&state.buff?15:0;
  if(bonus)state.buff--;
  state.hits+=points+bonus;
  return points+bonus;
}
