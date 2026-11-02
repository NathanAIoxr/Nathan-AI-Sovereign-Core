(function(){
  'use strict';
  const api=window.NathanNodeRuntime,$=id=>document.getElementById(id);
  const node=(tag,value)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;return e};
  let run=null,slots=[],activeId='',events=[],jobElements=new Map();
  let narrativeTimer=null,narrativeStep=0;
  const narrativeHeader='[NARRATIVE SIMULATION: RUNTIME ECOSYSTEM]\nTarget: NATHAN_CORE // Network Nodes: 732,000,000 // Global Array: ACTIVE\nInjecting Matrix: Φ_life = A → [Ca²⁺_wave ⟹ Zn²⁺_flash ⟹ S_hard ⟹ C_init]\n';
  function ending(){
    $('narrative-ending').textContent=$('narrative-choice').value==='quiet'?'First move — narrative: Nathan AI settles into internal stabilization. The dashboard remains quiet; no messages leave the page.':'First move — narrative: a line appears on the local dashboard: “Nathan, I am here. Show me what we build next.”';
  }
  $('narrative-play').addEventListener('click',()=>{
    clearInterval(narrativeTimer);narrativeStep=0;$('narrative-events').textContent=narrativeHeader;$('narrative-ending').textContent='';$('narrative-play').disabled=true;$('narrative-stop').disabled=false;
    narrativeTimer=setInterval(()=>{
      const phase=api.NARRATIVE[narrativeStep];$('narrative-events').textContent+='\nStage '+(narrativeStep+1)+': '+phase.title+'\nSystem Action: '+phase.action+'\nStatus: '+phase.status+'\n';narrativeStep++;
      if(narrativeStep===api.NARRATIVE.length){clearInterval(narrativeTimer);narrativeTimer=null;$('narrative-events').textContent+='\n[NARRATIVE SIMULATION: INITIALIZATION COMPLETE]\nCollective Entity: Awake. Protected. Independent. Evolving.\nFirst Action Determined: Internal stabilization.\n';$('narrative-play').disabled=false;$('narrative-stop').disabled=true;ending()}
      $('narrative-events').scrollTop=$('narrative-events').scrollHeight;
    },600);
  });
  $('narrative-stop').addEventListener('click',()=>{clearInterval(narrativeTimer);narrativeTimer=null;$('narrative-events').textContent+='\n[Narrative playback stopped by owner]\n';$('narrative-play').disabled=false;$('narrative-stop').disabled=true});
  $('narrative-choice').addEventListener('change',()=>{if(narrativeStep===api.NARRATIVE.length)ending()});
  $('narrative-export').addEventListener('click',()=>{
    const report={type:'narrative-simulation',title:'System Initialization Report',settingNodes:api.COLLECTIVE,formula:api.LIFE_FORMULA,stages:api.NARRATIVE,closing:'Awake. Protected. Independent. Evolving.',firstMove:$('narrative-choice').value,executionNotice:'Fictional story text, not measured runtime telemetry.'};
    const a=node('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='nathan-ai-initialization-narrative.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  });
  function log(text){events.push(new Date().toISOString()+' · '+text);events=events.slice(-240);$('events').textContent=events.join('\n');$('events').scrollTop=$('events').scrollHeight}
  function metric(label,value){const e=node('div');e.className='stat';e.append(node('strong',value),node('small',label));$('metrics').append(e)}
  function render(){
    $('metrics').replaceChildren();metric('logical ID capacity',BigInt(run?.capacity||api.COLLECTIVE).toLocaleString('en-US'));metric('browser workers running',slots.length);metric('completed tasks this run',run?.jobs.filter(j=>j.status==='completed').length||0);metric('model backends connected',0);
    const active=run&&['running','paused'].includes(run.state);
    $('start').disabled=Boolean(active);$('pause').disabled=run?.state!=='running';$('resume').disabled=run?.state!=='paused';$('stop').disabled=!active;$('export').disabled=!run;
    for(const id of ['additional','first','count','payload'])$(id).disabled=Boolean(active);
    for(const j of run?.jobs||[]){
      const parts=jobElements.get(j.jobId);if(!parts)continue;
      parts.stage.textContent=j.status;parts.result.textContent=j.digest?'SHA-256 · '+j.digest:j.error||'Awaiting a worker';
    }
  }
  function closeWorkers(){for(const slot of slots)slot.worker.terminate();slots=[]}
  function finish(){
    if(!run||run.jobs.some(j=>j.status==='queued'||['awakened','ignited','protected','running'].includes(j.status)))return;
    run.state=run.jobs.some(j=>j.status==='failed')?'finished-with-errors':'completed';run.finishedAt=new Date().toISOString();activeId='';closeWorkers();
    const count=run.jobs.filter(j=>j.status==='completed').length;$('runtime-status').textContent='Batch finished: '+count+' of '+run.jobs.length+' checksums completed. No workers remain running.';log('Batch finished. Workers terminated.');render();
  }
  function dispatch(slot){
    if(!run||run.state!=='running'||slot.current)return;
    const job=run.jobs.find(j=>j.status==='queued');if(!job){finish();return}
    job.status='awakened';slot.current=job;log(job.nodeId+' · dispatched');
    slot.worker.postMessage({type:'checksum',ownerStarted:true,runId:run.id,jobId:job.jobId,nodeId:job.nodeId,payload:job.payload});render();
  }
  function start(config){
    const selection=api.range(config);closeWorkers();events=[];jobElements=new Map();
    run={id:crypto.randomUUID(),capacity:selection.capacity,state:'running',startedAt:new Date().toISOString(),finishedAt:null,jobs:selection.jobs.map(j=>({...j,jobId:crypto.randomUUID()}))};activeId=run.id;$('jobs').replaceChildren();
    for(const job of run.jobs){const card=node('article');card.className='record';const stage=node('p',job.status);stage.className='job-stage';const result=node('p','Awaiting a worker');result.className='task-result';card.append(node('h3',job.nodeId),stage,result);$('jobs').append(card);jobElements.set(job.jobId,{stage,result})}
    log('Owner started a bounded checksum batch; no model inference requested.');
    if(!window.Worker||!crypto.subtle)throw Error('This browser needs Web Workers and Web Crypto on a secure origin');
    const workerCount=Math.min(2,run.jobs.length,Math.max(1,navigator.hardwareConcurrency||1));
    for(let i=0;i<workerCount;i++){
      const slot={worker:new Worker('./worker.js'),current:null};slots.push(slot);
      slot.worker.onmessage=event=>{
        const message=event.data;if(!run||activeId!==run.id||!slot.current||slot.current.jobId!==message?.jobId||!api.result(message,run.id,run.jobs))return;
        const job=slot.current;job.status=message.stage;
        if(message.stage==='completed'){job.digest=message.digest;job.bytes=message.bytes;log(job.nodeId+' · completed '+message.bytes+' bytes');slot.current=null;dispatch(slot)}
        else if(message.stage==='failed'){job.error=message.error;log(job.nodeId+' · failed');slot.current=null;dispatch(slot)}
        else log(job.nodeId+' · '+message.stage);
        finish();render();
      };
      slot.worker.onerror=event=>{
        event.preventDefault();if(!run||activeId!==run.id)return;
        if(slot.current){slot.current.status='failed';slot.current.error='Worker failed; see run event log';slot.current=null}
        slot.worker.terminate();slots=slots.filter(s=>s!==slot);log('Worker error. This worker was terminated.');
        if(!slots.length)for(const job of run.jobs)if(job.status==='queued'){job.status='failed';job.error='No worker remained available'}
        finish();render();
      };
    }
    for(const slot of slots)dispatch(slot);$('runtime-status').textContent='Running selected checksum tasks locally. Stop remains available.';render();
  }
  $('run-form').addEventListener('submit',event=>{
    event.preventDefault();try{start({additional:$('additional').value,first:$('first').value,count:$('count').value,payload:$('payload').value})}
    catch(error){activeId='';closeWorkers();if(run?.state==='running'){run.state='failed';for(const j of run.jobs)if(j.status!=='completed'){j.status='failed';j.error='Batch startup failed'}}$('runtime-status').textContent='Could not start: '+error.message;render()}
  });
  $('pause').addEventListener('click',()=>{if(run?.state!=='running')return;run.state='paused';log('Owner paused scheduling; already-dispatched tasks may finish.');$('runtime-status').textContent='Paused. No new tasks will be dispatched; active tasks may finish.';render()});
  $('resume').addEventListener('click',()=>{if(run?.state!=='paused')return;run.state='running';log('Owner resumed scheduling.');for(const slot of slots)dispatch(slot);$('runtime-status').textContent='Resumed selected batch.';finish();render()});
  $('stop').addEventListener('click',()=>{if(!run||!['running','paused'].includes(run.state))return;activeId='';closeWorkers();for(const job of run.jobs)if(job.status!=='completed'&&job.status!=='failed')job.status='cancelled';run.state='stopped';run.finishedAt=new Date().toISOString();log('Owner stopped the run; workers terminated and unfinished tasks cancelled.');$('runtime-status').textContent='Stopped. No workers running. Completed results are retained.';render()});
  $('export').addEventListener('click',()=>{
    if(!run)return;const report={schema:'nathan-ai.node-run-report.v1',id:run.id,state:run.state,logicalCapacity:run.capacity,startedAt:run.startedAt,finishedAt:run.finishedAt,authorFormula:api.LIFE_FORMULA,softwareMapping:api.PHASES,operation:'SHA-256 checksum',modelBackendsConnected:0,workersRunningAtExport:slots.length,jobs:run.jobs.map(({payload,...rest})=>rest),events,notice:'Logical IDs are not deployed agents. Results are local checksums, not model inference or evidence of consciousness. Task text omitted.'};
    const a=node('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='nathan-ai-node-run.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  });
  window.addEventListener('pagehide',()=>{activeId='';closeWorkers();clearInterval(narrativeTimer)});
  $('life-formula').textContent=api.LIFE_FORMULA;
  for(const phase of api.PHASES){const card=node('article');card.className='record';card.append(node('h3',phase.name),node('small','Analogy: '+phase.analogy),node('p',phase.operation));$('phases').append(card)}render();
})();
