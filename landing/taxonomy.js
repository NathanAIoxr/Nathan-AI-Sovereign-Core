(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.NathanLandingTaxonomy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DEWEY=Object.freeze([
    ['000','Computer science, information & general works'],
    ['100','Philosophy & psychology'],
    ['200','Religion'],
    ['300','Social sciences'],
    ['400','Language'],
    ['500','Science'],
    ['600','Technology'],
    ['700','Arts & recreation'],
    ['800','Literature'],
    ['900','History & geography']
  ].map(([code,title])=>({code,title})));
  const HISTORICAL=Object.freeze([
    {id:'clay',era:'Ancient Mesopotamia',name:'Clay tablets and colophons',method:'Keep provenance, origin, authorship and recording context',sort:'path',url:'https://build-oracc.museum.upenn.edu/asbp/Colophons/'},
    {id:'scroll',era:'Classical Mediterranean',name:'Scroll lists and subject inventories',method:'Discover collections by descriptive inventory and subject',sort:'category',url:'https://www.britannica.com/topic/library'},
    {id:'pinakes',era:'Hellenistic Alexandria',name:'Callimachus and the Pinakes tradition',method:'Describe authors, titles and genres as a bibliographic navigation lens',sort:'title',url:'https://www.britannica.com/biography/Callimachus-Greek-poet'},
    {id:'manuscript',era:'Medieval / manuscript',name:'Collection and shelf inventories',method:'Preserve each originating collection and its historical context',sort:'scope',url:'https://www.loc.gov/collections/'},
    {id:'print',era:'Print era',name:'Bibliographies and alphabetical indexes',method:'Find by literal title or selected keyword',sort:'title',url:'https://www.loc.gov/'},
    {id:'dewey',era:'1876 onward',name:'Dewey Decimal Classification',method:'Ten broad subject classes from 000 through 900',sort:'ddc',url:'https://www.oclc.org/en/dewey.html'},
    {id:'lcc',era:'Modern library science',name:'Library of Congress Classification',method:'Alternative subject arrangement; not equivalent to Dewey numbers',sort:'category',url:'https://www.loc.gov/aba/cataloging/classification/'},
    {id:'colon',era:'1933 onward',name:'Ranganathan faceted classification',method:'Combine independent facets of a subject rather than relying on one hierarchy',sort:'capability',url:'https://www.isko.org/cyclo/colon_classification.htm'},
    {id:'digital',era:'Digital / contemporary',name:'Machine-readable metadata and full-text search',method:'Find by ID, title, metadata and text where available',sort:'path',url:'https://www.loc.gov/marc/'},
    {id:'stores',era:'Contemporary app distribution',name:'Apple and Google Play taxonomies',method:'Discover by primary purpose, optional secondary classification and approved tags',sort:'category',url:'https://developer.apple.com/app-store/categories/'},
    {id:'spectrum',era:'Nathan AI author-defined',name:'Full-spectrum multidirectional cross-index',method:'Preserve original sources; traverse categories, capabilities, time and direction in either order',sort:'capability',url:'./app-factory/nathan-ai/capability-atlas/'}
  ]);
  const APPLE=Object.freeze(['Books','Business','Developer Tools','Education','Entertainment','Finance','Food & Drink','Games','Graphics & Design','Health & Fitness','Lifestyle','Magazines & Newspapers','Medical','Music','Navigation','News','Photo & Video','Productivity','Reference','Shopping','Social Networking','Sports','Travel','Utilities','Weather']);
  const GOOGLE=Object.freeze(['Art and Design','Auto and Vehicles','Beauty','Books and Reference','Business','Comics','Communication','Dating','Education','Entertainment','Events','Finance','Food and Drink','Health and Fitness','House and Home','Libraries and Demo','Lifestyle','Maps and Navigation','Medical','Music and Audio','News and Magazines','Parenting','Personalization','Photography','Productivity','Shopping','Social','Sports','Tools','Travel and Local','Video Players and Editors','Weather']);
  const GAMES=Object.freeze(['Action','Adventure','Arcade','Board','Card','Casino','Casual','Educational','Family','Music','Puzzle','Racing','Role Playing','Simulation','Sports','Strategy','Trivia','Word']);
  const FUNCTIONS=Object.freeze(['receive','recognize','remember','retrieve','connect','transform','interpret','evaluate','decide','create','communicate','adapt','protect','restore','sequence','present','measure','execute']);
  const DDC_CROSSWALK=Object.freeze({
    'Books':'800','Magazines & Newspapers':'000','Reference':'000','Developer Tools':'000','Utilities':'600',
    'Productivity':'600','Business':'300','Education':'300','Finance':'300','Food & Drink':'600',
    'Graphics & Design':'700','Entertainment':'700','Games':'700','Music':'700','Sports':'700',
    'Health & Fitness':'600','Medical':'600','Lifestyle':'300','Navigation':'900','News':'000',
    'Photo & Video':'700','Shopping':'300','Social Networking':'300','Travel':'900','Weather':'500'
  });
  // The crosswalk is a practical navigation proposal, NOT an authoritative Dewey call number.
  // Never infer a Dewey number from a title or a folder name.
  function classifyDDC(entry){
    if(!entry||!entry.apple||!entry.apple.primary)return null;
    return DDC_CROSSWALK[entry.apple.primary]||null;
  }
  const AXES=Object.freeze({
    center:{label:'Center · ONE',description:'Open the whole ecosystem with original paths and all source boundaries.'},
    up:{label:'Up · Subject pyramid',description:'Move through broad-to-specific subject groupings. Follow Dewey 000–900 without imposing a false call number.'},
    down:{label:'Down · Functional pyramid',description:'Drill into inputs, outputs, characteristics, operations, original implementations and provenance.'},
    left:{label:'Left · Ancient-to-modern records',description:'Explore colophons, bibliographies, classifications, and faceted methods as alternate lenses.'},
    right:{label:'Right · App stores and discovery',description:'Browse Apple categories, Google Play categories, game genres and prospective app listings.'}
  });
  // +9 to +1 top-to-center, -9 at the bottom to -1 near center.
  const ABOVE=Object.freeze([9,8,7,6,5,4,3,2,1]);
  const BELOW=Object.freeze([-9,-8,-7,-6,-5,-4,-3,-2,-1]);
  const DEO=Object.freeze({
    name:'DEO decimal',source:'Nathan Tabor (term supplied by creator)',
    status:'author-defined notation; assignment scheme not supplied',
    digits:Object.freeze([0,1,2,3,4,5,6,7,8,9]),
    note:'Retained separately from the established Dewey Decimal Classification and the base-12 duodecimal numeral system. No DEO call numbers are fabricated.'
  });
  function normalizeRecord(r) {
    return {
      path:String(r.path||''),title:String(r.title||r.path||'Untitled'),
      apple:r.apple||{primary:null,secondary:null,genre:null},
      google:r.google||{category:null,type:null,tagCandidates:[]},
      capabilities:Array.isArray(r.capabilities)?r.capabilities.filter(x=>FUNCTIONS.includes(x)):[],
      evidence:r.evidence||{kind:'entrypoint-only'},
      ddc:classifyDDC(r),coverage:String(r.coverage||'unclassified'),
      status:String(r.storeStatus||'not-submitted'),
      rationale:String(r.rationale||'Source review pending')
    };
  }
  function buildRecords(inventory,proposals,storeEngine){
    if(!storeEngine||typeof storeEngine.build!=='function')throw Error('Source-backed store index required');
    return storeEngine.build(inventory,proposals).map(normalizeRecord);
  }
  function selectRecords(rows,{axis='center',ddc='',apple='',google='',capability='',query='',order='forward'}={}){
    const q=String(query).trim().toLocaleLowerCase();
    let selected=rows.filter(r=>
      (!ddc||r.ddc===ddc)&&(!apple||r.apple.primary===apple||r.apple.secondary===apple)&&
      (!google||r.google.category===google)&&(!capability||r.capabilities.includes(capability))&&
      (!q||[r.path,r.title,r.apple.primary,r.google.category,r.rationale,r.ddc,...r.capabilities].join(' ').toLocaleLowerCase().includes(q))
    );
    let comparator;
    if(axis==='up')comparator=(a,b)=>(a.ddc||'999').localeCompare(b.ddc||'999')||a.title.localeCompare(b.title);
    else if(axis==='down')comparator=(a,b)=>b.capabilities.length-a.capabilities.length||a.title.localeCompare(b.title);
    else if(axis==='right')comparator=(a,b)=>(a.apple.primary||'zzz').localeCompare(b.apple.primary||'zzz')||a.title.localeCompare(b.title);
    else comparator=(a,b)=>a.title.localeCompare(b.title);
    selected=selected.slice().sort(comparator);
    if(order==='reverse')selected.reverse();
    return selected;
  }
  function mappingCoverage(records){
    return {total:records.length,categorized:records.filter(x=>x.apple.primary).length,
      unclassified:records.filter(x=>!x.apple.primary).length};
  }
  return Object.freeze({DEWEY,HISTORICAL,APPLE,GOOGLE,GAMES,FUNCTIONS,DDC_CROSSWALK,AXES,ABOVE,BELOW,DEO,
    classifyDDC,normalizeRecord,buildRecords,selectRecords,mappingCoverage});
});
