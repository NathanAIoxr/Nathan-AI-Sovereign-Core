/** Nathan AI B-family discovery: read-only helpers, no owner-data bundled. */
export const B_REVIEW_KINDS=Object.freeze([
  'literal-b-prefix','the-b-title','repeated-letter','phonetic-english',
  'mirror-rotation','numeric-eight','sideways-eight','stacked-circles',
  'cross-script','string-reversal','binary-visual'
]);
export function reverseCharacters(value) {
  if (typeof value!=='string') throw new TypeError('Expected text');
  return Array.from(value).reverse().join('');
}
export function classifyB(value) {
  if(typeof value!=='string') throw new TypeError('Expected text');
  const term=value.normalize('NFKC');
  const routes=[];
  const add=(key)=>{if(!routes.includes(key)) routes.push(key);};
  if(/^b/i.test(term)) add('literal-b-prefix');
  if(/^the[\s_-]+b/i.test(term)) add('the-b-title');
  if(/^b{2,}$/i.test(term)) add('repeated-letter');
  if(/^(bee|be)$/i.test(term)) add('phonetic-english');
  if(/^[bdpq]$/i.test(term)) add('mirror-rotation');
  if(/8|\beight\b/i.test(term)) add('numeric-eight');
  if(/[∞♾]/u.test(term)) add('sideways-eight');
  // OO in ordinary text does NOT prove a vertical double-circle drawing.
  if(/[ΟОO]{2}/u.test(value)) add('stacked-circles');
  if(/[ΒβБбВвבب]/u.test(value)) add('cross-script');
  if(/^[01]+$/.test(term)) add('binary-visual');
  return {original:value,normalized:term,routes,review_required:routes.some(x=>['mirror-rotation','stacked-circles','cross-script','sideways-eight'].includes(x))};
}
export function bSearchRows(rows,query) {
  if(!Array.isArray(rows)) throw new TypeError('Expected array of source rows');
  if(typeof query!=='string') throw new TypeError('Expected text');
  const q=query.toLocaleLowerCase().trim();
  return rows.filter(x => x && typeof x.title==='string' && x.title.toLocaleLowerCase().includes(q));
}
