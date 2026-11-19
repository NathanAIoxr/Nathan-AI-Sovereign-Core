"""Build a reproducible, allowlisted source archive for the verifier."""
from pathlib import Path
from sys import argv
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

worker = Path(__file__).resolve().parent
app = Path(argv[1])
output = Path(argv[2])
worker_names = (
    "README.md", "build.mjs", "package-agent.py", "worker.mjs", "proof.mjs",
    "proof-ledger.mjs", "proof-ledger.sql", "proof-ledger.test.mjs", "catalog.mjs",
    "catalog.css", "coin-families.json", "additional-coins.json", "conspectus.json",
    "coin_systems_and_values.csv", "quantum.mjs", "quantum-design.json",
    "switchboard.mjs", "switchboard.sql", "tabor_sha256d_mirror.py",
    "tabor_world_crypto.py", "nathan_ai_quantum_miner.py",
)
app_names = (
    "index.html", "style.css", "app.mjs", "engine.mjs", "registry.json",
    "engine.test.mjs", "coin_audit.py", "test_coin_audit.py",
)

with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for root, prefix, names in (
        (worker, "sovereign-currency", worker_names),
        (app, "app-factory/nathan-ai/sovereign-coins", app_names),
    ):
        for name in names:
            info = ZipInfo(f"{prefix}/{name}")
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, (root / name).read_bytes(), compress_type=ZIP_DEFLATED)
