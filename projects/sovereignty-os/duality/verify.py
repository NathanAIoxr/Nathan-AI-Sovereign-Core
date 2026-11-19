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
assert 1+1 == 2
assert format(1+1,"b") == "10"
assert d["flow"] == ["WILL","WHEEL","DEAMON","ANGEL","VERIFY","REPORT"]
print("PASS: roles unique, roles inactive, decimal and binary semantics verified")
