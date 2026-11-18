"""Classical reference for the Nathan Tabor 2X+ design."""
import argparse
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DESIGN = json.loads((ROOT / "design.json").read_text())
FIXTURE = "reference-v1"


def verify():
    add, subtract = DESIGN["axioms"]
    forbidden = "=".join(("1+1", "10"))
    packets = [
        {"op": add, "signal_value": 1},
        {"op": subtract, "signal_value": 0},
        {"op": add, "signal_value": 8, "noise": True},
        {"op": add, "signal_value": 1, "note": forbidden},
    ]
    accepted = [
        packet for packet in packets
        if not packet.get("noise")
        and forbidden not in "".join(json.dumps(packet).split())
        and packet["op"] in DESIGN["axioms"]
        and not (packet["op"] == subtract and packet["signal_value"] == 0)
    ]
    fields = [index % 2 for index in range(78)]
    copies = [fields.copy() for _ in range(3)]
    copies[1][41] ^= 1
    restored = [int(sum(column) >= 2) for column in zip(*copies)] == fields
    rounds = 4096
    return {
        "ok": 1 + 1 == 2 and 1 - 1 == 0 and len(accepted) == 1 and restored,
        "axioms": DESIGN["axioms"],
        "slayer": {"submitted": len(packets), "removed": len(packets) - len(accepted)},
        "sleyer": {"retained": len(accepted), "woven": sum(p["signal_value"] for p in accepted)},
        "redundancyFixture": {"fields": len(fields), "injectedFlips": 1, "restored": restored},
        "logicalSlots": 10 * 32,
        "logicalAxes": 33 * 2,
        "workload": {"rounds": rounds, "checksum": sum(i * 0.5 + 0.25 for i in range(1, rounds + 1))},
        "hplMeasurement": None,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=":memory:", help="SQLite receipt database")
    args = parser.parse_args()
    result = verify()
    if not result["ok"]:
        raise SystemExit("Reference verification failed")
    connection = sqlite3.connect(args.db)
    try:
        with connection:
            connection.executescript((ROOT / "schema.sql").read_text())
            connection.execute(
                "INSERT INTO sovereign_2x_receipts VALUES (?, ?, ?) ON CONFLICT(fixture) DO NOTHING",
                (FIXTURE, datetime.now(timezone.utc).isoformat(), json.dumps(result)),
            )
            created, data = connection.execute(
                "SELECT created_at, receipt FROM sovereign_2x_receipts WHERE fixture = ?", (FIXTURE,)
            ).fetchone()
        print(json.dumps({"fixture": FIXTURE, "createdAt": created, "result": json.loads(data)}, indent=2))
    finally:
        connection.close()


if __name__ == "__main__":
    main()
