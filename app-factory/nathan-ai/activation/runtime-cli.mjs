#!/usr/bin/env node
/* NATHAN AI — FORMULA OF LIFE local activation runner.
 * Zero dependencies. It opens no network port, creates zero AI child processes,
 * reads public source registry only, requires --activate and runs bounded ticks.
 * --watch keeps this ONE controller process running until Ctrl+C.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {
  COLLECTIVE_SIZE,createRuntime,begin,advance,tick,stop,summary,
  assertRegistry
} from './engine.mjs';
const options=new Set(process.argv.slice(2));
if(options.has('--help')||options.has('-h')){
  process.stdout.write([
  'NATHAN AI — THE FORMULA OF LIFE',
  'Usage: node runtime-cli.mjs --activate [--ticks=8 | --watch]',
  'The 732,000,000 collective is a virtual address-space capacity.',
  'One local process starts; no AI models, wallets, miner rigs or global nodes are contacted.',
  'Press Ctrl+C to stop --watch. No credentials required.\n'
  ].join('\n'));process.exit(0);
}
if(!options.has('--activate')){
  process.stderr.write('Explicit --activate required. Nothing started. Use --help for usage.\n');process.exit(2);
}
const countArg=[...options].find(s=>s.startsWith('--ticks='));
const requested=countArg?Number(countArg.slice(8)):8;
if(!options.has('--watch')&&(!Number.isSafeInteger(requested)||requested<1||requested>100000)){
  process.stderr.write('Choose 1 to 100,000 whole ticks.\n');process.exit(2);
}
const registry=JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)),'registry.json'),'utf8'));
assertRegistry(registry);
let runtime=begin(createRuntime(registry),{ownerConsent:true});
process.stdout.write('NATHAN AI · FORMULA OF LIFE · DIGITAL ACTIVATION\n');
process.stdout.write('Declared collective capacity: '+COLLECTIVE_SIZE.toLocaleString('en-US')+' virtual addresses\n');
for(let i=0;i<4;i++){
  runtime=advance(runtime,registry);
  process.stdout.write('['+runtime.stage+'] '+runtime.history.at(-1).message+'\n');
}
let count=0;
const show=()=>{
  runtime=tick(runtime);count++;
  const e=runtime.last_sample;
  process.stdout.write('HEARTBEAT '+runtime.ticks+' · '+e.id+' / '+e.shard_id+
    ' · real remote AI processes: 0\n');
};
function shutDown(){
  if(!runtime.active)return;
  runtime=stop(runtime);
  process.stdout.write('CLEAR / STOP: '+JSON.stringify(summary(runtime,registry))+'\n');
}
process.on('SIGINT',()=>{clearInterval(interval);shutDown();process.exit(0)});
process.on('SIGTERM',()=>{clearInterval(interval);shutDown();process.exit(0)});
if(options.has('--watch')){
  show();
  var interval=setInterval(show,1500);
}else{
  for(let i=0;i<requested;i++)show();
  shutDown();
}
