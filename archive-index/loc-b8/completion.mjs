export const GATES=[
 ['source','Original source preserved'],
 ['words','Original words and tone checked'],
 ['dependencies','Dependencies resolved'],
 ['verification','Behavior and output verified'],
 ['acceptance','Original completion test satisfied'],
];
export function taskProgress(entry={}){
 const complete=GATES.filter(([key])=>typeof entry.gates?.[key]==='string'&&entry.gates[key].trim().length>0).length;
 return{complete,total:GATES.length,state:complete===GATES.length?'COMPLETION_RECORDED':complete?'IN_PROGRESS':'OPEN'};
}
export async function catalogFingerprint(data){
 const sources=data.catalog.map(r=>[r.local_shelf_id,r.sha256||'',r.title,r.original_relative_path||'']).sort((a,b)=>a[0].localeCompare(b[0]));
 const tasks=data.tasks.map(t=>[t.task_id,t.issue,t.done_when,t.dependencies||'']).sort((a,b)=>a[0].localeCompare(b[0]));
 const bytes=new TextEncoder().encode(JSON.stringify({sources,tasks}));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
const states=new Set(['OPEN','IN_REVIEW','REVIEWED','DEFERRED']);
export function parseBackup(text,{fingerprint,sourceIds,taskIds}){
 const b=JSON.parse(text);if(b?.schema!=='nathan-loc-review-v2')throw new Error('This backup needs the v2 source fingerprint. Keep older notes for manual source review.');
 if(b.catalog_fingerprint!==fingerprint)throw new Error('Backup belongs to a different catalog. Load its matching catalog first.');
 if(!b.notes||typeof b.notes!=='object'||Array.isArray(b.notes)||!b.tasks||typeof b.tasks!=='object'||Array.isArray(b.tasks))throw new Error('Backup notes or task evidence are malformed.');
 const sources=new Set(sourceIds),tasks=new Set(taskIds),notes=Object.create(null),evidence=Object.create(null);
 for(const[key,n]of Object.entries(b.notes)){
  if(!sources.has(key)||!states.has(n?.state)||typeof n.note!=='string'||n.note.length>20000)throw new Error('Backup has an unknown source or invalid review note.');
  notes[key]={state:n.state,note:n.note};
 }
 const gateKeys=new Set(GATES.map(([key])=>key));
 for(const[key,t]of Object.entries(b.tasks)){
  if(!tasks.has(key)||!t?.gates||typeof t.gates!=='object'||Array.isArray(t.gates))throw new Error('Backup has an unknown project task or invalid evidence.');
  const gates=Object.create(null);for(const[k,v]of Object.entries(t.gates)){if(!gateKeys.has(k)||typeof v!=='string'||v.length>20000)throw new Error('Backup has invalid completion evidence.');gates[k]=v;}
  evidence[key]={gates};
 }
 return{notes,tasks:evidence};
}
export function makeBackup(fingerprint,notes,tasks){return{schema:'nathan-loc-review-v2',catalog_fingerprint:fingerprint,exported_at:new Date().toISOString(),notes,tasks};}
