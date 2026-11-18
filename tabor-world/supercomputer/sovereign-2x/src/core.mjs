import blueprint from "../blueprint.json" with {type:"json"};

export { blueprint };
export const kernelId = "fp64-dot-lcg32-v1";
const mask32 = 0xffffffff;
const stateFields = {
  Identity:"schema:s runId:s createdMs:i source:s revision:s mode:s platform:s kernel:s receiptVersion:i public:b",
  Operation:"buildExpression:s clearExpression:s buildValue:i clearValue:i inputCount:i acceptedCount:i rejectedCount:i clearCount:i malformedCount:i",
  Noise:"markedCount:i forbiddenCount:i badOperationCount:i gateMode:s acceptedBuildCount:i rejectedSlayCount:i policyVersion:i flagsClean:b ambiguityDetected:b slayerActive:b",
  Integrity:"eccScheme:s dataBits:i checkBits:i faultCount:i eccStatus:s corrected:b uncorrectable:b dataWord:i recoveredWord:i integrityPass:b",
  Routing:"gridRows:i gridColumns:i slotCount:i row:i column:i slot:i logicalCapacity:i logicalId:i levels:i directionalLevels:i",
  Execution:"seed:i terms:i operations:i elapsedNs:i checksum:i checksumScale:i arithmetic:s precision:s timed:b comparableHpl:b",
  Evidence:"provenance:s timer:s verificationMode:s truth:b time:b travel:b transfiguration:b physicalAttestation:b energyMeasured:b measuredHpl:b",
  Mirror:"auditMode:s proofAlgorithm:s kernelReplay:b mapReversible:b shapeValid:b forwardCount:i reverseCount:i resultHash:s sleyerActive:b"
};
export const frameContract = Object.fromEntries(Object.entries(stateFields).map(([layer,fields]) =>
  [layer,Object.fromEntries(fields.split(" ").map(field=>field.split(":")))]));
export const fieldCount = Object.values(frameContract).reduce((n,fields)=>n+Object.keys(fields).length,0);

export function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.keys(value).sort().map(key =>
    JSON.stringify(key)+":"+canonical(value[key])).join(",") + "}";
  return JSON.stringify(value);
}

export async function sha(value) {
  const bytes = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("");
}

export function gate(packets) {
  const accepted = [], rejected = [];
  for (const packet of packets) {
    const valid = packet && typeof packet === "object" && !Array.isArray(packet) &&
      typeof packet.op === "string" && typeof packet.signal_value === "number" &&
      Number.isFinite(packet.signal_value) && (packet.noise === undefined || typeof packet.noise === "boolean");
    let reason;
    if (!valid) reason = "malformed";
    else if (packet.noise) reason = "marked";
    else if ((packet.op + "\n" + (typeof packet.payload === "string" ? packet.payload : "")).replace(/\s+/g,"").includes("1+1=10")) reason = "forbidden";
    else if (!blueprint.axioms.includes(packet.op)) reason = "bad_operation";
    else if (packet.op === "1-1=0" || packet.signal_value === 0) reason = "clear";
    if (reason) rejected.push(reason);
    else accepted.push(packet);
  }
  return {accepted,rejected};
}

const parity = word => {
  let bit = 0;
  for (let remaining = word; remaining > 0n; remaining &= remaining-1n) bit ^= 1;
  return bit;
};
const powerOfTwo = position => (position & (position-1)) === 0;

export function encodeEcc(value) {
  let word=0n, index=0;
  for(let pos=1;pos<=38;pos++) if(!powerOfTwo(pos)) {
    if ((value >>> index)&1) word |= 1n << BigInt(pos-1);
    index++;
  }
  for(let check=1;check<=32;check*=2) {
    let syndrome=0;
    for(let pos=1;pos<=38;pos++) if (pos & check) syndrome ^= Number((word >> BigInt(pos-1))&1n);
    if (syndrome) word |= 1n << BigInt(check-1);
  }
  return word | (BigInt(parity(word)) << 38n);
}

export function decodeEcc(word) {
  let syndrome = 0;
  for (let pos=1;pos<=38;pos++) if ((word >> BigInt(pos-1))&1n) syndrome ^= pos;
  const odd = parity(word);
  if ((syndrome && !odd) || syndrome>38) return {status:"uncorrectable",value:null};
  const repaired = odd ? word ^ (1n << BigInt(syndrome ? syndrome-1 : 38)) : word;
  let value=0,index=0;
  for(let pos=1;pos<=38;pos++) if(!powerOfTwo(pos)) {
    value |= Number((repaired >> BigInt(pos-1))&1n) << index++;
  }
  return {status:odd ? "corrected" : "clean",value:value>>>0};
}

export function route(seed) {
  const {rows,circuits,slots,address_space,route_levels}=blueprint.grid;
  const logicalId=seed%address_space, slot=logicalId%slots;
  const forward=[slot];
  for(let level=1;level<=route_levels;level++) forward.push((forward.at(-1)+level*17)%slots);
  const reverse=[forward.at(-1)];
  for(let level=route_levels;level>0;level--) reverse.push((reverse.at(-1)-level*17+slots*2)%slots);
  return {logicalId,slot,row:Math.floor(slot/circuits),column:slot%circuits,rows,circuits,forward,reverse};
}

