#!/usr/bin/env python3
"""Import Wikipedia chess categories into Cloudflare D1 via Wikimedia Action API.
Public reads require no API key. Set WIKIMEDIA_CONTACT_URL to an operator-controlled
contact page; do not publish credentials. Output SQL in batches for reviewed execution.
"""
import argparse, hashlib, json, os, pathlib, time, urllib.parse, urllib.request
API="https://en.wikipedia.org/w/api.php"
ROOTS=["Category:Chess variants","Category:Chess openings","Category:Chess pieces",
       "Category:History of chess","Category:Chess terminology","Category:Chess rules",
       "Category:Chess endgames","Category:Chess strategy","Category:Chess tactics",
       "Category:Chess-related games"]
def fetch(params):
    url=API+"?"+urllib.parse.urlencode({"action":"query","format":"json","formatversion":"2",**params})
    contact=os.environ.get("WIKIMEDIA_CONTACT_URL","https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core")
    req=urllib.request.Request(url,headers={"User-Agent":f"TaborAcademyChessImporter/1.0 ({contact})"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req,timeout=40) as response:
                return json.load(response)
        except Exception as e:
            if attempt==4: raise
            time.sleep(min(30,2**attempt))
def sqlq(s):return "'"+str(s).replace("'","''")+"'"
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--output",default="data/chess-import/wikipedia-chess.sql")
    ap.add_argument("--max-pages",type=int,default=12000)
    ap.add_argument("--max-depth",type=int,default=2)
    args=ap.parse_args()
    queue=[(x,0) for x in ROOTS]
    visited=set()
    records={}
    while queue and len(records)<args.max_pages:
        category,depth=queue.pop(0)
        if category in visited:continue
        visited.add(category)
        continuation={}
        while True:
            data=fetch({"list":"categorymembers","cmtitle":category,"cmlimit":"max",**continuation})
            for item in data.get("query",{}).get("categorymembers",[]):
                title=item["title"]
                if item["ns"]==14 and depth<args.max_depth and title not in visited:
                    queue.append((title,depth+1))
                if item["ns"]!=0:continue
                url="https://en.wikipedia.org/wiki/"+urllib.parse.quote(title.replace(" ","_"))
                key=str(item["pageid"])
                record=records.setdefault(key,{"page_id":key,"title":title,"url":url,"categories":set()})
                record["categories"].add(category)
                if len(records)>=args.max_pages:break
            if len(records)>=args.max_pages or "continue" not in data:break
            continuation=data["continue"]
            time.sleep(0.15)
        time.sleep(0.15)
    out=pathlib.Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
    sql=["CREATE TABLE IF NOT EXISTS chess_wikipedia_pages (page_id INTEGER PRIMARY KEY, title TEXT NOT NULL, page_url TEXT NOT NULL, categories_json TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'en.wikipedia.org', content_status TEXT NOT NULL DEFAULT 'metadata_only', fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);"]
    for r in records.values():
        sql.append("INSERT INTO chess_wikipedia_pages(page_id,title,page_url,categories_json) VALUES ("+",".join([r["page_id"],sqlq(r["title"]),sqlq(r["url"]),sqlq(json.dumps(sorted(r["categories"])))])+") ON CONFLICT(page_id) DO UPDATE SET title=excluded.title,page_url=excluded.page_url,categories_json=excluded.categories_json;")
    out.write_text("\n".join(sql)+"\n",encoding="utf-8")
    print(json.dumps({"pages":len(records),"categories_traversed":len(visited),"sql_file":str(out)}))
if __name__=="__main__":main()
