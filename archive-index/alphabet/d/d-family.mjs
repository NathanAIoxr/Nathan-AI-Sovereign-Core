/** Nathan AI D-family. Read-only discovery; does not rewrite originals. */
export const D_ROUTE_IDS=Object.freeze([
  'd-prefix','the-d-title','numbered-d-title','dd-ddd','dick-family',
  'd0g-dog','phonetic-dee','mirror-capital-D','lowercase-d-inversions',
  'side-rotation-bowl','latin-d-diacritic','cross-script-d',
  'word-reversal','atbash','rot13','numeric-encodings',
  'creator-acronym-inversions','kjv-game-of-life','d-imagery-and-dimensions'
]);
export function reverseCodePoints(text){
 if(typeof text!=='string')throw new TypeError('Expected text');
 return Array.from(text).reverse().join('');
}
export function asciiAtbash(text){
 if(typeof text!=='string')throw new TypeError('Expected text');
 return text.replace(/[a-z]/gi,char=>{
   const code=char.charCodeAt(0),base=code>=97?97:65;
   return String.fromCharCode(base+25-(code-base));
 });
}
export function asciiRot13(text){
 if(typeof text!=='string')throw new TypeError('Expected text');
 return text.replace(/[a-z]/gi,char=>{
   const code=char.charCodeAt(0),base=code>=97?97:65;
   return String.fromCharCode(base+(code-base+13)%26);
 });
}
export function classifyD(value){
 if(typeof value!=='string')throw new TypeError('Expected text');
 const original=value,term=value.trim(),routes=[];
 const add=id=>{if(!routes.includes(id))routes.push(id);};
 if(/^d/i.test(term))add('d-prefix');
 if(/^the[ _-]+d/i.test(term))add('the-d-title');
 if(/^\d+[ _-]+d/i.test(term))add('numbered-d-title');
 if(/^(?:d{2,}|d\.d\.(?:d\.)?)$/i.test(term))add('dd-ddd');
 if(/\bdick(?:s|head)?\b/i.test(term)||/\bdick\s+tater\b/i.test(term))add('dick-family');
 if(/\bd0g\b|\bdog\b/i.test(term))add('d0g-dog');
 if(/^(?:d|dee|di)$/i.test(term))add('phonetic-dee');
 if(/[ᗡꓷ]/u.test(term))add('mirror-capital-D');
 if(/^[bdpq]$/.test(term))add('lowercase-d-inversions');
 if(/^(?:Ð|ð|Đ|đ|Ḍ|ḍ|Ḏ|ḏ|Ɖ|ɖ)$/.test(term))add('latin-d-diacritic');
 if(/[ΔδДдדدद]/u.test(term))add('cross-script-d');
 if(/^(?:D|d|DD|dd|DDD|ddd)$/.test(term))add('numeric-encodings');
 if(/D\.U\.M\.M\.I\.E\.|D\.U\.M\.B\.|S\.M\.A\.R\.T\.|Devil the DDD/i.test(term))add('creator-acronym-inversions');
 if(/Dungeons and Dragons|Game of Life — KJV|Daniel|dragon|deliverance/i.test(term))add('kjv-game-of-life');
 if(/Dante|Demiurge|Dimension|Divine|Darkness|D0G/i.test(term))add('d-imagery-and-dimensions');
 return {original,routes,reviewRequired:routes.some(x=>[
 'phonetic-dee','mirror-capital-D','lowercase-d-inversions',
 'latin-d-diacritic','cross-script-d','creator-acronym-inversions',
 'kjv-game-of-life','d-imagery-and-dimensions'
 ].includes(x))};
}
export function filterDTitles(rows,{query='',family=''}={}){
 if(!Array.isArray(rows)||typeof query!=='string'||typeof family!=='string')throw new TypeError('Invalid filter input');
 const q=query.trim().toLocaleLowerCase();
 return rows.filter(r=>r&&typeof r.title==='string'&&(!family||r.group===family)&&(!q||r.title.toLocaleLowerCase().includes(q)));
}
