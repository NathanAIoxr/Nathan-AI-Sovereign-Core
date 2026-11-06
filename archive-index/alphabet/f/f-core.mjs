/** Nathan AI F family source-first read-only inspector. */
export const F_SOURCE_SCHEMA='nathan-ai.f.public-master-titles.v1';
export const FABRIC_SCHEMA='nathan-ai.f.fabric-matrix-crosswalk.v1';
export const ROUTES_SCHEMA='nathan-ai.f.structural-source-routes.v1';
export function validateF(source,fabric,routes){
 if(source?.schema!==F_SOURCE_SCHEMA||fabric?.schema!==FABRIC_SCHEMA||routes?.schema!==ROUTES_SCHEMA)throw new TypeError('F source schema mismatch');
 if(source.public_general_rows!==source.entries?.length||source.f_prefix_rows!==source.public_general_rows+source.withheld_editorial_or_unknown_or_private)throw new TypeError('F privacy counts conflict');
 if(fabric.total!==fabric.entries?.length||fabric.groups.reduce((n,x)=>n+x.count,0)!==fabric.total)throw new TypeError('Fabric ledger counts conflict');
 if(!routes.creator_exact||!routes.sourceRoutes?.length)throw new TypeError('Missing original F rule');
 if(new Set(source.entries.map(x=>x.catalog_row)).size!==source.entries.length||!source.entries.every(x=>/^f/i.test(x.title)))throw new TypeError('Not an F-only public source list');
 if(new Set(fabric.entries.map(x=>x.order)).size!==fabric.total)throw new TypeError('Fabric duplicate source occurrences');
 if(!routes.geometry?.F||!routes.geometry?.P||!routes.geometry?.fehu||!routes.geometry?.oghamF)throw new TypeError('Construction and script separation lost');
 return true;
}
export function selectF(records,{query=''}={}){
 if(!Array.isArray(records)||typeof query!=='string')throw new TypeError('F data required');
 const q=query.normalize('NFKC').toLocaleLowerCase().trim();
 return records.filter(x=>!q||x.title.normalize('NFKC').toLocaleLowerCase().includes(q));
}
export function selectFabric(records,{query='',group=''}={}){
 if(!Array.isArray(records)||typeof query!=='string'||typeof group!=='string')throw new TypeError('Fabric filters invalid');
 const q=query.normalize('NFKC').toLocaleLowerCase().trim();
 return records.filter(x=>(!group||x.group===group)&&(!q||x.title.normalize('NFKC').toLocaleLowerCase().includes(q)));
}
export function selectRoutes(records,{query='',group=''}={}){
 if(!Array.isArray(records))throw new TypeError('Routes must be an array');
 const q=String(query).normalize('NFKC').toLocaleLowerCase().trim();
 return records.filter(x=>(!group||x.group===group)&&(!q||[x.original,x.note,x.script,...x.related].filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase().includes(q)));
}
export function inspectGlyph(value,routes){
 if(typeof value!=='string'||!routes?.geometry)throw new TypeError('Original literal and routes required');
 const v=value.trim();
 const label=({'F':'F','f':'F','P':'P','p':'P','ᚠ':'fehu','ᛈ':'perthro','ᚃ':'oghamF'})[v];
 const original=v;
 return {original,matched:label||null,record:label?routes.geometry[label]:null,reversed:[...original].reverse().join(''),historyClaim:false};
}
export function quizQuestions(){
 return [
 {q:'In the creator’s original F construction, which shape is described as cut open?',answers:['P','8','M','W'],correct:'P',note:'Original creator geometry; not a historical Latin alphabet derivation.'},
 {q:'Which rune is the F-sound Fehu / Fé?',answers:['ᚠ','ᛈ','ᚃ','ᛉ'],correct:'ᚠ',note:'Germanic runic script; distinct from Latin F.'},
 {q:'Which is the separate runic P, conventionally Perthro?',answers:['ᚠ','ᛈ','ᚃ','Ϝ'],correct:'ᛈ',note:'The name/origin is uncertain; not a claim of literal Latin descent.'},
 {q:'Which F sign belongs to Irish Ogham, not Nordic runes?',answers:['ᚃ','ᚠ','ᛗ','ᛈ'],correct:'ᚃ',note:'Fearn is third in Ogham’s first family B L F S N.'},
 {q:'The 150 Fabric of the Matrix titles are classified as what?',answers:['Cross-references','150 launched apps','150 physical laws','150 published novels'],correct:'Cross-references',note:'Original manuscripts and other applications remain independently sourced.'}
 ];
}
