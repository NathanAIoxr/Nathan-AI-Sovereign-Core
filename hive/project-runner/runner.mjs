import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,realpath,rename,stat,writeFile} from 'node:fs/promises';
import {dirname,isAbsolute,join,relative,resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
import {pathToFileURL} from 'node:url';

const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const ROLES = ['build','review','integrate','verify'];
const SHA = input => createHash('sha256').update(input).digest('hex');
const output = item => console.log(JSON.stringify(item));

export function client(base,token) {
  const url = new URL(base);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol!=='https:' && !(url.protocol==='http:' && ['127.0.0.1','localhost'].includes(url.hostname)))) {
    throw new Error('Use HTTPS or a local HTTP test server');
  }
  if (typeof token!=='string' || token.length<32) throw new Error('Set a runner token of at least 32 characters');
  return async function call(path,body) {
    const response = await fetch(new URL(path,url),{
      method:body===undefined?'GET':'POST',
      headers:{authorization:'Bearer '+token,'content-type':'application/json'},
      body:body===undefined?undefined:JSON.stringify(body),
      redirect:'error',signal:AbortSignal.timeout(15_000)
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error ?? 'Runner request failed');
      error.status = response.status;
      throw error;
    }
    return data;
  };
}

async function artifact(root, evidence) {
  const path = evidence?.artifact?.path;
  if (typeof path!=='string'||isAbsolute(path)) throw new Error('Adapter must return a relative artifact path');
  const target = await realpath(resolve(root,path));
  const location = relative(root,target);
  if (!location || location==='..' || location.startsWith('../') || isAbsolute(location)) {
    throw new Error('Artifact must stay inside the configured workspace');
  }
  const info = await stat(target);
  if (!info.isFile() || info.size>32*1024*1024) throw new Error('Artifact must be a file of at most 32 MiB');
  return {...evidence,artifact:{path:location,sha256:SHA(await readFile(target))}};
}

function invoke(adapter, args, task, cwd, signal, limit = 64*1024) {
  const env = {...process.env};
  delete env.NATHAN_RUNNER_TOKEN;
  return new Promise((resolve,reject) => {
    const child = spawn(adapter,args,{cwd,env,stdio:['pipe','pipe','ignore'],signal});
    const chunks = [];
    let size = 0;
    child.on('error',reject);
    child.stdin.on('error',()=>{});
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Adapter output exceeds the configured byte limit'));
        child.kill();
      } else chunks.push(chunk);
    });
    child.on('close', code => {
      if (code!==0) return reject(new Error(`Adapter exited with status ${code}`));
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('Adapter did not return one JSON receipt')); }
    });
    child.stdin.end(JSON.stringify(task));
  });
}

async function loadSaved(path, fingerprint, cwd) {
  try {
    const saved = JSON.parse(await readFile(path,'utf8'));
    if (saved.fingerprint!==fingerprint || saved.result?.outcome!=='accepted') return null;
    const observed = await artifact(cwd,saved.result.evidence);
    return observed.artifact.sha256===saved.result.evidence.artifact.sha256 ? saved.result : null;
  } catch { return null; }
}

async function save(path, value) {
  await mkdir(dirname(path),{recursive:true,mode:0o700});
  const temp = path+'.'+randomUUID()+'.tmp';
  await writeFile(temp,JSON.stringify(value),{flag:'wx',mode:0o600});
  await rename(temp,path);
}

async function runTask(call, config, claim) {
  const {job,task,lease,dependencies} = claim;
  const identity = {lease,attempt:task.attempt};
  const route = `/v1/jobs/${job.id}/tasks/${task.id}`;
  const packet = {job,task:{id:task.id,role:task.role,instruction:task.instruction,acceptance:task.acceptance},dependencies};
  const fingerprint = SHA(JSON.stringify(packet));
  const journal = join(config.journal,job.id,task.id+'.json');
  const lost = new AbortController();
  let heartbeat;
  const beat = async () => {
    try { await call(route+'/heartbeat',identity); } catch (error) {
      if (error.status===409 || error.status===401) lost.abort();
    } finally {
      if (!lost.signal.aborted) heartbeat = setTimeout(beat,25_000);
    }
  };
  heartbeat = setTimeout(beat,25_000);
  try {
    let result = await loadSaved(journal,fingerprint,config.cwd);
    if (!result) {
      try {
        for (const dependency of dependencies) {
          const saved = dependency.receipt;
          const current = await artifact(config.cwd,saved);
          if (current.artifact.sha256!==saved.artifact.sha256) {
            throw new Error(`Accepted artifact changed for prerequisite ${dependency.id}`);
          }
        }
        const proposed = await invoke(config.adapter,config.args, {...packet,attempt:task.attempt},
          config.cwd,AbortSignal.any([lost.signal,AbortSignal.timeout(config.taskTimeoutMs)]));
        if (!['accepted','retry','blocked'].includes(proposed?.outcome)) throw new Error('Unrecognized adapter outcome');
        if (proposed.outcome==='accepted') {
          const checks = proposed.evidence?.checks;
          if (!Array.isArray(checks) || !checks.length || checks.length>30 ||
              checks.some(check=>typeof check?.name!=='string' || !check.name.trim() || check.name.length>300 || check.result!=='passed')) {
            throw new Error('Adapter must report passing checks before acceptance');
          }
          result = {outcome:'accepted',evidence:await artifact(config.cwd,proposed.evidence)};
          if (JSON.stringify(result.evidence).length>8192) throw new Error('Adapter evidence exceeds 8 KiB');
          await save(journal,{fingerprint,result});
        } else {
          const reason = String(proposed.evidence?.reason??'').trim().slice(0,2000);
          result = {outcome:proposed.outcome,evidence:{reason:reason || 'Adapter did not complete'}};
        }
      } catch (error) {
        result = {outcome:'retry',evidence:{reason:String(error.message).slice(0,2000)}};
      }
    }
    if (lost.signal.aborted) throw new Error('Lease was lost before completion');
    const body = {...identity,...result};
    let confirmed;
    try { confirmed = await call(route+'/finish',body); }
    catch (error) {
      if (error.status && error.status<500) throw error;
      confirmed = await call(route+'/finish',body);
    }
    output({job:job.id,task:task.id,attempt:task.attempt,state:confirmed.state});
  } finally {
    lost.abort();
    clearTimeout(heartbeat);
  }
}

