/** Read-only Nathan AI E word-family research. Original spellings are immutable. */
export const AUTHOR_WORDS="find the Eloher's, Ella's, Evangelist (not good), Eve (female and eve of house and time before night)";
export const KNOWN_GROUPS=Object.freeze(['eloher','ella','evangelist','eve']);
export function selectEFamily(rows, {group='',query=''}={}){
 if(!Array.isArray(rows)||typeof group!=='string'||typeof query!=='string')throw new TypeError('Expected rows and string filters');
 if(group&&!KNOWN_GROUPS.includes(group))throw new TypeError('Unknown E-family group');
 const q=query.normalize('NFKC').toLocaleLowerCase().trim();
 return rows.filter(row=>row&&typeof row.title==='string'&&typeof row.group==='string'&&
  (!group||row.group===group)&&(!q||[row.title,row.variant,row.meaning,row.note,...(row.tags||[])].filter(v=>typeof v==='string').some(v=>v.normalize('NFKC').toLocaleLowerCase().includes(q))));
}
export function inspectLiteral(word){
 if(typeof word!=='string')throw new TypeError('Text required');
 return {original:word,reversed:Array.from(word).reverse().join(''),isLetterPalindrome:Array.from(word.toLocaleLowerCase()).join('')===Array.from(word.toLocaleLowerCase()).reverse().join('')};
}
export function checkEData(data){
 if(!data||data.schema!=='nathan-ai.e-word-families-source-crosswalk.v1'||!Array.isArray(data.records)||!Array.isArray(data.groups)||data.creator_original_words!==AUTHOR_WORDS)throw new TypeError('Invalid E family data');
 const ids=new Set();
 for(const row of data.records){if(!row||typeof row.id!=='string'||ids.has(row.id)||typeof row.title!=='string'||!KNOWN_GROUPS.includes(row.group)||typeof row.meaning!=='string'||typeof row.classification!=='string')throw new TypeError('Invalid E record');ids.add(row.id);}
 return true;
}
