export {RecoverySupervisor} from './one-healing.mjs';
// Shared authenticated gateway client. Each app supplies its own authorized key.
const utf8=value=>new TextEncoder().encode(value);
const b64=value=>btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',utf8(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export class ONEHubClient{
 constructor({baseUrl,capability,privateKey}){const url=new URL(baseUrl);if(url.protocol!=='https:'&&url.hostname!=='127.0.0.1')throw new Error('HTTPS or loopback required');this.base=url.origin;this.token=capability;this.key=privateKey;}
 async request(path,body){if(!path.startsWith('/api/')&&path!=='/mcp')throw new Error('Gateway action path required');const method=body===undefined?'GET':'POST',raw=body===undefined?'':JSON.stringify(body),time=Math.floor(Date.now()/1000),nonce=crypto.randomUUID();const message=JSON.stringify([await hash(this.token),method,path,await hash(raw),time,nonce]);const signature=b64(await crypto.subtle.sign('Ed25519',this.key,utf8(message)));const response=await fetch(this.base+path,{method,headers:{Authorization:'Bearer '+this.token,'X-Agent-Time':String(time),'X-Agent-Nonce':nonce,'X-Agent-Signature':signature,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:raw}:{})});const data=await response.json();if(!response.ok)throw new Error(data.error??'Gateway rejected request');return data;}
 diagnostics(){return this.request('/api/snapshot');}
 readContext(key){return this.request('/api/context?key='+encodeURIComponent(key));}
 sync(command){return this.request('/api/sync',command);}
}
