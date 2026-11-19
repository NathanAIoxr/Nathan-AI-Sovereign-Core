// Pure, bounded evidence reconciliation. No network or Cloudflare mutations.
export function reconcile({ordinary=[],dispatch=[],fleet=[],atlas=[]}){
 for(const [name,list] of Object.entries({ordinary,dispatch,fleet,atlas})) if(!Array.isArray(list)||list.length>5000)throw Error("invalid or oversized "+name);
 const seen=new Set(),duplicates=[];const records=[];
 for(const [kind,items] of [["ordinary_worker",ordinary],["dispatch_script",dispatch],["fleet_catalog",fleet],["atlas_reference",atlas]]){
  for(const entry of items){const id=String(entry.id??entry.name??"").trim();if(!id)throw Error("missing identity");
   const key=kind+":"+id;if(seen.has(key)){duplicates.push(key);continue;}seen.add(key);
   records.push({identity:id,kind,source_state:entry.source_state??"unknown",script_name:kind==="ordinary_worker"||kind==="dispatch_script"?id:null,deployment_id:entry.deployment_id||null,health:"unverified",ci:"unverified",test:"unverified",account_owned:entry.account_owned===true,dependency:entry.dependency||null});
  }
 }
 return {counts:{ordinary:ordinary.length,dispatch:dispatch.length,fleet:fleet.length,atlas:atlas.length,unique:records.length,duplicates:duplicates.length},duplicates,records};
}
