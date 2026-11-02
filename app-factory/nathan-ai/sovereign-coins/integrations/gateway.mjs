#!/usr/bin/env node
/**
 * Nathan AI — localhost-only read-only telemetry gateway.
 * Requires Node 20+. Does not mine, control miners, connect wallets, sign,
 * move coins, issue tokens, deploy proxies or request any seed/private key.
 */
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
const HERE=dirname(fileURLToPath(import.meta.url));
export const CATALOG=JSON.parse(readFileSync(join(HERE,'providers.json'),'utf8')).providers;
const BY_ID=new Map(CATALOG.map(p=>[p.id,p]));
const LIMIT=1024*1024;
function port(value,fallback){
 const number=Number(value??fallback);
 if(!Number.isInteger(number)||number<1||number>65535)throw Error('Invalid local port setting');
 return number;
}
function safeToken(actual,expected){
 if(typeof actual!=='string'||typeof expected!=='string')return false;
 const a=Buffer.from(actual),b=Buffer.from(expected);
 return a.length===b.length&&timingSafeEqual(a,b);
}
function has(env,...names){return names.every(k=>typeof env[k]==='string'&&env[k].length>0)}
function simpleUrl(value){
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/')
   throw Error('Configured BTCPay base URL must be a plain HTTPS origin');
 return u.origin;
}
export function providerConfigured(id,env={}){
 switch(id){
 case 'coingecko':return env.COINGECKO_ENABLED!=='0';
 case 'xmrig':return env.XMRIG_ENABLED==='1';
 case '2miners':return has(env,'TWOMINERS_ADDRESS','TWOMINERS_COIN');
 case 'braiins':return has(env,'BRAIINS_TOKEN');
 case 'bitcoin-core':return has(env,'BITCOIN_RPC_USER','BITCOIN_RPC_PASSWORD');
 case 'btcpay':return has(env,'BTCPAY_BASE_URL','BTCPAY_STORE_ID','BTCPAY_API_KEY');
 case 'alchemy':return has(env,'ALCHEMY_API_KEY');
 case 'home-assistant':return has(env,'HA_TOKEN','HA_ENTITY_ID');
 case 'prometheus':return env.PROMETHEUS_ENABLED==='1';
 case 'grafana':return env.GRAFANA_ENABLED==='1';
 default:return false; // Wallet SDK and vendor-specific management profiles need owner setup.
 }
}
async function readJson(fetchImpl,url,{method='GET',headers={},body}={}){
 const response=await fetchImpl(url,{method,headers,body,redirect:'error',signal:AbortSignal.timeout(6500)});
 if(!response.ok)throw Error('Provider returned HTTP '+response.status);
 const size=Number(response.headers?.get?.('content-length')||0);
 if(size>LIMIT)throw Error('Provider response exceeds 1 MB limit');
 const raw=await response.text();
 if(raw.length>LIMIT)throw Error('Provider response exceeds 1 MB limit');
 try{return JSON.parse(raw)}catch{throw Error('Provider did not return JSON')}
}
function localUrl(portNumber,suffix){return 'http://127.0.0.1:'+portNumber+suffix}
function noSecretUrl(value){return value.replace(/\?.*$/,'')}
export async function readProvider(id,env={},fetchImpl=fetch){
 if(!BY_ID.has(id))throw Error('Unknown integration');
 const profile=BY_ID.get(id);
 if(profile.mode!=='read')throw Error('Provider requires SDK setup or external authorization');
 if(!providerConfigured(id,env))throw Error('Provider not configured on this gateway');
 let response,values,scope='';
 switch(id){
 case 'coingecko':{
   const url='https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Cmonero&vs_currencies=usd&include_last_updated_at=true';
   const headers={};if(env.COINGECKO_DEMO_KEY)headers['x-cg-demo-api-key']=env.COINGECKO_DEMO_KEY;
   response=await readJson(fetchImpl,url,{headers});
   values={bitcoin_usd:response.bitcoin?.usd??null,ethereum_usd:response.ethereum?.usd??null,monero_usd:response.monero?.usd??null,
    price_updated_at:response.bitcoin?.last_updated_at??null};scope='market quotes, not mining revenue';break;
 }
 case 'xmrig':{
   const headers={};if(env.XMRIG_ACCESS_TOKEN)headers.Authorization='Bearer '+env.XMRIG_ACCESS_TOKEN;
   response=await readJson(fetchImpl,localUrl(port(env.XMRIG_PORT,18080),'/2/summary'),{headers});
   values={miner_id:response.id??null,uptime_seconds:response.uptime??null,
    hashrate:response.hashrate?.total??null,accepted_shares:response.results?.shares_good??null,
    total_shares:response.results?.shares_total??null};scope='local miner telemetry';break;
 }
 case '2miners':{
   const coin=env.TWOMINERS_COIN?.toLowerCase();
   const suffixes={etc:'etc',kas:'kas',erg:'erg',rvn:'rvn',zeph:'zeph',neox:'neox',ethw:'ethw',quaisha:'quaisha'};
   const address=env.TWOMINERS_ADDRESS||'';
   if(!Object.hasOwn(suffixes,coin)||!/^[a-zA-Z0-9._:-]{10,180}$/.test(address))throw Error('Invalid configured 2Miners coin or address');
   response=await readJson(fetchImpl,'https://'+suffixes[coin]+'.2miners.com/api/accounts/'+encodeURIComponent(address));
   values={current_hashrate:response.currentHashrate??null,workers_online:response.workersOnline??null,
     workers_offline:response.workersOffline??null,payments_count:response.paymentsTotal??null,
     pool_balance_native_units:response.stats?.balance??null};
   scope='pool account data; units depend on pool';break;
 }
 case 'braiins':{
   response=await readJson(fetchImpl,'https://pool.braiins.com/stats/json/btc/',{
      headers:{'Pool-Auth-Token':env.BRAIINS_TOKEN}});
   values={pool_hashrate_5m:response.btc?.pool_5m_hash_rate??null,
    pool_hashrate_60m:response.btc?.pool_60m_hash_rate??null,
    active_workers:response.btc?.pool_active_workers??null};scope='pool network, not individual wallet';break;
 }
 case 'bitcoin-core':{
   const credential=Buffer.from(env.BITCOIN_RPC_USER+':'+env.BITCOIN_RPC_PASSWORD).toString('base64');
   response=await readJson(fetchImpl,localUrl(port(env.BITCOIN_RPC_PORT,8332),'/'),{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:'Basic '+credential},
    body:JSON.stringify({jsonrpc:'2.0',id:'nathan-observe',method:'getblockchaininfo',params:[]})});
   if(response.error)throw Error('Bitcoin Core reported RPC error');
   values={chain:response.result?.chain??null,blocks:response.result?.blocks??null,
    headers:response.result?.headers??null,verification_progress:response.result?.verificationprogress??null};
   scope='node sync and chain metadata, no wallet RPC';break;
 }
 case 'btcpay':{
   const origin=simpleUrl(env.BTCPAY_BASE_URL);
   if(!/^[a-zA-Z0-9_-]{1,160}$/.test(env.BTCPAY_STORE_ID))throw Error('Invalid configured BTCPay store ID');
   response=await readJson(fetchImpl,origin+'/api/v1/stores/'+env.BTCPAY_STORE_ID,{
     headers:{Authorization:'token '+env.BTCPAY_API_KEY}});
   values={store_name:response.name??null,store_id:response.id??null};scope='read-only store metadata';break;
 }
 case 'alchemy':{
   if(!/^[a-zA-Z0-9_-]{8,256}$/.test(env.ALCHEMY_API_KEY))throw Error('Invalid Alchemy API key format');
   response=await readJson(fetchImpl,'https://eth-mainnet.g.alchemy.com/v2/'+env.ALCHEMY_API_KEY,{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({jsonrpc:'2.0',id:'nathan-observe',method:'eth_blockNumber',params:[]})});
   if(response.error)throw Error('Alchemy JSON-RPC error');
   values={ethereum_block_hex:response.result??null};scope='public chain height, not wallet holdings';break;
 }
 case 'home-assistant':{
   if(!/^sensor\.[a-z0-9_]{2,120}$/.test(env.HA_ENTITY_ID))throw Error('Invalid configured Home Assistant sensor ID');
   response=await readJson(fetchImpl,localUrl(port(env.HA_PORT,8123),'/api/states/'+env.HA_ENTITY_ID),{
     headers:{Authorization:'Bearer '+env.HA_TOKEN}});
   values={entity:response.entity_id??null,value:response.state??null,
     unit:response.attributes?.unit_of_measurement??null,last_updated:response.last_updated??null};
   scope='sensor reading; convert watts to kWh only using measured time series';break;
 }
 case 'prometheus':{
   response=await readJson(fetchImpl,localUrl(port(env.PROMETHEUS_PORT,9090),'/api/v1/query?query=up'));
   values={query_status:response.status??null,target_count:response.data?.result?.length??null,
     sampled_targets:(response.data?.result||[]).slice(0,5).map(x=>({job:x.metric?.job??null,up:x.value?.[1]??null}))};
   scope='monitoring, read-only health';break;
 }
 case 'grafana':{
   const headers={};if(env.GRAFANA_TOKEN)headers.Authorization='Bearer '+env.GRAFANA_TOKEN;
   response=await readJson(fetchImpl,localUrl(port(env.GRAFANA_PORT,3000),'/api/health'),{headers});
   values={database:response.database??null,version:response.version??null};
   scope='Grafana server health';break;
 }
 default:throw Error('No read-only adapter');
 }
 return {provider:id,checked_at:new Date().toISOString(),read_only:true,scope,values};
}
function json(res,status,payload){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify(payload));
}
export function createGateway(env=process.env,fetchImpl=fetch){
 const listenPort=port(env.NATHAN_GATEWAY_PORT,8765);
 const accessToken=env.NATHAN_GATEWAY_TOKEN||randomBytes(24).toString('hex');
 if(accessToken.length<24)throw Error('Gateway token must contain at least 24 characters');
 const allowedHost='127.0.0.1:'+listenPort;
 const files={'/':'index.html','/index.html':'index.html','/dashboard.mjs':'dashboard.mjs','/providers.json':'providers.json'};
 const server=createServer(async(req,res)=>{
   res.setHeader('X-Frame-Options','DENY');
   res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
   if(req.headers.host!==allowedHost){json(res,403,{error:'Localhost host check failed'});return}
   const origin=req.headers.origin;
   if(origin&&origin!=='http://'+allowedHost){json(res,403,{error:'Cross-site requests blocked'});return}
   if(req.method!=='GET'){json(res,405,{error:'Read-only gateway'});return}
   const url=new URL(req.url,'http://'+allowedHost);
   if(Object.hasOwn(files,url.pathname)){
     try{
       const filename=files[url.pathname];const body=readFileSync(join(HERE,filename));
       const mime=filename.endsWith('.mjs')?'text/javascript':filename.endsWith('.json')?'application/json':'text/html';
       res.writeHead(200,{'Content-Type':mime+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
       res.end(body);
     }catch{json(res,500,{error:'Static application unavailable'})}
     return;
   }
   if(url.pathname==='/health'){json(res,200,{ok:true,local_only:true,access:'token_required_for_api'});return}
   if(!url.pathname.startsWith('/api/')){json(res,404,{error:'Not found'});return}
   if(!safeToken((req.headers.authorization||'').replace(/^Bearer /,''),accessToken)){
     json(res,401,{error:'Gateway authorization required'});return;
   }
   if(url.pathname==='/api/providers'){
     json(res,200,{providers:CATALOG.map(p=>({...p,configured:providerConfigured(p.id,env)}))});return;
   }
   if(url.pathname==='/api/read'){
     const id=url.searchParams.get('id')||'';
     if(!BY_ID.has(id)){json(res,404,{error:'Unknown integration'});return}
     try{json(res,200,await readProvider(id,env,fetchImpl))}
     catch(e){json(res,502,{error:/^(Provider|Invalid configured|Configured BTCPay|No read-only)/.test(e.message)?e.message:'Provider read failed or is unavailable'})}
     return;
   }
   json(res,404,{error:'Not found'});
 });
 return {server,port:listenPort,sessionToken:accessToken};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=createGateway();
 app.server.listen(app.port,'127.0.0.1',()=>{
   process.stdout.write('Nathan AI sovereign gateway: http://127.0.0.1:'+app.port+'\n');
   process.stdout.write('Session token (keep private): '+app.sessionToken+'\n');
 });
}
