#!/usr/bin/env node
/* Φ_mine CLI: explicit local historical PoW cycle; opt-in read-only mining observations. */
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createMiningCycle,finishMiningCycle,exportMiningAudit,GENESIS_NONCE} from './engine.mjs';
import {readProvider,providerConfigured,CATALOG} from '../integrations/gateway.mjs';
const opt=new Set(process.argv.slice(2));
if(opt.has('--help')||opt.has('-h')) {
 process.stdout.write([
  'NATHAN AI — Φ_mine: four-stage cryptographic testing and read-only telemetry',
  '  node cli.mjs --run [--start=2083236891] [--attempts=5]',
  '  node cli.mjs --observe  # explicitly read configured XMRig/pool/energy/blockchain sources',
  '  node cli.mjs --run --observe',
  '  No network mining, wallet signing, pool submission, self-modification or 732m process spawn.',
  '  The --run test hashes the HISTORICAL Bitcoin genesis header and yields NO BTC.\n'
 ].join('\n'));process.exit(0);
}
if(!opt.has('--run')&&!opt.has('--observe')) {
 process.stderr.write('Choose --run and/or --observe (use --help for instructions). No process started.\n');
 process.exit(2);
}
function parseOption(prefix,fallback) {
 const values=[...opt].filter(s=>s.startsWith(prefix));
 if(values.length>1)throw Error('Repeated option: '+prefix);
 const n=values.length?Number(values[0].slice(prefix.length)):fallback;
 if(!Number.isSafeInteger(n))throw Error('Use a whole number for '+prefix);
 return n;
}
if(!globalThis.crypto?.subtle)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
const result={schema:'nathan-ai.phi-mining.cli-report.v1',at:new Date().toISOString(),run_requested:opt.has('--run'),
 observations_requested:opt.has('--observe'),mining_operation:'NONE',wallet_operation:'NONE'};
if(opt.has('--run')){
 const source=JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)),'..','registry.json'),'utf8'));
 const state=createMiningCycle(source,{
  startNonce:parseOption('--start=',GENESIS_NONCE-2),attempts:parseOption('--attempts=',5),consent:true});
 result.local_historical_pow_test=exportMiningAudit(await finishMiningCycle(state,source));
}
if(opt.has('--observe')){
 result.read_only_observations=[];
 for(const provider of CATALOG.filter(p=>p.mode==='read'&&providerConfigured(p.id,process.env))){
  try{const info=await readProvider(provider.id,process.env);result.read_only_observations.push(info)}
  catch(e){result.read_only_observations.push({provider:provider.id,error:'Source unavailable or permission missing; inspect local provider settings.'})}
 }
}
process.stdout.write(JSON.stringify(result,null,2)+'\n');
