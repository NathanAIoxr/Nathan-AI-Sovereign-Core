/* NATHAN AI — Independent Edition Engine
 * All records remain attached to original identities and provenance.
 * Browser-native exports; no network, no automatic source edits, no model calls.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanIndependentEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const VERSION='nathan-ai.independent-edition.v1',BRIDGE='nathan-ai.independent-edition-handoff.v1';
const FORMS=['app','game','book','academy'];
function text(value,name,max){if(typeof value!=='string'||value.length>max)throw Error(name+' must be text of at most '+max+' characters');return value}
function validForm(form){if(!FORMS.includes(form))throw Error('Unknown independent edition form');return form}
function validIdentity(id){if(typeof id!=='string'||!/^[a-z][a-z0-9-]{2,48}$/.test(id))throw Error('Invalid original program identifier');return id}
function newSession(program,form){return {schema:VERSION,id:validIdentity(program.id),form:validForm(form),original:{fileName:null,sha256:null,bytes:null,text:null},derivedNotes:'',checked:[],answers:[],visibleSourceChanged:false}}
function validateSession(value,program){
 if(!value||value.schema!==VERSION||value.id!==program.id||!FORMS.includes(value.form))throw Error('Edition does not match its original source');
 const x=value.original;if(!x||typeof x!=='object')throw Error('Missing original source');
 const empty=x.fileName===null&&x.sha256===null&&x.bytes===null&&x.text===null;
 if(!empty){
  if(!/^[^\x00-\x1f\\/]{1,180}$/.test(x.fileName)||!Number.isSafeInteger(x.bytes)||x.bytes<0||x.bytes>1048576||
     !/^[a-f0-9]{64}$/.test(x.sha256)||typeof x.text!=='string'||x.text.length>1048576)throw Error('Invalid original import metadata');
 }
 text(value.derivedNotes,'Derived notes',30000);
 if(!Array.isArray(value.checked)||value.checked.length>3||value.checked.some(i=>!Number.isInteger(i)||i<0||i>2)||new Set(value.checked).size!==value.checked.length)throw Error('Invalid process checklist');
 if(!Array.isArray(value.answers)||value.answers.length>3||value.answers.some(a=>!Number.isInteger(a)||a<0||a>2))throw Error('Invalid game answers');
 if(value.visibleSourceChanged!==false)throw Error('Original source must never be recorded as modified');
 return value;
}
function attachOriginal(session,program,entry){
 validateSession(session,program);
 if(!entry||typeof entry!=='object'||typeof entry.name!=='string'||typeof entry.text!=='string')throw Error('Owner-selected text source required');
 if(!Number.isSafeInteger(entry.bytes)||entry.bytes>1048576||entry.bytes<0||!/^[a-f0-9]{64}$/.test(entry.sha256))throw Error('Invalid fingerprint or byte limit');
 const safeName=entry.name.replace(/[^A-Za-z0-9._ -]/g,'_').slice(0,180);
 if(!safeName||safeName==='.'||safeName==='..')throw Error('Invalid source name');
 const updated={...session,original:{fileName:safeName,sha256:entry.sha256,bytes:entry.bytes,text:entry.text},visibleSourceChanged:false};
 return validateSession(updated,program);
}
function withNotes(session,program,notes){validateSession(session,program);return validateSession({...session,derivedNotes:text(notes,'Derived notes',30000)},program)}
function checkStep(session,program,index,checked){validateSession(session,program);if(!Number.isInteger(index)||index<0||index>2||typeof checked!=='boolean')throw Error('Invalid process selection');
 const steps=new Set(session.checked);if(checked)steps.add(index);else steps.delete(index);return validateSession({...session,checked:[...steps].sort()},program)}
function questions(program){
 return [
 {question:program.challenge[0],options:program.challenge.slice(1,4),answer:0,explanation:program.challenge[4]},
 {question:'Which statement describes what the current original program actually supports?',options:[program.activity,program.overclaim,'All original versions and private manuscripts are automatically restored'],answer:0,explanation:'Keep source-backed functionality separate from unverified promises.'},
 {question:'What should happen when creating a new edition from this original?',options:['Replace old source files with generated examples','Preserve the original source while linking a separately labeled adaptation','Declare missing historical software complete'],answer:1,explanation:'Originals, editions and shared technology have separate identities.'}
 ];
}
function answer(session,program,choice){
 validateSession(session,program);if(!Number.isInteger(choice)||choice<0||choice>2)throw Error('Invalid answer');
 if(session.answers.length>=3)throw Error('Game finished; reset to play again');
 return validateSession({...session,answers:[...session.answers,choice]},program);
}
function grade(session,program){validateSession(session,program);const quiz=questions(program);return {completed:session.answers.length,correct:session.answers.filter((a,i)=>a===quiz[i].answer).length,total:quiz.length};}
function bookMarkdown(program,session){
 validateSession(session,program);
 const exact=program.authorQuote?'## Preserved author statement\n\n'+program.authorQuote+'\n\n':'';
 const imported=session.original.text!==null?
  '## Owner-imported source (verbatim decoded text)\n\nSource filename: '+session.original.fileName+'\nSHA-256 of original imported bytes: '+session.original.sha256+
  '\n\n'+session.original.text+'\n\n':
  '## Owner original source\n\nNo private original manuscript was imported. Open the recorded source or import a text file you own.\n\n';
 const process=program.work.map((step,i)=>(i+1)+'. '+step).join('\n');
 return '# '+program.title+'\n\n'+'**Nathan AI — Independent Book / Reading Workbook**\n\n'+
 '**Status:** Derived reading workbook, not a claim that a complete author-original book exists.\n\n'+
 '**Original program source:** '+program.source+'\n\n'+'## Recorded original program heading\n\n'+program.sourceTitle+'\n\n'+exact+imported+
 '## Process and learning notes — edition adaptation\n\n'+process+'\n\n'+
 '## New, separately labeled draft notes\n\n'+session.derivedNotes+'\n\n'+
 '---\nThis export does not replace the original author source. For exact imported bytes, export the original file separately.\n';
}
function handoff(program,form){
 validIdentity(program.id);validForm(form);return {schema:BRIDGE,id:program.id,title:text(program.title,'Program title',200),form,
  intent:'Review this original Nathan AI program separately from derived game, book, app and academy editions.',
  sourceScope:'public-metadata-only',userTextIncluded:false,sourceTextIncluded:false,modelRequestSent:false};
}
function validateHandoff(packet){
 if(!packet||packet.schema!==BRIDGE||!packet.id||!packet.title||!FORMS.includes(packet.form)||
  packet.sourceScope!=='public-metadata-only'||packet.userTextIncluded!==false||packet.sourceTextIncluded!==false||packet.modelRequestSent!==false)throw Error('Invalid or private edition handoff');
 validIdentity(packet.id);text(packet.title,'Program title',200);
 return {id:packet.id,title:packet.title,form:packet.form};
}
return Object.freeze({VERSION,BRIDGE,FORMS,newSession,validateSession,attachOriginal,withNotes,checkStep,questions,answer,grade,bookMarkdown,handoff,validateHandoff});
});