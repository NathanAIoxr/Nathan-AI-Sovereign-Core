"""Build the original-numbered Tabor Concordance from the two Strong XML dictionaries."""
import argparse
import csv
import hashlib
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

OSIS = "{http://www.bibletechnologies.net/2003/OSIS/namespace}"
GAPS = {2717, *range(3203, 3303)}
KEY = re.compile(r"\b[HG][0-9]{1,4}\b")
VERSE = re.compile(r"\b\d{1,3}:\d{1,3}\b")
UNCERTAIN = re.compile(r"\b(?:probably|perhaps|apparently|presumed|supposed|possibly|uncertain|doubtful)\b", re.I)
SENSES = {
    "H1":"father", "H6":"to wander away, lose oneself or perish", "H215":"to be or make luminous",
    "H216":"light, illumination", "H226":"a sign or signal", "H426":"a god or deity", "H433":"a deity",
    "H1254":"to create", "H1918":"myrtle", "H1961":"to exist, be or become",
    "H1984":"to be clear, shine or boast", "H2287":"to move in a circle or keep a festival",
    "H2616":"to be kind", "H3068":"self-existent or eternal", "H7665":"to burst or break",
    "H7853":"to attack or accuse", "H7854":"an adversary", "H8396":"broken region", "H8406":"to be fragile",
    "G1":"first letter of the Greek alphabet", "G18":"good", "G25":"to love", "G26":"love, affection or benevolence",
    "G302":"supposition, wish, possibility or uncertainty", "G687":"question expecting a negative answer",
    "G814":"irregularly", "G906":"to throw", "G976":"inner bark of papyrus",
    "G1065":"emphasis or qualification", "G1097":"to know", "G1122":"writer", "G1223":"through",
    "G1225":"to slander or bring a false charge", "G1228":"slanderer or false accuser",
    "G1473":"I", "G1537":"from, out of", "G1682":"my God", "G1848":"to despise", "G2073":"evening",
    "G2289":"to kill", "G2316":"a deity", "G2366":"storm", "G2402":"perspiration",
    "G3004":"to lay forth or relate in words", "G3526":"black", "G3718":"to make a straight cut",
    "G4154":"to breathe hard or blow", "G4566":"adversary", "G4567":"the accuser", "G5333":"sorcerer",
}
ROOT_GLOSSES = {"G1","G302","G976","G1065","G1473","G1537","G1682","G3526","G4567","H3068","H8396"}
EXACT_REFS = {"G2073": [], "G4567": [("G4566","")], "G5333":[("G5332","")]}


def normalize(value):
    return unicodedata.normalize("NFC", re.sub(r"\s+([,.;:])", r"\1", " ".join(value.split())))


def brief(value):
    for _ in range(8):
        value = re.sub(r"\([^()]*\)|\[[^\[\]]*\]|\{([^{}]*)\}", r"\1", value)
    value = re.split(r":\s*--|[;()]|\b(?:specially|especially|used only|used as|in the New Testament)\b", value, 1, re.I)[0]
    value = re.sub(r"^(?:properly|literally|figuratively|abstractly|concretely)\s*,?\s*", "", value, flags=re.I)
    value = KEY.sub("", value)
    value = normalize(re.sub(r"\bi\.\s*e\.\s*", "", value)).strip(" ,:.;{}[]")
    return "" if VERSE.search(value) or value in {"or", "-"} else value


def node_text(element):
    return "" if element is None else "".join(element.itertext())


