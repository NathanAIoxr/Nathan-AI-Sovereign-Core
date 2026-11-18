import { readFile } from "node:fs/promises";
const [one,two]=process.argv.slice(2);
if (!one || !two) throw Error("Usage: node tools/compare.mjs baseline.json candidate.json");
const [a,b]=await Promise.all([one,two].map(async name=>JSON.parse(await readFile(name,"utf8"))));
if(a.model!==b.model || a.dataset.sha256!==b.dataset.sha256 ||
 a.criteria.minimumTop1!==b.criteria.minimumTop1 || a.criteria.maxLatencyMs!==b.criteria.maxLatencyMs ||
 a.summary.total!==b.summary.total || a.latencyUnit!==b.latencyUnit) throw Error("Workload, acceptance criteria, or load size differ.");
const throughputRatio=a.summary.acceptedPerHour>0 ? b.summary.acceptedPerHour/a.summary.acceptedPerHour : null;
const acceptedCost=r=>r.summary.actualSpend==null||r.summary.accepted===0 ? null : r.summary.actualSpend/r.summary.accepted;
const measuredSpendRatio=typeof a.summary.actualSpend==="number" && a.summary.actualSpend>0 && typeof b.summary.actualSpend==="number"
  ? b.summary.actualSpend/a.summary.actualSpend:null;
console.log(JSON.stringify({baseline:a.runId,candidate:b.runId,throughputRatio,measuredSpendRatio,
 acceptedCostUsd:{baseline:acceptedCost(a),candidate:acceptedCost(b)},cached:{baseline:a.summary.cacheHits??0,candidate:b.summary.cacheHits??0},
 outcome:measuredSpendRatio===null?"Actual spend comparison unavailable.":throughputRatio>=2&&measuredSpendRatio<=1?"2X+ observed for this workload and spend.":"2X+ at equal spend not observed."},null,2));
