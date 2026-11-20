import {seed,modes,normalize,verification,indexCatalog,wordIndex} from '/model.mjs';
const $=(selector)=>document.querySelector(selector);
const all=(selector)=>[...document.querySelectorAll(selector)];
let entry={...seed};
let data={entries:[]};
let forward=false;
let direction='ltr';
let selected=0;
let active='matrix';
let recorder;
let recognizer;
let toast;
let busy=false;
let readOnly=false;

async function api(path,options) {
  const response=await fetch('/api/'+path,options);
  const result=await response.json();
  if (!response.ok) throw new Error(result.error||'The request failed.');
  return result;
}
function notify(message,problem=false) {
  const status=$('#status');
  clearTimeout(toast);
  status.textContent=message;
  status.classList.toggle('problem',problem);
  status.hidden=false;
  toast=setTimeout(()=>{status.hidden=true;},6500);
}
function element(tag,text,className) {
  const node=document.createElement(tag);
  node.textContent=text;
  if(className) node.className=className;
  return node;
}
function show(panel) {
  active=panel;
  all('.pane').forEach(p=>{p.hidden=p.id!==panel;});
  all('[data-pane]').forEach(b=>b.dataset.pane===panel?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
  if(panel==='verify') renderVerification();
  if(panel==='library') searchArchive().catch(e=>notify(e.message,true));
}
function renderCanvas() {
  const nodes=[['End result',entry.result],...entry.steps.map((step,i)=>['Step '+(i+1),step]),['Origin',entry.origin]];
  if (forward) nodes.reverse();
  const canvas=$('#canvas');
  canvas.className=direction;
  canvas.replaceChildren(...nodes.map(([label],i)=>{
    const b=element('button',label,'node');
    b.type='button';
    b.setAttribute('aria-pressed',String(i===selected));
    b.addEventListener('click',()=>{selected=i;renderSelected(nodes);});
    return b;
  }));
  $('#matrix-title').textContent=entry.title||'New inquiry';
  $('#forward').textContent=forward?'Trace backward':'Trace forward';
  all('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===direction)));
  renderSelected(nodes);
}
function renderSelected(nodes) {
  selected=Math.min(selected,nodes.length-1);
  all('.node').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
  const [label,body]=nodes[selected];
  $('#node-label').textContent=label;
  $('#node-text').textContent=body||'Add the details in Build the inquiry.';
}
function renderRole() {
  $('#role-prompt').textContent=entry.role==='Storyteller'
    ? 'Retell the discovery in your own words and point to what you found.'
    : 'Ask what it does, what it is made of, and how someone can reproduce the result.';
}
function renderAudio() {
  const audio=$('#audio');
  const source=entry.audioId?'/api/audio/'+entry.audioId:'';
  if(source && audio.getAttribute('src')!==source) audio.src=source;
  if(!source && audio.hasAttribute('src')) audio.removeAttribute('src');
  audio.hidden=!source;
}
function renderSource() {
  const link=$('#open-source');
  link.hidden=!/^https?:\/\//i.test(entry.sourceUrl||'');
  if(link.hidden) link.removeAttribute('href');
  else link.href=entry.sourceUrl;
}
function renderWordIndex() {
  const box=$('#word-index');
  const indexed=wordIndex(entry);
  box.replaceChildren();
  if (!indexed.length) return;
  const detail=element('details','');
  detail.append(element('summary','Word index · '+indexed.length+' words'));
  const list=element('ul','');
  for(const item of indexed) list.append(element('li',[item.word,item.phonetic,item.root].filter(Boolean).join(' · ')));
  detail.append(list);
  box.append(detail);
}
function hydrate() {
  all('[data-field]').forEach(el=>{el.value=entry[el.dataset.field]??'';});
  $('#step-input').value=entry.steps.join('\n');
  $('#protect').value=entry.protect??'';
  $('#replicate').value=entry.replicate??'';
  ['manipulation','ambiguity','hiddenControl'].forEach(key=>{$('#'+key).checked=entry[key];});
  $('#transcript').readOnly=Boolean(entry.id&&entry.transcript);
  $('#approved').checked=false;
  $('#withdraw').hidden=!entry.published||readOnly;
  all('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(entry.mode===Number(b.dataset.mode))));
  renderRole();
  renderCanvas();
  renderVerification();
  renderAudio();
  renderSource();
  renderWordIndex();
}
function renderVerification() {
  const check=verification(entry);
  const pieces=[element('strong',check.retained?'1 + 1 = 2  ·  Retain':'1 - 1 = 0  ·  Clear from learner archive')];
  if (check.observed!==null) pieces.push(element('p','Observed result: '+check.observed));
  if(check.reasons.length) {
    const ul=element('ul','');
    ul.append(...check.reasons.map(reason=>element('li',reason)));
    pieces.push(ul);
  }
  $('#verdict').replaceChildren(...pieces);
}
async function save(publish=false,button) {
  if(busy) return;
  if(!entry.title.trim()) {show('matrix');$('[data-field=title]').focus();notify('Enter a title for the Library record.',true);return;}
  if(readOnly) {notify('Choose Dos to build an inquiry from this published record.',true);return;}
  if(recorder?.state==='recording' || recordingPending) {notify('Stop and finish recording before saving.',true);return;}
  busy=true;
  if(button) button.disabled=true;
  try {
    const {entry:saved}=await api('entries',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...entry,publish,shareApproved:$('#approved').checked})});
    entry=saved;
    data.entries=[saved,...data.entries.filter(x=>x.id!==saved.id)];
    hydrate();
    if(active==='library') await searchArchive();
    notify(publish?'Verified entry published.':'Saved to the Library of Tabor.');
  } catch(e) {notify(e.message,true);}
  finally {busy=false;if(button) button.disabled=false;}
}
function openEntry(item,isPublic) {
  if(recorder?.state==='recording'||recordingPending) {notify('Finish the current voice recording first.',true);return;}
  entry={...normalize(item),id:item.id,revision:item.revision,published:item.published};
  readOnly=isPublic;
  selected=0;forward=false;
  hydrate();
  show('matrix');
  window.scrollTo(0,0);
}
function newEntry(mode=1,retainSource=false) {
  if(recorder?.state==='recording'||recordingPending) {notify('Finish the current voice recording first.',true);return;}
  const blank=normalize({});
  entry=retainSource?{...entry,id:'',revision:undefined,published:false,transcript:'',corrections:'',audioId:'',
    protect:null,replicate:null,storyteller:'',mode}:{...blank,mode,id:''};
  readOnly=false;
  forward=false;selected=0;
  hydrate();
  show('matrix');
  $('[data-field=title]').focus();
}
let searchGeneration=0;
async function searchArchive() {
  const generation=++searchGeneration;
  const q=$('#catalog-search').value.trim();
  const isPublic=$('#collection').value==='public';
  const scheme=$('#classification').value;
  $('#semantic-control').hidden=!data.semantic||!isPublic;
  const needle=q.toLocaleLowerCase();
  const entries=isPublic?(await api('catalog?'+new URLSearchParams({q,semantic:$('#semantic').checked?'1':'0'}))).entries
    :data.entries.filter(item=>!needle||[indexCatalog(item),item.phonetic,item.rootMeaning,item.strong,item.source,item.origin,item.result].join(' ').toLocaleLowerCase().includes(needle));
  if(generation!==searchGeneration) return;
  const results=$('#results');
  results.replaceChildren();
  if(!entries.length) {results.append(element('p','No entries found.','helper'));return;}
  const groups=Map.groupBy(entries,item=>scheme==='mode'?item.mode+' · '+modes[item.mode]:(item[scheme||'kind']||'Unclassified'));
  for(const [group,items] of [...groups].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true}))) {
    results.append(element('h3',group));
    for(const item of items) {
      const b=element('button',item.title+(item.published?' · Published':' · Draft'));
      b.type='button';
      b.onclick=()=>openEntry(item,isPublic);
      results.append(b);
    }
  }
}

