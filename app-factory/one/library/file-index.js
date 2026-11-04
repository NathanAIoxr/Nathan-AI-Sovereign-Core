(function(root){
 'use strict';
 const code=new Set('js mjs cjs ts tsx jsx py swift sh bash sql kt java c h cpp hpp rs go vue svelte css scss html htm'.split(' '));
 const image=new Set('png jpg jpeg gif webp bmp svg heic heif avif tif tiff ico'.split(' '));
 const text=new Set([...code,...'txt md markdown json jsonl csv tsv yaml yml xml toml ini'.split(' ')]);
 function describe(name,bytes){
  const path=String(name).replace(/\\/g,'/'),parts=path.split('/'),base=parts.at(-1),extension=base.includes('.')?base.split('.').at(-1).toLowerCase():'';
  if(parts.some(p=>['.git','.aws','.ssh','.codex','node_modules','.venv','__pycache__'].includes(p))||/^\.env(?:\.|$)/i.test(base)||/^(?:credentials(?:\.json)?|secrets(?:\.json)?|id_rsa|id_ed25519)$/i.test(base)||['pem','pfx','p12','key'].includes(extension))throw Error('Credential/configuration or dependency path excluded.');
  const kind=image.has(extension)?'image':code.has(extension)?'code':extension==='zip'?'archive':'document';
  const meta={path,extension,kind,bytes:bytes.byteLength,lines:null,nonblankLines:null,codeLines:null,text:null};
  if(text.has(extension)){
   const decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   if(decoded.includes('\0'))throw Error('Binary content in a text file; original was not imported.');
   if(/-----BEGIN[^\n]*PRIVATE KEY-----|\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]{24,}/.test(decoded))throw Error('Recognizable credential detected; source was not imported.');
   const lines=decoded?decoded.split(/\r\n|\r|\n/):[];if(lines.length&&lines.at(-1)==='')lines.pop();
   meta.lines=lines.length;meta.nonblankLines=lines.filter(l=>l.trim()).length;meta.codeLines=kind==='code'?meta.lines:null;meta.text=decoded;
  }
  return meta;
 }
 function summary(sources){const unique=new Map(sources.map(s=>[s.id,s]));let codeLines=0,measured=0,images=0,documents=0,unmeasured=0;
  for(const s of unique.values()){const m=s.fileIndex;if(!m){unmeasured++;continue;}if(m.kind==='image')images++;else if(m.kind!=='code')documents++;if(m.kind==='code'&&Number.isSafeInteger(m.codeLines)){codeLines+=m.codeLines;measured++;}}
  return {files:unique.size,images,documents,measuredCodeFiles:measured,physicalCodeLines:codeLines,legacySourcesWithoutMetrics:unmeasured};
 }
 const api={describe,summary};if(typeof module==='object'&&module.exports)module.exports=api;else root.OneFileIndex=api;
})(typeof globalThis!=='undefined'?globalThis:this);
