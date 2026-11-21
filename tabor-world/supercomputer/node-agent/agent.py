#!/usr/bin/env python3
"""Low-privilege Tabor compute fleet heartbeat; uses existing fleet API contract."""
import json, os, time, urllib.request, urllib.error

def payload():
    d={"node_id":os.environ["TABOR_NODE_ID"],"provider":os.getenv("TABOR_PROVIDER","self-hosted"),
       "kind":os.getenv("TABOR_NODE_KIND","linux-compute"),
       "reported_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
       "software_version":"tabor-fleet-agent/0.2","cpu_cores":os.cpu_count() or 1}
    try: d["cpu_load"]=round(os.getloadavg()[0],3)
    except (AttributeError,OSError): pass
    return d

def heartbeat():
    url=os.environ["TABOR_FLEET_URL"].rstrip("/")+"/api/heartbeat"
    req=urllib.request.Request(url,data=json.dumps(payload()).encode(),headers={
        "Content-Type":"application/json","Authorization":"Bearer "+os.environ["TABOR_FLEET_TOKEN"]},method="POST")
    with urllib.request.urlopen(req,timeout=12) as response:
        if response.status not in (200,201,202): raise RuntimeError("heartbeat rejected")
        return response.status

if __name__=="__main__":
    while True:
        try: print(json.dumps({"heartbeat_status":heartbeat()}),flush=True)
        except (KeyError,ValueError,urllib.error.URLError,TimeoutError,RuntimeError) as exc:
            print(json.dumps({"heartbeat_error":str(exc)[:200]}),flush=True)
        time.sleep(max(30,int(os.environ.get("TABOR_HEARTBEAT_INTERVAL","60"))))
