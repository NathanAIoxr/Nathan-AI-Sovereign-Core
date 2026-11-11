(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.NathanBinaryAnchor=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TEXT='1+1=2\n1-1=0';
  const ID='nathan.arithmetic-anchor.v1';
  const SHA256='cf981eac09ffd28cdaea010d43bf46a4d9dcf21ace8808bf4fa33ac41a51deab';
  function bits(text){return Array.from(new TextEncoder().encode(text),b=>b.toString(2).padStart(8,'0')).join(' ');}
  const ANCHOR=Object.freeze({id:ID,schema_version:'1.0.0',text:TEXT,encoding:'UTF-8',byte_length:11,bit_length:88,binary:bits(TEXT),sha256:SHA256,build:'1+1=2',clear:'1-1=0',domain:'nonnegative whole integers'});
  function natural(value){
    if(typeof value==='bigint'){if(value>=0n)return value;}
    else if(typeof value==='number'){if(Number.isSafeInteger(value)&&value>=0)return BigInt(value);}
    else if(typeof value==='string'&&/^(0|[1-9][0-9]*)$/.test(value))return BigInt(value);
    throw new TypeError('Use a nonnegative whole integer; large values must be decimal strings or BigInt.');
  }
  function calculate(operation,left,right){
    const a=natural(left),b=natural(right);let answer;
    if(operation==='build')answer=a+b;
    else if(operation==='clear'){if(b>a)throw new RangeError('CLEAR cannot produce a negative value.');answer=a-b;}
    else throw new TypeError('Operation must be build or clear.');
    return Object.freeze({operation,left:a.toString(),right:b.toString(),value:answer.toString(),binary:answer.toString(2),anchor_ref:ID});
  }
  function validate(candidate){
    if(!candidate||typeof candidate!=='object')throw new TypeError('Missing binary anchor.');
    for(const key of Object.keys(ANCHOR))if(candidate[key]!==ANCHOR[key])throw new Error('Binary anchor mismatch: '+key);
    if(calculate('build',1,1).value!=='2'||calculate('clear',1,1).value!=='0')throw new Error('Arithmetic invariant failed.');
    return true;
  }
  async function verify(candidate=ANCHOR,subtle=globalThis.crypto&&globalThis.crypto.subtle){
    validate(candidate);
    if(!subtle)throw new Error('SHA-256 verification requires Web Crypto.');
    const digest=await subtle.digest('SHA-256',new TextEncoder().encode(candidate.text));
    const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    if(actual!==SHA256)throw new Error('Binary anchor SHA-256 mismatch.');
    return Object.freeze({ok:true,id:ID,sha256:actual,byte_length:11,bit_length:88});
  }
  return Object.freeze({ANCHOR,bits,calculate,validate,verify});
});
