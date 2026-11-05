/* ONE Library Mind — source-preserving public search and publication-link validation.
 * Search indexes are in memory only; original source records and translations
 * are never changed. No tracking, external search endpoint or private upload.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OneLibrarySearch=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const memo=new WeakMap();
 function fold(v){
  return String(v===null||v===undefined?'':v).normalize('NFKD')
   .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 }
 function searchableText(record){
  if(!record||typeof record!=='object')return fold(record);
  if(memo.has(record))return memo.get(record);
  const value=fold(JSON.stringify(record));
  memo.set(record,value);
  return value;
 }
 function search(rows,query){
  if(!Array.isArray(rows))throw Error('Library collection must be an array');
  const text=fold(String(query||'').trim());
  if(!text)return rows.slice();
  // Whole-record search retains compatibility with original searchable public
  // source fields, but doesn't repeatedly serialize 7,918 profiles per keystroke.
  return rows.filter(r=>searchableText(r).includes(text));
 }
 function safeDownload(item){
  if(!item||typeof item!=='object'||typeof item.file!=='string')return false;
  const name=item.file;
  if(name.includes('..')||! /^(?:downloads\/[a-z0-9][a-z0-9._-]{0,199}\.(?:zip|json|md|docx)|books\/[a-z0-9][a-z0-9._-]{0,199}\.md)$/i.test(name))return false;
  return Number.isSafeInteger(item.bytes)&&item.bytes>=0&&/^[a-f0-9]{64}$/i.test(item.sha256);
 }
 return Object.freeze({fold,search,safeDownload});
});
