#!/usr/bin/env python3
"""Gopher Ants: read-only public open-source metadata lookup; never execute remote code."""
import argparse
import json
import urllib.request
import pathlib

ROOT=pathlib.Path(__file__).resolve().parent
def inspect_source(row,live=False):
    result={"project":row["project"],"repository":row["github"],"role":row["role"],
            "state":"CATALOG_ONLY", "code_installed":False}
    if live:
        request=urllib.request.Request("https://api.github.com/repos/"+row["github"],
                 headers={"User-Agent":"NathanTaborGopherAnts/1.0","Accept":"application/vnd.github+json"})
        try:
            with urllib.request.urlopen(request,timeout=10) as response:
                info=json.load(response)
            result.update(state="METADATA_FETCHED",default_branch=info.get("default_branch"),
                          pushed_at=info.get("pushed_at"),license=(info.get("license") or {}).get("spdx_id"))
        except Exception as error:
            result.update(state="LOOKUP_FAILED",error=type(error).__name__)
    return result

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--live",action="store_true",help="opt in to public GitHub metadata requests")
    args=parser.parse_args()
    catalog=json.loads((ROOT/"sources.json").read_text(encoding="utf8"))
    results=[inspect_source(row,args.live) for row in catalog["sources"]]
    print(json.dumps({"mode":"PUBLIC_METADATA_ONLY","count":len(results),
          "software_installed":False,"results":results},indent=2))

if __name__=="__main__":main()
