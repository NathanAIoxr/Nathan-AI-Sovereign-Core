import * as V from './vault.js';
import {decodeImage,imageFromFile,cameraFrame,measureImage,polarIris,paintAnnotated} from './analysis.js';
const $=id=>document.getElementById(id), q=sel=>document.querySelector(sel), qa=sel=>Array.from(document.querySelectorAll(sel));
const now=()=>new Date().toISOString();
const LIMIT_DOC=8*1024*1024;
let page='overview',activeId=null,handSide='left',eyeSide='A';
let handImage=null,handSource=null,handMetrics=null,handAnnotations=[],handMarkerMode=false,handHash=null;
let irisImage=null,irisSource=null,irisMetrics=null,irisCenter=null,irisPolar=null;
let stream=null,modalDone=null,working=false,lastInteraction=Date.now();
const anatomy=[
 ['Epidermis & dermis','Surface barrier, pigmentation, creases, scars and visible weathering.','RGB macro photography; dermatology examination.'],
 ['Subcutaneous tissue','Fat and connective tissue influencing contour and cushioning.','Ultrasound, MRI and examination; not separated by ordinary photography.'],
 ['Superficial dorsal veins','Venous drainage and individually variable branching patterns.','Visible RGB where apparent; dedicated NIR or ultrasound with proper validation.'],
 ['Dorsal arterial networks','Arterial supply, with branches often deeper than visible surface veins.','Doppler ultrasound, angiography when clinically justified; no RGB arterial map.'],
 ['Cutaneous sensory nerves','Superficial radial and dorsal ulnar sensory distribution, with variation.','Clinical sensory testing, nerve studies or high-resolution ultrasound; not visually readable from RGB.'],
 ['Extensor tendons','Extend fingers and thumb across the back of the hand.','Motion examination, ultrasound or MRI. Surface contours may be visible.'],
 ['Intrinsic hand muscles','Interossei and associated muscles support fine motor function.','Strength/neuromuscular examination, ultrasound, MRI and EMG as indicated.'],
 ['Metacarpals & phalanges','Bony framework of the hand and fingers.','Palpation and external contour; internal bone structure requires radiography/CT/MRI.'],
 ['Knuckles & joint capsules','Metacarpophalangeal and interphalangeal articulations.','Visible surface contours and posture; inflammatory or degenerative diagnosis requires clinical assessment.'],
 ['Ligaments & fascia','Stabilizing connective tissue and load-bearing layers.','Clinical assessment; ultrasound or MRI for selected conditions.'],
 ['Circulation & perfusion','Blood flow, temperature and oxygen delivery.','Pulse examination, Doppler, clinical perfusion instrumentation; static skin color alone cannot quantify flow.'],
 ['Cervical nerve roots','Spinal pathways that contribute to upper-limb motor and sensory function.','Neurologic examination, MRI and electrodiagnostic testing; not discerned from hand appearance alone.'],
 ['Inherited traits','Some structural tendencies have genetic contributions; individual traits are multifactorial.','Family studies and genetics testing; hand shape cannot prove specific lineage.'],
 ['Life-history changes','Scars, injuries, skin aging, occupational exposure and observed healing over time.','Dated longitudinal images, interviews, source documents and clinical records.']
];
const sampleRegions={
 left:[['Dorsal finger joints',485,600],['Metacarpal / extensor tendon region',470,825],['Fine skin creases',390,1065],['Dorsal wrist crease',385,1370],['Localized reddish area, cause unknown',307,382],['Small pigmented spot, cause unknown',566,773]],
 right:[['Dorsal finger joints',584,665],['Metacarpal / extensor tendon region',547,945],['Fine skin creases',547,1165],['Dorsal wrist crease',530,1490],['Finger extension / posture',690,405],['Small pigmented spot, cause unknown',770,1780]]
};
const verses=[
 ['Job 37:7','He sealeth up the hand of every man; that all men may know his work.','Hand, seal, human work. Study the verse within its context.'],
 ['Psalm 24:4','He that hath clean hands, and a pure heart; who hath not lifted up his soul unto vanity, nor sworn deceitfully.','Ethical cleanliness and the pure heart are moral teachings, not photometric tests.'],
 ['Isaiah 1:15','...your hands are full of blood.','Moral indictment within Isaiah; not a skin diagnostic criterion.'],
 ['James 2:18','...I will shew thee my faith by my works.','Connects faith and action.'],
 ['Proverbs 20:11','Even a child is known by his doings, whether his work be pure, and whether it be right.','Actions and accountability.'],
 ['Psalm 90:17','...establish thou the work of our hands upon us; yea, the work of our hands establish thou it.','The labor of human hands.'],
 ['Ecclesiastes 12:14','For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil.','Moral judgment, not visual biography extraction.']
];
function txt(tag,content,cls=''){const el=document.createElement(tag);el.textContent=content; if(cls)el.className=cls;return el;}
function mk(tag,attrs={}){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else e.setAttribute(k,v);}return e;}
function empty(el,message){el.replaceChildren(txt('p',message,'empty'));}
function fmtDate(date){try{return new Date(date).toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}catch{return String(date)}}
function message(id,text,fail=false){const el=$(id);el.textContent=text;el.style.color=fail?'#ffc1b9':'#e4ce9a';}
let toastTimer;
function toast(msg){const el=$('toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4500);}
function setBusy(flag){working=flag;$('createVault').disabled=flag;$('unlockVault').disabled=flag;}
async function safe(fn){try{await fn();}catch(e){console.error('Action failed',e);toast(`Error: ${e.message}`)} }
function pushAudit(action,detail=''){const s=V.state();s.audit.unshift({id:V.newId(),at:now(),action,detail:String(detail).slice(0,250)});s.audit=s.audit.slice(0,300);}
async function persist(action,detail=''){pushAudit(action,detail);await V.save();renderAll();}
function downloadText(text,name,type='application/json') {const blob=new Blob([text],{type});downloadBlob(blob,name);}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=mk('a',{href:url,download:name});document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function fileText(file,maxBytes=100*1024*1024){if(!file||file.size>maxBytes)throw new Error('File exceeds the permitted size.');return file.text();}
function downloadDataURL(url,name){const a=mk('a',{href:url,download:name});document.body.appendChild(a);a.click();a.remove();}
function selOptions(el,items,selected,blankLabel=null){el.replaceChildren();if(blankLabel!==null)el.add(new Option(blankLabel,''));for(const x of items)el.add(new Option(x.label,x.value));if(selected&&items.some(x=>x.value===selected))el.value=selected;}
function getProfile(id){return V.state().profiles.find(x=>x.id===id);}
function profileLabel(id){return getProfile(id)?.name||'Unknown profile';}
function active(){return V.state().profiles.find(x=>x.id===activeId)||null;}
function ensureProfile(){if(!V.state().profiles.length)return false;if(!active())activeId=V.state().profiles[0].id;return true;}
function alertProfile(){if(!ensureProfile()){toast('Add a profile first.');navigate('profiles');return false;}return true;}
function refreshSelects(){const s=V.state();ensureProfile();const opts=s.profiles.map(x=>({label:x.name,value:x.id}));
  for(const id of ['activeProfile','scanProfile','irisProfile','documentProfile'])selOptions($(id),opts,activeId,opts.length?null:'No profiles yet');
}
async function initializeVault(){
  try{const supported=!!window.crypto?.subtle&&!!window.indexedDB; $('secureStatus').textContent=supported?'Browser cryptography and local storage are available.':'Encrypted local storage unavailable; use localhost or HTTPS in a modern browser.';
    const has=await V.exists();$('entry-create').hidden=has;$('entry-unlock').hidden=!has;
    for(const id of ['createVault','unlockVault'])$(id).disabled=!supported;
  }catch(e){message('entryMessage',e.message,true);}
}
async function openShell(){
  $('entry').hidden=true;$('shell').hidden=false;
  if(V.state().profiles.length)activeId=V.state().profiles[0].id;
  renderAll();navigate('overview');
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
function stopCamera(){if(stream){for(const t of stream.getTracks())t.stop();stream=null;}$('cameraVideo').srcObject=null;$('cameraWrap').hidden=true;$('cameraCapture').disabled=true;}
function lock(){stopCamera();handImage=null;irisImage=null;handSource=null;irisSource=null;V.lock();$('shell').hidden=true;$('entry').hidden=false;$('unlockPass').value='';$('entry-create').hidden=true;$('entry-unlock').hidden=false;document.body.classList.remove('nav-open');initializeVault();}
function navigate(next){page=next;qa('.view').forEach(v=>v.hidden=v.dataset.view!==next);qa('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===next));const t=qa('[data-page]').find(b=>b.dataset.page===next);$('pageTitle').textContent=t?.querySelector('span')?.textContent||next;document.querySelector('.sidebar').classList.remove('open');if(next!=='scan')stopCamera();if(next==='compare')renderCompareSelectors();window.scrollTo({top:0,behavior:'instant'});}
function renderAll(){if(!V.isUnlocked())return;refreshSelects();const s=V.state();$('statProfiles').textContent=s.profiles.length;$('statHands').textContent=s.scans.filter(x=>x.kind==='hand').length;$('statEyes').textContent=s.scans.filter(x=>x.kind==='iris').length;$('statLedger').textContent=s.ledger.length;
 renderRecent();renderProfiles();renderLedger();renderDocuments();renderAnatomy();renderResearch();renderAudit();renderCompareSelectors();}
function recordShell(title,detail,meta,actions=[]){const item=mk('div',{class:'record'}),head=mk('div',{class:'record-head'}),inner=mk('div');inner.append(txt('strong',title),txt('small',meta||''));head.append(inner);
  const buttons=mk('div');for(const a of actions){const b=mk('button',{class:'mini'+(a.danger?' dangertext':''),text:a.label});b.addEventListener('click',a.click);buttons.append(b);}head.append(buttons);item.append(head);if(detail)item.append(txt('p',detail));return item;}
function renderRecent(){const el=$('recentScans'),s=V.state();el.replaceChildren();for(const scan of s.scans.slice().sort((a,b)=>b.created.localeCompare(a.created)).slice(0,5)){
 const item=recordShell(`${scan.kind==='iris'?'◉ IRIS':'◎ HAND'} · ${scan.kind==='hand'?scan.side.toUpperCase():scan.side}`,`${scan.modality} · ${scan.image?.width||'?'} × ${scan.image?.height||'?'} px`,`${profileLabel(scan.profileId)} · ${fmtDate(scan.created)}`,[{label:'View',click:()=>openScan(scan)}]);el.append(item);
 }if(!s.scans.length)empty(el,'No scans saved yet. Start with your two provided hand photos or capture a new photo.');}
function showModal(title,fields,onSubmit){const dialog=$('modal'),box=$('modalFields');$('modalTitle').textContent=title;box.replaceChildren();modalDone=onSubmit;
 for(const f of fields){const l=mk('label',{for:'form_'+f.id,text:f.label});let control;
 if(f.type==='textarea'){control=mk('textarea',{id:'form_'+f.id,rows:4});control.value=f.value||'';}
 else if(f.type==='select'){control=mk('select',{id:'form_'+f.id});for(const [value,label] of f.options)control.add(new Option(label,value));control.value=f.value||f.options[0][0];}
 else {control=mk('input',{id:'form_'+f.id,type:f.type||'text'});control.value=f.value||''; if(f.maxLength)control.maxLength=f.maxLength;}
 if(f.required)control.required=true;
 box.append(l,control);
 }
 dialog.showModal();}
function modalValues(){const data={};for(const c of $('modalFields').querySelectorAll('input,select,textarea'))data[c.id.slice(5)]=c.value.trim();return data;}
async function addProfile(existing=null){showModal(existing?'Edit family profile':'Add family profile',[
 {id:'name',label:'Profile name',required:true,maxLength:120,value:existing?.name},
 {id:'relationship',label:'Family relation / role',type:'select',value:existing?.relationship,options:[['self','Self'],['father','Father'],['grandfather','Grandfather'],['cousin','Cousin'],['mother','Mother'],['other','Other']]},
 {id:'consent',label:'Consent / legal basis',type:'select',value:existing?.consent,options:[['self','My own records'],['consented','Subject has consented'],['historical','Historical family material / legal basis'],['pending','Consent not yet established']]},
 {id:'notes',label:'Context or permission notes',type:'textarea',value:existing?.notes}
 ],async d=>{
  if(!d.name)throw new Error('Name required.');if(!existing&&d.consent==='pending')throw new Error('Obtain consent before adding another person’s biometric scans.');
  if(existing)Object.assign(existing,d);else{const p={id:V.newId(),created:now(),...d};V.state().profiles.push(p);activeId=p.id;}
  await persist(existing?'PROFILE_UPDATED':'PROFILE_CREATED',d.name);
 });}
function renderProfiles(){const el=$('profilesGrid'),s=V.state();el.replaceChildren();if(!s.profiles.length){empty(el,'No profiles yet. Add your own record, then add relatives only with permission or a documented historical basis.');return}
 for(const p of s.profiles){const card=mk('article',{class:'profile-card'}),ava=mk('div',{class:'avatar',text:p.name.slice(0,1).toUpperCase()});
  card.append(ava,txt('h3',p.name),txt('small',`${p.relationship} · ${p.consent}`),txt('p',p.notes||'No context notes yet.'));
  const count=s.scans.filter(x=>x.profileId===p.id).length;
  card.append(txt('small',`${count} scans · ${s.ledger.filter(x=>x.profileId===p.id).length} ledger entries`));
  const actions=mk('div',{class:'actions'});const choose=mk('button',{text:'Select'}),edit=mk('button',{text:'Edit'}),remove=mk('button',{text:'Delete'});
  choose.onclick=()=>{activeId=p.id;renderAll();navigate('scan')};edit.onclick=()=>addProfile(p);
  remove.onclick=()=>safe(async()=>{if(!confirm(`Delete ${p.name} and all associated scans, documents, and ledger records?`))return;for(const key of ['scans','ledger','documents'])s[key]=s[key].filter(x=>x.profileId!==p.id);s.profiles=s.profiles.filter(x=>x.id!==p.id);activeId=s.profiles[0]?.id||null;await persist('PROFILE_DELETED',p.name)});
  actions.append(choose,edit,remove);card.append(actions);el.append(card);
 }}
function addLedger(){if(!alertProfile())return;showModal('Add a life ledger record',[
 {id:'date',label:'Event date',type:'date',value:new Date().toISOString().slice(0,10),required:true},
 {id:'category',label:'Category',type:'select',options:[['labor','Labor / work'],['injury','Injury / scar'],['healing','Healing / recovery'],['inheritance','Inheritance / genealogy'],['clinical','Clinical / medical'],['testimony','Family testimony'],['reflection','Spiritual reflection'],['other','Other']]},
 {id:'evidence',label:'Evidence class',type:'select',options:[['user_report','My statement'],['family_testimony','Family testimony'],['clinical_document','Documented clinical record'],['historical_document','Historical document'],['observed_rgb','RGB image observation'],['hypothesis','Hypothesis / interpretation']]},
 {id:'source',label:'Source / citation',value:'Personal account',required:true,maxLength:250},
 {id:'description',label:'The event and its context',type:'textarea',required:true}
 ],async d=>{if(!d.description||!d.source)throw new Error('Record and source are required.');V.state().ledger.push({id:V.newId(),profileId:activeId,created:now(),...d});await persist('LEDGER_ADDED',d.category);});}
function renderLedger(){const el=$('ledgerList'),s=V.state();el.replaceChildren();const rows=s.ledger.filter(x=>x.profileId===activeId).sort((a,b)=>b.date.localeCompare(a.date));
 for(const r of rows){el.append(recordShell(`${r.date} · ${r.category}`,r.description,`${r.evidence} · Source: ${r.source}`,[{label:'Delete',danger:true,click:()=>safe(async()=>{if(!confirm('Delete this entry?'))return;s.ledger=s.ledger.filter(x=>x.id!==r.id);await persist('LEDGER_DELETED',r.id)})}]));}
 if(!rows.length)empty(el,'No life records entered for this profile.');}
function renderDocuments(){const el=$('documentList'),s=V.state();el.replaceChildren();const rows=s.documents.filter(x=>x.profileId===activeId);
 for(const r of rows){el.append(recordShell(r.filename,`Source: ${r.source}`,`${Math.round(r.size/1024)} KB · ${fmtDate(r.created)}`,[{label:'Download',click:()=>downloadDataURL(r.data,r.filename)},{label:'Delete',danger:true,click:()=>safe(async()=>{if(!confirm('Delete this attachment?'))return;s.documents=s.documents.filter(x=>x.id!==r.id);await persist('DOCUMENT_DELETED',r.filename)})}]));}
 if(!rows.length)empty(el,'No supporting documents attached to this profile.');}
function renderAnatomy(){const box=$('anatomyGrid');box.replaceChildren();for(const [name,explanation,method] of anatomy){const div=mk('article',{class:'anatomy-card'});div.append(txt('h3',name),txt('p',explanation),txt('small','Evidence: '+method));box.append(div);}}
function renderResearch(){const box=$('verseGrid');box.replaceChildren();for(const [ref,quote,explanation] of verses){const div=mk('article',{class:'verse'});div.append(txt('h3',ref),txt('blockquote','“'+quote+'”'),txt('p',explanation));box.append(div);}
 const list=$('researchList');list.replaceChildren();for(const item of V.state().researchNotes.slice().reverse()){list.append(recordShell(item.source,item.text,fmtDate(item.created),[{label:'Delete',danger:true,click:()=>safe(async()=>{V.state().researchNotes=V.state().researchNotes.filter(x=>x.id!==item.id);await persist('RESEARCH_DELETED',item.id)})}]));}
 if(!V.state().researchNotes.length)empty(list,'No additional research notes. Original text and analysis should be kept distinct.');}
function renderAudit(){const el=$('auditList');el.replaceChildren();for(const a of V.state().audit.slice(0,35))el.append(recordShell(a.action,a.detail,fmtDate(a.at)));if(!V.state().audit.length)empty(el,'No activity recorded.');}
function renderCompareSelectors(){const s=V.state(),options=s.scans.filter(x=>x.image?.source).map(x=>({value:x.id,label:`${x.kind} ${x.side} · ${profileLabel(x.profileId)} · ${fmtDate(x.created)}`}));
 const oldA=$('compareA').value,oldB=$('compareB').value;selOptions($('compareA'),options,oldA,'Choose scan A');selOptions($('compareB'),options,oldB,'Choose scan B');}
async function openScan(scan){activeId=scan.profileId;renderAll();if(scan.kind==='iris'){navigate('iris');irisSource=scan.image.source;irisImage=await decodeImage(irisSource);irisCenter=scan.iris?.center||null;irisPolar=null;eyeSide=scan.side;$('irisRadius').value=Math.round((scan.iris?.radius||.14)*100);$('irisRadiusValue').textContent=$('irisRadius').value+'%';redrawIris();}else{navigate('scan');handSource=scan.image.source;handImage=await decodeImage(handSource);handSide=scan.side;handAnnotations=structuredClone(scan.annotations||[]);handMetrics=scan.metrics;handHash=scan.sha256||null;$('scanModality').value=scan.modality;updateSegment('handSide','side',handSide);redrawHand();}}
function updateSegment(id,key,value){qa(`#${id} [data-${key}]`).forEach(b=>b.classList.toggle('selected',b.dataset[key]===value));}
async function acceptHand(data,sourceLabel,sha){handSource=data.source;handImage=await decodeImage(handSource);handMetrics=measureImage(handImage,'hand');handAnnotations=[];handHash=sha||null;$('handEmpty').hidden=true;$('scanImageType').textContent=$('scanModality').value+' · '+sourceLabel;redrawHand();$('saveScan').disabled=false;$('addHandMarker').disabled=false;$('exportAnnotated').disabled=false;message('scanMessage','Photo loaded. Verify the capture side and modality before saving.');}
function redrawHand(){if(!handImage)return;const c=$('handCanvas');paintAnnotated(c,handImage,handAnnotations,$('scanMode').value,'hand');if($('scanGuide').checked){const ctx=c.getContext('2d');ctx.strokeStyle='#e3c3849e';ctx.lineWidth=2;ctx.setLineDash([9,9]);ctx.strokeRect(c.width*.12,c.height*.07,c.width*.76,c.height*.86);ctx.setLineDash([]);}
 $('handEmpty').hidden=true;const el=$('scanMetrics');el.replaceChildren();const m=handMetrics||measureImage(handImage,'hand');const pairs=[['Original pixels',m.width+' × '+m.height],['Mean luminance',m.meanLuminance+' / 255'],['Contrast',String(m.contrast)],['Sharpness proxy',String(m.sharpnessProxy)],['Clipped pixels',m.clippedPercent+'%'],['Edge density',m.edgePercent+'%']];
 for(const [label,val] of pairs)el.append(metric(label,val));
 let warning=$('scanMessage');warning.textContent=m.qualityFlags.join(' ')+' These statistics include background pixels.';
 renderMarkers();}
function metric(label,val){const div=mk('div',{class:'metric'});div.append(txt('b',val),txt('span',label));return div;}
function renderMarkers(){const box=$('handAnnotations');box.replaceChildren();for(let i=0;i<handAnnotations.length;i++){
 const a=handAnnotations[i];box.append(recordShell(`${i+1}. ${a.label}`,`(${Math.round(a.x*100)}%, ${Math.round(a.y*100)}%) · ${a.evidence}`,'User-placed observation',[{label:'Remove',danger:true,click:()=>{handAnnotations.splice(i,1);redrawHand();}}]));}
}
async function fileHandler(file,kind){if(!file)return;const arr=await file.arrayBuffer();const hash=await V.digest(arr),data=await imageFromFile(file);if(kind==='hand')await acceptHand(data,file.name,hash);else await acceptIris(data,file.name,hash);}
async function loadProvided(){if(!alertProfile())return;const btn=$('loadOriginals');btn.disabled=true;try{
 const s=V.state();let count=0;for(const [side,name] of [['left','IMG_5083.jpeg'],['right','IMG_5084.jpeg']]){
  if(s.scans.some(x=>x.profileId===activeId&&x.sourceName===name&&x.sample===true))continue;
  const res=await fetch('./private-samples/'+name,{cache:'no-store'});if(!res.ok)throw new Error('Private sample not present in this installation. Use the photo uploader.');
  const data=new Uint8Array(await res.arrayBuffer());const blob=new File([data],name,{type:'image/jpeg'});
  const image=await imageFromFile(blob),decoded=await decodeImage(image.source);
  s.scans.push({id:V.newId(),created:now(),profileId:activeId,kind:'hand',side,modality:'RGB',sourceName:name,sample:true,image,sha256:await V.digest(data.buffer),metrics:measureImage(decoded,'hand'),annotations:sampleRegions[side].map(([label,x,y])=>({id:V.newId(),x:x/1536,y:y/2048,label,evidence:'manually_reviewed_region_in_user_supplied_photo'})),device:'User-supplied camera photo',verified:false,livenessVerified:false});count++;
 }
 await persist('SAMPLES_IMPORTED',`${count} of the two provided hand photos`);$('sampleStatus').textContent=`Imported ${count} new photo(s) into your encrypted vault.`;
 const scan=s.scans.filter(x=>x.profileId===activeId&&x.sample).at(-1);if(scan)await openScan(scan);toast('Your provided hand photos are saved locally and encrypted.');
 }finally{btn.disabled=false;}}
function handCanvasTap(e){if(!handMarkerMode||!handImage)return;const r=$('handCanvas').getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
 const label=prompt('Describe the visible feature at this location. Do not enter a diagnosis without a clinical source.');if(!label?.trim())return;
 handAnnotations.push({id:V.newId(),x:+x.toFixed(5),y:+y.toFixed(5),label:label.trim().slice(0,300),evidence:'observed_rgb_or_user_description'});redrawHand();}
async function saveHand(){if(!handSource||!handImage||!alertProfile())return;const modality=$('scanModality').value;
 const scan={id:V.newId(),created:now(),profileId:$('scanProfile').value||activeId,kind:'hand',side:handSide,modality,sourceName:$('scanImageType').textContent,image:{source:handSource,width:handMetrics.width,height:handMetrics.height},sha256:handHash,metrics:handMetrics,annotations:structuredClone(handAnnotations),device:$('scanDevice').value.slice(0,160),wavelength_nm:modality==='NIR_IMPORTED'?(Number($('scanWave').value)||null):null,sensor_notes:$('scanSensorNotes').value.slice(0,4000),verified:false,livenessVerified:false,calibrated:false};
 V.state().scans.push(scan);await persist('HAND_SCAN_ADDED',`${scan.side}/${scan.modality}`);toast('Hand scan encrypted and saved.');}
async function startCamera(){if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera requires HTTPS/localhost and permission. Use the file input if unavailable.');stopCamera();stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});$('cameraVideo').srcObject=stream;$('cameraWrap').hidden=false;$('cameraCapture').disabled=false;await $('cameraVideo').play();}
function resizeMarkerInfo(){handMarkerMode=!handMarkerMode;$('addHandMarker').textContent=handMarkerMode?'Tap image to annotate · ON':'+ Place observation';$('handMarkerHint').textContent=handMarkerMode?'Tap a location on the canvas and describe what you see.':'All marker text is user-entered; there is no automatic disease labeling.';}
async function acceptIris(data,label,hash){irisSource=data.source;irisImage=await decodeImage(irisSource);irisMetrics=measureImage(irisImage,'iris');irisCenter=null;irisPolar=null;irisHash=hash||null;$('irisEmpty').hidden=true;redrawIris();$('saveIris').disabled=false;message('irisMessage',`${label} loaded. Tap iris center to mark. No identity match will be performed.`);}
let irisHash=null;
function redrawIris(){if(!irisImage)return;const radius=Number($('irisRadius').value)/100;const r=irisCenter?{center:irisCenter,radius}:null;
 paintAnnotated($('irisCanvas'),irisImage,[],$('irisMode').value,'iris',r);$('irisEmpty').hidden=true;
 const box=$('irisMetrics');box.replaceChildren();box.append(metric('Image size',irisMetrics.width+' × '+irisMetrics.height),metric('Contrast',String(irisMetrics.contrast)),metric('Sharpness proxy',String(irisMetrics.sharpnessProxy)),metric('Marked radius',`${Math.round(radius*100)}%`));
 if(irisCenter){irisPolar=polarIris(irisImage,irisCenter,radius);if(irisPolar){$('polarPreview').src=irisPolar.image;$('polarPreview').hidden=false;box.append(metric('Polar texture variation',String(irisPolar.textureVariation)),metric('Valid polar pixels',irisPolar.validPercent+'%'));}}
 else{$('polarPreview').hidden=true;irisPolar=null;}
}
function irisTap(e){if(!irisImage)return;const r=$('irisCanvas').getBoundingClientRect();irisCenter={x:+((e.clientX-r.left)/r.width).toFixed(5),y:+((e.clientY-r.top)/r.height).toFixed(5)};redrawIris();}
async function saveEye(){if(!irisImage||!alertProfile())return;const scan={id:V.newId(),kind:'iris',side:eyeSide,profileId:$('irisProfile').value||activeId,created:now(),modality:'RGB_MANUAL',sourceName:'User-selected iris photo',image:{source:irisSource,width:irisMetrics.width,height:irisMetrics.height},sha256:irisHash,metrics:irisMetrics,iris:{center:irisCenter,radius:Number($('irisRadius').value)/100,polarMetrics:irisPolar?{textureVariation:irisPolar.textureVariation,validPercent:irisPolar.validPercent}:null},verified:false,livenessVerified:false};V.state().scans.push(scan);await persist('IRIS_STUDY_ADDED',eyeSide);toast('Iris study encrypted and saved.');}
async function documentUpload(file){if(!file||!alertProfile())return;if(file.size>LIMIT_DOC)throw new Error('Attachment exceeds 8 MB.');if(!['application/pdf','text/plain'].includes(file.type)&&!file.type.startsWith('image/'))throw new Error('PDF, text or image files only.');const data=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(new Error('Document read failed.'));fr.readAsDataURL(file)});
 V.state().documents.push({id:V.newId(),profileId:$('documentProfile').value||activeId,created:now(),filename:file.name.slice(0,180),size:file.size,mime:file.type,source:$('documentSource').value.slice(0,300)||'Uploaded by profile owner',data});await persist('DOCUMENT_ATTACHED',file.name);toast('Document stored in encrypted vault.');}
async function compare(){const s=V.state(),a=s.scans.find(x=>x.id===$('compareA').value),b=s.scans.find(x=>x.id===$('compareB').value);const box=$('compareOutput');box.replaceChildren();if(!a||!b){toast('Choose two saved scans.');return;}if(a.id===b.id){toast('Choose different scans.');return;}
 if(a.kind!==b.kind){toast('Compare two hands or two iris studies, not mixed kinds.');return;}
 const grid=mk('div',{class:'comparison-images'});
 for(const x of [a,b]){const cell=mk('div');cell.append(mk('img',{src:x.image.source,alt:`${x.kind} ${x.side} scan`}),txt('p',`${profileLabel(x.profileId)} · ${x.side} · ${fmtDate(x.created)}`));grid.append(cell);}
 box.append(grid);const detail=mk('div',{class:'stats'});
 for(const [label,key] of [['Luminance change','meanLuminance'],['Contrast change','contrast'],['Sharpness proxy change','sharpnessProxy'],['Clipped pixels change','clippedPercent']]){
 const diff=+(b.metrics[key]-a.metrics[key]).toFixed(2);detail.append(metric(label,(diff>=0?'+':'')+diff+(key==='clippedPercent'?' pp':'')));
 }
 box.append(detail,txt('p','Differences above are whole-photo pixel metrics, not evidence of biological or medical change.','disclaimer'));
}
async function restoreBackup(file,fromEntry=false){if(!file)return;const raw=await fileText(file);let obj;try{obj=JSON.parse(raw)}catch{throw new Error('Invalid JSON backup.');}if(obj.format!=='EYEPRINTS_HANDPRINTS_ENCRYPTED_BACKUP')throw new Error('This is not a v3 encrypted backup.');
 if(!confirm('Replace the entire local vault with this encrypted backup? Current local records will be overwritten.'))return;
 stopCamera();await V.importEncrypted(raw);$('shell').hidden=true;$('entry').hidden=false;$('unlockPass').value='';await initializeVault();toast('Encrypted backup restored. Unlock using its original passphrase.');}
async function importLegacy(file){if(!file)return;const data=JSON.parse(await fileText(file,2*1024*1024));if(data.schema!=='handprints.evidence.v2'||!Array.isArray(data.life_ledger))throw new Error('Unsupported legacy file (expected handprints.evidence.v2).');if(!alertProfile())return;
 let count=0;for(const r of data.life_ledger.slice(0,500)){if(!r||typeof r.note!=='string')continue;V.state().ledger.push({id:V.newId(),profileId:activeId,created:now(),date:String(r.date||'').slice(0,10),category:String(r.category||'other').slice(0,90),evidence:'user_report',source:String(r.source||'Legacy import').slice(0,250),description:r.note.slice(0,20000)});count++;}
 await persist('LEGACY_LEDGER_IMPORTED',String(count));toast(`Imported ${count} legacy ledger records. Photos were not imported.`);}
function attachActions(){
 $('createVault').onclick=()=>safe(async()=>{if(working)return;setBusy(true);try{const pw=$('newPass').value;if(pw!==$('confirmPass').value)throw new Error('Passphrases do not match.');await V.create(pw);$('newPass').value='';$('confirmPass').value='';await openShell();toast('New encrypted vault created. Add your first profile.');}catch(e){message('entryMessage',e.message,true);}finally{setBusy(false);}});
 $('unlockVault').onclick=()=>safe(async()=>{if(working)return;setBusy(true);try{await V.unlock($('unlockPass').value);$('unlockPass').value='';message('entryMessage','');await openShell();}catch(e){message('entryMessage',e.message,true);}finally{setBusy(false);}});
 for(const id of ['unlockPass','newPass','confirmPass'])$(id).addEventListener('keydown',e=>{if(e.key==='Enter')$(id==='unlockPass'?'unlockVault':'createVault').click()});
 $('entryImport').onclick=()=>$('entryImportFile').click();$('entryImportFile').onchange=e=>safe(()=>restoreBackup(e.target.files?.[0],true));
 $('menuBtn').onclick=()=>q('.sidebar').classList.toggle('open');
 qa('[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));qa('[data-go]').forEach(b=>b.onclick=()=>navigate(b.dataset.go));
 $('quickScan').onclick=()=>navigate('scan');$('lockBtn').onclick=lock;
 $('activeProfile').onchange=e=>{activeId=e.target.value;renderAll();};
 for(const id of ['scanProfile','irisProfile','documentProfile'])$(id).onchange=e=>{activeId=e.target.value;renderAll();};
 $('addProfile').onclick=()=>addProfile();$('addLedger').onclick=addLedger;
 $('closeModal').onclick=()=>$('modal').close();$('cancelModal').onclick=()=>$('modal').close();
 $('modalForm').onsubmit=e=>{e.preventDefault();const submit=modalDone,d=modalValues();safe(async()=>{await submit(d);$('modal').close();});};
 qa('#handSide button').forEach(b=>b.onclick=()=>{handSide=b.dataset.side;updateSegment('handSide','side',handSide)});
 qa('#eyeSide button').forEach(b=>b.onclick=()=>{eyeSide=b.dataset.eye;updateSegment('eyeSide','eye',eyeSide)});
 $('handFile').onchange=e=>safe(()=>fileHandler(e.target.files?.[0],'hand'));
 $('loadOriginals').onclick=()=>safe(loadProvided);
 $('startCamera').onclick=()=>safe(startCamera);
 $('cameraCapture').onclick=()=>safe(async()=>{const data=await cameraFrame($('cameraVideo'));await acceptHand(data,'Camera capture',null);stopCamera()});
 $('stopCamera').onclick=stopCamera;
 $('scanMode').onchange=redrawHand;$('scanGuide').onchange=redrawHand;
 $('addHandMarker').onclick=resizeMarkerInfo;$('handCanvas').onclick=handCanvasTap;
 $('saveScan').onclick=()=>safe(saveHand);
 $('clearHand').onclick=()=>{handSource=null;handImage=null;handAnnotations=[];handMetrics=null;handHash=null;$('handEmpty').hidden=false;$('scanMetrics').replaceChildren();$('handCanvas').width=1;$('handCanvas').height=1;$('saveScan').disabled=true;$('addHandMarker').disabled=true;$('exportAnnotated').disabled=true;$('scanImageType').textContent='NO IMAGE';};
 $('exportAnnotated').onclick=()=>{$('handCanvas').toBlob(b=>{if(b)downloadBlob(b,'HANDPRINTS_annotated.png')},'image/png')};
 $('irisFile').onchange=e=>safe(()=>fileHandler(e.target.files?.[0],'iris'));
 $('irisRadius').oninput=e=>{$('irisRadiusValue').textContent=e.target.value+'%';redrawIris();};$('irisMode').onchange=redrawIris;$('irisCanvas').onclick=irisTap;
 $('saveIris').onclick=()=>safe(saveEye);
 $('documentFile').onchange=e=>safe(()=>documentUpload(e.target.files?.[0]));
 $('compareNow').onclick=()=>safe(compare);
 $('saveResearch').onclick=()=>safe(async()=>{let text=$('researchText').value.trim(),source=$('researchSource').value.trim();if(!text||!source)throw new Error('Note and source required.');V.state().researchNotes.push({id:V.newId(),text:text.slice(0,20000),source:source.slice(0,350),created:now()});$('researchText').value='';$('researchSource').value='';await persist('RESEARCH_ADDED',source)});
 $('backupVault').onclick=()=>safe(async()=>{downloadText(await V.exportEncrypted(),'HANDPRINTS_ENCRYPTED_BACKUP_'+new Date().toISOString().slice(0,10)+'.json');pushAudit('ENCRYPTED_BACKUP_EXPORTED');await V.save();toast('Encrypted backup downloaded.')});
 $('restoreVault').onclick=()=>$('restoreFile').click();$('restoreFile').onchange=e=>safe(()=>restoreBackup(e.target.files?.[0]));
 $('legacyImport').onclick=()=>$('legacyFile').click();$('legacyFile').onchange=e=>safe(()=>importLegacy(e.target.files?.[0]));
 $('deleteVault').onclick=()=>safe(async()=>{const typed=prompt('To permanently erase the local vault, type DELETE MY VAULT');if(typed!=='DELETE MY VAULT')return;await V.deleteVault();lock();toast('Local vault deleted. Exports/backups remain wherever you saved them.');});
 document.addEventListener('pointerdown',()=>lastInteraction=Date.now());document.addEventListener('keydown',()=>lastInteraction=Date.now());
 setInterval(()=>{if(V.isUnlocked()&&Date.now()-lastInteraction>15*60*1000){lock();toast('Vault auto-locked after 15 minutes of inactivity.');}},30000);
 window.addEventListener('pagehide',stopCamera);
}
attachActions();initializeVault();