def origin_parts(element, prefix):
    if element is None:
        return "", [], [], ""
    refs = []
    literal_sources = []
    literal_name = ""
    text = element.text or ""
    for child in element:
        kind = child.tag.split("}")[-1]
        clause = re.split(r"[;\[(]", text)[-1]
        section = text.rsplit(";",1)[-1]
        insides = section.count("(") + section.count("[") - section.count(")") - section.count("]")
        comparison = re.search(r"\b(?:compare|see|as in|in the sense of|similar to)\b",clause,re.I)
        annotation = insides > 0 and re.search(r"used after|pronounced|being implied|sense of|(?:first|second) part",clause,re.I)
        root_id = ""
        if kind == "strongsref":
            root_id = ("H" if child.get("language") == "HEBREW" else "G") + str(int(child.get("strongs")))
        elif kind == "w" and child.get("src","").isdigit():
            root_id = prefix + str(int(child.get("src")))
        form = child.get("unicode") or child.get("lemma") or child.text or ""
        tail = child.tail or ""
        if not (comparison or annotation):
            if root_id:
                sense = re.match(r"\s*\((?:as|in the sense of)\s+(?:a\s+)?([^()]+)\)",tail,re.I)
                modifier = brief(sense[1]) if sense else ""
                modifiers = {"negative particle":"not","negative prefix":"not","particle of union":"together"}
                refs.append((root_id,modifiers.get(modifier,modifier)))
                gloss = re.match(r"\s*;\s*([^;]+)\s*;",tail)
                if prefix=="H" and gloss and not literal_name:
                    candidate=gloss[1]
                    if not re.search(r"\b(?:compare|see|same as|variation|plural|form of|used|conjectural)\b|^(?:and|also|of|or)\b",candidate,re.I):
                        reading=brief(candidate)
                        if len(reading)<=78:
                            literal_name=reading
            elif kind in {"greek","latin","w"} and form:
                sense=re.match(r"\s*\(([^()]+)\)",tail)
                if sense and not re.search(r"as in|compare|used|^or\b",sense[1],re.I):
                    reading=brief(sense[1])
                    if reading:
                        literal_sources.append([None,normalize(form),reading])
        text += ("" if kind in {"note","pronunciation"} else root_id or form) + tail
    unattested=re.search(r"(?:unused|obsolete|unattested) (?:root|word)\s*\((?:meaning\s+)?([^()]+)\)",text,re.I)
    if unattested and brief(unattested[1]):
        literal_sources.append([None,"",brief(unattested[1])])
    return normalize(text), refs, literal_sources, literal_name


def make_entry(key, language, word, translit, origin_element, definition, name):
    prefix=key[0]
    origin, refs, unnumbered, literal_name=origin_parts(origin_element,prefix)
    primary=bool(re.search(r"\b(?:primitive|primary) (?:root|word|verb|noun|particle|pronoun|preposition|adjective|adverb)\b",origin,re.I))
    if primary and re.match(r"a (?:primitive|primary)\b", origin,re.I):
        refs=[]
    refs=EXACT_REFS.get(key,refs)
    sense=SENSES.get(key,brief(definition))
    if name and key not in SENSES:
        has_literal_greek_sense = ";" in definition and not re.search(r"\b(?:a place|a city|a region|a river|of Moses|Israelite|Roman|the name)\b",sense,re.I)
        sense=literal_name or (sense if prefix=="G" and has_literal_greek_sense else "")
    explicit=SENSES[key] if key in ROOT_GLOSSES else literal_name
    stated_origin=re.split(r";|\bcompare\b|\bused\b|\bdenoting\b",origin,1,flags=re.I)[0]
    tentative=bool(UNCERTAIN.search(stated_origin))
    derivation=bool(re.search(r"\b(?:from|origin|derivation|affinity|akin|corresponding|same as|form of|variation|compound|denominative|contracted|derivative|compare)\b",origin,re.I))
    return {
        "word":normalize(word), "translit":translit, "language":language, "refs":refs,
        "unnumbered":unnumbered, "sense":sense, "explicit":explicit,
        "tentative":tentative, "standalone":(not derivation or primary) and not name,
    }


def hebrew(path):
    for entry in ET.parse(path).findall(f'.//{OSIS}div[@type="entry"]'):
        word=entry.find(f"{OSIS}w")
        key="H"+entry.get("n")
        assert word.get("ID")==key
        origin=entry.find(f'{OSIS}note[@type="exegesis"]')
        lang=word.get("{http://www.w3.org/XML/1998/namespace}lang")
        aramaic=lang=="arc" or node_text(origin).strip().startswith("(Aramaic)")
        yield key,make_entry(key,"Aramaic" if aramaic else "Hebrew",word.get("lemma"),word.get("xlit",""),origin,
                             node_text(entry.find(f'{OSIS}note[@type="explanation"]')),word.get("morph","").startswith("n-pr"))


