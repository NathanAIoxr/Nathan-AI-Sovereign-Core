const utf8=new TextEncoder();
const algorithms=["SHA-1","SHA-256","SHA-384","SHA-512"];
const removable = new Set(["fbclid","gclid","dclid","msclkid","mc_cid","mc_eid","igshid","yclid","ttclid","twclid"]);

function string(body,key,length) {
  if(typeof body?.[key]!=="string"||body[key].length>length)throw new RangeError("Supply a valid "+key+".");
  return body[key];
}

async function metadata(html) {
  const output={title:"",openGraph:{},description:""};
  const seen=new Set();
  const source=new HTMLRewriter()
    .on("title",{text(chunk){output.title=(output.title+chunk.text).slice(0,400);}})
    .on("meta",{element(element){
      const key=(element.getAttribute("property")??element.getAttribute("name")??"").toLowerCase();
      const value=(element.getAttribute("content")??"").trim().slice(0,1000);
      if(!value||seen.has(key))return;
      if(key==="description"){output.description=value;seen.add(key);}
      if(/^og:(title|description|type|url|image|site_name)$/.test(key)){output.openGraph[key]=value;seen.add(key);}
    }})
    .transform(new Response(html,{headers:{"content-type":"text/html; charset=utf-8"}}));
  await source.arrayBuffer();
  output.title=output.title.trim();
  return output;
}

export async function executeUtility(name,body){
  if(name==="hash"){
    const input=string(body,"text",16000);
    if(!algorithms.includes(body.algorithm))throw new RangeError("Choose SHA-1, SHA-256, SHA-384, or SHA-512.");
    const data=utf8.encode(input);
    const digest=await crypto.subtle.digest(body.algorithm,data);
    return {algorithm:body.algorithm,bytes:data.length,digest:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("")};
  }
  if(name==="strip-tracking"){
    let url;
    try { url=new URL(string(body,"url",6000)); }
    catch { throw new RangeError("Supply an absolute HTTP or HTTPS URL."); }
    if(!["https:","http:"].includes(url.protocol)||url.username||url.password)throw new RangeError("Use an HTTP or HTTPS URL without credentials.");
    const removed=[];
    for(const key of new Set(url.searchParams.keys())){
      if(key.toLowerCase().startsWith("utm_")||removable.has(key.toLowerCase())){
        url.searchParams.delete(key);
        removed.push(key);
      }
    }
    return {url:url.href,removed};
  }
  if(name==="opengraph")return metadata(string(body,"html",45000));
  throw new RangeError("Unknown utility.");
}

export async function utilityBody(request){
  if(Number(request.headers.get("content-length"))>192000||!request.body)throw new RangeError("Payload is too large.");
  const reader=request.body.getReader();
  const chunks=[];
  let size=0;
  try{
    for(;;){
      const part=await reader.read();
      if(part.done)break;
      size+=part.value.length;
      if(size>192000)throw new RangeError("Payload is too large.");
      chunks.push(part.value);
    }
  }finally{await reader.cancel();}
  const all=new Uint8Array(size);
  let offset=0;
  for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
  const text=new TextDecoder("utf-8",{fatal:true}).decode(all);
  const content=request.headers.get("content-type")??"";
  if(content.startsWith("application/x-www-form-urlencoded"))return Object.fromEntries(new URLSearchParams(text));
  if(!content.startsWith("application/json"))throw new RangeError("Use a catalog form or application/json.");
  return JSON.parse(text);
}
