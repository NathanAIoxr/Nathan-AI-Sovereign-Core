/* THE DEEP ROCK CONVERGENCE — browser UI, source labels and owner-only inert review.
   This code only loads public JSON, calculates arithmetic and updates page text.
   It never accesses remote devices, private archives or external infrastructure.
*/
(function(){'use strict';
const D=window.NathanDeepRock,W=window.NathanRootWays,N=window.NathanNineCars,$=id=>document.getElementById(id);
let docs,ways,review=D.blankState(),controller=W.createOwnerLocalController();
function add(parent,tag,value,cls){const el=document.createElement(tag);if(value!==undefined&&value!==null)el.textContent=String(value);if(cls)el.className=cls;parent.appendChild(el);return el}
function msg(text){$('rootStatus').textContent=text}
function refreshGates(){
 const x=D.assess(review);$('outcome').textContent=x.label+' · '+x.passes+'/'+x.total+' marked; all checks are creator-entered and not independent verification';
}
function showDossiers(){
 const host=$('dossiers');host.replaceChildren();
 for(const dossier of docs.dossiers){
  const panel=add(host,'div',undefined,'record');add(panel,'h3',dossier.id+' — '+dossier.name);
  add(panel,'p',dossier.description);add(panel,'p',dossier.knownFact,'small');
  add(panel,'span','Original creator scenario · no independently reproduced remote result','small');
 }
 const obs=$('observations');obs.replaceChildren();
 const list=add(obs,'ul');for(const value of docs.observations)add(list,'li',value);
}
function showScenarios(){
 const results=$('results');results.replaceChildren();
 const filtered=D.select(docs,$('query').value,$('phase').value);
 $('count').textContent=filtered.length+' original titles displayed · '+docs.scenarios.length+' supplied in this public scenario view';
 for(const entry of filtered){
  const card=add(results,'div',undefined,'record');add(card,'h3',entry.number+'. '+entry.name);
  add(card,'p','Offline, owner-authorized research task: '+entry.objective,'small');
  add(card,'small','Original phase '+entry.phase+' · description is a proposed safety-bounded test, not a historical test receipt');
 }
}
function showGates(){
 const host=$('gates');host.replaceChildren();
 for(const g of D.GATES){
  const row=add(host,'label',undefined,'check');const cb=add(row,'input');cb.type='checkbox';cb.checked=review[g.id];
  const text=add(row,'span');add(text,'strong',g.label);add(text,'small',g.help);
  cb.addEventListener('change',()=>{review[g.id]=cb.checked;refreshGates()});
 }
 refreshGates();
}
function showRoot(){
 $('creator-root-quote').textContent=ways.exactCreatorStatement;
 const list=$('root-list');list.replaceChildren();
 ways.exactOrderIncludingRepetitions.forEach((term,i)=>add(list,'span',(i+1)+'. '+term,'record'));
 const buttons=[$('rootBuild'),$('rootClear')];
 const status=()=>{const s=controller.status();for(const b of buttons)b.disabled=s.state!=='enabled';
  if(s.state==='stopped')msg('STOP honored for this in-memory instance. A fresh instance requires a new explicit owner approval.');
  else if(s.state==='enabled')msg('Owner-local arithmetic simulation enabled. No network or remote calls.');
  else msg('Not enabled. The source language and all nine Ways are preserved.')};
 $('rootEnable').addEventListener('click',()=>{
  const yes=$('rootAuthorize').checked;
  const success=controller.authorize({scope:'owner-local',ownerApproved:yes});
  if(!success)msg('No authorization recorded, or this simulation was already stopped.');
  else status();
 });
 for(const [id,formula]of [['rootBuild','BUILD'],['rootClear','CLEAR']]){
  $(id).addEventListener('click',()=>{
   try{const outcome=controller.simulate(formula);
    msg(outcome.expression+' · '+outcome.action+' · local result '+outcome.result+' · zero network calls');}
   catch(e){msg(e.message);status()}
  });
 }
 $('rootStop').addEventListener('click',()=>{controller.stop('owner STOP');$('rootAuthorize').checked=false;status()});
 status();
}
function showNineCars(){
 let lot=N.newLedger(9);
 const out=$('nineCarsResult');
 const readNumber=(id,min,max)=>{
  const raw=$(id).value.trim();
  if(!/^\d+$/.test(raw))throw Error('Enter a whole number');
  const n=Number(raw);
  if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('Enter a number between '+min+' and '+max);
  return n;
 };
 const update=(extra='')=>{
  const groups=readNumber('nineCarsGroups',0,10);
  const m=N.calculate(lot,groups);
  out.textContent='Cars still in the simulated lot: '+m.physicalCarsStillPresent+
   ' · '+m.expression+' · calculation changes no physical cars.'+
   (extra?' · '+extra:'');
 };
 $('nineCarsCalculate').addEventListener('click',()=>{
  try{update('No physical event was recorded.');}catch(e){out.textContent=e.message}
 });
 for(const [id,type] of [['nineCarsDepart','departed'],['nineCarsArrive','entered']]){
  $(id).addEventListener('click',()=>{
   try{
    const amount=readNumber('nineCarsAmount',1,9);
    lot=N.applyPhysicalEvent(lot,{type,quantity:amount,ownerAuthorized:$('nineCarsAuthorize').checked,
     reason:'Owner-approved in-memory simulated '+type});
    update('One local inventory event recorded at revision '+lot.revision+'.');
   }catch(e){out.textContent=e.message}
  });
 }
 $('nineCarsReset').addEventListener('click',()=>{
  lot=N.newLedger(9);$('nineCarsAuthorize').checked=false;
  $('nineCarsGroups').value='0';update('The example is back at its original nine-car starting snapshot.');
 });
 $('nineCarsGroups').addEventListener('change',()=>{
  try{update()}catch(e){out.textContent=e.message}
 });
 update('No events recorded.');
}
function controls(){
 $('query').addEventListener('input',showScenarios);
 $('phase').addEventListener('change',showScenarios);
 $('reset').addEventListener('click',()=>{review=D.blankState();showGates()});
 $('export').addEventListener('click',()=>{
  const payload={schema:'nathan-ai.deep-rock.mock-review.v1',reference:'dossiers 70.1/70.2',
   originalSource:'creator-submitted',simulationOnly:true,review:D.assess(review),remoteAccessVerified:false};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='nathan-deep-rock-local-review.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
}
Promise.all([
 fetch('./dossiers.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('dossiers unavailable');return r.json()}),
 fetch('./ways-of-nathan-tabor.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Ways source unavailable');return r.json()})
]).then(([d,w])=>{D.validate(d);W.verify(w);docs=d;ways=w;showDossiers();showScenarios();showGates();showRoot();showNineCars();controls()})
.catch(error=>{$('outcome').textContent='The original-source view could not load: '+error.message;
 $('rootStatus').textContent='No local simulation was enabled.'});
})();
