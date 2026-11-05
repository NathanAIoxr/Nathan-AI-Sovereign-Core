/* Nathan AI public directory consolidation.
   Keep source registry and independent-site identities unchanged.
   De-duplicate display records only when both catalogs point at the same studio.
*/
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NathanDirectoryConsolidator=api;
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  function canonicalPath(path){
    if(typeof path!=='string')return '';
    return path.replace(/^\.\//,'').replace(/\/index\.html(?:#.*)?$/,'/').replace(/\/+#/g,'/#');
  }
  function consolidate(sites,modules){
    if(!Array.isArray(sites)||!Array.isArray(modules))throw TypeError('Both source arrays are required');
    const studioPaths=new Set(sites.filter(s=>s&&typeof s.slug==='string'&&/^[a-z0-9-]+$/.test(s.slug)).map(s=>canonicalPath('sites/'+s.slug+'/index.html')));
    const seen=new Set();
    const publicModules=[];
    const aliases=[];
    for(const m of modules){
      if(!m||typeof m.id!=='string')continue;
      const key=canonicalPath(m.id);
      if(studioPaths.has(key)){
        aliases.push(Object.freeze({id:m.id,canonical:key,reason:'independent-site-with-own-card'}));
        continue;
      }
      if(seen.has(key)){
        aliases.push(Object.freeze({id:m.id,canonical:key,reason:'duplicate-public-route'}));
        continue;
      }
      seen.add(key);
      publicModules.push(m);
    }
    return Object.freeze({
      sites:Object.freeze(sites.slice()),
      apps:Object.freeze(publicModules),
      aliases:Object.freeze(aliases)
    });
  }
  function uniqueIds(values,known,max){
    if(!Array.isArray(values)||!(known instanceof Set)||!Number.isSafeInteger(max)||max<0)throw TypeError('Invalid ID list');
    return [...new Set(values.filter(x=>typeof x==='string'&&known.has(x)))].slice(0,max);
  }
  return Object.freeze({canonicalPath,consolidate,uniqueIds});
});
