#!/usr/bin/env python3
"""Tabor compute node heartbeat agent. Requires explicitly configured fleet URL/token."""
import json, os, platform, socket, time, urllib.request, urllib.error
from datetime import datetime, timezone

def payload():
    return {"node_id":os.environ["TABOR_NODE_ID"],"hostname":socket.gethostname(),
            "status":"online","kind":"cpu","metadata":{"architecture":platform.machine(),
            "system":platform.system(),"python":platform.python_version()},
            "timestamp":datetime.now(timezone.utc).isoformat()}
def heartbeat():
    url=os.environ["TABOR_FLEET_URL"].rstrip("/")+"/api/heartbeat"
    req=urllib.request.Request(url,data=json.dumps(payload()).encode(),headers={
        "Content-Type":"application/json","Authorization":"Bearer "+os.environ["TABOR_FLEET_TOKEN"]},method="POST")
    with urllib.request.urlopen(req,timeout=12) as resp:
        if resp.status not in (200,201,202): raise RuntimeError("heartbeat rejected")
        return resp.status
if __name__=="__main__":
    while True:
        try: print(json.dumps({"heartbeat_status":heartbeat()}),flush=True)
        except (KeyError,ValueError,urllib.error.URLError,TimeoutError,RuntimeError) as exc:
            print(json.dumps({"heartbeat_error":str(exc)[:200]}),flush=True)
        time.sleep(max(30,int(os.environ.get("TABOR_HEARTBEAT_INTERVAL","60"))))
