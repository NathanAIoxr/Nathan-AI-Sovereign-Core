/* TABOR SOVEREIGN BOXES — original, deterministic foundation.
   Arithmetic is ordinary mathematics. Sovereignty is a data/permissions model.
   This local engine does NOT confer real access or delete remote records. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SovereignBoxes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function boxText(text){if(typeof text!=='string')throw TypeError('Text must be a string');return [...text].map((value,index)=>({boxId:'CHAR-'+String(index+1).padStart(5,'0'),index,value,codepoint:value.codePointAt(0),type:/^[0-9]$/.test(value)?'digit':/^[a-z]$/i.test(value)?'letter':value===' '?'space':'symbol'}));}
function boxNumber(value){if(!Number.isSafeInteger(value)||value<0)throw RangeError('Natural number 0 or greater required');return boxText(String(value));}
function sum(a,b){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!Number.isSafeInteger(a+b))throw RangeError('Safe integers only');return {operation:'+',a,b,result:a+b,proof:a+' + '+b+' = '+(a+b)}}
function subtract(a,b){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!Number.isSafeInteger(a-b))throw RangeError('Safe integers only');return {operation:'-',a,b,result:a-b,proof:a+' - '+b+' = '+(a-b)}}
function entity(id,kind,attributes={},status='concept'){if(!/^[A-Za-z][A-Za-z0-9_.:-]{1,127}$/.test(id))throw Error('Invalid namespaced ID');return Object.freeze({id,kind,attributes:{...attributes},status,sovereign:true})}
function relation(a,b,type,permission){if(!a?.id||!b?.id||a.id===b.id)throw Error('Two distinct boxes required');if(!['related','derived','attached','references','grants'].includes(type))throw Error('Unsupported relationship');return {id:a.id+'|'+type+'|'+b.id,from:a.id,to:b.id,type,active:true,authorized:permission===true,createdAt:new Date().toISOString()}}
function revoke(r){if(!r||!r.id)throw Error('Relationship missing');return {...r,active:false,authorized:false,revokedAt:new Date().toISOString(),warning:'Local relationship revoked; no external service was contacted or remote data deleted.'}}
function alphabetIndex(letter){if(typeof letter!=='string'||!(/^[a-z]$/i).test(letter))throw RangeError('Single Latin letter required');return ALPHABET.indexOf(letter.toUpperCase())+1}
function evaluate(){return {addition:sum(1,1),subtraction:subtract(1,1),ten:boxNumber(10),word:boxText('supercalifragilisticexpialidocious')}}
return Object.freeze({boxText,boxNumber,sum,subtract,entity,relation,revoke,alphabetIndex,evaluate});
});