/** Nathan AI C alphabet family. Preserves original words. No owner files bundled. */
export const C_VARIANT_TYPES=Object.freeze([
 'literal-c-initial','the-c-prefix','numbered-c-prefix','letter-repetition',
 'phonetic-resemblance','hard-c','soft-c','digraph-c','c-shaped-mirror',
 'cross-script-lookalikes','circled-c','roman-numeral-c','chemical-symbol-c',
 'computing-c','musical-c','author-middle-c'
]);
export function reverseCodePoints(value){
 if(typeof value!=='string')throw new TypeError('Expected string');
 return Array.from(value).reverse().join('');
}
export function classifyC(value){
 if(typeof value!=='string')throw new TypeError('Expected string');
 const original=value, searchForm=value.normalize('NFKC'), term=searchForm.trim(), routes=[];
 const add=(key)=>{if(!routes.includes(key)) routes.push(key);};
 if(/^c/i.test(term))add('literal-c-initial');
 if(/^the[ _-]+c/i.test(term))add('the-c-prefix');
 if(/^\\d+[ _-]+c/i.test(term))add('numbered-c-prefix');
 if(/^c{2,}$/i.test(term))add('letter-repetition');
 if(/^(?:c|cee|see|sea|si)$/i.test(term))add('phonetic-resemblance');
 if(/^(?:cat|carbon|code|copper)$/i.test(term))add('hard-c');
 if(/^(?:city|cipher|cereal)$/i.test(term))add('soft-c');
 if(/^(?:ch|ck|sc)$/i.test(term))add('digraph-c');
 if(/[ↃƆɔϽ]/u.test(original))add('c-shaped-mirror');
 if(/[СсϹϲ]/u.test(original))add('cross-script-lookalikes');
 if(/[©Ⓒⓒ]/u.test(original))add('circled-c');
 if(/^(?:C|CC|CCC|CD|CM)$/.test(term))add('roman-numeral-c');
 if(/^(?:C|Carbon|Cu|Copper)$/i.test(term))add('chemical-symbol-c');
 if(/^(?:C|C\\+\\+|C#|C♯)$/i.test(term))add('computing-c');
 if(/^(?:Middle C|C4)$/i.test(term))add('musical-c');
 if(/^(?:Above C|Below C|The Middle C|Consciousnesses)$/i.test(term))add('author-middle-c');
 return {original,searchForm,routes,reviewRequired:routes.some(x=>[
  'phonetic-resemblance','c-shaped-mirror','cross-script-lookalikes',
  'circled-c','roman-numeral-c','chemical-symbol-c',
  'computing-c','musical-c','author-middle-c'
 ].includes(x))};
}
export function findCTitles(rows,query='',group=''){
 if(!Array.isArray(rows)||typeof query!=='string'||typeof group!=='string')throw new TypeError('Invalid query');
 const q=query.trim().toLocaleLowerCase();
 return rows.filter(r=>r&&typeof r.title==='string'&&(!group||r.group===group)&&(!q||r.title.toLocaleLowerCase().includes(q)));
}
