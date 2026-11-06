/* Browser-only user interface for the five-station SIMULATION. */
(function() {
  'use strict';
  const core=globalThis.NathanFiveShop;
  const $=id=>document.getElementById(id);
  let state=core.initialState();
  let timer=null;
  try {
    const saved=JSON.parse(localStorage.getItem('nt-five-shop-v1')||'null');
    if(core.valid(saved) && saved.printers.every(p=>p.connectedHardware===false))state=saved;
  } catch(_e) {/* intentionally start a fresh simulation */}
  const safeText=v=>String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  function save(){try{localStorage.setItem('nt-five-shop-v1',core.snapshot(state));}catch(_e){}}
  function render(){
    $('stations').innerHTML=state.printers.map((p,i)=>{
      const j=state.jobs.find(j=>j.printerId===p.id);
      const progress=j?j.progress:0;
      return '<div class="station"><div class="number">'+(i+1)+'</div><strong>'+p.matrix+'</strong>'+
        '<div class="sub">Virtual Printer '+p.id+'</div><div class="progress"><div class="fill" style="width:'+progress+'%"></div></div>'+
        '<div class="status">'+safeText(p.state)+'</div><div class="sub">'+progress+'% · NO HARDWARE</div></div>';
    }).join('');
    $('jobs').textContent=state.jobs.length+' / 5';
    $('completed').textContent=state.jobs.filter(j=>j.status==='COMPLETE_SIMULATED').length+' / 5';
    $('linked').textContent=state.simulatedJoined?'YES (SIMULATED)':'NO';
    $('status').textContent=state.simulatedJoined?'All five virtual pieces linked into ONE; no physical parts were made.':
      'Simulation workspace. No physical hardware connected.';
    $('events').textContent=state.events.join('\n');
    save();
  }
  function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
  $('queue').onclick=()=>{stop();if(!core.queueFive(state))state.events.unshift('Existing batch preserved; use Clear to start again.');render();};
  $('run').onclick=()=>{
    if(!state.jobs.length){core.queueFive(state);}
    core.resume(state);stop();
    timer=setInterval(()=>{if(core.advance(state))stop();render();},280);
    render();
  };
  $('pause').onclick=()=>{stop();core.pause(state);render();};
  $('resume').onclick=()=>{if(!state.jobs.length)return;core.resume(state);stop();timer=setInterval(()=>{if(core.advance(state))stop();render();},280);render();};
  $('reset').onclick=()=>{stop();core.reset(state);render();};
  $('export').onclick=()=>{
    const file=new Blob([core.snapshot(state)],{type:'application/json'});
    const url=URL.createObjectURL(file);
    const a=document.createElement('a');a.href=url;a.download='nathan-five-matrix-simulation.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  fetch('sources.json').then(r=>{if(!r.ok)throw Error('No catalog');return r.json();}).then(data=>{
    const sources=Array.isArray(data.sources)?data.sources:[];
    const table=document.createElement('table'),header=document.createElement('tr');
    for(const name of ['Project','Purpose','Upstream']){const th=document.createElement('th');th.textContent=name;header.appendChild(th);}
    table.appendChild(header);
    for(const s of sources){const tr=document.createElement('tr');
      const name=document.createElement('td');name.textContent=s.project;
      const purpose=document.createElement('td');purpose.textContent=s.role;
      const td=document.createElement('td'),a=document.createElement('a');a.href='https://github.com/'+encodeURI(s.github);a.rel='noopener noreferrer';a.target='_blank';a.textContent='Source';td.appendChild(a);
      tr.append(name,purpose,td);table.appendChild(tr);
    }
    $('source-list').replaceChildren(table);
  }).catch(()=>{$('source-list').textContent='Source catalog unavailable. See sources.json in repository.';});
  render();
})();
