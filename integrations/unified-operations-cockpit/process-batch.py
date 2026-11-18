#!/usr/bin/env python3
"""Read-only inventory batch processor; stdlib only. Writes verifiable per-batch results."""
import json, os, sys, urllib.request, urllib.error, datetime, pathlib
batch_id=int(sys.argv[1])
root=pathlib.Path(__file__).resolve().parent
manifest=json.loads((root/"worker-batches.json").read_text())
batch=manifest["batches"][batch_id-1]
assert batch["batch"]==batch_id
token=os.getenv("CLOUDFLARE_API_TOKEN")
account=os.getenv("CLOUDFLARE_ACCOUNT_ID")
if not token or not account:
    raise SystemExit("Cloudflare API credentials missing; cannot verify batch")
results=[]
for item in batch["items"]:
    name=item["name"]
    url=f"https://api.cloudflare.com/client/v4/accounts/{account}/workers/scripts/{name}/settings"
    req=urllib.request.Request(url,headers={"Authorization":f"Bearer {token}","Accept":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=15) as response:
            data=json.load(response)
        if not data.get("success"):
            raise ValueError("Cloudflare returned success=false")
        bindings=data.get("result",{}).get("bindings",[])
        results.append({"name":name,"status":"verified","bindings":[{"name":b.get("name"),"type":b.get("type")} for b in bindings]})
    except (urllib.error.URLError,ValueError,TimeoutError) as exc:
        results.append({"name":name,"status":"verification_failed","error":str(exc)[:180]})
output={"batch":batch_id,"count":len(results),"checked_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"items":results}
dest=root/"batch-results";dest.mkdir(exist_ok=True)
(dest/f"batch-{batch_id:02d}.json").write_text(json.dumps(output,indent=2)+"\n")
print(f"Batch {batch_id}: {sum(x['status']=='verified' for x in results)}/{len(results)} verified")
if any(x["status"]!="verified" for x in results):
    sys.exit(1)
