#!/usr/bin/env python3
"""Additive, idempotent Cloudflare D1 catalog ingestion, 20 records per API batch.
Reads a JSON array of candidate objects from a local file. No deletion or deployment.
Environment: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CATALOG_DB_ID.
Usage: python3 catalog-batch-ingest.py candidates.json
"""
import json,os,sys,time,urllib.request,urllib.error,pathlib
records=json.loads(pathlib.Path(sys.argv[1]).read_text())
if not isinstance(records,list): raise SystemExit("Expected JSON array")
token=os.environ["CLOUDFLARE_API_TOKEN"];account=os.environ["CLOUDFLARE_ACCOUNT_ID"]
db=os.getenv("CATALOG_DB_ID","1889fb08-9b26-45b9-8a71-f22a6ee3fc66")
endpoint=f"https://api.cloudflare.com/client/v4/accounts/{account}/d1/database/{db}/query"
def query(sql,params):
 body=json.dumps({"sql":sql,"params":params}).encode()
 for attempt in range(5):
  try:
   req=urllib.request.Request(endpoint,data=body,headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},method="POST")
   with urllib.request.urlopen(req,timeout=30) as res: payload=json.load(res)
   if not payload.get("success"):raise RuntimeError(str(payload.get("errors")))
   return
  except urllib.error.HTTPError as e:
   if e.code not in (429,500,502,503,504) or attempt==4:raise
   wait=e.headers.get("Retry-After")
   time.sleep(min(60,int(wait) if wait and wait.isdigit() else 2**attempt))
for start in range(0,len(records),20):
 group=records[start:start+20]
 for item in group:
  source=item["source_id"];key=item["item_id"];name=item["name"]
  if not all(isinstance(v,str) and 0<len(v)<=500 for v in (source,key,name)):raise ValueError("Invalid required field")
  query("INSERT OR IGNORE INTO catalog_items(item_id,source_id,external_id,name,url,license,cost_class,compatibility,state,last_checked) VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)",
        [key,source,str(item.get("external_id",key)),name,item.get("url"),item.get("license"),item.get("cost_class","unknown"),item.get("compatibility","unreviewed"),"discovered"])
 print(f"Batch {start//20+1}: {len(group)} candidate records submitted")
