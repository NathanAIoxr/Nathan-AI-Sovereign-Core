#!/usr/bin/env python3
"""Safe, deterministic verification of the Nathan AI role contract."""
import json
from pathlib import Path
root = Path(__file__).parent
contract = json.loads((root / "roles.json").read_text(encoding="utf-8"))
systems = json.loads((root / "game-assignments.json").read_text(encoding="utf-8"))["systems"]
roles = contract["roles"]
above = {"WILL", "WHEEL", "ANGEL", "WAY"}
below = {"DAEMON", "CHALLENGER"}

assert contract["terminology"] == {"MSP": "DAEMON", "IT": "ANGEL"}
assert len({role["id"] for role in roles}) == len(roles)
assert {role["kind"] for role in roles if role["plane"] == "ABOVE"} == above
assert {role["kind"] for role in roles if role["plane"] == "BELOW"} == below
assert all(not role["enabled"] for role in roles)
assert contract["deployment"]["work_dispatch"] is False
assert contract["alignment"]["noise"]["operator"] == f"1-1={1-1}"
assert contract["alignment"]["rule"]["operator"] == f"1+1={1+1}"
assert contract["alignment"]["rule"]["replaces"] == "1=1=10"
assert format(1 + 1, "b") == "10"
assert contract["flow"] == ["WILL", "WHEEL", "DAEMON", "CHALLENGER", "ANGEL", "WAY", "REPORT"]
assert len({system["id"] for system in systems}) == len(systems) == 20
assert all(system["below_daemon"] and system["above_angel"] for system in systems)
print(f"PASS: {len(roles)} roles, 20 independent system assignments, and arithmetic alignment")
