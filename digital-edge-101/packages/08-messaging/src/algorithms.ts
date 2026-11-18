import { check, define, int, str } from "../../../shared/core.ts";
export const modules={
 "203": define("Folder flag change plan",{before:{a:["read"]},after:{a:["read","archived"],b:["read"]}},p=>{
  const read=(v:unknown)=>{check(v&&typeof v==="object"&&!Array.isArray(v),"Expected message flag map");const es=Object.entries(v);check(es.length<=128,"Too many messages");return new Map(es.map(([id,flags])=>{check(Array.isArray(flags)&&flags.length<=16,"Invalid flags");return [id,[...new Set(flags.map(x=>str(x,48)))].sort()];}));};
  const a=read(p.before),b=read(p.after);return [...new Set([...a.keys(),...b.keys()])].sort().flatMap(id=>JSON.stringify(a.get(id))===JSON.stringify(b.get(id))?[]:[{id,flags:b.get(id)??null}]);
 }),
 "204": define("Thread parent resolution",{messages:[{id:"a"},{id:"b",replyTo:"a"},{id:"c",references:["a","b"]}]},p=>{
  check(Array.isArray(p.messages)&&p.messages.length<=128,"Expected up to 128 messages");const known=new Set(p.messages.map(row=>str(row.id,256)));
  return p.messages.map(row=>{const refs=row.references??[];check(Array.isArray(refs)&&refs.length<=32,"Invalid references");const parent=[row.replyTo,...[...refs].reverse()].find(x=>typeof x==="string"&&x!==row.id&&known.has(x));return {id:row.id,parent:parent??null};});
 }),
 "205": define("Parse opt-out metadata",{header:"<https://example.org/remove>, <mailto:list@example.org>",post:"List-Unsubscribe=One-Click"},p=>{
  const urls=[...str(p.header,2000).matchAll(/<(https:\/\/[^<>\s]+|mailto:[^<>\s]+)>/gi)].map(m=>m[1]);return {urls,oneClick:str(p.post,120)==="List-Unsubscribe=One-Click"&&urls.some(u=>u.startsWith("https://"))};
 }),
 "206": define("Delivery status categorization",{status:"5.1.1"},p=>{const s=str(p.status,32);check(/^[245]\.\d{1,3}\.\d{1,3}$/.test(s),"Expected enhanced status code");return {status:s,category:s.endsWith(".2.2")?"mailbox-full":s[0]==="5"?"permanent":s[0]==="4"?"temporary":"delivered"};}),
 "207": define("Address syntax and role detection",{address:"support@example.org",disposableDomains:["test.invalid"]},p=>{const address=str(p.address,254),[local,domain]=address.toLowerCase().split("@");check(Array.isArray(p.disposableDomains)&&p.disposableDomains.length<=128,"Expected domain fixture list");return {syntax:/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(address),role:["support","admin","sales","info","postmaster"].includes(local),onList:p.disposableDomains.some(x=>str(x,253).toLowerCase()===domain)};}),
 "208": define("SMS segment estimator",{text:"A message with € and ^"},p=>{
  const basic="@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
  const extension="^{}\\[~]|€\f",text=str(p.text),chars=Array.from(text),gsm=chars.every(c=>basic.includes(c)||extension.includes(c));const units=chars.map(c=>gsm?(extension.includes(c)?2:1):c.length);const total=units.reduce((a,b)=>a+b,0);const single=gsm?160:70,multi=gsm?153:67;
  let segments=total?1:0,used=0;if(total>single)for(const unit of units){if(used+unit>multi){segments++;used=0;}used+=unit;}return {alphabet:gsm?"GSM-7":"Unicode",units:total,segments};
 }),
 "209": define("DTMF menu routing",{digit:"1",menu:{"1":"support","2":"billing"}},p=>{const d=str(p.digit,1);check(/^[0-9*#A-D]$/.test(d)&&p.menu&&typeof p.menu==="object","Invalid menu input");return {destination:Object.hasOwn(p.menu,d)?str((p.menu as Record<string,unknown>)[d],64):null};}),
 "212": define("UTC scheduled-send planner",{now:3600,deliverAfter:7200},p=>{const a=int(p.now,0,1e11),b=int(p.deliverAfter,0,1e11);return {delaySeconds:Math.max(0,b-a),deliverAt:Math.max(a,b)};}),
 "214": define("Latest reaction per actor and receipt watermark",{events:[{actor:"a",emoji:"👍",at:1},{actor:"a",emoji:"✨",at:2},{actor:"b",emoji:"👍",at:3}]},p=>{
  check(Array.isArray(p.events)&&p.events.length<=128,"Expected reaction events");const byActor=new Map<string,{emoji:string,at:number}>();
  for(const row of p.events){const actor=str(row.actor,64),emoji=str(row.emoji,24),at=int(row.at,0,1e14);if(at>=(byActor.get(actor)?.at??-1))byActor.set(actor,{emoji,at});}
  const counts=new Map<string,number>();for(const {emoji} of byActor.values())counts.set(emoji,(counts.get(emoji)??0)+1);
  return {counts:Object.fromEntries(counts),watermark:Math.max(0,...[...byActor.values()].map(v=>v.at))};
 }),
 "216": define("Mutual appointment windows",{first:[[0,60],[120,180]],second:[[30,150]],minutes:30},p=>{
  const ranges=(input:unknown)=>{check(Array.isArray(input)&&input.length<=64,"Expected calendar intervals");return input.map(x=>{check(Array.isArray(x)&&x.length===2,"Expected interval pair");const a=int(x[0],0,1e10),b=int(x[1],a,1e10);return [a,b];});};
  const a=ranges(p.first),b=ranges(p.second),minutes=int(p.minutes,1,1440);return a.flatMap(([x,y])=>b.map(([s,e])=>[Math.max(x,s),Math.min(y,e)]).filter(([s,e])=>e-s>=minutes));
 })
};
