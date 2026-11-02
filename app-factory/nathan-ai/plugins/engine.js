(function(root){
  'use strict';
  const SCHEMA='nathan-ai.plugin-inventory.v1';
  function validate(value){
    if(!value||value.schema!==SCHEMA||!/^\d{4}-\d{2}-\d{2}$/.test(value.observedDate)||!Array.isArray(value.groups)||value.groups.length>100)throw Error('Unsupported plugin inventory');
    const ids=new Set(),workflowIds=new Set();
    for(const group of value.groups){
      if(!group||typeof group.id!=='string'||!group.id||ids.has(group.id)||typeof group.name!=='string'||group.status!=='workflow-available'||group.browserExecution!=='not-bridged'||!Array.isArray(group.workflows)||!Array.isArray(group.hostTools))throw Error('Invalid plugin group');
      ids.add(group.id);
      for(const w of group.workflows){
        if(!w||typeof w.id!=='string'||!w.id.startsWith(group.id+':')||workflowIds.has(w.id)||typeof w.name!=='string'||typeof w.description!=='string')throw Error('Invalid or duplicate workflow');
        workflowIds.add(w.id);
      }
    }
    if(value.installationDatesKnown!==false||!Array.isArray(value.requestedApps)||!Array.isArray(value.workspaceAccess))throw Error('Invalid capability provenance');
    return value;
  }
  function list(inventory,query='',groupId=''){
    const words=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return inventory.groups.filter(g=>!groupId||g.id===groupId).flatMap(group=>group.workflows.map(w=>({...w,groupId:group.id,groupName:group.name,hostTools:group.hostTools}))).filter(w=>words.every(t=>[w.name,w.description,w.groupName].join(' ').toLocaleLowerCase().includes(t)));
  }
  function handoff(inventory,id,task){
    const row=list(inventory).find(w=>w.id===id);if(!row)throw Error('Unknown workflow');
    if(typeof task!=='string'||!task.trim()||task.length>2000)throw Error('Describe the task in 1–2000 characters');
    return {schema:'nathan-ai.plugin-handoff.v1',workflowId:row.id,task:task.trim(),request:'Use the '+row.id+' workflow for this task:\n\n'+task.trim()+'\n\nCheck its instructions and currently callable tools before execution. Preserve source references and report missing access. This handoff does not grant account permissions or authorize payments, messages, deployments or publication.'};
  }
  function sources(inventory,id){return list(inventory).filter(w=>!id||w.id===id).map(w=>({id:'plugin:'+w.id,title:w.groupName+' · '+w.name,body:w.description+'\nHost workflow available at inventory time; browser execution is not bridged. Installation date is unknown.\nWorkflow ID: '+w.id,sourceName:'Current chat workflow inventory · '+inventory.observedDate,stage:'Workflow metadata; not an account connection',private:false}))}
  const api={SCHEMA,validate,list,handoff,sources};if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanPlugins=api;
})(typeof window==='object'?window:globalThis);
