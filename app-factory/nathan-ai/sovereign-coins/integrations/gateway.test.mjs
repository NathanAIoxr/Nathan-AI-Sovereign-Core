import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {CATALOG,providerConfigured,readProvider,createGateway} from './gateway.mjs';
const here=dirname(fileURLToPath(import.meta.url));
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
test('all 17 named providers are cataloged without pretending all 17 are live',()=>{
 assert.equal(CATALOG.length,17);
 assert.equal(new Set(CATALOG.map(p=>p.id)).size,17);
 assert.equal(CATALOG.filter(p=>p.mode==='read').length,10);
 assert.equal(CATALOG.filter(p=>p.mode==='sdk').length,3);
 assert.equal(CATALOG.filter(p=>p.mode==='setup').length,4);
 for(const p of CATALOG){assert.ok(p.docs.startsWith('https://'));assert.ok(p.name);}
 for(const id of ['xmrig','hiveon','awesome-miner','nicehash','reown','trezor','coinbase-wallet','bitcoin-core','btcpay','alchemy','2miners','braiins','minerstat','coingecko','prometheus','grafana','home-assistant'])assert.ok(CATALOG.some(p=>p.id===id),id);
});
test('unconfigured services are not labeled live and no wallet is automatically connected',()=>{
 assert.equal(providerConfigured('xmrig',{}),false);
 assert.equal(providerConfigured('bitcoin-core',{}),false);
 assert.equal(providerConfigured('reown',{}),false);
 assert.equal(providerConfigured('trezor',{}),false);
 assert.equal(providerConfigured('coinbase-wallet',{}),false);
 assert.equal(providerConfigured('coingecko',{}),true);
 assert.equal(providerConfigured('coingecko',{COINGECKO_ENABLED:'0'}),false);
});
test('CoinGecko returns price references from fixed approved URL only',async()=>{
 const calls=[];
 const fetcher=async(url,opts)=>{calls.push({url,opts});return reply({bitcoin:{usd:100,last_updated_at:10},ethereum:{usd:10},monero:{usd:1}})};
 const result=await readProvider('coingecko',{},fetcher);
 assert.equal(calls.length,1);
 assert.match(calls[0].url,/api.coingecko.com\/api\/v3\/simple\/price/);
 assert.equal(result.values.bitcoin_usd,100);
 assert.equal(result.scope,'market quotes, not mining revenue');
 assert.equal(result.read_only,true);
 assert.equal(JSON.stringify(result).includes('mining_profit_confirmed'),false);
});
test('XMRig reads localhost only and reports accepted shares, no miner commands',async()=>{
 const calls=[];
 const env={XMRIG_ENABLED:'1',XMRIG_PORT:'18080',XMRIG_ACCESS_TOKEN:'PRIVATE_TEST_TOKEN'};
 const result=await readProvider('xmrig',env,async(url,opts)=>{calls.push({url,opts});return reply({id:'rig-1',hashrate:{total:[100,105,106]},results:{shares_good:12,shares_total:14}})});
 assert.equal(calls[0].url,'http://127.0.0.1:18080/2/summary');
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(result.values.accepted_shares,12);
 assert.ok(!JSON.stringify(result).includes('PRIVATE_TEST_TOKEN'));
});
test('Bitcoin Core only sends getblockchaininfo as JSON RPC',async()=>{
 let observed;
 const result=await readProvider('bitcoin-core',{BITCOIN_RPC_USER:'local',BITCOIN_RPC_PASSWORD:'SECRET'},async(url,opts)=>{
  observed={url,opts};return reply({result:{chain:'main',blocks:800000,headers:800000,verificationprogress:1},error:null});
 });
 assert.equal(observed.url,'http://127.0.0.1:8332/');
 assert.equal(JSON.parse(observed.opts.body).method,'getblockchaininfo');
 assert.equal(result.values.blocks,800000);
 assert.ok(!JSON.stringify(result).includes('SECRET'));
});
test('2Miners reads only a configured pool and account with fixed host',async()=>{
 const env={TWOMINERS_COIN:'etc',TWOMINERS_ADDRESS:'0123456789abcdef0123456789abcdef'};
 let url;
 const result=await readProvider('2miners',env,async(u)=>{url=u;return reply({currentHashrate:121,workersOnline:2,workersOffline:1,stats:{balance:300}})});
 assert.match(url,/^https:\/\/etc\.2miners\.com\/api\/accounts\//);
 assert.equal(result.values.workers_online,2);
 await assert.rejects(readProvider('2miners',{...env,TWOMINERS_COIN:'example.com'},async()=>reply({})),/Invalid configured/);
});
test('read-only pool, power and payment adapter projections',async()=>{
 const braiins=await readProvider('braiins',{BRAIINS_TOKEN:'SECRET'},async()=>reply({btc:{pool_5m_hash_rate:500,pool_active_workers:42}}));
 assert.equal(braiins.values.active_workers,42);
 const ha=await readProvider('home-assistant',{HA_TOKEN:'SECRET',HA_ENTITY_ID:'sensor.miner_watts'},async()=>reply({entity_id:'sensor.miner_watts',state:'140',attributes:{unit_of_measurement:'W'}}));
 assert.equal(ha.values.unit,'W');
 assert.match(ha.scope,/sensor reading/);
 const pay=await readProvider('btcpay',{BTCPAY_BASE_URL:'https://pay.example.org/',BTCPAY_STORE_ID:'abc',BTCPAY_API_KEY:'SECRET'},async(_,opts)=>{
  assert.equal(opts.headers.Authorization,'token SECRET');return reply({id:'abc',name:'Merchant'});
 });
 assert.equal(pay.values.store_name,'Merchant');
 assert.ok(!JSON.stringify(pay).includes('SECRET'));
});
test('local gateway blocks unauthenticated, cross-site and mutation requests',async()=>{
 const gateway=createGateway({NATHAN_GATEWAY_PORT:'18766',NATHAN_GATEWAY_TOKEN:'LOCAL_GATEWAY_TEST_TOKEN_1234567890',COINGECKO_ENABLED:'0'});
 await new Promise((resolve,reject)=>gateway.server.once('error',reject).listen(gateway.port,'127.0.0.1',resolve));
 try{
   const base='http://127.0.0.1:'+gateway.port;
   const denied=await fetch(base+'/api/providers');assert.equal(denied.status,401);
   const wrongOrigin=await fetch(base+'/api/providers',{headers:{Origin:'https://attacker.example',Authorization:'Bearer '+gateway.sessionToken}});
   assert.equal(wrongOrigin.status,403);
   const post=await fetch(base+'/api/read?id=coingecko',{method:'POST'});assert.equal(post.status,405);
   const list=await fetch(base+'/api/providers',{headers:{Authorization:'Bearer '+gateway.sessionToken}});
   assert.equal(list.status,200);assert.equal((await list.json()).providers.length,17);
   const bad=await fetch(base+'/api/read?id=invalid',{headers:{Authorization:'Bearer '+gateway.sessionToken}});
   assert.equal(bad.status,404);
   const document=await fetch(base+'/');assert.equal(document.status,200);assert.match(await document.text(),/Sovereign Mining/);
 }finally{await new Promise(resolve=>gateway.server.close(resolve))}
});
test('UI static code does not embed secrets or claim live wallet custody',()=>{
 const app=readFileSync(join(here,'dashboard.mjs'),'utf8');
 const html=readFileSync(join(here,'index.html'),'utf8');
 assert.doesNotMatch(app,/innerHTML\s*=/);
 assert.match(html,/No wallet keys, seed phrases/);
 assert.match(app,/\/api\/providers/);
 assert.match(html,/16:1 design target/);
});
