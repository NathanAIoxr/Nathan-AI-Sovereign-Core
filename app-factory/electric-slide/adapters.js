/* TTFES&BTP — universal local destination packet builder.
 * Every destination produces a field-mapped EXPORT TEMPLATE; none gains external
 * publishing access merely by appearing in this catalog.
 * Creator: Nathan Tabor. Uses the existing DUMMIE ZIP writer.
 */
(function(root,factory){
 'use strict';
 const matrix=typeof module==='object'&&module.exports?require('./matrix.js'):root.TaborUniversalMatrix;
 const zip=typeof module==='object'&&module.exports?require('../dummie-publisher/publisher.js'):root.DummiePublisher;
 const api=factory(matrix,zip);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.TaborDestinationAdapters=api;
})(typeof globalThis==='undefined'?this:globalThis,function(M,zip){
 'use strict';
 const SCHEMA='tabor.ttfes-btp.destination-packet.v1';
 const TYPES={
   name:'Name / title',subtitle:'Subtitle / short description',description:'Description / body text',
   category:'Category / classification candidate',keywords:'Search phrases / tags (comma-separated)',
   source_ref:'Original source reference',media_refs:'Local asset filenames / references',
   rights:'Rights and permissions statement (review required)',author:'Author / creator',
   sku:'SKU / product identifier',variants:'Variants / options (JSON or plain text)',
   price:'Proposed price and currency',inventory:'Inventory information',
   shipping:'Shipping and fulfillment rules',terms:'Terms and policies (review required)',
   release_notes:'Release notes / changelog',version:'Version / release identifier',
   file_refs:'File names and local asset references',status:'Publishing visibility proposal',
   alt_text:'Accessibility description',credits:'Contributors and credit lines',
   link:'Destination or canonical URL',schedule:'Proposed publish date',
   reward_tiers:'Reward tiers and obligations',goal:'Funding goal and currency',
   duration:'Campaign duration (days)',risks:'Risks and mitigations',
   timeline:'Milestones and proposed delivery dates',metadata:'Structured metadata / trait notes',
   fees:'Cost / payout / commission assumptions (review required)',
   headline:'Headline',primary_text:'Primary text / ad copy',audience:'Audience proposal',
   budget:'Budget proposal (owner must approve)',chapters:'Chapter/time markers',
   privacy:'Privacy considerations',room:'Room and property descriptions',
   amenities:'Amenities / inventory list',house_rules:'Rules / policies',
   availability:'Availability proposal (verify)',location:'Location / coverage',
   royalty:'Royalties and ownership (review required)',
   wallet:'Public payout address (verify manually; never secrets)',
   syllabus:'Syllabus / learning objectives',modules:'Modules and lesson outline',
   assessments:'Assignments / quiz content',organization:'Organization / entity profile',
   abstract:'Project abstract',budget_justification:'Budget justification',
   qualifications:'Qualifications and eligibility evidence',
   account:'Owner-controlled account reference (NO credentials)',
   issue:'Task or GitHub issue text',repository:'Repository identification',
   branch:'Proposed branch / release tag',env_notes:'Configuration notes (NO secrets)',
   record:'Primary record content',relations:'Linked IDs and references',
   citation:'Source citation and limitations',hash:'SHA-256 fingerprint reference',
   classification:'Suggested classification (requires verification)',
   language:'Language / translation provenance'
 };
 const SECTORS={
   'Crowdfunding':['name','subtitle','description','category','goal','duration','reward_tiers','timeline','risks','media_refs','rights','fees'],
   'Commerce':['name','subtitle','description','category','sku','price','inventory','variants','keywords','media_refs','shipping','terms','rights'],
   'Digital Publishing':['name','subtitle','author','description','category','keywords','file_refs','media_refs','rights','language','schedule'],
   'Freelance & Jobs':['name','subtitle','description','category','keywords','price','timeline','terms','credits','file_refs'],
   'Creative Portfolio':['name','description','category','keywords','media_refs','alt_text','credits','rights','link'],
   'Media & Advertising':['name','headline','primary_text','description','audience','keywords','link','media_refs','alt_text','budget','schedule','rights'],
   'Real Estate':['name','description','location','room','amenities','house_rules','availability','price','media_refs','rights','terms'],
   'Web3':['name','description','metadata','media_refs','royalty','wallet','rights','risks','fees'],
   'Education & Grants':['name','description','abstract','organization','syllabus','modules','assessments','budget_justification','qualifications','rights','timeline'],
   'Nathan AI Internal':['name','description','source_ref','category','metadata','relations','citation','rights','status'],
   'Development':['name','description','issue','repository','branch','version','release_notes','file_refs','env_notes','rights'],
   'Operations':['name','description','record','relations','category','metadata','timeline','rights'],
   'Libraries':['name','subtitle','author','description','classification','language','citation','rights','metadata'],
   'Governance':['name','description','source_ref','citation','hash','metadata','relations','rights']
 };
 const OVERRIDES={
   'kickstarter':['name','subtitle','category','goal','duration','description','reward_tiers','timeline','risks','media_refs'],
   'kdp':['name','subtitle','author','description','keywords','category','language','file_refs','media_refs','rights'],
   'youtube':['name','description','chapters','keywords','media_refs','alt_text','rights','schedule','status'],
   'linkedin-jobs':['name','subtitle','description','qualifications','location','terms','schedule'],
   'shopify':['name','description','sku','variants','price','inventory','keywords','media_refs','shipping'],
   'etsy':['name','description','category','keywords','price','variants','media_refs','shipping','rights'],
   'canvas-lms':['name','description','syllabus','modules','assessments','rights'],
   'blackboard':['name','description','syllabus','modules','assessments','rights'],
   'grants-gov':['name','organization','abstract','description','budget','budget_justification','qualifications','timeline'],
   'sam-gov':['name','organization','description','qualifications','account','rights'],
   'one-library':['name','author','description','source_ref','classification','metadata','relations','rights'],
   'evidence':['name','description','source_ref','citation','hash','metadata','rights']
 };
 function template(destinationId){
   const d=M.findDestination(destinationId);
   if(!d)throw Error('Unknown destination.');
   const keys=OVERRIDES[d.id]||SECTORS[d.sector];
   if(!Array.isArray(keys)||!keys.length)throw Error('Missing destination field family.');
   return Object.freeze({destination:d,verifiedProviderFields:false,
     importGuaranteed:false,externalWriteSupported:false,
     fields:Object.freeze(keys.map(id=>Object.freeze({id,label:TYPES[id]||id,valueType:'text',required:false,providerSelectorVerified:false})))});
 }
 function validFields(destinationId,fields) {
   if(!fields||typeof fields!=='object'||Array.isArray(fields))throw Error('Field map must be an object.');
   const allowed=new Set(template(destinationId).fields.map(x=>x.id)),out={};
   for(const [key,value] of Object.entries(fields)){
     if(!allowed.has(key))throw Error('Unexpected field: '+key);
     if(typeof value!=='string'&&typeof value!=='number')throw Error('Field '+key+' must be text or number.');
     const str=String(value);
     if(str.length>100000)throw Error('Field '+key+' exceeds 100000 characters.');
     out[key]=str;
   }
   return out;
 }
 function build(input) {
   input=input||{};
   const destinationId=String(input.destinationId||''),d=template(destinationId),text=String(input.originalSource??'');
   if(!text)throw Error('Original source text required. No packet without its source.');
   if(text.length>5000000)throw Error('Source exceeds 5 million characters; split it into intact parts.');
   const fields=validFields(destinationId,input.fields||{});
   const labels=d.fields.map(x=>({key:x.id,label:x.label,value:fields[x.id]??'',providerSelectorVerified:false}));
   return {
     schema:SCHEMA,creator:String(input.creator||'Nathan Tabor').slice(0,120),
     source:{label:String(input.sourceLabel||'Original transcription').slice(0,200),
       originalText:text,unchanged:true},
     destination:{id:d.destination.id,name:d.destination.name,sector:d.destination.sector,
       registryStatus:d.destination.status,verifiedProviderFields:false,
       externalWriteSupported:false,importGuaranteed:false},
     fields:labels,approval:{reviewed:false,submitted:false,published:false},
     warning:'Local planning template. Field names are generic, not verified live provider form selectors; no provider import guarantee.'
   };
 }
 function rowEsc(value){
   let x=String(value).replace(/^\s*([=+\-@])/,'\u0027$&');
   return '"'+x.replace(/"/g,'""')+'"';
 }
 function mappingCsv(packet){
   if(!packet||packet.schema!==SCHEMA)throw Error('Unsupported packet schema.');
   const rows=[['logical_field','display_label','draft_value','provider_selector_verified'].map(rowEsc).join(',')];
   for(const x of packet.fields)rows.push([x.key,x.label,x.value,'false'].map(rowEsc).join(','));
   return '\uFEFF'+rows.join('\r\n')+'\r\n';
 }
 function shortGuide(p){
   return [
     'TTFES&BTP — LOCAL HANDOFF FOR '+p.destination.name,
     'Creator: '+p.creator,
     '1. Keep SOURCE/ORIGINAL.txt private; it is the exact text supplied for this package.',
     '2. Review DESTINATION/mapping.csv and destination-packet.json. Field names are logical suggestions, not verified provider selectors.',
     '3. Log in yourself through the destination official website or supported import utility.',
     '4. Transfer only appropriate fields; verify costs, rights, sensitive information, settings and downstream actions.',
     '5. Save or submit only through the website after your own review.',
     '6. Preserve remote receipt and update status separately. Clicking Copy or creating a ZIP is NOT an upload.',
     'This package does not contain API keys or official integration access.',
     'Original creator: Nathan Tabor'
   ].join('\n')+'\n';
 }
 function makeZip(input){
   const p=build(input),enc=new TextEncoder();
   const entries=[
     {path:'SOURCE/ORIGINAL.txt',bytes:enc.encode(p.source.originalText)},
     {path:'DESTINATION/destination-packet.json',bytes:enc.encode(JSON.stringify(p,null,2)+'\n')},
     {path:'DESTINATION/mapping.csv',bytes:enc.encode(mappingCsv(p))},
     {path:'DESTINATION/READ-ME-FIRST.txt',bytes:enc.encode(shortGuide(p))}
   ];
   if(!zip||!zip.zip)throw Error('DUMMIE ZIP engine unavailable.');
   return zip.zip(entries);
 }
 function audit(){
   const errors=[];for(const d of M.DESTINATIONS){
     const t=template(d.id);if(!t.fields.length)errors.push('Missing fields for '+d.id);
     if(t.verifiedProviderFields||t.externalWriteSupported)errors.push('Overclaimed permission for '+d.id);
     const seen=new Set();for(const f of t.fields){if(seen.has(f.id))errors.push('Duplicate '+d.id+':'+f.id);seen.add(f.id);}
   }
   return {ok:!errors.length,total:M.DESTINATIONS.length,errors};
 }
 return Object.freeze({SCHEMA,TYPES,SECTORS,OVERRIDES,template,validFields,build,mappingCsv,makeZip,audit});
});