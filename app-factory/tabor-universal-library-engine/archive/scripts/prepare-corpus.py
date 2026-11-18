#!/usr/bin/env python3
"""Normalize downloaded, attributable corpora and package exact permitted text bytes."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
import json
from pathlib import Path
import random
import re
import subprocess
import tarfile
from urllib.parse import quote, urlsplit
from xml.etree import ElementTree as ET

LCC = "ABCDEFGHJKLMNPQRSTUVZ"
LOC_SNAPSHOT = "LC Labs · Selected Digitized Books metadata, through 2022-08-26"
LOC_ORIGIN = "https://data.labs.loc.gov/digitized-books/"
LOC_RIGHTS = "Library of Congress · Public domain in the Selected Digitized Books data package. OCR may include scanner and recognition errors. Consult page images for the original."
CDLI_RIGHTS = "Credit: Cuneiform Digital Library Initiative, https://cdli.earth. Catalog and transliteration reuse follow CDLI terms. Photos remain at the source."
PAP_RIGHTS = "Credit: Duke Databank of Documentary Papyri / Papyri.info. TEI source under CC BY 3.0. See revision history and editorial notation in the source file."
T = "{http://www.tei-c.org/ns/1.0}"


def clean(value, cap=900):
    if isinstance(value, list):
        value = "; ".join(str(item) for item in value if item)
    return " ".join(str(value or "").replace("\x00", "").split())[:cap]


def slug(text):
    return re.sub("[^a-z0-9]+", "-", text.lower()).strip("-")


def classify(value, fallback):
    match = re.search(r"^([A-Z])[A-Z0-9]", clean(value).upper())
    return match[1] if match and match[1] in LCC else fallback


def row(provider, id_, title, author, language, shelf, vault, material, source_url,
        rights, snapshot, *, holding="", dating="", shelfmark="", description=""):
    safe_id = slug(id_)
    if not safe_id:
        raise ValueError("Invalid source ID")
    book = material == "book"
    return {
        "work": [provider + "-" + safe_id, clean(title) or id_, clean(author) or "Unrecorded",
                 clean(language, 180) or "und", shelf, vault, "edition" if book else "artifact",
                 "source-edition" if book else "surviving-witness", clean(description),
                 source_url, clean(id_), rights],
        "source": [provider, clean(id_), material, clean(holding), clean(dating), clean(shelfmark), snapshot],
    }


def sample(iterator, maximum, seed):
    rng = random.Random(seed)
    picked = []
    for offset, item in enumerate(iterator):
        if offset < maximum:
            picked.append(item)
        elif maximum:
            slot = rng.randrange(offset + 1)
            if slot < maximum:
                picked[slot] = item
    return picked


def loc_record(record):
    url = record.get("url") or record.get("id") or ""
    parsed = urlsplit(url)
    match = re.fullmatch(r"/item/([a-zA-Z0-9]+)/?", parsed.path)
    if not match or parsed.hostname != "www.loc.gov" or record.get("access_restricted") or not record.get("title"):
        return None
    if "book" not in record.get("original_format", []):
        return None
    id_ = match[1]
    item = record.get("item") or {}
    call = clean(item.get("call_number"))
    return row("loc", id_, record["title"], item.get("contributors") or record.get("contributor"),
               item.get("language") or record.get("language"), classify(call, "A"), "loc", "book",
               f"https://www.loc.gov/item/{id_}/", LOC_RIGHTS, LOC_SNAPSHOT,
               holding="Library of Congress", dating=record.get("date"), shelfmark=call,
               description=item.get("created_published") or record.get("description") or record.get("subject"))


def save_edition(directory, record, id_, format_, label, url, data):
    if not data or len(data) > 1_490_000:
        return False
    work = record["work"][0]
    key = directory / (work + "-" + id_)
    key.with_suffix(".bin").write_bytes(data)
    key.with_suffix(".json").write_text(json.dumps({
        "work": work, "id": id_, "format": format_, "label": label, "url": url,
        "digest": hashlib.sha256(data).hexdigest(),
    }, ensure_ascii=False), encoding="utf-8")
    return True


def download_loc(selected, records, directory):
    def get(pair):
        name, id_, md5, size, key = pair
        work = records.get(id_)
        url = "https://" + key
        if not work or not re.fullmatch(r"https://data\.labs\.loc\.gov/digitized-books/sample-data/data/[a-zA-Z0-9_.-]+\.txt", url):
            return False
        result = subprocess.run(["curl", "-fsS", "--max-time", "20", url], capture_output=True)
        if result.returncode or len(result.stdout) != size or hashlib.md5(result.stdout, usedforsecurity=False).hexdigest() != md5:
            return False
        return save_edition(directory, work, "loc-ocr-2022", "ocr", "Library of Congress OCR reading copy", url, result.stdout)
    with ThreadPoolExecutor(max_workers=12) as pool:
        return sum(pool.map(get, selected))


def loc(src, directory, count, files):
    seeded = [r for t in json.loads((src / "loc-metadata.json").read_text()) if (r := loc_record(t))]
    primary = {w["work"][0]: w for w in seeded[:count]}
    if len(primary) < count:
        def choices():
            with (src / "loc-overview.jsonl").open() as f:
                for line in f:
                    record = loc_record(json.loads(line))
                    if record and record["work"][0] not in primary:
                        yield record
        picked=sample(choices(), count-len(primary), 12314)
        for work in picked:
            primary[work["work"][0]]=work
    indexes = {"http" + w["work"][9][5:]:w for w in primary.values()}
    manifest = json.loads((src / "loc-manifest.json").read_text())["rows"]
    available = [r for r in manifest if r[0].endswith(".txt") and r[1] in indexes and 7500 <= r[3] <= 900_000]
    published = download_loc(sample(available, files, 77), indexes, directory) if files else 0
    return list(primary.values()), published


def gutenberg(src, count):
    def choices():
        with (src / "pg-catalog.csv").open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f, strict=True)
            for data in reader:
                ref = data.get("Text#", "")
                if not str(ref).isdigit() or data.get("Type") != "Text" or not data.get("Title"):
                    continue
                if ref in {"10", "11", "1342"}:
                    continue
                yield row("gutenberg", ref, data["Title"], data.get("Authors"), data.get("Language"),
                          classify(data.get("LoCC"), "A"), "loc", "book", "https://www.gutenberg.org/ebooks/" + ref,
                          "Project Gutenberg catalog record. Consult the specific e-book's rights notice at the source.",
                          "Project Gutenberg · machine-readable catalog, 2026-11-18",
                          holding="Project Gutenberg", shelfmark="eBook " + ref,
                          description=data.get("Subjects") or data.get("Bookshelves"))
    return sample(choices(), count, 557)


def cdli(src, directory, count, files):
    ref = json.loads((src / "cdli-ref.json").read_text())["object"]["sha"]
    old_source = f"https://github.com/cdli-gh/data/blob/{ref}/cdliatf_unblocked.atf"
    broad_kinds = ("tablet", "prism", "cylinder", "cone", "brick", "seal", "bulla", "stone")
    priority = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 31, 42, 50}
    early = {}
    def choices():
        with (src / "cdli.csv").open(encoding="utf-8", newline="") as f:
            for data in csv.DictReader(f):
                raw = data.get("id_text", "")
                if not raw.isdigit() or int(raw)==0:
                    continue
                objtype = clean(data.get("object_type")).lower()
                if not any(x in objtype for x in broad_kinds):
                    continue
                no = int(raw)
                pnum = f"P{no:06}"
                material = "seal" if "seal" in objtype or "bulla" in objtype else "tablet" if "tablet" in objtype else "inscription"
                genre = clean(data.get("genre"))
                designation = data.get("designation") or data.get("primary_publication") or pnum
                note = " · ".join(filter(None, map(clean, [data.get("object_type"), data.get("material"), data.get("provenience"), genre])))
                record = row("cdli", pnum, designation, "Ancient scribes or makers", data.get("language"), "C",
                             "ancient",material,"https://cdli.earth/artifacts/"+str(no), CDLI_RIGHTS,
                             "CDLI public bulk snapshot · "+ref, holding=data.get("collection"), dating=data.get("period"),
                             shelfmark=data.get("museum_no"), description=note)
                if no in priority:
                    early[pnum]=record
                else:
                    yield record
    if not count:
        return [],0
    sampled=sample(choices(), max(0,count-len(priority)), 2311)
    first = list(early.values())[:count]
    candidates = {r["source"][1].encode():r for r in first+sampled}
    selected = set(list(candidates)[:min(files, len(first))])
    selected.update(sample((k for k in candidates if k not in selected), max(0,files*3-len(selected)), 572))
    atf = bytearray()
    current = None
    saved = 0
    if files:
        with (src / "cdli.atf").open("rb") as data:
            for line in data:
                marker=re.match(rb"&([PQ][0-9]{6,})\b", line)
                if marker:
                    if current in selected and atf:
                        saved += save_edition(directory,candidates[current],"cdli-atf-2022","atf","CDLI ATF transliteration",old_source,atf)
                    if saved>=files:
                        break
                    current = marker[1]
                    atf = bytearray()
                if current in selected:
                    atf.extend(line)
            else:
                if current in selected and atf and saved<files:
                    saved += save_edition(directory,candidates[current],"cdli-atf-2022","atf","CDLI ATF transliteration",old_source,atf)
    return first+sampled,saved


def parse_papyrus(data):
    root = ET.fromstring(data)
    hybrid = root.find(f".//{T}idno[@type='ddb-hybrid']")
    filename = root.find(f".//{T}idno[@type='filename']")
    if hybrid is None or not hybrid.text or filename is None or not filename.text:
        return None
    hybrid_id = hybrid.text.strip()
    if ";" not in hybrid_id or not re.fullmatch("[a-zA-Z0-9._;,+ -]+", hybrid_id):
        return None
    title = root.find(f"./{T}text/{T}body/{T}head/{T}ref/{T}title")
    if title is None:
        title = root.find(f".//{T}title")
    entry = root.find(f".//{T}div[@type='edition']")
    language=entry.get("{http://www.w3.org/XML/1998/namespace}lang") if entry is not None else ""
    return filename.text.strip(), hybrid_id, clean("".join(title.itertext()) if title is not None else hybrid_id), language


def papyri(src,directory,count,files):
    ref = json.loads((src/"papyri-tree.json").read_text())["sha"]
    blobs = (r["path"] for r in json.loads((src/"papyri-ddb-tree.json").read_text())["tree"]
             if r["type"]=="blob" and re.fullmatch(r"\d+/\d+[a-z]?\.xml",r["path"]) and 1300<r["size"]<300_000)
    sample_paths = set(sample(blobs,count,408))
    sample_paths.update(["0/1.xml","0/2.xml","0/3.xml"])
    out=[]
    metadata={}
    files_ready=[]
    wanted_hgv={}
    with tarfile.open(src/"papyri.tar.gz","r|gz") as tar:
        for member in tar:
            relative=member.name.split("/",1)[-1]
            if relative.startswith("DDbDP/") and relative[6:] in sample_paths:
                data=tar.extractfile(member).read()
                try:
                    fields=parse_papyrus(data)
                except ET.ParseError:
                    continue
                if not fields:
                    continue
                file_id,hybrid,title,language=fields
                if len(metadata)>=count or file_id in metadata:
                    continue
                material_id=ET.fromstring(data).find(f".//{T}idno[@type='HGV']")
                if material_id is not None and material_id.text:
                    wanted_hgv[material_id.text.strip()]=file_id
                metadata[file_id]=[hybrid,title,language,relative]
                if len(files_ready)<files:
                    files_ready.append((file_id,relative,data))
            elif relative.startswith("HGV_meta_EpiDoc/") and member.isfile():
                identifier=Path(relative).stem
                match=wanted_hgv.get(identifier)
                if not match:
                    continue
                try:
                    record=ET.fromstring(tar.extractfile(member).read())
                except ET.ParseError:
                    continue
                material=" ".join(c.strip() for element in record.iter(T+"material") for c in element.itertext() if c.strip())
                dates=" ".join(c.strip() for element in record.iter(T+"origDate") for c in element.itertext() if c.strip())
                place=" ".join(c.strip() for element in record.iter(T+"origPlace") for c in element.itertext() if c.strip())
                institution=record.find(f".//{T}repository")
                metadata[match].extend([material,dates,place,clean("".join(institution.itertext()) if institution is not None else "")])
            elif relative.startswith("HGV_metadata/") and metadata:
                break
    by_id={}
    for file_id,fields in metadata.items():
        hybrid,title,language,_=fields[:4]
        material,dating,place,holding=fields[4:] if len(fields)==8 else ("","","","")
        form="papyrus" if re.search(r"papyrus|papyr|papyri", material, re.I) else "inscription" if re.search(r"ost(racon|rakon)|wood|stone",material,re.I) else "manuscript"
        by_id[file_id]=row("papyri",file_id,title,"Ancient documentary sources",language,"C","ancient",form,
          "https://papyri.info/ddbdp/"+quote(hybrid,safe=";._-"),PAP_RIGHTS,"Papyri.info DDbDP · "+ref,
          holding=holding,dating=dating,shelfmark=hybrid,description=" · ".join(filter(None,[material,place,
            "DDbDP documentary text. Papyri.info includes editorial notes and related records."])))
    out=list(by_id.values())
    saved=sum(save_edition(directory,by_id[key],"ddbdp-tei","tei","Papyri.info EpiDoc TEI transcription",
                      f"https://raw.githubusercontent.com/papyri/idp.data/{ref}/{path}",data)
              for key,path,data in files_ready if key in by_id)
    return out,saved


def featured():
    rows=json.loads((Path(__file__).resolve().parents[1]/"data/featured-manuscripts.json").read_text())
    return [row(p,id_,title,"Ancient or medieval scribes",lang,"B",("silk" if p=="idp" else "scriptural"),
                material,url,"Facsimile available at the source. Check image rights with the holding institution.",
                "Holding institution's digital catalog",holding=institution,shelfmark=mark,description=desc)
            for p,id_,title,lang,material,institution,mark,url,desc in rows]


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("source",type=Path)
    parser.add_argument("output",type=Path)
    parser.add_argument("--sizes",default="5000,3500,4000,1800",help="LoC, Project Gutenberg, CDLI, Papyri.info catalog counts")
    parser.add_argument("--files",default="90,60,45",help="LoC OCR, CDLI ATF, Papyri.info TEI exact files")
    args=parser.parse_args()
    a,b,c,d=map(int,args.sizes.split(","))
    x,y,z=map(int,args.files.split(","))
    directory=args.output/"editions"
    directory.mkdir(parents=True,exist_ok=True)
    source=args.source
    records=Counter()
    editions=Counter()
    seen=set()
    with (args.output/"records.ndjson").open("w",encoding="utf-8") as index:
        def write(items):
            for item in items:
                if item["work"][0] in seen:
                    continue
                seen.add(item["work"][0]);records[item["source"][0]]+=1
                index.write(json.dumps(item,ensure_ascii=False)+"\n")
            index.flush()
        write(featured())
        if a:
            data,n=loc(source,directory,a,x)
            write(data);editions["ocr"]+=n
            print("Library of Congress",len(data),n,flush=True)
        if b:
            data=gutenberg(source,b)
            write(data)
            print("Project Gutenberg",len(data),flush=True)
        if c:
            data,n=cdli(source,directory,c,y)
            write(data);editions["atf"]+=n
            print("CDLI",len(data),n,flush=True)
        if d:
            data,n=papyri(source,directory,d,z)
            write(data);editions["tei"]+=n
            print("Papyri.info",len(data),n,flush=True)
    report={"records":dict(records),"editions":dict(editions)}
    (args.output/"summary.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report),flush=True)


if __name__=="__main__":
    main()
