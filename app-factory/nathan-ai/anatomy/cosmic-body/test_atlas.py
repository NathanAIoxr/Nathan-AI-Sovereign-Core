#!/usr/bin/env python3
"""No-dependency consistency checks: complete enumerated sets, no made-up chakras."""
import json
import tempfile
import unittest
from collections import Counter
from pathlib import Path
from build_sqlite import build
import sqlite3

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT/"atlas.json").read_text(encoding="utf-8"))
records = data["records"]
counts = Counter(r["category"] for r in records)
by_id = {r["id"]:r for r in records}

class CosmicBodyAtlasTests(unittest.TestCase):
    def test_246_preserved(self):
        self.assertEqual((counts["spine-pillar"],counts["question-pillar"],counts["bone-pillar"]),(33,7,206))
        self.assertEqual(sum(data["counts"][k] for k in ("spine","question","bones")),246)
        self.assertTrue(all(by_id[f"QUESTION-{i}"]["meta"]["needs_original"] for i in range(1,8)))
    def test_full_named_sets(self):
        self.assertEqual((counts["chakra-upper"],counts["chakra-lower"]),(7,7))
        self.assertEqual((counts["vayu"],counts["manipura-petal"],counts["named-nadi"]),(5,10,10))
        self.assertEqual((counts["ayurvedic-agni"],counts["jyotisha-graha"],counts["jyotisha-rashi"]),(13,9,12))
        self.assertEqual([r["label"] for r in records if r["category"]=="manipura-petal"],
                        ["Ḍa","Ḍha","Ṇa","Ta","Tha","Da","Dha","Na","Pa","Pha"])
    def test_separate_traditions(self):
        self.assertEqual(by_id["SYS-114-ISHA"]["meta"]["internal"],112)
        self.assertEqual(by_id["SYS-114-ISHA"]["meta"]["external"],2)
        self.assertEqual(by_id["SYS-114-ISHA"]["meta"]["workable"],108)
        self.assertEqual(sum(by_id["SYS-114-RAY"]["meta"][k] for k in ("major","minor","other")),114)
    def test_mirror_math(self):
        a=by_id["ROOT-MIRROR"]["meta"]["tokens"]
        self.assertEqual(a,a[::-1])
        original="".join(a)
        self.assertNotEqual(original,original[::-1])
        b=by_id["ROOT-MOTHER"]["meta"]["character_palindrome"]
        self.assertEqual(b,b[::-1])
        values=[ord(c)-64 for c in b]
        self.assertEqual(sum(values),114)
        self.assertEqual(sum(values[:3]+values[-3:]),72)
        self.assertEqual(sum(values[3:5]),42)
    def test_foreign_keys_and_build(self):
        with tempfile.TemporaryDirectory() as folder:
            fn=Path(folder)/"atlas.sqlite"
            result=build(fn)
            self.assertEqual(result["integrity"],"ok")
            with sqlite3.connect(fn) as db:
                self.assertEqual(db.execute("select count(*) from concepts").fetchone()[0],len(records))
                self.assertEqual(db.execute("select count(*) from concept_links").fetchone()[0],len(data["links"]))
                self.assertEqual(db.execute("select count(*) from source_transcripts").fetchone()[0],1)
                self.assertGreaterEqual(db.execute("select count(*) from concept_search where concept_search match 'navel'").fetchone()[0],1)
    def test_sources_and_attribution(self):
        ids={s["id"] for s in data["sources"]}
        concept_ids=set(by_id)
        self.assertTrue(all(set(r["source_ids"])<=ids for r in records))
        self.assertTrue(all(e["from"] in concept_ids and e["to"] in concept_ids for e in data["links"]))
        self.assertTrue(all(r["tier"] in ("CERO","UNO","DOS") for r in records))
        self.assertEqual(by_id["ROOT-TABOR"]["tier"],"DOS")
        self.assertEqual(by_id["ROOT-SPACE"]["tier"],"CERO")

if __name__=="__main__":
    unittest.main()
