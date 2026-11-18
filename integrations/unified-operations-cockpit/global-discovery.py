#!/usr/bin/env python3
"""Discover public MCP servers, GitHub repositories, and Hugging Face AI models.
Additive catalog only. Max 20,000 unique candidates per run. Stdlib, no installs.
Writes D1 in batches of 20 with bounded retry. Never clones or deploys third-party code.
"""
import os,json,time,urllib.request,urllib.parse,urllib.error,sys,random
LIMIT=int(os.getenv("DISCOVERY_LIMIT","20000"))
LIMIT=min(max(LIMIT,20),20000)
DB=os.getenv("CATALOG_DB_ID","1889fb08-9b26-45b9-8a71-f22a6ee3fc66")
ACCOUNT=os.environ["CLOUDFLARE_ACCOUNT_ID"]
TOKEN=os.environ["CLOUDFLARE_API_TOKEN"]
GH=os.getenv("GH_DISCOVERY_TOKEN",os.getenv("GITHUB_TOKEN",""))
endpoint=f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/d1/database/{DB}/query"
def request(url,headers=None,post=None):
 for n in range(6):
  try:
   h={"User-Agent":"NathanAI-Catalog/1.0","Accept":"application/json"}
   h.update(headers or {})
   if post is not None:h["Content-Type"]="application/json"
   req=urllib.request.Request(url,headers=h,data=json.dumps(post).encode() if post is not None else None)
   with urllib.request.urlopen(req,timeout=45) as r:return json.load(r)
  except urllib.error.HTTPError as e:
   if e.code not in (429,500,502,503,504) or n==5:raise
   retry=e.headers.get("Retry-After")
   wait=min(120,int(retry) if retry and retry.isdigit() else 2**n+random.random())
   time.sleep(wait)
  except (TimeoutError,urllib.error.URLError):
   if n==5:raise
   time.sleep(2**n+random.random())
def ingest(items):
 for start in range(0,len(items),20):
  batch=items[start:start+20]
  statements=[]
  for it in batch:
   params=[it["id"],it["source"],it["external_id"],it["name"],it["url"],it.get("license"),"unknown","unreviewed","discovered"]
   # SQLite safely encoded as literals: source metadata only, never executable SQL from sources
   q=lambda x:"NULL" if x is None else "'"+str(x).replace("'","''")+"'"
   statements.append("INSERT OR IGNORE INTO catalog_items(item_id,source_id,external_id,name,url,license,cost_class,compatibility,state,last_checked) VALUES("+",".join(map(q,params))+",CURRENT_TIMESTAMP)")
  result=request(endpoint,{"Authorization":"Bearer "+TOKEN},post={"sql":";".join(statements)})
  if not result.get("success"):raise RuntimeError(result.get("errors"))
 print("Submitted",len(items),"candidate records")
seen=set()
def unique(items):
 out=[]
 for it in items:
  if it["id"] not in seen:
   seen.add(it["id"]);out.append(it)
 return out
def mcp():
 cursor=None;total=0
 while total<LIMIT:
  params={"limit":100,"version":"latest"}
  if cursor:params["cursor"]=cursor
  data=request("https://registry.modelcontextprotocol.io/v0.1/servers?"+urllib.parse.urlencode(params))
  entries=data.get("servers",[])
  items=[]
  for entry in entries:
   s=entry.get("server",entry)
   name=s.get("name")
   if not name:continue
   items.append({"id":"mcp:"+name,"source":"mcp-registry","external_id":name,"name":name,"url":"https://registry.modelcontextprotocol.io/","license":None})
  items=unique(items)[:LIMIT-total]
  if items:ingest(items);total+=len(items)
  nxt=data.get("metadata",{}).get("nextCursor")
  if not nxt or nxt==cursor or not entries:break
  cursor=nxt
 print("MCP records:",total)
 return total
def github():
 total=0
 queries=["topic:ai-agent archived:false","topic:automation archived:false","topic:cloudflare-workers archived:false","topic:multi-agent archived:false","topic:bot archived:false","topic:llm-agent archived:false","topic:mcp-server archived:false","topic:edge-computing archived:false"]
 headers={"Accept":"application/vnd.github+json"}
 if GH:headers["Authorization"]="Bearer "+GH
 for query in queries:
  for page in range(1,11):
   if len(seen)>=LIMIT:break
   data=request("https://api.github.com/search/repositories?"+urllib.parse.urlencode({"q":query,"per_page":100,"page":page}),headers)
   items=[]
   for s in data.get("items",[]):
    if s.get("private") or s.get("archived"):continue
    name=s.get("full_name");license=(s.get("license") or {}).get("spdx_id")
    if not name:continue
    items.append({"id":"github:"+name.lower(),"source":"github","external_id":name,"name":name,"url":s.get("html_url"),"license":license})
   items=unique(items)
   if items:ingest(items);total+=len(items)
   if len(data.get("items",[]))<100:break
   time.sleep(3)
 print("GitHub records:",total)
 return total
def huggingface():
 total=0
 for kind in ["models"]:
  for offset in range(0,5000,100):
   data=request("https://huggingface.co/api/"+kind+"?"+urllib.parse.urlencode({"limit":100,"skip":offset,"sort":"downloads","direction":-1}))
   if not isinstance(data,list) or not data:break
   items=[]
   for m in data:
    name=m.get("id")
    if not name:continue
    items.append({"id":"hf:"+name,"source":"huggingface","external_id":name,"name":name,"url":"https://huggingface.co/"+name,"license":(m.get("cardData") or {}).get("license")})
   items=unique(items)
   if items:ingest(items);total+=len(items)
 print("Hugging Face records:",total)
 return total
if __name__=="__main__":
 results={}
 for source,fn in [("mcp",mcp),("github",github),("huggingface",huggingface)]:
  try:results[source]={"count":fn(),"status":"completed"}
  except Exception as e:results[source]={"status":"failed","error":str(e)[:300]};print(source,"failed",e,file=sys.stderr)
 print(json.dumps(results))
 if any(x["status"]=="failed" for x in results.values()):sys.exit(1)
