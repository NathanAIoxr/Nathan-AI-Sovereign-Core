#!/usr/bin/env python3
"""Opt-in, low-privilege fleet heartbeat; no mining, shell execution, or credential discovery."""
import json,os,platform,sys,time,urllib.request
def snapshot():
    data={"node_id":os.environ["TABOR_NODE_ID"],"provider":os.getenv("TABOR_PROVIDER","self-hosted"),"kind":os.getenv("TABOR_NODE_KIND","linux-compute"),"reported_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"software_version":"tabor-fleet-agent/0.1","cpu_cores":os.cpu_count() or 1}
    try:
        import resource
        data["cpu_load"]=round(os.getloadavg()[0],3)
    except (AttributeError,OSError): pass
    return data
def main():
    url=os.environ["TABOR_FLEET_URL"].rstrip("/")+"/api/heartbeat"
    token=os.environ["TABOR_FLEET_TOKEN"]
    body=json.dumps(snapshot()).encode()
    req=urllib.request.Request(url,data=body,headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},method="POST")
    with urllib.request.urlopen(req,timeout=15) as r: print(r.read().decode())
if __name__=="__main__": main()
