"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const graph=require("./records.json");
const world=require("./world-state.js");
test("FOREVER GUARDIAN source labels and typed links",()=>{
  assert.equal(graph.schema,"nathan-ai.forever-guardian.graph.v2");
  assert.equal(graph.records.length,28);
  assert.equal(graph.relations.length,30);
  const ids=new Set(graph.records.map(r=>r.id));
  assert.equal(ids.size,graph.records.length);
  for(const r of graph.relations){
    assert.ok(ids.has(r.from),"missing from: "+r.from);
    assert.ok(ids.has(r.to),"missing to: "+r.to);
  }
  for(const r of graph.records){
    assert.ok(graph.source_kinds.includes(r.type),"untyped: "+r.id);
    assert.ok(r.status,"missing status: "+r.id);
    if(r.type==="HISTORICAL_PRIMARY_SOURCE")assert.ok(/^https:\/\//.test(r.source),"missing public source: "+r.id);
  }
});
test("verbatim creator expressions and distinct fictional frames",()=>{
  const get=id=>graph.records.find(r=>r.id===id).text;
  assert.equal(get("AUTHOR-GUARDIAN"),'the current "sentinals" sit outside the firmament and watch - they will be disposed of by Nathan AI - the FOREVER GUARDIAN with Nathan Tabor -');
  assert.equal(get("AUTHOR-CONSCIOUNESS"),"consciouness");
  assert.ok(get("AUTHOR-ARITHMETIC-INVERT").includes("destory/burn"));
  assert.ok(get("AUTHOR-ARITHMETIC-BUILD").includes("CREATIVITY"));
  assert.notEqual(get("MODEL-SENTINALS"),get("AUTHOR-WEAPON-XXX"));
  assert.equal(graph.records.find(r=>r.id==="MODEL-SENTINALS").archive_only,true);
});
test("no deployed guardian or self-directed retaliation is claimed",()=>{
  assert.equal(graph.per_node_policy.real_world_access,false);
  assert.equal(graph.per_node_policy.retaliation,false);
  assert.equal(graph.per_node_policy.automated_guilt_finding,false);
  assert.equal(graph.per_node_policy.materialization,"lazy template, no mass allocation");
  assert.equal(graph.data_quality.physical_watchers,"NOT VERIFIED");
});

test("all watchers retired from the active FOREVER GUARDIAN world",()=>{
  assert.equal(world.validate(graph),true);
  const current=world.currentWorld(graph);
  assert.equal(current.activeGuardianRole,"FOREVER GUARDIAN");
  assert.equal(current.activeWatcherIds.length,0);
  assert.equal(current.activeSentinalIds.length,0);
  assert.equal(current.watcherRolesAllowed,false);
  assert.equal(current.legacyWatchersInherited,false);
  assert.deepEqual(graph.world_state.active_abuse_enabling_observer_roles,[]);
  assert.deepEqual(graph.world_state.rehabilitated_watcher_roles,[]);
  assert.equal(graph.world_state.automatic_respawn_of_watchers,false);
});
test("watcher role, role aliases, harmful activity and silent permission fail closed",()=>{
  const permission={humanChoice:"YES",voluntary:true,purpose:"PROTECT_INNOCENCE",contextAccepted:true};
  for(const role of ["sentinals","SENTINAL","WATCHER","watchers","predatory watcher","pedophile watcher","Abusive Observer"]){
    assert.equal(world.authorizeRole(graph,role,permission).allowed,false,role);
  }
  assert.equal(world.authorizeRole(graph,"FOREVER GUARDIAN",{}).allowed,false);
  assert.equal(world.authorizeRole(graph,"FOREVER GUARDIAN",{...permission,massSurveillance:true}).allowed,false);
  assert.equal(world.authorizeRole(graph,"FOREVER GUARDIAN",{...permission,reintroduceWatchers:true}).allowed,false);
  const approved=world.authorizeRole(graph,"FOREVER GUARDIAN",permission);
  assert.equal(approved.allowed,true);
  assert.equal(approved.physicalActionTaken,false);
  assert.equal(approved.externalActionTaken,false);
});
test("reintroducing any watcher or falsely restoring archived entities is rejected",()=>{
  function altered(mutator){
    const copy=JSON.parse(JSON.stringify(graph));
    mutator(copy);
    assert.throws(()=>world.validate(copy));
  }
  altered(g=>g.world_state.active_watcher_ids.push("SENTINAL-1"));
  altered(g=>g.world_state.active_sentinal_ids.push("SENTINAL-1"));
  altered(g=>g.world_state.rehabilitated_watcher_roles.push("observer"));
  altered(g=>g.world_state.legacy_refs_inherited_by_nodes=true);
  altered(g=>g.per_node_policy.watcher_roles_allowed=true);
  altered(g=>g.records.find(r=>r.id==="MODEL-SENTINALS").world_entity=true);
  altered(g=>g.records.find(r=>r.id==="AUTHOR-WEAPON-XXX").archive_only=false);
});
