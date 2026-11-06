/* Local, validated two-generation saves. No network or automatic data deletion. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OneSaveStore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function create(storage,key,validate,{equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b)}={}){
 const backup=key+'.backup',damaged=key+'.damaged';
 const decode=raw=>{if(raw===null)return null;return validate(JSON.parse(raw));};
 function readBackup(){try{const raw=storage.getItem(backup);return raw===null?null:decode(raw);}catch{return null;}}
 function load(){try{const raw=storage.getItem(key);try{return {data:decode(raw),status:raw===null?'empty':'loaded',backupAvailable:readBackup()!==null};}catch{return {data:null,status:'damaged',backupAvailable:readBackup()!==null};}}catch{return {data:null,status:'unavailable',backupAvailable:false};}}
 function write(data,{replaceDamaged=false}={}){
  try{
   validate(data);const next=JSON.stringify(data),raw=storage.getItem(key);
   if(raw===next)return {status:'saved',backupAvailable:readBackup()!==null};
   if(raw!==null){
    let valid=true,previous;try{previous=decode(raw);}catch{valid=false;}
    if(valid&&equal(previous,data))return {status:'saved',backupAvailable:readBackup()!==null};
    if(!valid&&!replaceDamaged)return {status:'damaged',backupAvailable:readBackup()!==null};
    // Preserve the old bytes before replacing anything. A quota/write failure
    // leaves the current primary intact and reports that saving failed.
    storage.setItem(valid?backup:damaged,raw);
   }
   storage.setItem(key,next);return {status:'saved',backupAvailable:readBackup()!==null};
  }catch{return {status:'unavailable',backupAvailable:readBackup()!==null};}
 }
 function recover(){
  const data=readBackup();if(data===null)return {status:'missing',data:null,backupAvailable:false};
  const result=write(data,{replaceDamaged:true});return {...result,data:result.status==='saved'?data:null};
 }
 function damagedText(){try{const raw=storage.getItem(key);if(raw!==null){try{decode(raw);}catch{return raw;}}return storage.getItem(damaged);}catch{return null;}}
 return Object.freeze({load,write,recover,damagedText});
}
return Object.freeze({create});
});
