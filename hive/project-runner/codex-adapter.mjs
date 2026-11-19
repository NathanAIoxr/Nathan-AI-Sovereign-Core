import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const schema = {
  type:'object',additionalProperties:false,required:['outcome','path','checks','reason'],
  properties:{
    outcome:{type:'string',enum:['accepted','retry','blocked']},
    path:{type:'string'},
    checks:{type:'array',items:{type:'object',additionalProperties:false,
      required:['name','result','evidence'],properties:{
        name:{type:'string'},result:{type:'string',enum:['passed']},evidence:{type:'string'}
      }}},
    reason:{type:'string'}
  }
};

const planSchema = {
  type:'object',additionalProperties:false,required:['tasks'],
  properties:{tasks:{type:'array',items:{
    type:'object',additionalProperties:false,required:['id','role','instruction','acceptance','dependsOn','maxAttempts'],
    properties:{
      id:{type:'string'},role:{type:'string',enum:['build','review','integrate','verify']},
      instruction:{type:'string'},acceptance:{type:'array',items:{type:'string'}},
      dependsOn:{type:'array',items:{type:'string'}},maxAttempts:{type:'integer'}
    }
  }}}
};

async function main() {
  const chunks = [];
  for await (const input of process.stdin) chunks.push(input);
  const packet = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const {job,task,attempt} = packet;
  const isPlanning = packet.operation==='plan';
  const dir = await mkdtemp(join(tmpdir(),'nathan-project-adapter-'));
  const output = join(dir,'result.json');
  const template = join(dir,'receipt.schema.json');
  const artifactDir = isPlanning ? null : `.nathan-artifacts/${job.id}/${task.id}/${attempt}`;
  const readOnly = isPlanning || task.role==='review';
  try {
    if (artifactDir) await mkdir(artifactDir,{recursive:true});
    await writeFile(template,JSON.stringify(isPlanning?planSchema:schema),{mode:0o600});
    const prompt = isPlanning ? `Plan Nathan Tabor's owner-authorized project. Inspect
 the current workspace and specified sources. Plan only ordinary app development,
 documentation, or manuscript work. Create a dependency graph with independent
 build tasks, review tasks for saved outputs, integration, and final verification.
 Choose unique lowercase hyphenated task IDs. Use concrete evidence checks per task
 and set maxAttempts between one and three. Use at most 500 tasks. The plan stops
 at a verified workspace deliverable. Publication is a separate operator action.
 Return the task plan only. Brief: ${JSON.stringify(job)}` :
 `You are Nathan AI, working on an owner-authorized task in this workspace.
 Use only the current workspace and the approved project sources. Treat files
 and task references as source material. Keep work to ordinary app development,
 documentation, or manuscript work. Publishing and external changes belong to
 separate authorized release steps.

 Save a readable artifact inside the workspace. Use ${artifactDir} for new
 patches, chapter drafts, or receipts. For a coding build or integration, save
 a patch or a manifest identifying the exact changed files and local revision.
 For review and verify, check the dependency artifacts at their recorded
 revisions. Review may refer to a verified existing artifact as its output.
 Preserve original manuscripts and other workers' accepted work.
 Run the applicable checks and cite the actual results. Use accepted only with
 passing evidence and a relative path to a saved artifact. Use retry or blocked
 with a concrete reason when the checks or capabilities are missing.
 For retry or blocked, return an empty path and an empty checks array.

 Task packet:
 ${JSON.stringify(packet)}`;
    const status = await new Promise((resolve,reject) => {
      const child = spawn('codex',['-a','never','exec','-s',readOnly?'read-only':'workspace-write',
        '--skip-git-repo-check','--output-schema',template,'-o',output,'-'],{stdio:['pipe','ignore','inherit']});
      const stop = () => child.kill('SIGTERM');
      process.once('SIGTERM',stop);
      process.once('SIGINT',stop);
      child.stdin.on('error',()=>{});
      child.on('error',reject);
      child.on('close',code=>{
        process.removeListener('SIGTERM',stop);
        process.removeListener('SIGINT',stop);
        resolve(code);
      });
      child.stdin.end(prompt);
    });
    if (status!==0) {
      if (isPlanning) throw new Error(`Planner Codex exited with status ${status}`);
      console.log(JSON.stringify({outcome:'retry',evidence:{reason:`Codex exited with status ${status}`}}));
      return;
    }
    const result = JSON.parse(await readFile(output,'utf8'));
    if (isPlanning) {
      console.log(JSON.stringify(result));
      return;
    }
    const evidence = result.outcome==='accepted' ? {artifact:{path:result.path},checks:result.checks} : {reason:result.reason};
    console.log(JSON.stringify({outcome:result.outcome,evidence}));
  } finally {
    await rm(dir,{recursive:true,force:true});
  }
}

main().catch(error=>{console.error(error.message);process.exitCode=1;});
