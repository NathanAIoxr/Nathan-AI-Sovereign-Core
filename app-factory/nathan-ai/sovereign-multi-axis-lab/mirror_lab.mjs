import {createHash} from 'node:crypto';
const sha256d=b=>createHash('sha256').update(createHash('sha256').update(b).digest()).digest();
const reverseBytes=b=>Buffer.from(b).reverse();
const invertBytes=b=>Buffer.from(b.map(x=>x^255));
const reverseBits=b=>Buffer.from(b.map(x=>Number(x.toString(2).padStart(8,'0').split('').reverse().join(''),2)));
export function views(input){const original=Buffer.from(input);const frames=[original,reverseBytes(original),invertBytes(original)];const transformations=[x=>x,reverseBytes,reverseBits];return frames.flatMap((f,i)=>transformations.map((t,j)=>({view:i*3+j+1,frame:i,transform:j,digest:sha256d(t(f)).toString('hex')})));}
export function analyze(header){if(!Buffer.isBuffer(header)||header.length!==80)throw Error('Bitcoin header must be 80 bytes');const results=views(header);return {schema:1,algorithm:'sha256d',views:results,uniqueDigests:new Set(results.map(x=>x.digest)).size,scope:'offline research only'};}
if(process.argv[1]?.endsWith('mirror_lab.mjs')){const b=Buffer.alloc(80);console.log(JSON.stringify(analyze(b),null,2));}
