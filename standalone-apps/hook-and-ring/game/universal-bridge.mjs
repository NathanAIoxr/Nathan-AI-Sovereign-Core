// Local arcade adapter. An attempt may be resolved once and a reward may be used once.
export function createBridge() {
  let round=0;
  let nextAttempt=0;
  let active=null;
  let total=0;
  let shots=0;
  const snapshot=()=>({round,points:total,loadedShots:shots});
  return {
    snapshot,
    startAttempt(game){
      active={id:++nextAttempt,points:game.bridge.points};
      return active.id;
    },
    emitTopHit(attempt,outcome){
      if(active?.id!==attempt) return false;
      const {points}=active;
      active=null;
      if(!outcome.success) return false;
      total+=points;
      shots++;
      return true;
    },
    grantShots(count){ if(Number.isSafeInteger(count)&&count>0)shots+=count; },
    consumeShot(){
      if(shots===0) return false;
      shots--;
      round++;
      return true;
    },
    reset(){ active=null;total=0;shots=0;round=0; },
  };
}
