#!/usr/bin/env node
'use strict';
/* SOVEREIGN DEFENDER owner-selected read-only triage (Node 22).
 * No writes to scanned directories, no execution, network, quarantine,
 * malware creation, ransomware encryption, credential or remote access.
 */
const fs=require('node:fs/promises');
const path=require('node:path');
const scanner=require('../../one/hall-of-mirrors/inspector.cjs');
const engine=require('./engine.js');
function usage(){return [
 'SOVEREIGN DEFENDER — owner-local, read-only antivirus-style triage',
 'Usage: node audit.cjs --dir /absolute/owner/selected/folder [--baseline /private/previous-baseline.json]',
 '       node audit.cjs --exercise',
 'Scans only the chosen directory using Hall of Mirrors safe bounded file inspection.',
 'Writes JSON to stdout only. To preserve a baseline, redirect stdout to an owner-private location.',
 'No files are encrypted, modified, quarantined, executed or uploaded.',
 'Not a substitute for installed antivirus and a tested offline backup.'
 ].join('\n')}
function parse(args){
 if(args.length===1&&args[0]==='--exercise')return {mode:'exercise'};
 if(args.length===1&&args[0]==='--help')return {mode:'help'};
 if(args.length<2||args.length>4||args[0]!=='--dir')throw Error('Expected --dir and a selected absolute path');
 const dir=args[1];
 if(!path.isAbsolute(dir)||dir===path.parse(dir).root)throw Error('Choose a specific absolute owner directory, not the entire filesystem');
 let baseline=null;
 if(args.length===4){
  if(args[2]!=='--baseline'||!path.isAbsolute(args[3]))throw Error('Baseline must be an explicit absolute path');
  baseline=args[3];
 }
 return {mode:'scan',dir,baseline};
}
async function run(argv){
 const opts=parse(argv);
 if(opts.mode==='help')return {help:usage()};
 if(opts.mode==='exercise'){
  const events=[
   {type:'rename',path:'sample/notes-1.txt',to:'sample/notes-1.txt.locked'},
   {type:'rename',path:'sample/notes-2.txt',to:'sample/notes-2.txt.locked'},
   {type:'rename',path:'sample/notes-3.txt',to:'sample/notes-3.txt.locked'},
   {type:'backup-unavailable',path:'sample/offline-backup'}
  ];
  return {mode:'inert-fictional-exercise',exercise:engine.syntheticRansomware(events),
   responseSteps:engine.responseSteps()};
 }
 const raw=await scanner.inspectLocal({dir:opts.dir});
 const report=engine.audit(raw.records);
 const baseline=engine.baselineFromReport(report);
 const result={schema:'nathan-ai.sovereign-defender.cli.v1',scanScope:'explicit-owner-selected-local-folder',source:raw.schema,
  report,baseline,responseSteps:engine.responseSteps(),networkCalls:0,filesModified:0,samplesExecuted:0};
 if(opts.baseline){
  const st=await fs.stat(opts.baseline);
  if(!st.isFile()||st.size>2*1024*1024)throw Error('Invalid or oversized baseline file');
  const prior=JSON.parse(await fs.readFile(opts.baseline,'utf8'));
  const doc=prior.schema==='nathan-ai.sovereign-defender.cli.v1'?prior.baseline:prior;
  result.comparison=engine.compareBaseline(doc,report);
 }
 return result;
}
if(require.main===module){
 run(process.argv.slice(2)).then(result=>{
  if(result.help)process.stdout.write(result.help+'\n');
  else process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }).catch(error=>{process.stderr.write('SOVEREIGN DEFENDER: '+error.message+'\n'+usage()+'\n');process.exitCode=1});
}
module.exports={parse,run,usage};
