const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;
if(!/^[a-f0-9]{32}$/.test(account??"")||!token) throw Error("Cloudflare Actions credentials are required");
const queue="/queues/0cb97077733e4e1f831e4b12414df6dc/messages";
const control="/storage/kv/namespaces/f0c0ef9b5a964825ba2508f8dd7ca6b8/bulk/get";
const ledger="/d1/database/3279cbc0-0e73-4b07-9bc2-47ab0c3b95c2/query";
const sourceDb="/d1/database/2744aea4-b218-41e9-ab21-a04f25c10475/query";
async function call(path,body) {
  const response=await fetch("https://api.cloudflare.com/client/v4/accounts/"+account+path,{
    method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify(body),redirect:"error",signal:AbortSignal.timeout(20000)
  });
  const result=await response.json();
  if(!response.ok||!result.success)throw Error("Cloudflare API "+response.status+" for "+path);
  return result.result;
}
function unpack(raw) {
  if(raw&&typeof raw==="object")return raw;
  try{return JSON.parse(raw)}catch{return JSON.parse(Buffer.from(raw,"base64").toString("utf8"));}
}
const now=new Date().toISOString();
const {messages=[]}=await call(queue+"/pull",{batch_size:10,visibility_timeout_ms:60000});
const acks=[],retries=[];
const filters={github:"kind LIKE 'GitHub %'",cloudflare:"kind NOT LIKE 'GitHub %'",links:"1=1"};
for(const row of messages){
  try {
    const msg=unpack(row.body);
    if(typeof msg.id!=="string"||msg.id.length>100||!["CHEIRONOMER_TIME","CHEIRONOMER_READER"].includes(msg.event))throw Error("invalid_event");
    const evidence=await call(ledger,{sql:"SELECT event_type FROM provenance_ledger WHERE event_id=?",params:[msg.id]});
    const kind=evidence[0]?.results?.[0]?.event_type;
    if(msg.event==="CHEIRONOMER_TIME"&&kind!=="time"||msg.event==="CHEIRONOMER_READER"&&kind!=="dispatch")throw Error("no_provenance");
    if(msg.event==="CHEIRONOMER_READER") {
      if(!Object.hasOwn(filters,msg.source))throw Error("invalid_source");
      const mode=await call(control,{keys:["KILL_SWITCH_ACTIVE"]});
      if(mode?.values?.KILL_SWITCH_ACTIVE!=="0")throw Error("BRAKE");
      const page=await call(sourceDb,{sql:`SELECT node_key,kind,resolution,json_extract(details_json,'$.scan_status') AS scan_status FROM zone_reader_provenance_nodes WHERE ${filters[msg.source]} ORDER BY node_key LIMIT 25`});
      const nodes=page[0]?.results??[];
      if(nodes.length)await call(ledger,{batch:nodes.map(x=>({
        sql:"INSERT OR IGNORE INTO recursive_nodes VALUES(?,?,?,?,?)",params:[x.node_key,x.kind,x.scan_status??x.resolution,Number(x.scan_status==="no-static-reference"),now]
      }))});
    }
    await call(ledger,{sql:"INSERT OR IGNORE INTO extraction_log VALUES(?,?,?,?)",params:["queue:"+msg.id,"emit",JSON.stringify({event:msg.event}),now]});
    acks.push({lease_id:row.lease_id});
  } catch {retries.push({lease_id:row.lease_id,delay_seconds:60});}
}
if(messages.length)await call(queue+"/ack",{acks,retries});
console.log(JSON.stringify({received:messages.length,acked:acks.length,retried:retries.length}));
