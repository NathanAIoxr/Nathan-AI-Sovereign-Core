(function(){'use strict';
const E=window.NathanNaturalTouch,D=window.NathanNaturalTouchEvidence,$=id=>document.getElementById(id);
const registry=E.makeRegistry(),history=[];
function status(s){$('status').textContent=s;}
function record(source){
 try{const r=E.route(registry,{modality:$('modality').value,source,ownerConsent:true},$('target').value);
  const e={time:new Date().toISOString(),target:r.selection,modality:r.modality,source:r.source,addressed:r.addressed,accepted:r.accepted};
  history.push(e);if(history.length>50)history.shift();
  $('log').textContent=history.slice(-15).reverse().map(x=>x.time+' · '+x.modality+' · '+x.target+' · '+x.accepted+'/'+x.addressed+' logical routes').join('\n');
  status(r.accepted+' of '+r.addressed+' local endpoints accepted an event description. No biological touch or network traffic produced.');
 }catch(error){status(error.message);}
}
$('simulate').addEventListener('click',()=>record('demonstration'));
$('pad').addEventListener('pointerdown',()=>record('device-pointer'));
$('pad').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();record('device-pointer');}});
$('haptic').addEventListener('click',()=>{
 if(typeof navigator.vibrate!=='function'){status('Browser vibration unavailable.');return;}
 const requested=navigator.vibrate(25);
 status(requested?'Vibration requested; the OS and hardware decide whether it is felt.':'Vibration request was declined.');
});
$('clear').addEventListener('click',()=>{history.length=0;$('log').textContent='No events retained.';status('Local events cleared.');});
$('export').addEventListener('click',()=>{
 const v={schema:E.SCHEMA,records:history,notice:'Local software-event descriptions only. No sensory or medical measurements.'};
 const u=URL.createObjectURL(new Blob([JSON.stringify(v,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=u;a.download='nathan-natural-touch.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1200);
});
$('coverage').textContent=E.capabilityReport(registry).classes.map(x=>x.kind+': '+x.count).join(' · ');
for(const r of D.ITEMS){
 const c=document.createElement('article'),h=document.createElement('h3'),a=document.createElement('a'),p=document.createElement('p'),q=document.createElement('p'),small=document.createElement('small');
 c.className='source';a.href=r.url;a.rel='noopener noreferrer';a.target='_blank';a.textContent=r.title;h.append(a);small.textContent=r.type;
 p.textContent=r.finding;q.textContent=r.qualification;q.className='caution';c.append(h,small,p,q);$('sources').append(c);
}
})();