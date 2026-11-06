/** G/OG/DOG/DOGGESS source-preserving original word family, no mutating filesystem. */
export const WORD_FAMILY_SCHEMA='nathan-ai.g.god-goddess-dog-doggess-sseggod.v1';
export const ORIGINAL_WORDS=Object.freeze(['God','Goddess','Dog','Doggess','Sseggod']);
export function reverseLiteral(value){
 if(typeof value!=='string')throw TypeError('Expected a literal text string');
 return Array.from(value).reverse().join('');
}
export function reverseUppercase(value){
 if(typeof value!=='string')throw TypeError('Expected a literal text string');
 return reverseLiteral(value.toLocaleUpperCase('en-US'));
}
export function verifyWordFamily(doc){
 if(doc?.schema!==WORD_FAMILY_SCHEMA||!Array.isArray(doc.entries)||doc.entries.length!==5)throw TypeError('Incorrect G word-family schema');
 if(doc.originalLabels?.join('|')!==ORIGINAL_WORDS.join('|'))throw TypeError('Original creator labels changed');
 const names=new Set();
 for(const row of doc.entries){
  if(names.has(row.original)||!ORIGINAL_WORDS.includes(row.original))throw TypeError('Duplicate/non-original label');
  names.add(row.original);
  if(row.canonical!==row.original.toUpperCase()||row.reverseUppercase!==reverseUppercase(row.original)||row.reverseOriginalCodepoints!==reverseLiteral(row.original))throw TypeError('Incorrect literal reversal');
  if(row.indexDepartment!=='G'||row.originalInitial!==row.original[0]||row.originalAlphabetPreserved!==true)throw TypeError('Original letter/index relationship lost');
 }
 if(doc.entries.find(x=>x.original==='Doggess').reverseUppercase!=='SSEGGOD'||doc.entries.find(x=>x.original==='Goddess').reverseUppercase!=='SSEDDOG')throw TypeError('Doggess/Goddess reversal conflated');
 if(doc.relations.some(x=>x.kind.includes('historical')||x.kind.includes('etymolog')))throw TypeError('Historical word-origin inference not authorized');
 return true;
}
export function searchGWords(rows,{query=''}={}){
 if(!Array.isArray(rows)||typeof query!=='string')throw TypeError('Expected word records and query');
 const term=query.normalize('NFKC').toLocaleLowerCase().trim();
 return rows.filter(x=>!term||[x.original,x.canonical,x.reverseUppercase,x.notes,...(x.associatedSourceTitles||[])].some(y=>String(y).normalize('NFKC').toLocaleLowerCase().includes(term)));
}
export function directReverseRelation(doc,word){
 if(!doc||typeof word!=='string')throw TypeError('Invalid word selection');
 const name=word.toLocaleUpperCase('en-US'),record=doc.entries.find(x=>x.canonical===name);
 if(!record)return null;
 const pair=doc.entries.find(x=>x.canonical===record.reverseUppercase);
 return {original:record.original,canonical:record.canonical,reversed:record.reverseUppercase,partnerInSuppliedFive:pair?.original||null,source:pair?'two-originals':'generated-literal-reversal'};
}
