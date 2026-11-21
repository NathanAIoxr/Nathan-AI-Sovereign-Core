import { createReadStream } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { setTimeout } from "node:timers/promises";

const [directory,base,mode="both"]=process.argv.slice(2);
if (!directory||!base||!["both","records","editions"].includes(mode)||!/^[a-f0-9]{64}$/.test(process.env.TABOR_IMPORT_KEY??"")) {
  console.error("Usage: set TABOR_IMPORT_KEY and run upload-corpus.mjs DIRECTORY ENDPOINT [both|records|editions]");
  process.exit(2);
}
const origin=new URL(base);
if (origin.protocol!=="https:"||origin.username||origin.password) throw new Error("Expected an HTTPS import endpoint");

async function send(path,payload) {
  for(let i=0;i<3;i++) {
    let response;
    try {
      response=await fetch(new URL(path,origin),{method:"POST",redirect:"error",headers:{
        authorization:"Bearer "+process.env.TABOR_IMPORT_KEY,"content-type":"application/json"},
        body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
    } catch (error) {
      if (i===2) throw error;
    }
    if (response?.ok) return response.json();
    if (response && (response.status<500||i===2)) throw new Error(response.status+" "+await response.text());
    await setTimeout(400*(i+1));
  }
}

if (mode!=="editions") {
  let pending=[];
  let provider="";
  const records=createInterface({input:createReadStream(join(directory,"records.ndjson")),crlfDelay:Infinity});
  for await (const line of records) {
    const row=JSON.parse(line);
    if (pending.length && (pending.length===128||row.source[0]!==provider)) {
      console.log(JSON.stringify(await send("/records",pending)));
      pending=[];
    }
    provider=row.source[0];
    pending.push(row);
  }
  if (pending.length) console.log(JSON.stringify(await send("/records",pending)));
}
if (mode!=="records") {
  const pack=join(directory,"editions");
  const paths=(await readdir(pack)).filter(name=>name.endsWith(".json")).sort();
  for(let start=0;start<paths.length;start+=5) {
    const results=await Promise.allSettled(paths.slice(start,start+5).map(async name=>{
      const meta=JSON.parse(await readFile(join(pack,name),"utf8"));
      const data=await readFile(join(pack,name.slice(0,-5)+".bin"));
      return send("/edition",{...meta,body:data.toString("base64")});
    }));
    for (const result of results) {
      if(result.status==="fulfilled") console.log(JSON.stringify(result.value));
      else { console.error(result.reason); process.exitCode=1; }
    }
  }
}
