import {readFile,writeFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {canonical,digest,b64,utf8,id,fields,requireThat,strictJson} from './core.mjs';
import {BOT_ROLES} from './swarm.mjs';
import {
 coreRegistry,boxValue,pixelBox,reversePlan,defaultGuards,guardUpdate,allowAgent,profile,
 planRole,grantMessage,subjectMessage,verifyPortableGrant,
} from './personal-core.mjs';

const registry=coreRegistry(BOT_ROLES);
const read=async path=>strictJson(await readFile(path,'utf8'));
const [command,inputPath,dbPath]=process.argv.slice(2);
const emit=value=>console.log(JSON.stringify(value,null,2));
const sign=async(key,body)=>b64(await crypto.subtle.sign('Ed25519',key,utf8(body)));
const usage='Commands: registry | box <json> | pixel <json> | reverse <json> | key <new-key-file> | envelope <json> | verify <json> | run <json> <db> | control <json> <db> | status <db>';

async function handle(){
 if(command==='registry')return {profile:profile('zero-cloud'),...registry};
 requireThat(inputPath,usage);
 if(command==='key'){
  const keys=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const publicKey=b64(await crypto.subtle.exportKey('raw',keys.publicKey));
  await writeFile(inputPath,canonical({public_key:publicKey,private_jwk:await crypto.subtle.exportKey('jwk',keys.privateKey)}),{flag:'wx',mode:0o600});
  return {public_key:publicKey};
 }
 const data=command==='status'?null:await read(inputPath);
 if(command==='box'){
  fields(data,['root','value']);
  return boxValue(data.root,data.value);
 }
 if(command==='pixel'){
  fields(data,['root','width','height','x','y','channel']);
  return pixelBox(data.root,data.width,data.height,data.x,data.y,data.channel);
 }
 if(command==='reverse'){
  fields(data,['goal','rules','facts']);
  return reversePlan(data.goal,data.rules,data.facts);
 }
 if(command==='envelope'){
  fields(data,['issuer_file','subject_file','audience','role','key','goal']);
  id(data.key);
  requireThat(registry.agents.some(agent=>agent.id===data.role)&&['assess','recover'].includes(data.goal),'Unknown role or goal');
  const input={key:data.key,role:data.role,goal:data.goal};
  const issuer=await read(data.issuer_file),subject=await read(data.subject_file);
  const issued=Math.floor(Date.now()/1000);
  const grant={id:crypto.randomUUID(),issuer:issuer.public_key,subject:subject.public_key,audience:data.audience,
   role:input.role,purpose:'plan',issued,expires:issued+300};
  const requestHash=await digest(canonical(input));
  const importKey=identity=>crypto.subtle.importKey('jwk',identity.private_jwk,'Ed25519',false,['sign']);
  return {...input,identity:{grant,signature:await sign(await importKey(issuer),grantMessage(grant)),
   proof:await sign(await importKey(subject),subjectMessage(grant,requestHash))}};
 }
 if(command==='verify'){
  fields(data,['audience','trusted_issuer','input']);
  const {key,role,goal,identity}=fields(data.input,['key','role','goal','identity']);
  id(key);
  return verifyPortableGrant(identity,{audience:data.audience,role,issuerTrusted:key=>key===data.trusted_issuer,
   requestHash:await digest(canonical({key,role,goal}))});
 }
 requireThat(['run','control','status'].includes(command),usage);
 const file=command==='status'?inputPath:dbPath;
 requireThat(file&&file!==':memory:',usage);
 process.umask(0o077);
 const db=new DatabaseSync(file);
 try{
  db.exec('PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS state(id TEXT PRIMARY KEY, payload TEXT NOT NULL);');
  db.exec('BEGIN IMMEDIATE');
  const readState=(key,fallback)=>JSON.parse(db.prepare('SELECT payload FROM state WHERE id=?').get(key)?.payload??JSON.stringify(fallback));
  const saveState=(key,value)=>db.prepare('INSERT INTO state VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(key,canonical(value));
  const guards=readState('guards',defaultGuards());
  let output;
  if(command==='status')output={profile:profile('zero-cloud'),guards};
  if(command==='control'){
   fields(data,['role','paused']);
   output=guardUpdate(guards,data.role,data.paused,registry.agents);
   saveState('guards',output);
  }
  if(command==='run'){
   fields(data,['key','role','goal','evidence']);
   id(data.key);
   const agent=registry.agents.find(role=>role.id===data.role);
   requireThat(agent,'Unknown role');
   allowAgent(guards,agent.id);
   const {state,source}=fields(data.evidence,['state','source']);
   requireThat(['verified','contradicted','unknown'].includes(state)&&typeof source==='string'&&source.length<=240,'Invalid evidence');
   const fingerprint=canonical(data),key='receipt:'+data.key;
   const prior=readState(key,null);
   if(prior)requireThat(prior.input===fingerprint,'Run key was already used',409);
   if(prior)output=prior.receipt;
   else{
    const observation={state,source,origin:'owner-supplied snapshot'};
    output={key:data.key,role:agent.id,goal:data.goal,mode:'zero-cloud',observation,
     plan:planRole(agent,data.goal,observation),at:Date.now(),guard_generation:guards.generation};
    saveState(key,{input:fingerprint,receipt:output});
   }
  }
  db.exec('COMMIT');
  return output;
 }finally{db.close();}
}

try{emit(await handle());}
catch(error){console.error(error.message);process.exitCode=1;}
