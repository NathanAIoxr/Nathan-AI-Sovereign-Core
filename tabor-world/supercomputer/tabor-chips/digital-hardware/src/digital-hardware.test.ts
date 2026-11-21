import {simulateDevice,simulateFabric} from "./digital-hardware";
const devices=[
{id:"tabor-chip-01",kind:"compute" as const,capacity:100,demand:125,health:0.8,latencyMs:2,metadata:{precision:"fp16"}},
{id:"tabor-power-01",kind:"power" as const,capacity:200,demand:150,health:1,latencyMs:0,metadata:{unit:"W"}}
];
const result=simulateFabric(devices);
if(result.receipts[0].accepted!==80||result.receipts[0].rejected!==45)throw new Error("compute gate failed");
if(result.receipts[1].accepted!==150||result.fullyServed)throw new Error("fabric simulation failed");
try{simulateDevice({...devices[0],health:2});throw new Error("expected failure")}catch(e){if(!(e instanceof RangeError))throw e}
console.log(JSON.stringify(result,null,2));
