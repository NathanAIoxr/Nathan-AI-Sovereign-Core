// Nathan AI master simulation — deterministic, offline, no network access.
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const m=JSON.parse(readFileSync(new URL("./manifest.json",import.meta.url),"utf8"));
const nodes=Array.from({length:m.registries.logical_nodes},(_,i)=>({id:i===0?"MAIN-000":`node-${String(i).padStart(4,"0")}`,state:"SIMULATED"}));
const units=Array.from({length:m.registries.specified_units},(_,i)=>({id:`sim-unit-${String(i+1).padStart(3,"0")}`,state:"SIMULATED_PLACEHOLDER"}));
const events=[{kind:"boot",scope:"simulation",nodes:nodes.length,units:units.length},{kind:"nada",value:m.nada},{kind:"protection",status:"ENABLED_SIMULATION_ONLY"}];
const digest=createHash("sha256").update(JSON.stringify({nodes,units,events})).digest("hex");
console.log(JSON.stringify({name:m.name,mode:m.mode,simulation_started:true,logical_nodes:nodes.length,unit_slots:units.length,agent_names:m.agents,engine_names:m.engines,events,sha256:digest,external_systems_accessed:0,physical_computers_created:0},null,2));