let recordingPending=false;
async function startRecording() {
  if(recorder?.state==='recording') {recorder.stop();return;}
  if(!data.audio||!navigator.mediaDevices||!window.MediaRecorder) {notify('Microphone recording is unavailable here. You can type or use keyboard dictation.',true);return;}
  if(readOnly || (entry.id && entry.transcript)) {notify('Start a new inquiry to add an original recording.',true);return;}
  const mic=$('#mic');
  const state=$('#record-state');
  let stream;
  mic.disabled=true;
  recordingPending=true;
  try {
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const chunks=[];
    recorder=new MediaRecorder(stream);
    const liveType=window.SpeechRecognition||window.webkitSpeechRecognition;
    const transcribe=$('#auto-transcribe').checked;
    const prior=entry.transcript;
    const prefix=prior?prior+'\n':'';
    let liveText='';
    recognizer=null;
    if(liveType&&transcribe) {
      recognizer=new liveType();
      recognizer.continuous=true;recognizer.interimResults=true;
      recognizer.onresult=event=>{
        liveText=Array.from(event.results,item=>item[0].transcript).join('');
        entry.transcript=prefix+liveText;
        $('#transcript').value=entry.transcript;
      };
      recognizer.onerror=()=>{state.textContent='Recording audio. Live transcription is unavailable.';};
      try{recognizer.start();}catch{recognizer=null;}
    }
    recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
    recorder.onstop=async()=>{
      mic.disabled=true;
      mic.textContent='Record voice';
      try{recognizer?.stop();}catch{/* Speech recognition already ended. */}
      stream.getTracks().forEach(track=>track.stop());
      state.textContent='Saving the original audio…';
      try {
        const type=recorder.mimeType||chunks[0]?.type||'audio/webm';
        const blob=new Blob(chunks,{type});
        const saved=await api('audio?transcribe='+(transcribe&&data.transcription&&!liveText?'1':'0'),{method:'POST',body:blob});
        entry.audioId=saved.id;
        if(saved.transcript&&!liveText) {entry.transcript=prefix+saved.transcript;$('#transcript').value=entry.transcript;}
        renderAudio();
        renderWordIndex();
        state.textContent=saved.warning||'Original audio saved. Review the wording before saving the capture.';
      } catch(e) {state.textContent=e.message;}
      finally {recordingPending=false;mic.disabled=false;}
    };
    recorder.start();
    mic.textContent='Stop recording';
    state.textContent='Recording…';
  } catch(e) {
    stream?.getTracks().forEach(track=>track.stop());
    recordingPending=false;
    state.textContent=e.message;
  } finally {mic.disabled=false;}
}

