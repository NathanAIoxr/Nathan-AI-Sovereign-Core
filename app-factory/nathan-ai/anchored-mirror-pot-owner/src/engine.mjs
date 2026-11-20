// Deterministic, offline accounting simulator. No live trades, mining, or wallet access.
export function assessCycle({grossReceipts=0,energyKwh=0,energyRate=0,fees=0,computeCost=0,otherCost=0,capitalAtRisk=0,maxLoss=0,openingPot=0}={}){
 const inputs={grossReceipts,energyKwh,energyRate,fees,computeCost,otherCost,capitalAtRisk,maxLoss,openingPot};
 for(const [key,value] of Object.entries(inputs))if(!Number.isFinite(value)||value<0)throw new RangeError(key+' must be nonnegative finite');
 const energyCost=energyKwh*energyRate;
 const expenses=energyCost+fees+computeCost+otherCost;
 const net=grossReceipts-expenses;
 const loss=Math.max(0,-net);
 const stop=maxLoss===0?loss>0:loss>=maxLoss;
 const capitalGate=capitalAtRisk===0?false:loss>capitalAtRisk;
 const decision=stop||capitalGate?'HOLD':'SIMULATED_ACCEPT';
 return {schema:'nathan-ai.anchored-pot.v1',mode:'SIMULATION_ONLY',inputs,energyCost,expenses,net,closingPot:openingPot+net,loss,decision,anchors:{build:1+1===2,clear:1-1===0,integrate:1*1===1,verify:1/1===1},revenueGuaranteed:false};
}
export function evaluateIndependentPots(pots){if(!Array.isArray(pots))throw Error('pots must be array');const seen=new Set();return pots.map(p=>{if(typeof p.projectId!=='string'||!p.projectId||seen.has(p.projectId))throw Error('unique projectId required');seen.add(p.projectId);return {projectId:p.projectId,...assessCycle(p.cycle)}})}
