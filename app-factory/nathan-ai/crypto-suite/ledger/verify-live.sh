#!/usr/bin/env bash
set -euo pipefail

directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
endpoint=https://nathan-ai-mining-lab.nathantaboract.workers.dev/api/crypto-mirror
temporary="$(mktemp -d)"
trap 'rm -rf -- "$temporary"' EXIT

expected="$(python3 "$directory/verify.py")"
curl --fail --silent --show-error --max-time 20 "$endpoint/state.bin" --output "$temporary/state.bin"
cmp "$directory/state.json" "$temporary/state.bin"
curl --fail --silent --show-error --max-time 20 "$endpoint" --output "$temporary/status.json"
python3 - "$temporary/status.json" "$expected" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as response:
    status = json.load(response)
if (status["verification"] != 2 or status["stateSha256"] != sys.argv[2]
        or status["repositoryReceiptSha256"] != sys.argv[2]
        or status["d1Matches"] is not True or status["historicalProofsMatch"] is not True):
    raise SystemExit("Worker and D1 verification failed")
print(f"Verification 2: {sys.argv[2]}")
PY
