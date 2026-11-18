import { check, define, int, num, str, sum } from "../../../shared/core.ts";
function fields(v:unknown){check(v!==null&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length<=128,"Expected bounded record");return v as Record<string,unknown>;}
export const modules={
 "279":define("Reciprocal rank fusion of supplied rankings",{keyword:["a","b","c"],vector:["b","d","a"],k:60},p=>{
  const k=int(p.k,1,1000),score=new Map<string,number>();for(const list of [p.keyword,p.vector]){check(Array.isArray(list)&&list.length<=200,"Expected bounded ranking");[...new Set(list.map(x=>str(x,128)))].forEach((x,i)=>score.set(x,(score.get(x)??0)+1/(k+i+1)));}return [...score].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));
 }),
 "280":define("Paragraph-aware supplied text chunking",{text:"Opening paragraph.\n\nSecond paragraph.",limit:40},p=>{
  const limit=int(p.limit,16,2048),output:string[]=[];let buffer="";
  for(const paragraph of str(p.text).split(/\n\s*\n/).filter(Boolean))for(let offset=0;offset<paragraph.length;offset+=limit){
   const part=paragraph.slice(offset,offset+limit);if(buffer&&buffer.length+2+part.length>limit){output.push(buffer);buffer="";}buffer+=(buffer?"\n\n":"")+part;
  }if(buffer)output.push(buffer);return output;
 }),
 "281":define("Pure planner–executor–verifier state transition",{state:"planning",event:"plan-valid"},p=>{const state=str(p.state,30),event=str(p.event,30);const transitions:Record<string,string>={"planning/plan-valid":"executing","executing/result-ready":"verifying","verifying/pass":"complete","verifying/fail":"rejected"};return {state:transitions[state+"/"+event]??state};}),
 "282":define("Strict typed object field validation",{record:{count:2,label:"catalog"},required:{count:"number",label:"string"}},p=>{
  const data=fields(p.record),schema=fields(p.required);const errors=[];
  for(const [k,t] of Object.entries(schema)){check(["boolean","number","string"].includes(String(t)),"Unsupported type");if(!Object.hasOwn(data,k)||typeof data[k]!==t)errors.push(k);}
  for(const k of Object.keys(data))if(!Object.hasOwn(schema,k))errors.push(k);return {valid:!errors.length,fieldsWithErrors:errors};
 }),
 "283":define("Basic prompt leak screening without echo",{text:"Contact demo@example.org"},p=>{const text=str(p.text);return {emailLike:/\b[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}\b/.test(text),credentialLike:/\b(?:api[_ -]?key|password|token)\s*[:=]\s*\S+/i.test(text),paymentLike:/\b(?:\d[ -]?){13,19}\b/.test(text)};}),
 "284":define("Versioned literal prompt template preview",{template:"Find {{subject}}",values:{subject:"Greek tablets"},version:3},p=>{
  const fields_=fields(p.values);return {version:int(p.version,1,1e9),preview:str(p.template,2000).replace(/\{\{([a-zA-Z][\w-]{0,63})\}\}/g,(_,k)=>{check(Object.hasOwn(fields_,k),"Missing template field");return str(fields_[k],512);})};
 }),
 "286":define("Retention dry-run candidate selection",{nowDay:120,ageDays:90,records:[{id:"a",day:1},{id:"b",day:110}]},p=>{
  check(Array.isArray(p.records)&&p.records.length<=256,"Expected fixture records");const cutoff=int(p.nowDay,0,1e8)-int(p.ageDays,1,1e8);
  return p.records.flatMap(x=>int(x.day,0,1e8)<cutoff?[str(x.id,48)]:[]);
 }),
 "287":define("Currency and supplied tax-rate arithmetic",{amountCents:10000,unitsPerBase:1.2,taxRate:.1},p=>{const net=Math.round(int(p.amountCents,0,1e8)*num(p.unitsPerBase,.000001,1000));const tax=Math.round(net*num(p.taxRate,0,1));return {netCents:net,taxCents:tax,totalCents:net+tax};}),
 "288":define("Invoice integer-cent line subtotal",{lines:[{units:5,priceCents:400},{units:1,priceCents:1000}],discountCents:500},p=>{
  check(Array.isArray(p.lines)&&p.lines.length<=128,"Expected line items");const subtotal=sum(p.lines.map(x=>int(x.units,0,1e6)*int(x.priceCents,0,1e8)));
  const discount=int(p.discountCents,0,Math.min(subtotal,1e8));return {subtotal,discount,total:subtotal-discount};
 }),
 "291":define("Support SLA elapsed time assessment",{opened:10,now:40,slaMinutes:25},p=>{const opened=int(p.opened,0,1e10),elapsed=int(p.now,opened,1e10)-opened,sla=int(p.slaMinutes,1,1e6);return {elapsed,remaining:Math.max(0,sla-elapsed),breached:elapsed>=sla};}),
 "292":define("Conventional commit release-notes grouping",{subjects:["feat: catalog lookup","fix(parser): handle empty string","docs: setup"]},p=>{
  check(Array.isArray(p.subjects)&&p.subjects.length<=128,"Expected commit subjects");const output=new Map<string,string[]>();
  for(const item of p.subjects){const s=str(item,256),m=/^(feat|fix|docs|perf|refactor)(?:\([\w-]+\))?!?:\s*(.+)$/.exec(s);if(m)output.set(m[1],[...(output.get(m[1])??[]),m[2]]);}return Object.fromEntries(output);
 }),
 "294":define("Environment key-set diff without values",{staging:["APP_VERSION","DATABASE"],production:["APP_VERSION"]},p=>{
  const set=(v:unknown)=>{check(Array.isArray(v)&&v.length<=128,"Expected environment key names");return new Set(v.map(x=>{const name=str(x,80);check(/^[A-Z][A-Z0-9_]*$/.test(name),"Expected key name, not a value");return name;}));};
  const a=set(p.staging),b=set(p.production);return {stagingOnly:[...a].filter(x=>!b.has(x)),productionOnly:[...b].filter(x=>!a.has(x))};
 }),
 "295":define("Certificate-expiry alert from supplied dates",{nowDay:100,expiryDay:111},p=>{const days=int(p.expiryDay,0,1e8)-int(p.nowDay,0,1e8);return {days,band:days<0?"expired":days<=3?"3d":days<=14?"14d":days<=30?"30d":"none"};}),
 "296":define("Synthetic probe availability rollup",{probes:[{ok:true},{ok:false},{ok:true}]},p=>{
  check(Array.isArray(p.probes)&&p.probes.length>0&&p.probes.length<=256&&p.probes.every(x=>typeof x.ok==="boolean"),"Expected probe results");
  const available=p.probes.filter(x=>x.ok).length;return {checks:p.probes.length,available,ratio:available/p.probes.length};
 }),
 "298":define("Structured CSV dry-run rows",{rows:[["id","title"],["1","A"],["2"]]},p=>{
  check(Array.isArray(p.rows)&&p.rows.length>=1&&p.rows.length<=256&&p.rows.every(Array.isArray),"Expected parsed CSV rows");const n=p.rows[0].length;check(n>0&&n<=64,"Invalid columns");return {columns:n,rows:p.rows.length-1,invalidRows:p.rows.flatMap((r,i)=>r.length===n?[]:[i+1])};
 })
};
