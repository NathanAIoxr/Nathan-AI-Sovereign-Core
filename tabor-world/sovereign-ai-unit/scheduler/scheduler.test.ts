import {selectBackend} from "./scheduler";
const pools=[
{id:"gpu-a",kind:"gpu" as const,region:"us",accelerator:"test-gpu",deviceCount:2,memoryMb:24576,precisions:["fp16"],runtimes:["cuda"],interconnect:"ethernet",available:2,reserved:2,costUsdPerHour:1,enabled:true},
{id:"gpu-b",kind:"gpu" as const,region:"us",accelerator:"test-gpu",deviceCount:1,memoryMb:24576,precisions:["fp16"],runtimes:["cuda"],interconnect:"ethernet",available:1,reserved:0,costUsdPerHour:2,enabled:true}
];
const job={runtime:"cuda",precision:"fp16",memoryMb:8192,maxCostUsd:3,estimatedHours:1};
if(selectBackend(pools,job)?.id!=="gpu-b")throw new Error("full pool did not fail over");
if(selectBackend(pools,{...job,maxCostUsd:1})!==null)throw new Error("budget exceeded");
if(selectBackend(pools,{...job,memoryMb:32768})!==null)throw new Error("memory overcommit");
if(selectBackend(pools.map(x=>({...x,enabled:false})),job)!==null)throw new Error("unavailable pool");
console.log("scheduler capacity, failover, budget and memory assertions passed");
