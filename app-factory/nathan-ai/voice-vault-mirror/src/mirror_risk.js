// Deterministic calculations only; no trading, mining, or financial transactions.
export function miningBreakEven({watts,hours,usdPerKwh,revenueUsd,otherCostsUsd=0}) {
  const values=[watts,hours,usdPerKwh,revenueUsd,otherCostsUsd];
  if(values.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0)) throw Error('nonnegative finite numbers required');
  const energyKwh=watts*hours/1000;
  const costUsd=energyKwh*usdPerKwh+otherCostsUsd;
  const marginUsd=revenueUsd-costUsd;
  return {energyKwh,costUsd,marginUsd,decision:marginUsd>0?'REVIEW_PROFITABLE': 'HOLD_UNPROFITABLE'};
}
export function mirrorViews(record) {
 const keys=Object.keys(record).sort();
 const forward=Object.fromEntries(keys.map(k=>[k,record[k]]));
 return {forward,reverse:Object.fromEntries([...keys].reverse().map(k=>[k,record[k]])),mirror:{...forward,verified:false,meaning:'reordered view, not an inverse hash'}};
}
export function riskGate({ownerApproved=false,verified=false,lossLimitUsd=0,estimatedLossUsd=0}={}){
 if(![lossLimitUsd,estimatedLossUsd].every(Number.isFinite)||lossLimitUsd<0||estimatedLossUsd<0) return 'HOLD';
 return ownerApproved&&verified&&estimatedLossUsd<=lossLimitUsd?'ELIGIBLE_FOR_REVIEW':'HOLD';
}