export function dot(seed,terms) {
  let state = seed >>> 0, value = 0;
  for(let i=0;i<terms;i++) {
    state = (Math.imul(state,1664525)+1013904223)>>>0;
    const left = (state>>>22)/1024;
    state = (Math.imul(state,1664525)+1013904223)>>>0;
    const right = (state>>>22)/1024;
    value += left*right;
  }
  return value*1048576;
}

export function validateFrame(frame) {
  if (!frame || Object.keys(frame).length!==Object.keys(frameContract).length) throw Error("Wrong telemetry layer count.");
  for(const [layer,fields] of Object.entries(frameContract)) {
    const values=frame[layer];
    if (!values || Object.keys(values).length!==Object.keys(fields).length) throw Error("Wrong field count in "+layer);
    for(const [name,type] of Object.entries(fields)) {
      const value=values[name];
      if (type==="i" ? !Number.isSafeInteger(value) : typeof value!==(type==="s"?"string":"boolean")) {
        throw Error("Invalid telemetry field "+layer+"."+name);
      }
    }
  }
}

export async function run({seed=73,terms=2048,faults=1,source="worker-probe",now=Date.now(),clock=performance}={}) {
  if (!Number.isInteger(seed)||seed<0||seed>mask32||!Number.isInteger(terms)||terms<64||terms>32768||![0,1,2].includes(faults)) {
    throw new RangeError("Use a 32-bit unsigned seed, 64–32768 terms, and 0–2 bit faults.");
  }
  const packets = [{op:"1+1=2",signal_value:1},{op:"1-1=0",signal_value:0},
    {op:"1+1=2",signal_value:1,noise:true},{op:" 1 + 1 = 10 ",signal_value:1},{op:"1+0=1",signal_value:1},null];
  const decisions = gate(packets);
  const count = reason => decisions.rejected.filter(value=>value===reason).length;
  const encoded = encodeEcc(seed) ^ [0n,1n<<9n,(1n<<9n)|(1n<<17n)][faults];
  const ecc = decodeEcc(encoded);
  const map=route(seed);
  const reversible=map.forward.every((slot,i)=>slot===map.reverse[map.reverse.length-1-i]);
  const canRun=ecc.value===seed && decisions.accepted.length===1;
  const started=clock.now();
  const checksum=canRun ? dot(ecc.value,terms) : 0;
  const elapsedNs=canRun ? Math.max(0,Math.round((clock.now()-started)*1000000)) : 0;
  const replay=canRun && dot(seed,terms)===checksum;
  const resultHash=await sha(canonical({kernel:kernelId,seed,terms,checksum}));
  const frame={
    Identity:{schema:"nathan-78-v1",runId:crypto.randomUUID(),createdMs:now,source,revision:blueprint.revision,mode:canRun?"software-benchmark":"quarantined",platform:"javascript",kernel:kernelId,receiptVersion:1,public:true},
    Operation:{buildExpression:"1+1=2",clearExpression:"1-1=0",buildValue:1+1,clearValue:1-1,inputCount:packets.length,acceptedCount:decisions.accepted.length,rejectedCount:decisions.rejected.length,clearCount:count("clear"),malformedCount:count("malformed")},
    Noise:{markedCount:count("marked"),forbiddenCount:count("forbidden"),badOperationCount:count("bad_operation"),gateMode:"Slayer 0",acceptedBuildCount:decisions.accepted.length,rejectedSlayCount:decisions.rejected.length,policyVersion:1,flagsClean:decisions.accepted.every(p=>!p.noise),ambiguityDetected:count("forbidden")>0,slayerActive:true},
    Integrity:{eccScheme:"SECDED(39,32)",dataBits:32,checkBits:7,faultCount:faults,eccStatus:ecc.status,corrected:ecc.status==="corrected",uncorrectable:ecc.value===null,dataWord:seed,recoveredWord:ecc.value??-1,integrityPass:ecc.value===seed},
    Routing:{gridRows:map.rows,gridColumns:map.circuits,slotCount:blueprint.grid.slots,row:map.row,column:map.column,slot:map.slot,logicalCapacity:blueprint.grid.address_space,logicalId:map.logicalId,levels:blueprint.grid.route_levels,directionalLevels:2*blueprint.grid.route_levels},
    Execution:{seed,terms,operations:canRun?2*terms:0,elapsedNs,checksum,checksumScale:1048576,arithmetic:"dot product",precision:"binary64",timed:elapsedNs>0,comparableHpl:false},
    Evidence:{provenance:source,timer:"performance.now",verificationMode:"deterministic replay",truth:replay,time:elapsedNs>0,travel:reversible,transfiguration:decisions.accepted.length===1,physicalAttestation:false,energyMeasured:false,measuredHpl:false},
    Mirror:{auditMode:"reverse and replay",proofAlgorithm:"SHA-256",kernelReplay:replay,mapReversible:reversible,shapeValid:true,forwardCount:map.forward.length-1,reverseCount:map.reverse.length-1,resultHash,sleyerActive:canRun},
  };
  validateFrame(frame);
  return {frame,digest:await sha(canonical(frame)),route:{forward:map.forward,reverse:map.reverse}};
}
