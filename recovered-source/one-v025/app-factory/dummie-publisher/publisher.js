/* DUMMIE™ — Big Red Button Publisher · original TABOR ROOT static packaging core.
 * Local ZIP creation and explicit provider handoff. NO provider writes without OAuth.
 * No credentials, source code or assets are transmitted by this module.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DummiePublisher=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const enc=new TextEncoder(),maxBytes=80*1024*1024;
const PROVIDERS=Object.freeze([
 {id:'github',name:'GitHub',kind:'git',url:'https://github.com/new',step:'Create a repository, then upload the ZIP contents using Add file → Upload files, or push them with Git.',connected:false},
 {id:'gitlab',name:'GitLab',kind:'git',url:'https://gitlab.com/projects/new',step:'Create a blank project, then upload or push the extracted files.',connected:false},
 {id:'codeberg',name:'Codeberg',kind:'git',url:'https://codeberg.org/repo/create',step:'Create a repository, then upload or push the extracted files.',connected:false},
 {id:'bitbucket',name:'Bitbucket',kind:'git',url:'https://bitbucket.org/repo/create',step:'Create a repository and push the extracted files using Git.',connected:false},
 {id:'huggingface',name:'Hugging Face Spaces',kind:'app',url:'https://huggingface.co/new-space',step:'Create a Space and upload compatible app files. Some frameworks need their own configuration.',connected:false},
 {id:'itch',name:'itch.io',kind:'game',url:'https://itch.io/game/new',step:'Create a game page and upload a compatible playable build or HTML game ZIP.',connected:false},
 {id:'netlify',name:'Netlify',kind:'web',url:'https://app.netlify.com/drop',step:'Drop the unzipped static site folder or ZIP supported by the current provider interface; a backend application needs separate hosting.',connected:false},
 {id:'vercel',name:'Vercel',kind:'web',url:'https://vercel.com/new',step:'Import a Git repository containing the project and configure its build settings.',connected:false}
]);
function safeName(name){if(typeof name!=='string')throw Error('Project name required');const s=name.trim();if(!s||s.length>100||/[<>\x00-\x1F]/.test(s))throw Error('Invalid project title');return s}
function slug(name){const s=safeName(name).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);if(!s)throw Error('Choose a name containing letters or numbers');return s}
function safePath(name){if(typeof name!=='string'||!name||name.length>240||name.startsWith('/')||name.includes('\\')||name.includes('\0'))throw Error('Invalid file path');const parts=name.split('/');if(parts.some(p=>!p||p==='.'||p==='..'||/^\s*$/.test(p)||/[\x00-\x1f]/.test(p)))throw Error('Unsafe file path');return name}
function forbiddenPath(name){return /(^|\/)(\.env(?:\..*)?|id_rsa|id_ed25519|\.ssh|\.git|\.npmrc|\.pypirc|credentials(?:\.json)?|service.account\.json|.*\.(?:pem|p12|pfx|key))$/i.test(name)}
function w16(a,p,v){a[p]=v&255;a[p+1]=(v>>>8)&255}function w32(a,p,v){w16(a,p,v);w16(a,p+2,v>>>16)}
function crc32(a){let c=-1;for(const b of a){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^-1)>>>0}
function zip(entries){if(!Array.isArray(entries)||entries.length>5000)throw Error('Too many source files');let count=0;const list=[],seen=new Set();for(const e of entries){const name=safePath(e.path),b=e.bytes instanceof Uint8Array?e.bytes:null;if(!b)throw Error('Invalid source file bytes');if(seen.has(name.toLowerCase()))throw Error('Duplicate path '+name);seen.add(name.toLowerCase());if(forbiddenPath(name))throw Error('Secret or private configuration file blocked: '+name);count+=b.length+enc.encode(name).length+120;if(count>maxBytes)throw Error('Project package over 80 MiB. Keep large media in the private Vault.');list.push({name,b,nb:enc.encode(name),crc:crc32(b)})}
const output=new Uint8Array(count+256);const refs=[];let p=0;
for(const e of list){const at=p;w32(output,p,0x04034b50);w16(output,p+4,20);w16(output,p+6,0x0800);w16(output,p+8,0);w32(output,p+14,e.crc);w32(output,p+18,e.b.length);w32(output,p+22,e.b.length);w16(output,p+26,e.nb.length);p+=30;output.set(e.nb,p);p+=e.nb.length;output.set(e.b,p);p+=e.b.length;refs.push({...e,at})}
const start=p;for(const e of refs){w32(output,p,0x02014b50);w16(output,p+4,20);w16(output,p+6,20);w16(output,p+8,0x0800);w32(output,p+16,e.crc);w32(output,p+20,e.b.length);w32(output,p+24,e.b.length);w16(output,p+28,e.nb.length);w32(output,p+42,e.at);p+=46;output.set(e.nb,p);p+=e.nb.length}
w32(output,p,0x06054b50);w16(output,p+8,refs.length);w16(output,p+10,refs.length);w32(output,p+12,p-start);w32(output,p+16,start);p+=22;return output.slice(0,p)}
function provider(id){const p=PROVIDERS.find(x=>x.id===id);if(!p)throw Error('Unsupported publishing destination');return p}
function makeProject(spec,files=[]){const name=safeName(spec.name),id=slug(name),description=String(spec.description||'').trim().slice(0,2500),visibility=spec.visibility==='private'?'private':'public';if(files.length>4990)throw Error('Too many files');const seen=new Set();
const original=files.map(f=>{const path=safePath(f.path),bytes=f.bytes;if(!(bytes instanceof Uint8Array))throw Error('Missing original bytes for '+path);if(forbiddenPath(path))throw Error('Sensitive configuration blocked: '+path);const k=path.toLowerCase();if(seen.has(k)||['readme.md','tabor-publish.json'].includes(k))throw Error('Duplicate or reserved path: '+path);seen.add(k);return {path,bytes}});
const readme='# '+name+'\n\n'+(description||'Original creation under TABOR 1-2-3 FACTORY.')+'\n\nCreator: Nathan Tabor.\n\nDeployment is not automatic; review files, license and secrets before publishing.\n';
const meta={schema:'tabor.dummie.publish-package.v1',project:{name,id,description,requestedVisibility:visibility},sourceCount:original.length,status:'prepared-locally-not-published',createdAt:new Date().toISOString(),instructions:'Do not upload to a public repository unless the owner explicitly approves the contents and licensing.'};
const entries=[{path:'README.md',bytes:enc.encode(readme)},{path:'tabor-publish.json',bytes:enc.encode(JSON.stringify(meta,null,2)+'\n')},...original];
if(!original.length){const page='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+escapeHtml(name)+'</title><main><h1>'+escapeHtml(name)+'</h1><p>'+escapeHtml(description||'Created in TABOR 1-2-3 FACTORY')+'</p></main></html>';entries.push({path:'index.html',bytes:enc.encode(page)})}
return {bytes:zip(entries),id,metadata:meta,files:entries.map(x=>x.path)}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function guidance(p,project){const target=provider(p);return {name:target.name,url:target.url,steps:['1. Save your TABOR project ZIP and keep a private backup.','2. Review ownership, license, privacy and secrets before making anything public.','3. Open '+target.name+' and sign in to your own account.','4. '+target.step,'5. Confirm the real destination and verify the published project yourself.'],automation:'Manual official-site handoff. A trusted OAuth backend is required for true one-tap API publishing; this page has no access tokens.',project:project?.id||null}}
return Object.freeze({PROVIDERS,safeName,slug,safePath,forbiddenPath,zip,makeProject,provider,guidance,crc32,maxBytes});
});