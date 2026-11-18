import { check, define, int, str } from "../../../shared/core.ts";
export const modules={
 "265":define("Edge context projection from fixture headers",{country:"US",timezone:"America/New_York",asn:13335},p=>({country:str(p.country,2).toUpperCase(),timezone:str(p.timezone,80),asn:int(p.asn,0,0xffffffff)})),
 "266":define("Exact-origin CORS decision",{origin:"https://example.org",allow:["https://example.org"],method:"GET"},p=>{
  const origin=str(p.origin,250),method=str(p.method,12);check(Array.isArray(p.allow)&&p.allow.length<=64,"Expected origin allowlist");
  const allowed=["GET","HEAD","POST","PUT","PATCH","DELETE"].includes(method)&&p.allow.some(x=>str(x,250)===origin);return {allowed,vary:"Origin",allowOrigin:allowed?origin:null};
 }),
 "267":define("Allowed compression negotiation",{header:"gzip;q=0.8, br;q=1"},p=>{
  const enc=["br","zstd","gzip","identity"];const accepted=new Map<string,number>();
  for(const value of str(p.header,512).split(",")){const [name,param]=value.trim().split(";");if(name){const m=param?.match(/^\s*q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/);accepted.set(name.toLowerCase(),param?(m?Number(m[1]):0):1);}}
  const choices=enc.map(name=>({name,q:accepted.get(name)??(name==="identity"?(accepted.get("*")===0?0:1):accepted.get("*")??0)})).filter(x=>x.q>0).sort((a,b)=>b.q-a.q);
  return {encoding:choices[0]?.name??null};
 }),
 "270":define("Sample v1 to v2 field transformer",{version:1,book_title:"Example",book_id:"demo"},p=>{check(p.version===1,"Expected v1 example schema");return {version:2,book:{id:str(p.book_id,100),title:str(p.book_title,200)}};}),
 "272":define("Bounded Retry-After backpressure policy",{pending:40,capacity:32,drainPerSecond:4},p=>{const n=int(p.pending,0,1e6),c=int(p.capacity,1,1e6),r=int(p.drainPerSecond,1,1e6);return {status:n>=c?429:200,retryAfter:n>=c?Math.min(300,Math.ceil((n-c+1)/r)):null};}),
 "273":define("Event-to-topic recipient plan",{event:"file.created",subscriptions:[{id:"archive",topic:"file.created"},{id:"other",topic:"book.created"}]},p=>{
  const e=str(p.event,64);check(Array.isArray(p.subscriptions)&&p.subscriptions.length<=128,"Expected bounded subscriptions");return [...new Set(p.subscriptions.filter(x=>str(x.topic,64)===e).map(x=>str(x.id,64)))];
 }),
 "274":define("Deterministic A/B bucket for opaque identifier",{key:"anonymous-demo",percentB:30},p=>{const w=int(p.percentB,0,100);let h=2166136261;for(const v of str(p.key,256))h=Math.imul(h^v.codePointAt(0)!,16777619);return (h>>>0)%100<w?"B":"A";}),
 "275":define("Offline IPv4 CIDR allowlist evaluation",{address:"192.0.2.42",cidr:"192.0.2.0/24"},p=>{
  const v4=(x:string)=>{const a=x.split(".");check(a.length===4&&a.every(v=>/^\d{1,3}$/.test(v)&&Number(v)<256),"Expected IPv4 dotted decimal");return a.reduce((n,v)=>(n*256+Number(v))>>>0,0);};
  const [net,prefix,...rest]=str(p.cidr,24).split("/");check(prefix!==undefined&&/^\d{1,2}$/.test(prefix)&&!rest.length,"Expected IPv4 CIDR");const n=int(Number(prefix),0,32);
  const a=v4(str(p.address,15)),b=v4(net),mask=n===0?0:0xffffffff<<(32-n);return {allowed:(a&mask)===(b&mask)};
 })
};
