/** Nathan AI E / 3 / M / W creator-defined glyph family. Read-only. */
export const ORIGINAL_WORDS="do E's, which could also be 3, M, W - E is made of 2 sticks with one stick broke into 3 parts - 3 is 2 sticks fused together and bent - M and W are each 4 sticks -";
export const ROUTES=Object.freeze(['e-prefix','the-e-prefix','ee-eee','letter-e','number-3','stick-geometry','m-w-rotation','cross-script-homoglyph','e-diacritics','phonetic-e','reverse-codepoints','latin-atbash','latin-rot13','authored-sequences','original-source-catalog']);
export const GLYPHS=Object.freeze({
 E:Object.freeze({originalSticks:2,visibleStraightSegments:4,svg:'M1 1 V9 M1 1 H8 M1 5 H7 M1 9 H8',description:'One whole stick, plus a second stick broken into three horizontal parts.'}),
 '3':Object.freeze({originalSticks:2,visibleStraightSegments:null,svg:'M2 1 C10 -1 11 4 5 5 M5 5 C11 6 10 11 2 9',description:'Two sticks fused and bent.'}),
 M:Object.freeze({originalSticks:4,visibleStraightSegments:4,svg:'M1 9 L1 1 L5 6 L9 1 L9 9',description:'Four joined straight sticks.'}),
 W:Object.freeze({originalSticks:4,visibleStraightSegments:4,svg:'M1 1 L1 9 L5 4 L9 9 L9 1',description:'Four joined straight sticks.'})
});
export function glyphInfo(g){return Object.hasOwn(GLYPHS,g)?{glyph:g,...GLYPHS[g]}:null;}
export function reverseCodepoints(s){if(typeof s!=='string')throw new TypeError('Text required');return Array.from(s).reverse().join('');}
export function atbash(s){if(typeof s!=='string')throw new TypeError('Text required');return s.replace(/[A-Za-z]/g,c=>{const b=c>='a'?97:65;return String.fromCharCode(b+25-(c.charCodeAt(0)-b));});}
export function rot13(s){if(typeof s!=='string')throw new TypeError('Text required');return s.replace(/[A-Za-z]/g,c=>{const b=c>='a'?97:65;return String.fromCharCode(b+(c.charCodeAt(0)-b+13)%26);});}
export function inspect(value){if(typeof value!=='string')throw new TypeError('Text required');const q=value.trim(),routes=[];
 const add=r=>{if(!routes.includes(r))routes.push(r)};
 if(/^e/i.test(q))add('e-prefix');
 if(/^the[ _-]+e/i.test(q))add('the-e-prefix');
 if(/^e{2,}$/i.test(q))add('ee-eee');
 if(/^[eE]$/.test(q))add('letter-e');
 if(q==='3')add('number-3');
 if(Object.hasOwn(GLYPHS,q))add('stick-geometry');
 if(/^[MW]$/.test(q))add('m-w-rotation');
 if(/[ΕεЕеЗз]/u.test(q))add('cross-script-homoglyph');
 if(/[ÉÈÊËĒĔĖĘĚéèêëēĕėęě]/u.test(q))add('e-diacritics');
 if(/^(?:e|ee|eee|three|em|double-u|w)$/i.test(q))add('phonetic-e');
 return {original:value,routes,reversed:reverseCodepoints(value),atbash:atbash(value),rot13:rot13(value),glyph:glyphInfo(q),requiresInterpretiveReview:routes.some(r=>['stick-geometry','cross-script-homoglyph','phonetic-e','m-w-rotation'].includes(r))};
}
export function searchTitles(rows,query='',limit=500){if(!Array.isArray(rows)||typeof query!=='string'||!Number.isInteger(limit)||limit<1)throw new TypeError('Invalid search arguments');const q=query.toLocaleLowerCase().trim();return rows.filter(r=>r&&typeof r.title==='string'&&r.title.toLocaleLowerCase().includes(q)).slice(0,limit);}
