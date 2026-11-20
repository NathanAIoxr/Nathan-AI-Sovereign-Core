#!/usr/bin/env python3
"""Regenerates test/vectors.json from the Python reference. Run after any scheme change,
then run BOTH test suites: the TS tests must reproduce every value."""
import json
from pathlib import Path
import ledger as L

cases = []
texts = [
    ("1QIsa-a", "Qumran Cave 1", "parchment", "Hebrew", "extant_verified",
     "  \u05d1\u05e8\u05d0\u05e9\u05d9\u05ea \u05d1\u05e8\u05d0 \u05d0\u05dc\u05d4\u05d9\u05dd  "),
    ("4Q175", "Qumran Cave 4", "parchment", "Paleo-Hebrew", "reconstructed", "line1\nline2\ttabbed \"quoted\" \\ back"),
    ("3Q15", "Qumran Cave 3", "copper", "Hebrew", "extant_verified", "e\u0301 composed? caf\u00e9 \u2028 sep \U0001F4DC \u0001 ctrl"),
]
prev = L.GENESIS_HASH
ts = 1767225600
for i, (sig, site, med, lang, st, raw) in enumerate(texts):
    rec = L.validate_record(dict(scroll_siglum=sig, cave_or_site=site, medium=med, script_lang=lang,
                                 epigraphic_status=st, raw_text=raw,
                                 media_asset_sha256=("ab" * 32) if i == 1 else None))
    c = L.client_hash(rec)
    p = L.payload_hash(rec, c, prev, ts + i)
    cases.append({"input": dict(scroll_siglum=sig, cave_or_site=site, medium=med, script_lang=lang,
                                epigraphic_status=st, raw_text=raw,
                                media_asset_sha256=("ab" * 32) if i == 1 else None),
                  "canonical_content": L.canonical_json(L.content_fields(rec)),
                  "content_nfc": rec["content_nfc"],
                  "client_sha256": c, "prev": prev, "ts": ts + i, "payload_sha256": p})
    prev = p

first_client = cases[0]["client_sha256"]
corr = L.validate_record(dict(entry_type="correction", ref_client_sha256=first_client, scroll_siglum="1QIsa-a",
                              cave_or_site="Qumran Cave 1", medium="parchment", script_lang="Hebrew",
                              epigraphic_status="extant_verified", raw_text="corrected reading"))
cc = L.client_hash(corr)
cases.append({"input": dict(entry_type="correction", ref_client_sha256=first_client, scroll_siglum="1QIsa-a",
                            cave_or_site="Qumran Cave 1", medium="parchment", script_lang="Hebrew",
                            epigraphic_status="extant_verified", raw_text="corrected reading"),
              "canonical_content": L.canonical_json(L.content_fields(corr)),
              "content_nfc": corr["content_nfc"], "client_sha256": cc, "prev": prev, "ts": ts + 3,
              "payload_sha256": L.payload_hash(corr, cc, prev, ts + 3)})

hm = []
for body in ("", '{"records":[{"raw_text":"\u05d0"}]}'):
    hm.append({"secret": "test-secret-key", "ts": "1767225600", "method": "POST", "path": "/ingest?x=1",
               "body": body, "signature": L.sign_request("test-secret-key", "1767225600", "POST", "/ingest?x=1", body)})

out = {"anchor": L.FORMAT_ANCHOR, "cases": cases, "hmac": hm}
Path(__file__).resolve().parent.parent.joinpath("test", "vectors.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote test/vectors.json with", len(cases), "cases")