export async function run(call, settings) {
  const config = {
    ...settings,cwd:await realpath(settings.cwd),journal:resolve(settings.journal),
    roles:settings.roles??ROLES,args:settings.args??[],pollMs:settings.pollMs??5000,
    taskTimeoutMs:settings.taskTimeoutMs??900_000
  };
  const stopAt = settings.stopAt===undefined ? Infinity : Date.parse(settings.stopAt);
  if (!ID.test(config.jobId??'') || !ID.test(config.root??'') || typeof config.adapter!=='string' || Number.isNaN(stopAt) ||
      !Array.isArray(config.args) || config.args.some(arg=>typeof arg!=='string') ||
      !Array.isArray(config.roles) || !config.roles.length || config.roles.some(role=>!ROLES.includes(role)) ||
      !Number.isInteger(config.pollMs) || config.pollMs<100 ||
      !Number.isInteger(config.taskTimeoutMs) || config.taskTimeoutMs<1000) throw new Error('Invalid runner settings');
  const route = `/v1/jobs/${config.jobId}`;
  while (true) {
    if (Date.now()>=stopAt) return {...await call(route),session:'paused'};
    try {
      const claim = await call(route+'/claim',{root:config.root,roles:config.roles});
      if (claim.task) {
        await runTask(call,config,claim);
        continue;
      }
      const status = await call(route);
      if (status.state!=='active') return status;
    } catch (error) {
      if (error.status && error.status<500 && error.status!==409 && error.status!==429) throw error;
      if (error.status===409 && error.message==='Job is assigned to a different workspace') throw error;
      console.error('Runner will retry:',error.message);
    }
    await sleep(config.pollMs);
  }
}

export async function start(call, settings) {
  const {project} = settings;
  if (!project || typeof project.id!=='string' || !ID.test(project.id) ||
      typeof project.root!=='string' || !ID.test(project.root) ||
      typeof project.title!=='string' || typeof project.brief!=='string' ||
      !['code','manuscript','both'].includes(project.mode)) throw new Error('Invalid start project brief');
  const job = {id:project.id,root:project.root,title:project.title,mode:project.mode,brief:project.brief};
  const fingerprint = SHA(JSON.stringify(job));
  const checkpoint = join(resolve(settings.journal),job.id,'plan.json');
  let saved;
  try { saved = JSON.parse(await readFile(checkpoint,'utf8')); }
  catch (error) { if (error.code!=='ENOENT') throw error; }
  if (saved && saved.fingerprint!==fingerprint) throw new Error('The local plan checkpoint has a different brief');
  if (!saved) {
    if (settings.stopAt!==undefined && !(Date.parse(settings.stopAt)>Date.now())) {
      throw new Error('Set stopAt to a future time before starting a new plan');
    }
    const result = await invoke(settings.adapter,settings.args??[],{operation:'plan',job},
      await realpath(settings.cwd),AbortSignal.timeout(settings.taskTimeoutMs??900_000),512*1024);
    if (!Array.isArray(result?.tasks) || !result.tasks.length) throw new Error('Planner did not return tasks');
    saved = {fingerprint,plan:{...job,tasks:result.tasks}};
    await save(checkpoint,saved);
  }
  try { await call('/v1/jobs',saved.plan); }
  catch (error) {
    if (error.status===400 || error.status===413) {
      throw new Error(`Plan rejected. Correct or replace ${checkpoint} before restarting. ${error.message}`);
    }
    throw error;
  }
  return run(call,{...settings,jobId:job.id,root:job.root});
}

async function main() {
  const [action,path] = process.argv.slice(2);
  if (!['submit','status','run','start'].includes(action)||!path) {
    throw new Error('Usage: node runner.mjs submit PLAN.json | status JOB_ID | run SETTINGS.json | start SETTINGS.json');
  }
  const call = client(process.env.NATHAN_RUNNER_URL,process.env.NATHAN_RUNNER_TOKEN);
  if (action==='status') {
    if (!ID.test(path)) throw new Error('Invalid job ID');
    return output(await call('/v1/jobs/'+path));
  }
  const data = JSON.parse(await readFile(path,'utf8'));
  if (action==='submit') return output(await call('/v1/jobs',data));
  const status = await (action==='start' ? start(call,data) : run(call,data));
  output(status);
  if (status.state==='blocked') process.exitCode = 2;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
