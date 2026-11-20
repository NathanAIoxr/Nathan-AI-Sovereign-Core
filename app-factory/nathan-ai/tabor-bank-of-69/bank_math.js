// Accounting and simulation only. No custody, minting, trading or mining.
export function expectedValue(outcomes){
 if(!Array.isArray(outcomes)||!outcomes.length)throw Error('outcomes required');
 let sumP=0,ev=0;
 for(const {probability,netUsd} of outcomes){
  if(!Number.isFinite(probability)||probability<0||!Number.isFinite(netUsd))throw Error('invalid outcome');
  sumP+=probability;ev+=probability*netUsd;
 }
 if(Math.abs(sumP-1)>1e-9)throw Error('probabilities must sum to one');
 return {expectedNetUsd:ev,expectedLossUsd:Math.max(0,-ev)};
}
export function miningMargin({hashrate,networkHashrate,blocksPerDay,rewardCoin,coinUsd,watts,hours=24,usdPerKwh,otherCostUsd=0}){
 const vals=[hashrate,networkHashrate,blocksPerDay,rewardCoin,coinUsd,watts,hours,usdPerKwh,otherCostUsd];
 if(vals.some(x=>!Number.isFinite(x)||x<0)||networkHashrate===0||hashrate>networkHashrate)throw Error('invalid mining inputs');
 const revenueUsd=(hashrate/networkHashrate)*blocksPerDay*rewardCoin*coinUsd;
 const powerUsd=watts*hours/1000*usdPerKwh;
 const costUsd=powerUsd+otherCostUsd;
 return {revenueUsd,powerUsd,costUsd,expectedMarginUsd:revenueUsd-costUsd,action:revenueUsd>=costUsd?'REVIEW':'HOLD'};
}
export function anchoredGate({dailyLossUsd,lossCapUsd,emotionOverride=false}){
 if(![dailyLossUsd,lossCapUsd].every(Number.isFinite)||dailyLossUsd<0||lossCapUsd<0)return 'HOLD';
 return emotionOverride||dailyLossUsd>=lossCapUsd?'STOP':'REVIEW_ONLY';
}
