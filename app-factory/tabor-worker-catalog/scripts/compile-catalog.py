"""Compile the supplied numbered catalog with a snapshot of upstream references."""
from collections import Counter
from html import unescape
import json
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
refs=Path(sys.argv[1])
input_text=(ROOT/"data/submitted-list.md").read_text()
lines=[]
for line in input_text.splitlines():
    line=unescape(line).replace("\\.",".").strip().rstrip("\\").rstrip()
    if line:
        lines.append(line)
metadata={}
for file in refs.glob("*~*.json"):
    value=json.loads(file.read_text())
    if value.get("status")=="200":
        metadata[value["repo"].lower()]=value
matching_links={}
for key,repo in [("selfhosted","theoephraim/awesome-cloudflare-selfhosted"),("containers","tobilg/awesome-cloudflare-containers")]:
    file=refs/(key+".md")
    if not file.exists():
        continue
    matching_links[repo]={label.lower():url.rstrip("/") for label,url in re.findall(r"\[([^]\n]+)\]\((https://github\.com/[^\s)]+)\)",file.read_text())}

github="https://github.com/"
REPOS={6:"cloudflare/moltworker",7:"ghostwriternr/claude-code-containers",17:"cloudflare/kitesurf",
       34:"tobilg/cloudflare-ducklake",75:"megaconfidence/wifski",87:"honojs/hono"}
EXAMPLES={13:"vectorize-rag",21:"opengraph",46:"dynamic-py-py",81:"image-redraw",86:"chatroom",
          88:"fastapi",89:"django",100:"cron"}
DOCUMENTATION={37:"https://developers.cloudflare.com/r2/api/s3/presigned-urls/",
               20:"https://developers.cloudflare.com/browser-rendering/",
               82:"https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/",
               68:"https://developers.cloudflare.com/workers/examples/ratelimiter/",
               99:"https://developers.cloudflare.com/api/resources/dns/subresources/records/"}
RELATED={14:"mcp-server",80:"image-redraw",84:"django-markdown-r2"}
LOCAL={21:"opengraph",96:"strip-tracking",98:"hash"}

def source(num,name,via):
    value=metadata.get(via.lower())
    if value and value.get("sha"):
        exact=name if via=="cloudflare/templates" else EXAMPLES.get(num,RELATED.get(num))
        if exact and exact+"/" in {p.rsplit("/",1)[0]+"/" for p in value.get("workers",[])}:
            return {"status":"related" if num in RELATED else "template","url":github+via+"/tree/"+value["sha"]+"/"+exact,"revision":value["sha"]}
    repo=REPOS.get(num) or (name if not via and re.fullmatch(r"[\w.-]+/[\w.-]+",name) else None)
    if repo and repo.lower() in metadata:
        verified=metadata[repo.lower()]
        return {"status":"archived" if verified.get("archived") else "repository","url":verified["url"],
                "license":verified.get("license") or None}
    links=matching_links.get(via,{})
    lookups=[name.lower(),(name.split(" Video-to-GIF")[0]).lower()]
    matched=next((links[k] for k in lookups if k in links),None)
    if matched:
        return {"status":"index-match","url":matched,"index":github+via}
    if num in DOCUMENTATION:
        return {"status":"related","url":DOCUMENTATION[num]}
    if value:
        return {"status":"reference","url":value["url"]}
    return {"status":"unresolved","url":None,"reference":via or repo or name}

categories=[]
entries=[]
for line in lines:
    category=re.fullmatch(r"(\d+)\. (.+) \((\d+)\s*[–-]\s*(\d+)\)",line)
    item=re.fullmatch(r"(\d+)\. (.+?) – (.+)",line)
    if category:
        n,title,lo,hi=category.groups()
        categories.append({"id":int(n),"title":title,"first":int(lo),"last":int(hi)})
    elif item:
        n,title,description=item.groups()
        n=int(n)
        mat=re.fullmatch(r"(.+) \(via (.+)\)",title)
        name,via=mat.groups() if mat else (title,"")
        if not categories or not categories[-1]["first"]<=n<=categories[-1]["last"]:
            raise ValueError("Item outside source category: "+title)
        entries.append({"id":n,"name":name,"submittedReference":via or None,"description":description,
                        "category":categories[-1]["id"],"source":source(n,name,via),
                        "localUtility":LOCAL.get(n)})
assert len(categories)==9
assert [e["id"] for e in entries]==list(range(1,102))
fleet=json.loads((refs/"federation.json").read_text())
slots=[x["id"] for x in fleet["slots"]]
assert fleet["cohort"]=="tabor-federation-v1"
assert slots==[f"node-{n:03d}" for n in range(1,1001)]
catalog={"schema":"tabor.worker-catalog.v1","release":"2026-11-18.1","title":"Tabor Worker Catalog","categories":categories,"entries":entries}
def write(name,data):
    (ROOT/"data"/name).write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n")
write("catalog.json",catalog)
write("fleet.json",{"cohort":fleet["cohort"],"source":"https://tabor-supercomputer-federation.nathantaboract.workers.dev/v1/nodes","slots":slots})
print(Counter(e["source"]["status"] for e in entries))
