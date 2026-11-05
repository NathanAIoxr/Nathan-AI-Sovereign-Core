/** Nathan AI A-Z source-preserving directory. Read only; no source edits. */
export const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const VALID_KINDS=Object.freeze(['standalone-app','game-catalog','feature-concept','program-record','authored-sequence','public-source-title','public-library-filename','word-family']);
const text=s=>String(s??'').normalize('NFKC').toLocaleLowerCase();
export function validateDirectory(doc,taxonomy){
 if(!doc||doc.schema!=='nathan-ai.complete-alphabet-directory.v1'||!Array.isArray(doc.entries)||doc.entryCount!==doc.entries.length||doc.alphabet!==ALPHABET)throw new TypeError('Invalid directory');
 if(!taxonomy||taxonomy.schema!=='nathan-ai.a-z.store-taxonomy.v1'||!Array.isArray(taxonomy.apple?.appCategories)||!Array.isArray(taxonomy.google?.gameCategories))throw new TypeError('Invalid platform taxonomy');
 const ids=new Set();
 for(const item of doc.entries){
  if(!item||typeof item.id!=='string'||ids.has(item.id)||typeof item.title!=='string'||typeof item.sourceRegistry!=='string'||!VALID_KINDS.includes(item.kind))throw new TypeError('Invalid source record or duplicate ID');
  ids.add(item.id);
  if(item.assignedLetter!==null&&!ALPHABET.includes(item.assignedLetter))throw new TypeError('Invalid assigned letter');
  if(item.titleInitial!==null&&!ALPHABET.includes(item.titleInitial))throw new TypeError('Invalid original title initial');
  const s=item.store;
  if(!s||!s.apple||!s.google||!Array.isArray(s.apple.gameSubcategories)||s.apple.gameSubcategories.length>2||!Array.isArray(s.google.tagCandidates)||s.google.tagCandidates.length>5)throw new TypeError('Invalid platform proposal');
  if(s.apple.primary&&!taxonomy.apple.appCategories.includes(s.apple.primary))throw new TypeError('Unknown Apple category');
  if(s.apple.secondary&&!taxonomy.apple.appCategories.includes(s.apple.secondary))throw new TypeError('Unknown secondary Apple category');
  if(s.google.category&&!(taxonomy.google.appCategories.includes(s.google.category)||taxonomy.google.gameCategories.includes(s.google.category)))throw new TypeError('Unknown Google category');
  if(s.apple.gameSubcategories.some(g=>!taxonomy.apple.gameSubcategories.includes(g)))throw new TypeError('Unknown Apple game genre');
  if(item.href&&(!/^\.\.\/\.\.\//.test(item.href)||item.href.includes('..',6)||/[:?#]/.test(item.href)))throw new TypeError('Unsafe app entry path');
 }
 return true;
}
export function letterCounts(rows,{letterMode='assigned'}={}){
 if(!Array.isArray(rows)||!['assigned','literal'].includes(letterMode))throw new TypeError('Invalid data or mode');
 const result=Object.fromEntries([...ALPHABET].map(c=>[c,0]));
 for(const item of rows){const k=letterMode==='assigned'?item.assignedLetter:item.titleInitial;if(k&&Object.hasOwn(result,k))result[k]++;}
 return result;
}
export function filterDirectory(rows,options={}){
 if(!Array.isArray(rows))throw new TypeError('Expected records');
 const {letter='',letterMode='assigned',query='',kind='',apple='',google='',gameGenre='',stage='',sort='source'}=options;
 if(!['assigned','literal'].includes(letterMode)||!['source','title','reverse-title'].includes(sort)||typeof query!=='string'||(letter!==''&&!ALPHABET.includes(letter)))throw new TypeError('Invalid directory filters');
 const q=text(query.trim());
 const out=rows.filter(item=>{
  const letterValue=letterMode==='assigned'?item.assignedLetter:item.titleInitial;
  if(letter&&letterValue!==letter)return false;
  if(kind&&item.kind!==kind)return false;
  if(apple&&item.store.apple.primary!==apple&&item.store.apple.secondary!==apple)return false;
  if(google&&item.store.google.category!==google)return false;
  if(gameGenre&&!item.store.apple.gameSubcategories.includes(gameGenre)&&item.store.google.category!==gameGenre)return false;
  if(stage&&item.stage!==stage)return false;
  return !q||[item.title,item.summary,item.id,item.sourceCategory,item.sourceRegistry,item.sourceRecordId].some(v=>text(v).includes(q));
 });
 if(sort==='title')out.sort((a,b)=>a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
 if(sort==='reverse-title')out.sort((a,b)=>b.title.localeCompare(a.title)||a.id.localeCompare(b.id));
 return out;
}
export function kinds(rows){return [...new Set(rows.map(v=>v.kind))].sort();}
export function statusCounts(rows){const obj={};for(const x of rows)obj[x.stage]=(obj[x.stage]||0)+1;return obj;}
export function sourceLink(item){
 if(!item||typeof item.href!=='string'||!item.href.startsWith('../../'))return null;
 if(!/^(\.\.\/){2}[a-z0-9_/.-]+\.html$/i.test(item.href)||item.href.includes('..',6))return null;
 return item.href;
}
