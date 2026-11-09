/* Nathan AI 🚀 / EYES — ancient arithmetic roots
 * Additive independent implementation. Mathematical comparisons are NOT claims of direct historical transmission.
 * Nonnegative bounded integer arithmetic only; browser / CommonJS compatible. */
(function(root,factory){'use strict';const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.NathanArithmeticRoots=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const requireInt=(n,label='number')=>{if(!Number.isSafeInteger(n)||n<0||n>1e9)throw new RangeError(label+' must be an integer in 0..1e9');return n};
const bit=(n,i)=>(Math.floor(n/2**i)%2);
function egyptianMultiply(a,b){requireInt(a,'a');requireInt(b,'b');let result=0,rows=[];for(let p=1,x=a;p<=b;p*=2,x*=2){const selected=Math.floor(b/p)%2===1;if(selected)result+=x;rows.push({power:p,multiple:x,selected});}if(!Number.isSafeInteger(result))throw new RangeError('Product exceeds safe integer range');return {result,rows};}
function pingalaNashta(index,length){if(!Number.isSafeInteger(length)||length<1||length>20)throw new RangeError('Length 1..20');if(!Number.isInteger(index)||index<1||index>2**length)throw new RangeError('Index 1..2^length');let n=index,pattern='';for(let i=0;i<length;i++){if(n%2){pattern+='0';n=(n+1)/2;}else{pattern+='1';n/=2;}}return pattern;}
function pingalaUddishta(pattern){if(typeof pattern!=='string'||!/^[01]{1,20}$/.test(pattern))throw new RangeError('One to twenty binary line symbols required');let index=1;for(const b of [...pattern].reverse())index=index*2-(b==='0'?1:0);return index;}
const BACON_ALPHABET='ABCDEFGHIKLMNOPQRSTUWXYZ';
function baconEncode(text){return [...String(text).toUpperCase().replaceAll('J','I').replaceAll('V','U')].filter(c=>BACON_ALPHABET.includes(c)).map(c=>{let n=BACON_ALPHABET.indexOf(c);return Array.from({length:5},(_,i)=>bit(n,4-i)?'b':'a').join('');}).join(' ');}
function baconDecode(text){return String(text).toLowerCase().split(/\s+/).filter(Boolean).map(w=>{if(!/^[ab]{5}$/.test(w))throw new RangeError('Bacon groups must be 5 a/b letters');const n=parseInt(w.replaceAll('a','0').replaceAll('b','1'),2);if(n>=24)throw new RangeError('Unused Bacon code');return BACON_ALPHABET[n];}).join('');}
function toNapier(n){requireInt(n);if(n===0)return '';let letters='';for(let i=0;n>0;i++,n=Math.floor(n/2)){if(n%2)letters+=String.fromCharCode(97+i);}return letters;}
function fromNapier(code){if(typeof code!=='string'||!/^[a-z]*$/i.test(code))throw new RangeError('Location letters a-z required');let result=0;for(const c of new Set(code.toLowerCase()))result+=2**(c.charCodeAt(0)-97);if(!Number.isSafeInteger(result))throw new RangeError('Out of range');return result;}
function napierMultiply(a,b){return toNapier(fromNapier(a)*fromNapier(b));}
function leibnizBinary(n){return requireInt(n).toString(2);}
function leibnizAdd(a,b){if(!/^[01]+$/.test(a)||!/^[01]+$/.test(b)||a.length>40||b.length>40)throw new RangeError('Binary strings up to 40 digits');let i=a.length-1,j=b.length-1,carry=0,out='';while(i>=0||j>=0||carry){const sum=(i>=0?+a[i--]:0)+(j>=0?+b[j--]:0)+carry;out=String(sum%2)+out;carry=Math.floor(sum/2);}return out.replace(/^0+(?=.)/,'');}
function booleNot(x){binary(x);return 1-x;}
function binary(v){if(v!==0&&v!==1)throw new RangeError('Binary input 0 or 1 required');}
function booleAnd(x,y){binary(x);binary(y);return x*y;}
function booleOr(x,y){binary(x);binary(y);return x+y-x*y;}
function booleXor(x,y){binary(x);binary(y);return x+y-2*x*y;}
function sexagesimalEncode(n){requireInt(n);if(n===0)return [0];let v=n,d=[];while(v){d.unshift(v%60);v=Math.floor(v/60);}return d;}
function sexagesimalDecode(digits){if(!Array.isArray(digits)||digits.length<1||digits.length>7||!digits.every(x=>Number.isInteger(x)&&x>=0&&x<60))throw new RangeError('Base-60 digits 0..59 required');let n=0;for(const digit of digits){n=n*60+digit;if(!Number.isSafeInteger(n)||n>1e9)throw new RangeError('Too large');}return n;}
function reciprocalRegular(n){requireInt(n);if(!n)throw new RangeError('Nonzero divisor required');let d=n;for(const p of [2,3,5])while(d%p===0)d/=p;return {divisor:n,terminatesInBase60:d===1};}
function egyptianUnitFractions(numerator,denominator){requireInt(numerator);requireInt(denominator);if(!denominator)throw new RangeError('Denominator required');let n=numerator,d=denominator,whole=Math.floor(n/d),terms=[];n=n%d;for(let i=0;n&&i<20;i++){const unit=Math.ceil(d/n);terms.push(unit);n=n*unit-d;d*=unit;const g=gcd(n,d);n/=g;d/=g;if(!Number.isSafeInteger(d))throw new RangeError('Precision overflow');}if(n)throw new RangeError('Decomposition exceeds limit');return {whole,denominators:terms};}
function gcd(a,b){while(b){[a,b]=[b,a%b]}return a;}
function euclidGcd(a,b){requireInt(a);requireInt(b);const steps=[];while(b){steps.push({a,b,remainder:a%b});[a,b]=[b,a%b];}return {gcd:a,steps};}
function iChingState(lower,upper){if(!Number.isInteger(lower)||lower<0||lower>7||!Number.isInteger(upper)||upper<0||upper>7)throw new RangeError('trigram values 0..7');return lower+(upper<<3);}
function iChingChange(state,mask){if(!Number.isInteger(state)||!Number.isInteger(mask)||state<0||state>63||mask<0||mask>63)throw new RangeError('6-bit values');return state^mask;}
const COMPARISON=Object.freeze([
 {id:'sumer',label:'Sumerian / Neo-Sumerian',system:'Early metrology and base-60 place-value precursors',radix:60,kind:'positional & tables',connection:'Place value, grouped counting, standardized calculation',limit:'Not a binary-computer architecture'},
 {id:'babylon',label:'Old Babylonian',system:'Sexagesimal place value and reciprocal tables',radix:60,kind:'positional',connection:'Numerical encoding, lookup tables, repeated arithmetic',limit:'Base 60, not base 2'},
 {id:'egypt',label:'Ancient Egyptian',system:'Repeated doubling and sums of unit fractions',radix:10,kind:'doubling / additive',connection:'Doubling selects powers of two in multiplication',limit:'Written notation remained largely decimal and non-positional'},
 {id:'indian',label:'Pingala / Sanskrit prosody',system:'Two syllable lengths; enumerated poetic meters',radix:2,kind:'combinatorial',connection:'Two-state strings and reversible index mapping',limit:'Poetic prosody, not electronic instructions'},
 {id:'chinese',label:'I Ching and Fu Xi ordering',system:'Broken / unbroken lines; 64 hexagrams',radix:2,kind:'combinatorial',connection:'Six binary-state positions',limit:'Not itself a CPU or predictive physical law'},
 {id:'greek',label:'Greek / Euclid',system:'Euclidean remainder algorithm',radix:10,kind:'algorithmic',connection:'Finite deterministic procedure independent of notation',limit:'Not evidence of a binary encoding tradition'},
 {id:'bacon',label:'Francis Bacon (1605/1623)',system:'Biliteral cipher, 24-letter alphabet',radix:2,kind:'encoding',connection:'Five two-state symbols encode a letter',limit:'This code is a cipher, not general arithmetic'},
 {id:'napier',label:'John Napier (1617)',system:'Location arithmetic and chessboard calculator',radix:2,kind:'arithmetic',connection:'Powers of two represented by letter positions',limit:'Not identical to modern CPUs'},
 {id:'leibniz',label:'Leibniz (1679/1703)',system:'Base-two positional arithmetic',radix:2,kind:'arithmetic',connection:'Formal carry and binary notation',limit:'Leibniz developed this before seeing the Fu Xi diagram'},
 {id:'boole',label:'George Boole (1847/1854)',system:'Algebra of logical states',radix:2,kind:'logic',connection:'AND, OR, NOT, XOR truth operations',limit:'Hardware implementation came later'}
]);
function verify(){let transitions=0;for(let i=0;i<64;i++)for(let j=0;j<64;j++){if(iChingChange(i,j)!==(i^j))throw Error('XOR failure');transitions++;}let pingala=0;for(let n=1;n<=256;n++)if(pingalaUddishta(pingalaNashta(n,8))===n)pingala++;for(let n=0;n<=250;n++){if(fromNapier(toNapier(n))!==n)throw Error('Napier failure');if(sexagesimalDecode(sexagesimalEncode(n))!==n)throw Error('Base60 failure');}return {hexagrams:64,transitions,pingalaRoundTrips:pingala,napierRoundTrips:251,base60RoundTrips:251,egyptian13x12:egyptianMultiply(13,12).result,baconCODE:baconEncode('CODE'),leibniz13plus19:leibnizAdd('1101','10011')};}
return Object.freeze({COMPARISON,egyptianMultiply,pingalaNashta,pingalaUddishta,baconEncode,baconDecode,toNapier,fromNapier,napierMultiply,leibnizBinary,leibnizAdd,booleNot,booleAnd,booleOr,booleXor,sexagesimalEncode,sexagesimalDecode,reciprocalRegular,egyptianUnitFractions,euclidGcd,iChingState,iChingChange,verify});
});
