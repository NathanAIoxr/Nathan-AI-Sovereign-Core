#!/usr/bin/env node
'use strict';
/* NATHAN AI read-only MCP stdio bridge. Explicitly selected local directory only.
   No sockets, API tokens, writes, background sync, telemetry, or model inference. */
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const TEXT_EXT=new Set(['.txt','.md','.json','.csv','.log','.js','.cjs','.mjs','.ts','.py','.go','.rs','.c','.h','.html','.css','.xml','.yaml','.yml']);
const IMAGE_EXT=new Map([['.png','image/png'],['.jpg','image/jpeg'],['.jpeg','image/jpeg'],['.webp','image/webp'],['.gif','image/gif']]);
const MAX_FILES=2000,MAX_DEPTH=5,MAX_TEXT=2*1024*1024,MAX_IMAGE=4*1024*1024;
function accepted(name){const ext=path.extname(name).toLowerCase();return TEXT_EXT.has(ext)||IMAGE_EXT.has(ext)||ext==='.pdf';}
function ignored(name){return name.startsWith('.')||/^(node_modules|__MACOSX)$/i.test(name)||/\.(pem|key|p12|pfx)$/i.test(name);}
function within(root,full){const r=path.relative(root,full);return r!==''&&!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r);}
async function listSources(directory,options={}){if(!directory)throw Error('Set NATHAN_VAULT_DIR to an owner-selected folder before starting the MCP bridge.');const root=await fs.realpath(path.resolve(directory));const stat=await fs.stat(root);if(!stat.isDirectory())throw Error('Selected Vault root must be a folder');const output=[];const stack=[{dir:root,depth:0}];while(stack.length&&output.length<MAX_FILES){const item=stack.pop();const dirents=await fs.readdir(item.dir,{withFileTypes:true});for(const d of dirents){if(ignored(d.name)||d.isSymbolicLink())continue;const full=path.join(item.dir,d.name);if(!within(root,full))continue;if(d.isDirectory()&&item.depth<MAX_DEPTH){stack.push({dir:full,depth:item.depth+1});continue;}if(!d.isFile()||!accepted(d.name))continue;const s=await fs.stat(full);if(!s.isFile())continue;output.push({id:path.relative(root,full).split(path.sep).join('/'),name:d.name,size:s.size,mime:IMAGE_EXT.get(path.extname(d.name).toLowerCase())||'application/octet-stream',type:TEXT_EXT.has(path.extname(d.name).toLowerCase())?'text':IMAGE_EXT.has(path.extname(d.name).toLowerCase())?'image':'document'});if(output.length>=MAX_FILES)break;}}
output.sort((a,b)=>a.id.localeCompare(b.id));return output;}
async function getSelected(directory,id){if(typeof id!=='string'||!id||id.length>400||id.includes('\u0000'))throw Error('Invalid asset ID');const sources=await listSources(directory);const item=sources.find(x=>x.id===id);if(!item)throw Error('Asset not found in approved source directory');const root=await fs.realpath(path.resolve(directory)),full=path.resolve(root,...item.id.split('/'));if(!within(root,full))throw Error('Source path must stay within the selected directory');const resolved=await fs.realpath(full);if(!within(root,resolved))throw Error('Source path resolves outside approved directory');return {item,full:resolved};}
async function readSource(directory,id,maxChars=4000){const {item,full}=await getSelected(directory,id);if(item.type!=='text')throw Error('Not a text source. Use get_image for image files or transfer the original PDF separately.');if(item.size>MAX_TEXT)throw Error('Text file is too large for bounded MCP read');const raw=await fs.readFile(full);const text=raw.toString('utf8');const n=Math.min(8000,Math.max(1,Number(maxChars)||4000));return {id:item.id,name:item.name,mime:item.mime,sha256:crypto.createHash('sha256').update(raw).digest('hex'),content:text.slice(0,n),truncated:text.length>n};}
async function getImage(directory,id){const {item,full}=await getSelected(directory,id);if(item.type!=='image'||item.size>MAX_IMAGE)throw Error('Image must be a supported raster file of at most 4 MB');const raw=await fs.readFile(full);return {id:item.id,mime:IMAGE_EXT.get(path.extname(item.name).toLowerCase()),data:raw.toString('base64'),sha256:crypto.createHash('sha256').update(raw).digest('hex')};}
async function searchVault(directory,query,max=20){const words=String(query||'').toLowerCase().slice(0,250).trim().split(/\s+/).filter(Boolean).slice(0,12);if(!words.length)return [];const all=await listSources(directory);const found=[];let scanned=0;for(const s of all){let hay=s.id.toLowerCase();if(s.type==='text'&&s.size<150000&&scanned<220){scanned++;try{const f=await getSelected(directory,s.id);const text=(await fs.readFile(f.full,'utf8')).slice(0,12000).toLowerCase();hay+=' '+text;}catch(e){/* file may be removed while indexing */}}if(words.every(w=>hay.includes(w)))found.push(s);if(found.length>=Math.max(1,Math.min(50,Number(max)||20)))break;}return found;}
const TOOL_LIST=[
{name:'list_sources',description:'List filenames and source IDs in the user-selected local Vault folder.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
{name:'search_vault',description:'Find eligible source filenames and bounded text excerpts in the selected folder. No remote access.',inputSchema:{type:'object',properties:{query:{type:'string'},max_results:{type:'integer'}},required:['query']}},
{name:'read_source',description:'Read up to 8000 characters from an authorized local text file, with SHA-256.',inputSchema:{type:'object',properties:{asset_id:{type:'string'},max_chars:{type:'integer'}},required:['asset_id']}},
{name:'get_image',description:'Return a raster image at most 4 MB from an authorized local folder.',inputSchema:{type:'object',properties:{asset_id:{type:'string'}},required:['asset_id']}}
];
async function dispatch(msg,directory){if(msg.method==='notifications/initialized')return null;if(msg.method==='initialize')return {jsonrpc:'2.0',id:msg.id,result:{protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'nathan-personal-intelligence-local',version:'1.0.0'}}};if(msg.method==='ping')return {jsonrpc:'2.0',id:msg.id,result:{}};if(msg.method==='tools/list')return {jsonrpc:'2.0',id:msg.id,result:{tools:TOOL_LIST}};if(msg.method==='tools/call'){const args=msg.params?.arguments||{},name=msg.params?.name;try{let result;if(name==='list_sources')result=await listSources(directory);else if(name==='search_vault')result=await searchVault(directory,args.query,args.max_results);else if(name==='read_source')result=await readSource(directory,args.asset_id,args.max_chars);else if(name==='get_image'){const img=await getImage(directory,args.asset_id);return {jsonrpc:'2.0',id:msg.id,result:{content:[{type:'text',text:JSON.stringify({id:img.id,sha256:img.sha256})},{type:'image',data:img.data,mimeType:img.mime}]}};}else throw Error('Unknown MCP tool');return {jsonrpc:'2.0',id:msg.id,result:{content:[{type:'text',text:JSON.stringify(result)}]}};}catch(e){return {jsonrpc:'2.0',id:msg.id,result:{isError:true,content:[{type:'text',text:String(e.message)}]}};}}
return {jsonrpc:'2.0',id:msg.id||null,error:{code:-32601,message:'Method not supported'}};}
function run(){
  const directory=process.env.NATHAN_VAULT_DIR||'';
  let lineBuf='';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data',chunk=>{
    lineBuf+=chunk;
    if(lineBuf.length>1024*1024){process.stderr.write('MCP input exceeded 1 MB\n');process.exitCode=1;process.stdin.pause();return;}
    let idx;
    while((idx=lineBuf.indexOf('\n'))>=0){
      const line=lineBuf.slice(0,idx);lineBuf=lineBuf.slice(idx+1);
      if(!line.trim())continue;
      let req;
      try{req=JSON.parse(line);}
      catch(e){process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}})+'\n');continue;}
      Promise.resolve(dispatch(req,directory))
        .then(out=>{if(out)process.stdout.write(JSON.stringify(out)+'\n');})
        .catch(e=>{process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:req.id||null,error:{code:-32603,message:'Internal error: '+e.message}})+'\n');});
    }
  });
}
if(require.main===module)run();
module.exports={listSources,getSelected,readSource,getImage,searchVault,dispatch,within,accepted,ignored};
