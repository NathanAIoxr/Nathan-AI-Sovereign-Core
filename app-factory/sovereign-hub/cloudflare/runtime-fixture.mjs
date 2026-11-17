import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {b64,digest,utf8,canonical} from './core.mjs';
const require=createRequire(import.meta.url);
const {Miniflare}=process.env.ONE_MINIFLARE_PATH?require(process.env.ONE_MINIFLARE_PATH):await import('miniflare');
const here=dirname(fileURLToPath(import.meta.url));
const setup='test-bootstrap-'+crypto.randomUUID()+crypto.randomUUID();
export async function createRuntime(){const mf=new Miniflare({name:'one-sovereign-hub',modules:[{type:'ESModule',path:resolve(here,'worker.mjs')},{type:'ESModule',path:resolve(here,'core.mjs')},{type:'ESModule',path:resolve(here,'swarm.mjs')}],compatibilityDate:'2026-08-01',durableObjects:{HUB:{className:'SovereignHub',useSQLite:true}},d1Databases:{DB:'test-db'},kvNamespaces:['PUBLIC_KV'],queueProducers:{JOBS:'test-jobs'},queueConsumers:{'test-jobs':{maxBatchSize:5,maxBatchTimeout:0,maxRetries:2}},workflows:{RECOVERY:{name:'one-test-recovery',className:'RecoveryWorkflow'}},assets:{workerName:'one-sovereign-hub',directory:resolve(here,'public'),binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}},bindings:{TOKEN_KEY:b64(crypto.getRandomValues(new Uint8Array(32))),BOOTSTRAP_HASH:await digest(setup),HUB_INSTANCE:'owner'}});const db=await mf.getD1Database('DB');await db.exec((await readFile(resolve(here,'schema.sql'),'utf8')).replace(/\n/g,' '));return {mf,setup};}

if(process.argv.includes('--serve')){const {mf,setup}=await createRuntime();console.log(JSON.stringify({url:String(await mf.ready),setup}));process.on('SIGTERM',async()=>{await mf.dispose();process.exit(0);});}
