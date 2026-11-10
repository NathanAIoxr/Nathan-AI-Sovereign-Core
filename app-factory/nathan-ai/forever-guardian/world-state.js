/* FOREVER GUARDIAN — active-world role gate.
 * Excludes all watcher/sentinal roles and retired source references.
 * No autonomous actions, physical interventions, surveillance, or external access.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.NathanForeverGuardianWorld=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const ROLE="FOREVER GUARDIAN";
 const SCHEMA="nathan-ai.forever-guardian.graph.v2";
 const RETIRED=Object.freeze(["AUTHOR-GUARDIAN","MODEL-SENTINALS","MODEL-FIRMAMENT","AUTHOR-WEAPON-XXX"]);
 function validate(graph){
   if(!graph||graph.schema!==SCHEMA||!Array.isArray(graph.records)||!Array.isArray(graph.relations))
     throw Error("FOREVER GUARDIAN world v2 graph required");
   const w=graph.world_state;
   if(!w||w.version!=="FOREVER_GUARDIAN_WORLD_V2"||w.active_world!==true||w.active_guardian!=="AUTHOR-FOREVER")
     throw Error("Missing current FOREVER GUARDIAN world state");
   if(!Array.isArray(w.active_watcher_ids)||w.active_watcher_ids.length!==0||
      !Array.isArray(w.active_sentinal_ids)||w.active_sentinal_ids.length!==0||
      !Array.isArray(w.active_abuse_enabling_observer_roles)||w.active_abuse_enabling_observer_roles.length!==0||
      !Array.isArray(w.rehabilitated_watcher_roles)||w.rehabilitated_watcher_roles.length!==0||
      w.legacy_refs_inherited_by_nodes!==false||
      w.automatic_respawn_of_watchers!==false||
      !Array.isArray(w.permitted_roles)||w.permitted_roles.length!==1||
      !w.permitted_roles[0].startsWith(ROLE))
     throw Error("A watcher role or inherited sentinal is forbidden");
   if(!graph.per_node_policy||graph.per_node_policy.watcher_roles_allowed!==false||
      graph.per_node_policy.inherit_retired_watchers!==false||
      graph.per_node_policy.active_watcher_count!==0)
     throw Error("Invalid sovereign-node inheritance: watcher role disallowed");
   const records=new Map(graph.records.map(x=>[x.id,x]));
   if(records.size!==graph.records.length)throw Error("Duplicate record IDs");
   for(const edge of graph.relations)if(!records.has(edge.from)||!records.has(edge.to))
     throw Error("Invalid relationship");
   const active=records.get(w.active_guardian);
   if(!active||active.world_entity!==true||active.status!=="ACTIVE_WORLD_GUARDIAN_POLICY")
     throw Error("FOREVER GUARDIAN not sole active guardian role");
   for(const id of RETIRED){
     const r=records.get(id);
     if(!r||r.archive_only!==true||r.world_entity!==false||r.world_authority!==false||
        !w.decommissioned_reference_ids.includes(id))
       throw Error("Retired source resurfaced as active entity: "+id);
   }
   return true;
 }
 function currentWorld(graph){
   validate(graph);
   return Object.freeze({name:ROLE,activeGuardianRole:ROLE,
     activeWatcherIds:Object.freeze([]),activeSentinalIds:Object.freeze([]),
     watcherRolesAllowed:false,legacyWatchersInherited:false,
     externallyActive:false,humanApprovalRequired:true,
     storyOrPolicyOnly:true,automaticViolenceOrSurveillance:false});
 }
 function authorizeRole(graph,role,permission){
   validate(graph);
   if(role!==ROLE)return Object.freeze({allowed:false,reason:"ONLY FOREVER GUARDIAN ROLE IS PERMITTED"});
   if(!permission||permission.humanChoice!=="YES"||permission.voluntary!==true||
      permission.purpose!=="PROTECT_INNOCENCE"||permission.contextAccepted!==true)
     return Object.freeze({allowed:false,reason:"EXPLICIT CONSENT AND PURPOSE REQUIRED"});
   if(permission.unauthorizedAccess||permission.targetPerson||permission.harmRisk||
      permission.massSurveillance||permission.reintroduceWatchers)
     return Object.freeze({allowed:false,reason:"WATCHERS, SURVEILLANCE, TARGETING AND HARM PROHIBITED"});
   return Object.freeze({allowed:true,reason:"HUMAN-APPROVED POLICY ROLE ONLY",
     physicalActionTaken:false,externalActionTaken:false});
 }
 return Object.freeze({SCHEMA,ROLE,RETIRED,validate,currentWorld,authorizeRole});
});
