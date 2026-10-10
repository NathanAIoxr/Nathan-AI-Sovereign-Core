/* TABOR RADIX LADDER v1: arithmetic and transport status are SEPARATE domains.
 * Each digit is a sovereign token, never an authority credential.
 * Base 0 is a connection state, not a number base.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaborRadix=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SYMBOLS='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*';
const RADIXES=Object.freeze([1,2,3,4,5,6,7,8,9,10,12,13,17,21,33,69]);
const MAX_UNARY=10000;
function validateRadix(radix){if(!Number.isInteger(radix)||radix<1||radix>69)throw RangeError(radix===0?'Base 0 is DISCONNECTED status, not positional notation.':'Radix must be integer 1–69');}
function digits(radix){validateRadix(radix);if(radix===1)return ['1'];return Array.from({length:radix},(_,i)=>radix===12&&i===10?'↊':radix===12&&i===11?'↋':SYMBOLS[i]);}
function integer(value){if(typeof value==='bigint')return value;if(typeof value==='number'&&Number.isSafeInteger(value))return BigInt(value);if(typeof value==='string'&&/^-?(0|[1-9][0-9]*)$/.test(value))return BigInt(value);throw TypeError('Expected exact signed integer string, BigInt or safe integer number');}
function encode(value,radix){validateRadix(radix);let n=integer(value);const neg=n<0n;if(neg)n=-n;if(radix===1){if(n>BigInt(MAX_UNARY))throw RangeError('Unary output limited to 10000 marks');return neg?'-'+'1'.repeat(Number(n)):'1'.repeat(Number(n))||'0';}if(n===0n)return'0';const syms=digits(radix);const b=BigInt(radix),out=[];while(n>0n){out.push(syms[Number(n%b)]);n/=b;}return(neg?'-':'')+out.reverse().join('');}
function decode(value,radix){validateRadix(radix);if(typeof value!=='string'||!value)throw TypeError('Nonempty encoded string required');const neg=value[0]==='-';const text=neg?value.slice(1):value;if(!text||text==='-')throw Error('No digits');if(radix===1){if(text==='0')return 0n;if(text.length>MAX_UNARY||!/^(1+)$/.test(text))throw Error('Bad unary representation');return(BigInt(text.length)*(neg?-1n:1n));}if(text==='0')return 0n;const syms=digits(radix);const map=new Map(syms.map((s,i)=>[s,BigInt(i)]));let n=0n;for(const digit of [...text]){if(!map.has(digit))throw Error('Invalid digit '+digit+' for base '+radix);n=n*BigInt(radix)+map.get(digit);}return neg?-n:n;}
function encodeTable(value,radixes=RADIXES){return radixes.map(base=>({base,encoded:encode(value,base)}));}
function convert(value,sourceBase,targetBase){return encode(decode(value,sourceBase),targetBase);}
function boxTokens(text,radix){const value=decode(text,radix);return [...text].map((symbol,i)=>({id:'DIGIT-'+String(i+1).padStart(4,'0'),symbol,index:i,place:Math.max(0,[...text].length-i-1),negativeSign:symbol==='-',value:value.toString(10)}));}
function connector(status,permission){const connected=status==='connected';const approved=permission===true;return Object.freeze({status:connected?'connected':'disconnected',canSend:connected&&approved,reason:!connected?'Disconnected: outbound operation denied.':!approved?'Unapproved: outbound operation denied.':'Simulation reports permission; real outbound access requires backend enforcement.'});}
return Object.freeze({SYMBOLS,RADIXES,digits,encode,decode,encodeTable,convert,boxTokens,connector});
});