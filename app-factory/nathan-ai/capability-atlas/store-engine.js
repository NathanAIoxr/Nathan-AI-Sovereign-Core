(function(root,factory) {
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NathanStoreDiscovery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function() {
  'use strict';
  const appleApps=Object.freeze([
    'Books','Business','Developer Tools','Education','Entertainment','Finance','Food & Drink',
    'Graphics & Design','Health & Fitness','Lifestyle','Magazines & Newspapers','Medical',
    'Music','Navigation','News','Photo & Video','Productivity','Reference','Shopping',
    'Social Networking','Sports','Travel','Utilities','Weather'
  ]);
  const appleGenres=Object.freeze(['Action','Adventure','Board','Card','Casino','Casual','Family','Music','Puzzle','Racing','Role Playing','Simulation','Sports','Strategy','Trivia','Word']);
  const googleApps=Object.freeze([
    'Art and Design','Auto and Vehicles','Beauty','Books and Reference','Business','Comics',
    'Communication','Dating','Education','Entertainment','Events','Finance','Food and Drink',
    'Health and Fitness','House and Home','Libraries and Demo','Lifestyle','Maps and Navigation',
    'Medical','Music and Audio','News and Magazines','Parenting','Personalization','Photography',
    'Productivity','Shopping','Social','Sports','Tools','Travel and Local','Video Players and Editors','Weather'
  ]);
  const googleGames=Object.freeze(['Action','Adventure','Arcade','Board','Card','Casino','Casual','Educational','Music','Puzzle','Racing','Role Playing','Simulation','Sports','Strategy','Trivia','Word']);
  const unique = array => array.length === new Set(array).size;

  function validateManifest(manifest, entries) {
    if(!manifest||manifest.schema!=='nathan-ai.store-discovery.v1'||!Array.isArray(manifest.records))
      throw Error('Invalid store discovery manifest');
    if(!entries||!Array.isArray(entries)) throw Error('Missing complete GitHub tree inventory');
    const indexed=new Set(entries.filter(x=>x.t==='f').map(x=>x.p));
    if(!unique(manifest.records.map(x=>x.path))) throw Error('Duplicate app paths');
    if(manifest.limit.appleCategoryCount!==2||manifest.limit.googleCategoryCount!==1||
       manifest.limit.googleTags!==5||manifest.limit.appleGameGenres!==2) throw Error('Unexpected store platform limits');
    for(const r of manifest.records) {
      if(!indexed.has(r.path)) throw Error('Missing GitHub entry point: '+r.path);
      if(!r.path.startsWith('app-factory/')||!r.path.endsWith('/index.html'))
        throw Error('Invalid app route: '+r.path);
      if(!r.apple||!r.google||!r.apple.primary||
         ![...appleApps,'Games'].includes(r.apple.primary)) throw Error('Invalid Apple category: '+r.path);
      if(r.apple.secondary&&![...appleApps,'Games'].includes(r.apple.secondary)) throw Error('Invalid Apple secondary: '+r.path);
      if(r.apple.genre&&!appleGenres.includes(r.apple.genre)) throw Error('Invalid Apple game genre: '+r.path);
      if(r.google.type==='game' && !googleGames.includes(r.google.category)) throw Error('Invalid Google game category: '+r.path);
      if(r.google.type==='app' && !googleApps.includes(r.google.category)) throw Error('Invalid Google app category: '+r.path);
      if(!['game','app'].includes(r.google.type)) throw Error('Unrecognized Google listing type: '+r.path);
      if(!Array.isArray(r.google.tagCandidates)||r.google.tagCandidates.length>5)
        throw Error('Google tags exceed limit: '+r.path);
      if(!Array.isArray(r.capabilities)||!unique(r.capabilities)) throw Error('Invalid function inventory: '+r.path);
      if(r.storeStatus!=='not-submitted'||r.reviewStatus!=='proposed-requires-product-review')
        throw Error('A category proposal cannot claim store publication');
    }
    return true;
  }

  function build(inventory, manifest) {
    if(!inventory||inventory.schema!=='nathan-ai.capability-atlas.inventory.v1')
      throw Error('Unexpected source inventory');
    validateManifest(manifest,inventory.entries);
    const byPath=new Map(manifest.records.map(x=>[x.path,x]));
    const indexes=inventory.entries.filter(x=>x.t==='f'&&x.p.startsWith('app-factory/')&&x.p.endsWith('/index.html'));
    return indexes.map(item=>{
      const choice=byPath.get(item.p);
      if(choice) return {...choice, indexedGitSha:item.s, coverage:'category-proposal', distribution:'web-entrypoint-not-native-package'};
      const dir=item.p.slice(0,-'/index.html'.length);
      return {
        id:dir.replace(/\//g,':'), title:dir.split('/').at(-1).replace(/[-_]/g,' '),
        path:item.p, indexedGitSha:item.s,
        apple:{primary:null,secondary:null,genre:null},
        google:{type:null,category:null,tagCandidates:[]},
        capabilities:[], rationale:'Pending functional and product review; no category inferred from a file name.',
        evidence:{kind:'entrypoint-only',source:item.p},
        coverage:'unclassified', reviewStatus:'needs-review',
        storeStatus:'not-submitted',distribution:'web-entrypoint-not-native-package'
      };
    }).sort((a,b)=>a.path.localeCompare(b.path));
  }

  function filter(records,{query='',store='All',category='All',coverage='All',capability='All'}={}) {
    const q=String(query).trim().toLowerCase();
    return records.filter(r=>
      (store==='All'||(store==='Apple'&&r.apple.primary)||(store==='Google'&&r.google.category)) &&
      (category==='All'||r.apple.primary===category||r.apple.secondary===category||r.google.category===category||r.apple.genre===category) &&
      (coverage==='All'||r.coverage===coverage) &&
      (capability==='All'||r.capabilities.includes(capability)) &&
      (!q||[r.title,r.path,r.rationale,r.apple.primary,r.apple.secondary,r.apple.genre,r.google.category,...r.capabilities].join(' ').toLowerCase().includes(q))
    );
  }

  function counts(records) {
    const mapped=records.filter(x=>x.coverage==='category-proposal');
    return {total:records.length,mapped:mapped.length,needsReview:records.length-mapped.length,
      webEntryPoints:records.length,publishedStoreListings:0};
  }
  return Object.freeze({appleApps,appleGenres,googleApps,googleGames,validateManifest,build,filter,counts});
});
