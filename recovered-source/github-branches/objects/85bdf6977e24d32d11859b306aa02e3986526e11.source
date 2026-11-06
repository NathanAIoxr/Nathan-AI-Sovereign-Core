/* DATA ATAD × NATHAN AI — local deterministic core.
   Original text stays immutable; transformations are derived data.
   Not sentient, not a model inference service. */
export const VERSION = '0.1.0';
export const CANON = Object.freeze({creator:'Nathan Tabor',pipeline:['NATHAN AI','TABOR ROOT','TABOR 1-2-3 FACTORY','ONE APP'],build:'1+1=2',clear:'1-1=0'});
export function build(a=1,b=1) {
  if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!Number.isSafeInteger(a+b)) throw new TypeError('Safe integers required');
  return a+b;
}
export function clear(x=1) {if(x!==1) throw new TypeError('Expected 1');return x-x;}
export function binary(text) {return [...new TextEncoder().encode(String(text))].map(b=>b.toString(2).padStart(8,'0')).join(' ');}
export function reverse(text,locale='en') {
 const str=String(text);
 if(Intl.Segmenter) return [...new Intl.Segmenter(locale,{granularity:'grapheme'}).segment(str)].map(x=>x.segment).reverse().join('');
 return [...str].reverse().join('');
}
export function soundUnits(text) {return String(text).normalize('NFC').trim().split(/\s+/u).filter(Boolean);}
export function initials(text){return soundUnits(text).map(x=>[...x][0]).join('');}
export async function sha256(text) {
 if(!globalThis.crypto?.subtle) return null;
 const data=new TextEncoder().encode(String(text));
 const d=await crypto.subtle.digest('SHA-256',data);
 return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function analyze(text,language='und'){
 const original=String(text);
 const jobs=[
  Promise.resolve({original,normalized:original.normalize('NFC'),language,soundUnits:soundUnits(original)}),
  Promise.resolve({utf8:binary(original),bytes:new TextEncoder().encode(original).length}),
  Promise.resolve({ltr:original,rtl:reverse(original),initials:initials(original)}),
  sha256(original).then(hash=>({sha256:hash,verified:hash!==null}))
 ];
 const outputs=await Promise.allSettled(jobs);
 const keys=['language','binary','mirror','provenance'];
 return {schema:'data-atad.v1',version:VERSION,original,acousticsMeasured:false,
  lanes:Object.fromEntries(outputs.map((o,i)=>[keys[i],o.status==='fulfilled'?o.value:{error:'unavailable'}]))};
}
export function respond(message){
 const s=String(message).trim();
 if(!s) return 'Enter an original phrase or a command.';
 if(/^(help|commands)$/i.test(s)) return 'Commands: build, clear, reverse TEXT, binary TEXT, analyze TEXT. The Phonics Lab stores author-defined spelling and feedback.';
 if(/^(build|1\s*\+\s*1)$/i.test(s)) return 'BUILD: 1 + 1 = '+build(1,1);
 if(/^(clear|1\s*[-−]\s*1)$/i.test(s)) return 'CLEAR: 1 − 1 = '+clear(1)+' (does not erase archives)';
 const r=s.match(/^reverse\s+([\s\S]+)/i);if(r)return 'RTL: '+reverse(r[1]);
 const b=s.match(/^binary\s+([\s\S]+)/i);if(b)return 'UTF-8: '+binary(b[1]);
 const a=s.match(/^analy[sz]e\s+([\s\S]+)/i);if(a)return 'Original: '+a[1]+'\nUnits: '+soundUnits(a[1]).join(' / ')+'\nMirror: '+reverse(a[1]);
 return 'Original preserved: '+s+'\nTry analyze, reverse, binary, BUILD, or CLEAR. No fabricated model answer.';
}