all('[data-pane]').forEach(b=>b.onclick=()=>show(b.dataset.pane));
all('[data-direction]').forEach(b=>b.onclick=()=>{direction=b.dataset.direction;renderCanvas();});
all('[data-mode]').forEach(b=>b.onclick=()=>{
  const mode=Number(b.dataset.mode);
  if(mode===0) {newEntry(0);return;}
  if(mode===2 && (entry.id||entry.title)) {newEntry(2,true);return;}
  entry.mode=mode;
  if(mode===1) selected=forward?0:entry.steps.length+1;
  hydrate();
});
all('[data-field]').forEach(el=>el.addEventListener('input',()=>{
  entry[el.dataset.field]=el.value;
  if(el.dataset.field==='role') renderRole();
  if(['transcript','phonetic','rootMeaning'].includes(el.dataset.field)) renderWordIndex();
  if(el.dataset.field==='sourceUrl') renderSource();
  if(active==='matrix') renderCanvas();
}));
$('#step-input').oninput=(e)=>{entry.steps=e.target.value.split('\n').filter(x=>x.trim()).slice(0,30);renderCanvas();};
$('#forward').onclick=()=>{forward=!forward;selected=0;renderCanvas();};
$('#new').onclick=()=>newEntry();
for(const id of ['save','save-voice','save-index','withdraw','publish']) $('#'+id).onclick=(e)=>save(id==='publish',e.currentTarget);
for(const key of ['protect','replicate']) $('#'+key).oninput=(e)=>{entry[key]=e.target.value===''?null:Number(e.target.value);};
for(const key of ['manipulation','ambiguity','hiddenControl']) $('#'+key).oninput=(e)=>{entry[key]=e.target.checked;};
$('#run').onclick=renderVerification;
$('#mic').onclick=startRecording;
$('#search-form').onsubmit=(e)=>{e.preventDefault();searchArchive().catch(err=>notify(err.message,true));};
for(const id of ['collection','classification','semantic']) $('#'+id).onchange=()=>searchArchive().catch(err=>notify(err.message,true));
$('#spec-open').onclick=async()=>{
  try {
    const response=await fetch('/specification');
    if(!response.ok) throw new Error('Specification unavailable.');
    $('#spec-text').textContent=await response.text();
    $('#spec').showModal();
  }catch(e){notify(e.message,true);}
};
try {
  data=await api('bootstrap');
  $('#environment').textContent=data.environment==='staging'?'Staging preview':'Local workspace';
} catch(e) {notify(e.message,true);}
hydrate();
