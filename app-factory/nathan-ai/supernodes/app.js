/* Browser-only, human-approved steward for sovereign node keyspaces. */
(function(){
  "use strict";
  const core=window.NathanSupernodes,adapter=window.NathanSupernodeDatabase;
  const $=name=>document.getElementById(name);
  let db=null,currentId=core.id("1"),node=null,incidents=[];
  function message(text){$("status").textContent=text;}
  function approved(){
    if(!$("approve-action").checked)throw Error("NO human YES: operation stopped");
    if(!$("self").checked||!$("voluntary").checked||!$("consent").checked)throw Error("Affirm your own voluntary consent for this node first");
    $("approve-action").checked=false;
    if(!node)throw Error("Create or select a consenting node first");
    return {humanChoice:"YES",voluntary:$("voluntary").checked,
      purpose:$("purpose").value.trim(),context:$("context").value.trim(),
      coerced:false,targetsUnconsentingPerson:false,harmRisk:false,
      deception:false,unauthorizedAccess:false,physicalIntervention:false,detainPerson:false,
      ownerControlsMaterial:$("controls-material").checked,humanReviewed:$("human-reviewed").checked};
  }
  function button(handler){return async function(){
    try{if(!db)throw Error("Local database not ready");await handler();}
    catch(error){message("NO CHANGE: "+error.message);}
  };}
  function viewSchema(){
    const schema=core.template(currentId);
    $("template").textContent=JSON.stringify({
      node:schema.id,namespace:schema.namespace,
      installed:node?"LOCAL SOVEREIGN RECORD":"ON-DEMAND LOGICAL TEMPLATE",
      moralAbsolutes:schema.moralAbsolutes,
      independentDatabaseNamespace:schema.database,
      modules:schema.modules.length,dimensions:schema.axes.length,pathways:schema.paths.length,
      sentienceVerified:false,remoteNodesContacted:0
    },null,2);
    $("inherited").textContent=JSON.stringify({
      canon:schema.canon,modules:schema.modules,dimensions:schema.axes,paths:schema.paths,
      sources:schema.sourceThreads,defensiveProtocol:schema.defensiveProtocol
    },null,2);
  }
  async function refresh(){
    viewSchema();
    if(!node){$("snapshot").textContent="Only the inherited template exists for "+currentId+". No stored node or database records.";return;}
    const content=await db.exportNode(currentId);
    incidents=content.incidents;
    const control=$("incident-select"),oldValue=control.value;
    control.replaceChildren();
    const blank=document.createElement("option");
    blank.value="";blank.textContent="Select incident";control.append(blank);
    for(const item of incidents){
      const option=document.createElement("option");
      option.value=item.key;option.textContent=item.category+" / "+item.state+" / "+item.key.slice(0,8);
      control.append(option);
    }
    if(incidents.some(x=>x.key===oldValue))control.value=oldValue;
    $("snapshot").textContent=JSON.stringify(content,null,2);
  }
  $("select").onclick=button(async()=>{
    currentId=core.id($("node-id").value);
    node=await db.getNode(currentId);
    if(node){
      $("purpose").value=node.purpose;$("context").value=node.context;$("owner").value=node.ownerLabel;
      $("voluntary").checked=false;$("self").checked=false;$("consent").checked=false;
    }else{
      $("voluntary").checked=false;$("self").checked=false;$("consent").checked=false;
    }
    await refresh();message(node?"Loaded this node's stored database.":"Uncreated logical node selected. No database records allocated.");
  });
  $("create").onclick=button(async()=>{
    currentId=core.id($("node-id").value);
    const existing=await db.getNode(currentId);
    if(existing)throw Error("This node already exists. Use its own consent and existing database.");
    const result=core.createNode(currentId,{
      self:$("self").checked,voluntary:$("voluntary").checked,
      consent:$("consent").checked?"YES":"NO",
      ownerLabel:$("owner").value,purpose:$("purpose").value,context:$("context").value
    });
    node=await db.putNode(result);
    await refresh();message("BUILD: created "+currentId+" as a sovereign, local-only, consented database namespace.");
  });
  $("add-knowledge").onclick=button(async()=>{
    const request=approved();
    const record=core.knowledge(node,{
      title:$("knowledge-title").value,body:$("knowledge-text").value,
      kind:$("knowledge-kind").value,provenance:$("knowledge-source").value
    },request);
    await db.addKnowledge(currentId,record);$("knowledge-text").value="";
    await refresh();message("Added source-labeled knowledge inside "+currentId+" only.");
  });
  $("capture").onclick=button(async()=>{
    const request=approved();
    const record=core.incident(node,{
      category:$("incident-kind").value,
      evidenceReference:$("evidence").value,
      note:$("incident-note").value
    },request);
    await db.addIncident(currentId,record);
    $("evidence").value="";$("incident-note").value="";
    await refresh();message("Recorded a *possible concern* and its reference, not a finding of guilt or a report to authorities.");
  });
  $("progress").onclick=button(async()=>{
    const request=approved();
    const record=incidents.find(x=>x.key===$("incident-select").value);
    if(!record)throw Error("Select a recorded incident");
    const update=core.progress(node,record,$("action").value,request);
    await db.updateIncident(currentId,update);
    await refresh();message("Defensive review step recorded locally. No person targeted, account attacked or report transmitted.");
  });
  $("refresh").onclick=button(async()=>{node=await db.getNode(currentId);await refresh();message("Sovereign namespace read without cross-node data access.");});
  $("export").onclick=button(async()=>{
    if(!node)throw Error("No node created");
    if(!$("self").checked||!$("voluntary").checked||!$("consent").checked)throw Error("Affirm your own voluntary consent before exporting");
    if(!$("approve-action").checked)throw Error("Separate human YES required for export");
    $("approve-action").checked=false;
    if(!window.confirm("YES: export only this node's private local data onto your device?"))return;
    const data=await db.exportNode(currentId);
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="nathan-supernode-"+currentId+".json";a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    message("Requested download for this node only. No server synchronization.");
  });
  $("clear").onclick=button(async()=>{
    if(!node)throw Error("No node created");
    if(!$("approve-action").checked)throw Error("Separate human YES required to withdraw consent");
    $("approve-action").checked=false;
    if(!window.confirm("Withdraw consent and DELETE all stored data for "+currentId+"? This cannot be undone."))return;
    await db.clearNode(currentId);node=null;incidents=[];
    $("consent").checked=false;$("self").checked=false;$("voluntary").checked=false;
    await refresh();message("1-1=0 CLEAR: consent withdrawn and all data for "+currentId+" deleted from the local node database.");
  });
  adapter.openBrowserDatabase().then(async value=>{
    db=value;node=await db.getNode(currentId);await refresh();message("Ready: 732m logical templates, independently consented local namespaces, zero remote nodes.");
  }).catch(error=>message("Local database unavailable: "+error.message+" (use a local web server or HTTPS browser origin)."));
})();
