#!/usr/bin/env python3
"""Archive a user-provided original conversation export; never invent messages."""
import argparse,base64,datetime,hashlib,json,os,pathlib,urllib.request
p=argparse.ArgumentParser()
p.add_argument("source",type=pathlib.Path)
p.add_argument("--conversation-id")
p.add_argument("--github-repo")
p.add_argument("--github-branch",default="main")
p.add_argument("--cloudflare-account")
p.add_argument("--cloudflare-kv-namespace")
p.add_argument("--publish",action="store_true")
a=p.parse_args()
raw=a.source.read_bytes()
if a.source.name=="conversations.json":
    if not a.conversation_id: p.error("Specify --conversation-id; do not publish unrelated chats")
    matches=[x for x in json.loads(raw) if x.get("id")==a.conversation_id]
    if len(matches)!=1: p.error("Conversation ID missing or ambiguous")
    raw=json.dumps(matches[0],ensure_ascii=False,sort_keys=True,indent=2).encode()
digest=hashlib.sha256(raw).hexdigest()
name="conversation-"+digest[:16]+(".json" if raw[:1] in (b"{",b"[") else ".txt")
pathlib.Path(name).write_bytes(raw)
manifest={"file":name,"sha256":digest,"bytes":len(raw),"source":a.source.name,"timestamp":datetime.datetime.now(datetime.timezone.utc).isoformat()}
pathlib.Path(name+".sha256.json").write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
def put(url,body,token,typ):
    req=urllib.request.Request(url,data=body,method="PUT",headers={"Authorization":"Bearer "+token,"Content-Type":typ,"User-Agent":"NathanAI-Archive/1.0"})
    with urllib.request.urlopen(req,timeout=45) as resp: print(resp.status,resp.read().decode()[:300])
if a.publish:
    if a.github_repo:
        token=os.environ["GITHUB_TOKEN"]
        url="https://api.github.com/repos/"+a.github_repo+"/contents/evidence/chat-archives/"+name
        body=json.dumps({"message":"Archive original conversation","content":base64.b64encode(raw).decode(),"branch":a.github_branch}).encode()
        put(url,body,token,"application/json")
    if a.cloudflare_account and a.cloudflare_kv_namespace:
        token=os.environ["CLOUDFLARE_API_TOKEN"]
        url="https://api.cloudflare.com/client/v4/accounts/"+a.cloudflare_account+"/storage/kv/namespaces/"+a.cloudflare_kv_namespace+"/values/nathan:conversation-archive:"+digest
        put(url,raw,token,"application/octet-stream")