def greek(path):
    for entry in ET.parse(path).findall("./entries/entry"):
        number=int(entry.get("strongs"))
        word=entry.find("greek")
        if word is None:
            assert number in GAPS
            continue
        forms=[]
        for child in entry:
            if child.tag in {"strongs_derivation","strongs_def","kjv_def"}:
                break
            if child.tag=="greek":
                forms.append(child)
        key="G"+str(number)
        yield key,make_entry(key,"Greek"," / ".join(x.get("unicode") for x in forms)," / ".join(x.get("translit") for x in forms),
                             entry.find("strongs_derivation"),node_text(entry.find("strongs_def")),
                             word.get("unicode")[0].isupper() and number not in {1,5,5598})


def sense_for(key, entries, active):
    if key in active:
        return ""
    value=entries[key]
    if value["sense"]:
        return value["sense"]
    senses=(over or sense_for(k,entries,active | {key}) for k,over in value["refs"] if k in entries)
    return " + ".join(dict.fromkeys(filter(None,senses)))


def rows_for(entries):
    rows=[]
    for key,entry in entries.items():
        roots=[]
        seen={key}
        for parent,override in entry["refs"]:
            if parent in seen or parent not in entries:
                continue
            seen.add(parent)
            meaning=override or sense_for(parent,entries,{key})
            if meaning:
                roots.append([parent,entries[parent]["word"],meaning])
        for item in entry["unnumbered"]:
            if item not in roots:
                roots.append(item)
        summary=entry["explicit"] or (entry["sense"] if not roots and entry["standalone"] else "")
        state="tentative" if entry["tentative"] else "available"
        if not (summary or roots):
            state="unavailable"
        rows.append([key,entry["word"],entry["language"],entry["translit"],state,summary,roots])
    return rows


def printable(row):
    _,_,_,_,state,summary,roots=row
    if state=="unavailable":
        return "Root meaning unavailable"
    pieces=[summary] if summary else []
    for key,word,meaning in roots:
        label=" ".join(filter(None,(key,word)))
        pieces.append(f"{label} = {meaning}" if label else meaning)
    return ("Tentative: " if state=="tentative" else "")+" | ".join(pieces)


def write_output(h_path,g_path,target):
    entries=dict([*hebrew(h_path),*greek(g_path)])
    assert set(entries)=={f"H{i}" for i in range(1,8675)}|{f"G{i}" for i in range(1,5625) if i not in GAPS}
    rows=rows_for(entries)
    by_id={row[0]:row for row in rows}
    assert by_id["H8396"][5]=="broken region"
    assert by_id["G3526"][5]=="black"
    assert [r[0] for r in by_id["G1228"][6]]==["G1225"]
    assert [r[0] for r in by_id["G1225"][6]]==["G1223","G906"]
    assert by_id["G4567"][6][0][0]=="G4566"
    assert by_id["H2"][2]=="Aramaic"
    assert all(x[1] and not VERSE.search(printable(x)) for x in rows)
    target.mkdir(parents=True,exist_ok=True)
    for prefix,filename in [("H","hebrew-aramaic.json"),("G","greek.json")]:
        (target/filename).write_text("[\n"+",\n".join(json.dumps(row,ensure_ascii=False,separators=(",",":")) for row in rows if row[0].startswith(prefix))+"\n]\n",encoding="utf-8")
    with (target/"Tabor_Concordance.csv").open("w",encoding="utf-8-sig",newline="") as output:
        writer=csv.writer(output)
        writer.writerow(["Strong’s number","Original word","Root word meaning"])
        writer.writerows((row[0],row[1],printable(row)) for row in rows)
    source_hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (h_path,g_path)}
    (target/"edition.json").write_text(json.dumps({
        "title":"Tabor Concordance","author":"Nathan Tabor","entries":len(rows),
        "languages":dict(Counter(x[2] for x in rows)),"states":dict(Counter(x[4] for x in rows)),
        "source_sha256":source_hashes,
        "columns":["Strong’s ID","original word","language","transliteration","status","root meaning","root components"],
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("hebrew_xml",type=Path)
    parser.add_argument("greek_xml",type=Path)
    parser.add_argument("output",type=Path)
    args=parser.parse_args()
    write_output(args.hebrew_xml,args.greek_xml,args.output)
