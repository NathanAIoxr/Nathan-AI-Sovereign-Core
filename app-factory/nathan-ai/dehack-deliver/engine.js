/* NATHAN AI — DEHACK / DELIVER WORLD
 * Local-first source review tools. Every transformation keeps original
 * data separately; no universal lie detector, no unauthorized access.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanDehackTools=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SCHEMA='nathan-ai.dehack-deliver.tools.v1';
function text(s,label='text'){if(typeof s!=='string'||s.length>30000)throw Error(label+' must be text of no more than 30,000 characters');return s}
function whole(value,label='number'){
 const s=String(value).trim();if(!/^\d{1,7}$/.test(s))throw Error(label+' must be a nonnegative whole number (0–1,000,000)');
 const n=Number(s);if(n>1000000)throw Error(label+' is outside the allowed range');return n;
}
function radixReview(a='1',b='1'){
 const x=whole(a,'left value'),y=whole(b,'right value'),sum=x+y;
 return {schema:SCHEMA,inputs:[x,y],operation:'addition',
  decimal:String(x)+' + '+String(y)+' = '+String(sum),
  binary:x.toString(2)+'₂ + '+y.toString(2)+'₂ = '+sum.toString(2)+'₂',
  decimalValue:sum,binaryValue:parseInt(sum.toString(2),2),equalValues:true,
  originalValueChanged:false,
  note:'1 + 1 = 10₂ in base two and 1 + 1 = 2 in base ten are two representations of the same quantity. Neither notation takes away autonomy or changes a physical inventory.'};
}
function evidenceReview(claim,source='',interpretation=''){
 const c=text(claim,'claim').trim(),s=text(source,'source').trim(),i=text(interpretation,'interpretation').trim();
 if(!c)throw Error('A claim is required');
 return {schema:SCHEMA,claim:c,sourceProvided:!!s,sourceReference:s,interpretation:i,
  reviewState:s?'source-provided-awaiting-verification':'source-required',
  automaticTruthOrLieVerdict:null,notice:'A source citation needs checking. The program cannot conclude truth, deliberate deception, theology or historical manipulation from words alone.'};
}
function compareSources(original,alternative){
 const before=text(original,'original'),after=text(alternative,'comparison');
 const a=before.replace(/\r\n?/g,'\n').split('\n'),b=after.replace(/\r\n?/g,'\n').split('\n');
 if(a.length>400||b.length>400)throw Error('Compare up to 400 lines per document');
 const changes=[];
 for(let i=0;i<Math.max(a.length,b.length);i++){
  if(a[i]!==b[i])changes.push({line:i+1,original:a[i]??null,comparison:b[i]??null});
 }
 return {schema:SCHEMA,original:before,comparison:after,
  differentLines:changes.length,changedLinePreview:changes.slice(0,100),
  previewTruncated:changes.length>100,autoAccusation:false,
  note:'Differences are literal text differences, not proof of who changed a text, when, why, or whether an alteration is deceptive. Preserve original manuscripts and source provenance.'};
}
const JARGON=Object.freeze([
 ['in order to','to'],['utilize','use'],['prior to','before'],
 ['subsequent to','after'],['pursuant to','under'],['at this point in time','now'],
 ['in the event that','if'],['facilitate','help'],['commence','begin'],
 ['notwithstanding','despite'],['hereinafter','later called']
]);
function plainPreview(original){
 const before=text(original,'original'),suggestions=[];
 let preview=before;
 for(const [term,simple]of JARGON){
  const regex=new RegExp('\\b'+term+'\\b','gi');
  const matches=preview.match(regex);
  if(matches?.length){suggestions.push({original:term,suggested:simple,occurrences:matches.length});preview=preview.replace(regex,simple)}
 }
 return {schema:SCHEMA,original:before,preview,suggestions,originalModified:false,
  automaticTruthOrLieVerdict:null,notice:'Word substitutions may change nuance or legal meaning. Review side by side with the unchanged original; no source is deleted.'};
}
function share(total='10000',percent='20'){
 const cents=whole(total,'resource cents'),p=whole(percent,'percentage');
 if(p>100)throw Error('Percentage must be 0–100');
 const shared=Math.floor(cents*p/100),remainder=cents-shared;
 return {schema:SCHEMA,inputCents:cents,percent:p,sharedCents:shared,remainderCents:remainder,
  totalPreserved:shared+remainder===cents,notice:'Planning calculation only. This does not transfer money or take assets from anyone.'};
}
function clearWorkspace(){return {schema:SCHEMA,viewerState:'cleared-local-only',remoteFilesDeleted:0,serverSessionsStopped:0,originalsModified:false}}
return Object.freeze({SCHEMA,radixReview,evidenceReview,compareSources,plainPreview,share,clearWorkspace,JARGON});
});
