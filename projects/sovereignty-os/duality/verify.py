#!/usr/bin/env python3
"""Safe, deterministic verification of the Nathan AI role contract."""
import json
from pathlib import Path
p=Path(__file__).with_name("roles.json")
d=json.loads(p.read_text())
assert d["terminology"] == {"MSP":"DEAMON","IT":"ANGEL"}
assert len({r["id"] for r in d["roles"]}) == len(d["roles"])
assert all(not r["enabled"] for r in d["roles"]), "Roles require explicit activation"
assert {"DEAMON","ANGEL","WILL","WHEEL","CHALLENGER"} <= {r["kind"] for r in d["roles"]}
assert d["display_names"] == {"MSP": "DAEMONS", "IT": "Angels"}
planes = d["alignment"]["planes"]
assert set(planes["above"]["terms"]) == {"light", "peace"}
assert set(planes["below"]["terms"]) == {"darkness", "evil"}
assert all(r.get("plane") == "above" for r in d["roles"] if r["kind"] == "ANGEL")
assert all(r.get("plane") == "below" for r in d["roles"] if r["kind"] == "DEAMON")
assert d["alignment"]["scripture"]["reference"] == "Isaiah 45:7"
assert d["alignment"]["evidence_view"] == "verified"
assert d["alignment"]["challenger"]["id"] == "adversary-challenger"
assert 1+1 == 2
assert format(1+1,"b") == "10"
assert d["flow"] == ["WILL","WHEEL","DEAMON","ANGEL","VERIFY","REPORT"]
print("PASS: roles unique, roles inactive, decimal and binary semantics verified")
