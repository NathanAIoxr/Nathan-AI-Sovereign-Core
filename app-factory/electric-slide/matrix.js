/* TTFES&BTP Universal Master Matrix.
 * Creator: Nathan Tabor. Additive registry, not provider integrations.
 * This code never touches the network, changes provider sites, or deletes sources.
 */
(function(root,factory) {
  'use strict';
  var api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  else root.TaborUniversalMatrix=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
  'use strict';
  const VERSION='tabor.ttfes-btp.matrix.v1';
  const PLANES=Object.freeze([
    {id:'geometry',label:'Geometry',purpose:'Coordinates, text structure, layout, grids, axes, character positions and dimensions',output:'coordinate-map'},
    {id:'logic',label:'Logic',purpose:'1+1=2 BUILD; 1-1=0 CLEAR. Validate derived states without deleting originals',output:'validation-ledger'},
    {id:'phonetic',label:'Phonetic',purpose:'Original words versus separately identified sounds, reversals, anagrams, acrostics and user-defined ciphers',output:'interpretation-ledger'},
    {id:'deployment',label:'Deployment',purpose:'Provider-specific mapping, permission review, owner approval and observed handoff receipt',output:'destination-packet'}
  ]);
  const AXES=Object.freeze([
    {id:'source',label:'Source / origin',value:'Original source remains immutable'},
    {id:'structure',label:'Structure',value:'Stack / matrix / grid / dimension / layer / coordinate'},
    {id:'direction',label:'Direction',value:'Forward / reverse / mirrored / transformed'},
    {id:'language',label:'Language / phonetics',value:'Literal spelling and optional independent interpretation'},
    {id:'format',label:'Artifact format',value:'Text / Markdown / JSON / CSV / EPUB / DOCX / media'},
    {id:'destination',label:'Destination',value:'Platform adapter and owned account'},
    {id:'permission',label:'Permission',value:'Requested, granted, withdrawn or unsupported'},
    {id:'status',label:'Status',value:'planned / local-preparation / tested / externally-verified'},
    {id:'revision',label:'Revision',value:'Version, UTC time, digest and source linkage'}
  ]);
  const STACKS=Object.freeze([
    ['source-records','Unchanged manuscripts and evidence','Sources'],
    ['learning-stacks','Reading sequences and courses','Knowledge'],
    ['index-matrices','A-Z, 0-1, four-state and classification matrices','Knowledge'],
    ['grids','Characters, tables, vertical/horizontal coordinates','Geometry'],
    ['dimensions','Multi-axis and symbolic dimensions','Geometry'],
    ['phonetic','Phonetic spelling, sound maps, reversals, SVIRS/VIRUS examples','Language'],
    ['sacred-text','Scripture, commentary, text comparisons and citations','Knowledge'],
    ['artifacts','Books, manuscripts, images, video, audio and code','Media'],
    ['metadata','Titles, authors, rights, keywords, categories and identifiers','Publishing'],
    ['workflow','Tasks, dependencies, approvals, permissions and retries','Operations'],
    ['provenance','Source digest, timestamps, revisions, receipts and evidence limits','Governance']
  ].map(x=>Object.freeze({id:x[0],title:x[1],group:x[2]})));
  // status is the observed implementation state in this repository, NOT account capability.
  // local-preparation: packages prepared locally; NO direct provider upload or launch.
  // planned: destination field mapping has not been implemented or validated.
  const DEST_DATA=[
    ['Crowdfunding','Kickstarter','kickstarter','local-preparation','campaign text, goal, tiers, risks, timeline'],
    ['Crowdfunding','Indiegogo','indiegogo','planned','campaign text, tiers, timeline'],
    ['Crowdfunding','BackerKit','backerkit','planned','rewards, fulfillment, campaign updates'],
    ['Commerce','Shopify','shopify','planned','products, variants, SEO, SKU, inventory'],
    ['Commerce','eBay Seller Hub','ebay','planned','item specifics, shipping, pricing, descriptions'],
    ['Commerce','Etsy Shop Manager','etsy','planned','handmade products, titles, tags, partners'],
    ['Commerce','Gumroad','gumroad','planned','digital products, variants, access and checkout terms'],
    ['Commerce','Lemon Squeezy','lemon','planned','digital products, plans, checkout copy'],
    ['Digital Publishing','Amazon KDP','kdp','separate-module','EPUB/DOCX and listing; owner KDP handoff'],
    ['Digital Publishing','Substack','substack','planned','newsletter titles, excerpts, editorial tags'],
    ['Digital Publishing','Ghost','ghost','planned','posts, metadata and publishing schedules'],
    ['Digital Publishing','Teachable','teachable','planned','lessons, modules, quizzes'],
    ['Digital Publishing','Thinkific','thinkific','planned','lessons, modules, quizzes'],
    ['Freelance & Jobs','Upwork','upwork','planned','portfolio, project catalogs, proposals'],
    ['Freelance & Jobs','Fiverr','fiverr','planned','gig tiers, pricing, deliverables'],
    ['Freelance & Jobs','LinkedIn Jobs','linkedin-jobs','planned','job descriptions, requirements, screening questions'],
    ['Creative Portfolio','Behance','behance','planned','project descriptions, credits, tags'],
    ['Creative Portfolio','Adobe Portfolio','adobe-portfolio','planned','creative works, descriptions and accessibility text'],
    ['Creative Portfolio','Shutterstock','shutterstock','planned','stock metadata, licenses, captions'],
    ['Creative Portfolio','Adobe Stock','adobe-stock','planned','stock metadata, licenses, captions'],
    ['Media & Advertising','Meta Ads Manager','meta-ads','planned','ad variants, targeting summaries and review'],
    ['Media & Advertising','Pinterest Business','pinterest','planned','pins, descriptions and destination URLs'],
    ['Media & Advertising','YouTube Studio','youtube','planned','video descriptions, chapters, tags, visibility'],
    ['Real Estate','Airbnb','airbnb','planned','listing copy, policies, room details'],
    ['Real Estate','Vrbo','vrbo','planned','listing copy, policies, room details'],
    ['Real Estate','Zillow Rental Manager','zillow','planned','rental descriptions, amenities, terms'],
    ['Real Estate','Apartments.com','apartments','planned','rental policies, terms and listing descriptions'],
    ['Web3','OpenSea','opensea','planned','collections, metadata and creator settings'],
    ['Web3','Magic Eden','magic-eden','planned','collections, metadata and creator settings'],
    ['Web3','Gitcoin','gitcoin','planned','project descriptions, public grant proposals'],
    ['Web3','Mirror.xyz','mirror','planned','web publishing and crowdfunding descriptions'],
    ['Education & Grants','Canvas LMS','canvas-lms','planned','modules, syllabi, assignments'],
    ['Education & Grants','Blackboard','blackboard','planned','modules, syllabi, assessments'],
    ['Education & Grants','Grants.gov','grants-gov','planned','abstracts, application narratives and budget explanations'],
    ['Education & Grants','SAM.gov','sam-gov','planned','organization profiles and permitted registrations'],
    ['Nathan AI Internal','ONE Master Library','one-library','planned','book and source catalog with provenance'],
    ['Nathan AI Internal','TABOR Factory','tabor-factory','planned','specifications, tasks and releases'],
    ['Nathan AI Internal','DUMMIE Publisher','dummie','separate-module','local ZIP packaging'],
    ['Development','GitHub','github','planned','issues, README, releases and code handoffs'],
    ['Development','Vercel','vercel','planned','deployment metadata and releases'],
    ['Operations','Airtable','airtable','planned','records, linked tables and categorization'],
    ['Operations','Notion','notion','planned','wiki pages, tasks and documentation'],
    ['Operations','Google Drive','google-drive','planned','documents, spreadsheets, metadata'],
    ['Libraries','ISBN & Book Cataloging','book-catalog','planned','edition and contributor metadata; classifications unverified'],
    ['Media & Advertising','Podcast / Audiobook Distributors','audio','planned','show notes, transcripts, chapters and artwork'],
    ['Governance','Evidence & Revision Archive','evidence','planned','digest ledger, timestamps and audit receipts']
  ];
  const DESTINATIONS=Object.freeze(DEST_DATA.map(row=>Object.freeze({
    sector:row[0],name:row[1],id:row[2],status:row[3],scope:row[4]
  })));
  const VALID_STATUSES=Object.freeze(['planned','local-preparation','separate-module','tested','externally-verified']);
  function findDestination(id){return DESTINATIONS.find(x=>x.id===id)||null;}
  function validateRegistry(){
    const errors=[],seen=new Set();
    for(const d of DESTINATIONS){
      if(seen.has(d.id))errors.push('Duplicate id: '+d.id);
      seen.add(d.id);
      if(!VALID_STATUSES.includes(d.status))errors.push('Unknown status: '+d.id);
      if(!d.scope||!d.sector||!d.name)errors.push('Incomplete destination: '+d.id);
    }
    return Object.freeze({ok:errors.length===0,errors:errors,destinationCount:DESTINATIONS.length});
  }
  function planFromSource(input){
    input=input||{};
    const value=String(input.source===undefined?'':input.source),chosen=findDestination(input.destinationId);
    if(!value)throw Error('An original source is required.');
    if(value.length>5000000)throw Error('Source over 5 million characters. Split into exact preserved parts.');
    if(!chosen)throw Error('Choose a known destination.');
    return {
      schema:VERSION,
      owner:String(input.owner||'Nathan Tabor').slice(0,160),
      sourceText:value, // never corrected, normalized, or truncated
      sourceLabel:String(input.sourceLabel||'Original transcription').slice(0,200),
      dimensions:{stack:String(input.stack||'source-records'),plane:String(input.plane||'geometry'),
        direction:String(input.direction||'forward')},
      indexing:{duoDecimal:String(input.duoDecimal||''),deweySuggested:String(input.deweySuggested||''),
        deweyVerified:false},
      destination:{id:chosen.id,name:chosen.name,status:chosen.status},
      approval:{approved:false,submitted:false,externallyVerified:false}
    };
  }
  function summarize(){
    const bySector={};
    for(const x of DESTINATIONS)bySector[x.sector]=(bySector[x.sector]||0)+1;
    return Object.freeze({planes:PLANES.length,axes:AXES.length,stacks:STACKS.length,
      destinations:DESTINATIONS.length,bySector:bySector});
  }
  return Object.freeze({VERSION,PLANES,AXES,STACKS,DESTINATIONS,VALID_STATUSES,
    findDestination,validateRegistry,planFromSource,summarize});
});
