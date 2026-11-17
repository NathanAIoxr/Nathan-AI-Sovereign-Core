/* Nathan Tabor 3-D Print Shop: additive public SIMULATION; NO hardware control. */
(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NathanFiveShop = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  const MATRICES = Object.freeze(["BODY", "SOUL", "SHADOW", "MIND", "SPIRIT"]);
  const OBJECT_TYPES = Object.freeze([
    "architectural_gate","figurative_gate","visionary_gate","traditional_gate",
    "jewelry","furniture","structural_hardware","material",
    "historical_weapon_reference","other"
  ]);
  const EXAMPLE_PARTS = Object.freeze([
    "models/matrix_1.stl","models/matrix_2.stl","models/matrix_3.stl",
    "models/matrix_4.stl","models/matrix_5.stl"
  ]);
  function initialState() {
    return { schema: "nt-five-shop.v1", mode: "SIMULATION",
      printers: MATRICES.map((matrix,i)=>({
        id: "P"+(i+1), matrix, connectedHardware: false, state:"IDLE", jobId:null
      })),
      jobs: [], events: ["Five virtual stations initialized; no real hardware connected."],
      artifactCatalog: [], simulatedJoined: false
    };
  }
  function valid(s) {
    return !!s && s.schema === "nt-five-shop.v1" && s.mode === "SIMULATION"
      && Array.isArray(s.printers) && s.printers.length === 5
      && Array.isArray(s.jobs) && Array.isArray(s.events);
  }
  function requireState(s) { if (!valid(s)) throw new Error("Invalid shop state"); }
  function log(s,message){s.events.unshift(message);s.events=s.events.slice(0,60);}
  function queueFive(s) {
    requireState(s);
    if (s.jobs.length) return false;
    s.jobs=MATRICES.map((matrix,i)=>({
      id:"ONE-TILE-"+(i+1), matrix, printerId:"P"+(i+1), model:EXAMPLE_PARTS[i],
      description:"Nonfunctional demonstration connector "+(i+1),
      objectClass:"structural_hardware", status:"QUEUED", progress:0,
      actualFabrication:false
    }));
    s.printers.forEach((p,i)=>{p.state="QUEUED";p.jobId=s.jobs[i].id;});
    s.simulatedJoined=false;
    log(s,"Five educational tile jobs queued; simulation only.");
    return true;
  }
  function advance(s) {
    requireState(s);
    for(const job of s.jobs) {
      if(job.status==="QUEUED")job.status="SIMULATING";
      if(job.status==="SIMULATING"){
        job.progress=Math.min(100,job.progress+10);
        if(job.progress===100) job.status="COMPLETE_SIMULATED";
      }
      const station=s.printers.find(p=>p.id===job.printerId);
      if(station)station.state=job.status;
    }
    if(s.jobs.length===5 && s.jobs.every(j=>j.status==="COMPLETE_SIMULATED")){
      if(!s.simulatedJoined)log(s,"All five virtual tiles complete; ONE assembled in simulation only.");
      s.simulatedJoined=true;
    }
    return s.simulatedJoined;
  }
  function pause(s) {
    requireState(s);
    for(const j of s.jobs)if(j.status==="QUEUED"||j.status==="SIMULATING"){j.status="PAUSED";s.printers.find(p=>p.id===j.printerId).state="PAUSED";}
    log(s,"Simulation paused.");
  }
  function resume(s) {
    requireState(s);
    for(const j of s.jobs)if(j.status==="PAUSED"){j.status="SIMULATING";s.printers.find(p=>p.id===j.printerId).state="SIMULATING";}
    log(s,"Simulation resumed.");
  }
  function reset(s) {
    requireState(s);
    s.jobs=[];s.simulatedJoined=false;
    s.printers.forEach(p=>{p.state="IDLE";p.jobId=null;});
    log(s,"Simulation reset. No physical machine was affected.");
  }
  function addArtifact(s, raw) {
    requireState(s);
    if(!raw || typeof raw !=="object" || !OBJECT_TYPES.includes(raw.objectClass))throw new Error("Unknown original object class");
    if(typeof raw.name!=="string" || !raw.name.trim())throw new Error("Artifact name required");
    if(s.artifactCatalog.some(x=>x.id===raw.id))throw new Error("Duplicate artifact id");
    const record={id: String(raw.id || "NT-"+(s.artifactCatalog.length+1)),
      name:raw.name,objectClass:raw.objectClass,
      scripture: String(raw.scripture || ""), dimensions: String(raw.dimensions || "NOT SPECIFIED"),
      evidence: String(raw.evidence || "unverified"), interpretations: Array.isArray(raw.interpretations)?raw.interpretations.slice():[]};
    s.artifactCatalog.push(record);return record;
  }
  function snapshot(s){requireState(s);return JSON.stringify(s,null,2);}
  return Object.freeze({MATRICES,OBJECT_TYPES,EXAMPLE_PARTS,initialState,valid,queueFive,advance,pause,resume,reset,addArtifact,snapshot});
});
