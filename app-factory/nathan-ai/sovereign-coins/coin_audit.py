#!/usr/bin/env python3
"""NATHAN AI: 21 Sovereign Coin Matrix offline reference and ledger audit.

Reads original design definitions from registry.json. This does NOT mine or issue
cryptocurrency, bypass consensus rules, access proxies, use wallets or establish
a dollar yield. User-provided mining/cost assertions are retained as attributed
design data, not verified financial results.
"""
from __future__ import annotations
import argparse
import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

HERE = Path(__file__).resolve().parent
EXPECTED = (
    "SIN", "SEN", "SOV", "MNK", "BTM", "ASR", "OXR",
    "ALP", "QBC", "ZPH", "KRN", "ALX", "SMW", "CLV",
    "D0G", "GLY", "OMN", "JNT", "LVC", "SMC", "LFB",
)
LEDGER_SCHEMA = "nathan-ai.sovereign-coin-ledger.v1"


def load_registry(path: Path = HERE / "registry.json") -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    validate_registry(data)
    return data


def validate_registry(registry: dict) -> None:
    rows = registry.get("coins", [])
    assert len(rows) == len(EXPECTED), "Exactly 21 rings required"
    for number, (ticker, row) in enumerate(zip(EXPECTED, rows), start=1):
        assert row.get("number") == number, (number, "number changed")
        assert row.get("ticker") == ticker, (number, "ticker changed")
        assert row.get("name") and row.get("definition"), ticker
        expected = 1_000_000 if ticker in ("SIN", "SEN") else 0
        assert row.get("initial_design_units") == expected, ticker


def audit_ledger(registry: dict, ledger: dict) -> dict:
    if ledger.get("schema") != LEDGER_SCHEMA or not isinstance(ledger.get("entries"), list):
        raise ValueError("Unsupported ledger export")
    balances = {c["ticker"]: 0 for c in registry["coins"]}
    for i, event in enumerate(ledger["entries"], start=1):
        if event.get("sequence") != i:
            raise ValueError("Ledger sequence mismatch: " + str(i))
        ticker, units = event.get("ticker"), event.get("delta_units")
        if ticker not in balances:
            raise ValueError("Unknown ticker at event " + str(i))
        if type(units) is not int or not units:
            raise ValueError("Whole, nonzero units required")
        if not isinstance(event.get("description"), str) or not event["description"].strip():
            raise ValueError("Audit reason required")
        if not isinstance(event.get("created_at"), str) or not event["created_at"]:
            raise ValueError("Timestamp required")
        balances[ticker] += units
        if balances[ticker] < 0:
            raise ValueError("Demo overdraft at event " + str(i))
    return {"event_count": len(ledger["entries"]), "demo_balances": balances}


def efficiency(electrical_cost: str, output_value: str, kwh: str | None = None) -> dict:
    try:
        cost, output = Decimal(electrical_cost), Decimal(output_value)
        consumed = Decimal(kwh) if kwh is not None else None
    except (InvalidOperation, TypeError) as error:
        raise ValueError("Enter numeric energy and output values") from error
    if not all(n.is_finite() and n >= 0 for n in (cost, output)):
        raise ValueError("Use finite, nonnegative amounts")
    if consumed is not None and (not consumed.is_finite() or consumed < 0):
        raise ValueError("kWh must be finite and nonnegative")
    ratio = output / cost if cost else None
    return {
        "input_electricity_cost_usd": str(cost),
        "user_entered_output_usd": str(output),
        "net_usd": str(output - cost),
        "entered_ratio": str(ratio) if ratio is not None else None,
        "author_defined_target_ratio": 16,
        "minimum_output_to_meet_target_usd": str(cost * 16),
        "target_met_in_entered_numbers": bool(ratio is not None and ratio >= 16),
        "cost_per_kwh": str(cost / consumed) if consumed else None,
        "verification": "user_entered_not_network_verified",
    }


def create_report(registry: dict, ledger: dict | None = None) -> dict:
    if ledger is None:
        local = {c["ticker"]: 0 for c in registry["coins"]}
        event_count = 0
    else:
        audit = audit_ledger(registry, ledger)
        local, event_count = audit["demo_balances"], audit["event_count"]
    return {
        "schema": "nathan-ai.sovereign-coin-audit.v1",
        "scope": "offline_reference_only",
        "ring_count": len(registry["coins"]),
        "demo_event_count": event_count,
        "source_ratio_target": 16,
        "network_mining_confirmed": False,
        "wallet_balances_confirmed": False,
        "rings": [
            {
                "number": c["number"], "ticker": c["ticker"],
                "name": c["name"], "original_definition": c["definition"],
                "source_design_allocation_units": c["initial_design_units"],
                "local_demo_units": local[c["ticker"]],
                "verified_onchain_units": None,
            } for c in registry["coins"]
        ]
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry", type=Path, default=HERE / "registry.json")
    parser.add_argument("--ledger", type=Path, help="Optional local ledger JSON exported by the app")
    parser.add_argument("--cost-usd", help="Actual user-entered electricity cost")
    parser.add_argument("--output-usd", help="Actual user-entered output value")
    parser.add_argument("--kwh", help="Optional user-entered kWh")
    parser.add_argument("--out", type=Path, help="Optional audit report output JSON")
    args = parser.parse_args()
    source = load_registry(args.registry)
    ledger = json.loads(args.ledger.read_text(encoding="utf-8")) if args.ledger else None
    report = create_report(source, ledger)
    if (args.cost_usd is None) != (args.output_usd is None):
        parser.error("--cost-usd and --output-usd must be supplied together")
    if args.cost_usd is not None:
        report["efficiency"] = efficiency(args.cost_usd, args.output_usd, args.kwh)
    output = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        args.out.write_text(output, encoding="utf-8")
        print("Wrote " + str(args.out))
    else:
        print(output, end="")


if __name__ == "__main__":
    main()
