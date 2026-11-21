"""Read the existing Tabor cloud fleet and NUTSY's operating resources into one local receipt."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import tempfile
from urllib.error import URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener


ENDPOINTS = {
    "federation": "https://tabor-supercomputer-federation.nathantaboract.workers.dev/v1/tasks",
    "node_manifest": "https://tabor-supercomputer-federation.nathantaboract.workers.dev/v1/nodes",
    "rocket": "https://tabor-bridge.nathantaboract.workers.dev/rocket-conductor/api/status",
    "dmsp_dit": "https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/api/public/departments",
}
MAX_RESPONSE = 1024 * 1024


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def count(value):
    if type(value) is not int or value < 0:
        raise ValueError("Invalid nonnegative resource count")
    return value


def summarize(name, payload):
    if name == "federation":
        assigned, verified, pending = (count(payload[k]) for k in ("assigned", "verified", "pending"))
        if assigned != verified + pending or payload["cohort"] != "tabor-federation-v1":
            raise ValueError("Inconsistent federation status")
        return dict(assigned=assigned, verified=verified, pending=pending,
                    task_version=payload["task_version"], resource_type="sqlite_durable_object")
    if name == "node_manifest":
        ids = [slot["id"] for slot in payload["slots"]]
        if (payload["cohort"] != "tabor-federation-v1" or len(set(ids)) != len(ids)
                or not all(re.fullmatch(r"node-[0-9]{3,}", item) for item in ids)):
            raise ValueError("Invalid federation node identities")
        return {"count": len(ids), "ids": ids}
    if name == "rocket":
        observed = payload["observed"]
        github, fleet = observed["github"], observed["fleet"]
        slots = github["requestedSlots"] if github["ok"] is True else {}
        return {
            "super2x_reserved": count(slots["super2x"]) if slots else None,
            "hypercomputer_reserved": count(slots["hyper"]) if slots else None,
            "enrolled_hardware": count(fleet["registered"]) if fleet["ok"] is True else None,
            "hardware_heartbeats": count(fleet["heartbeats"]) if fleet["ok"] is True else None,
        }
    entries = payload if isinstance(payload, list) else payload["departments"]
    if not isinstance(entries, list) or not all(isinstance(item, dict) for item in entries):
        raise ValueError("Invalid DMSP department catalog")
    return {"departments": len(entries)}


def read_source(name, url):
    try:
        req = Request(url, headers={"Accept": "application/json", "User-Agent": "NUTSY-Federation/1"})
        with build_opener(NoRedirect()).open(req, timeout=8) as response:
            raw = response.read(MAX_RESPONSE + 1)
        if len(raw) > MAX_RESPONSE:
            raise ValueError("Cloud response exceeds byte limit")
        data = summarize(name, json.loads(raw))
        return name, {"url": url, "state": "observed", "data": data, "sha256": hashlib.sha256(raw).hexdigest()}
    except (URLError, OSError, ValueError, KeyError, TypeError) as err:
        return name, {"url": url, "state": "unavailable", "error_type": type(err).__name__}


def capture(filesystem, hostname_expected=None):
    host = platform.node()
    if hostname_expected and hostname_expected != host:
        raise ValueError(f"Expected server {hostname_expected}, running on {host}")
    try:
        os_name = platform.freedesktop_os_release()["PRETTY_NAME"]
    except (OSError, KeyError):
        os_name = platform.system()
    volume = shutil.disk_usage(filesystem)
    with ThreadPoolExecutor(max_workers=len(ENDPOINTS)) as pool:
        sources = dict(pool.map(lambda p: read_source(*p), ENDPOINTS.items()))
    if all(sources[name]["state"] == "observed" for name in ("federation", "node_manifest")):
        if sources["federation"]["data"]["assigned"] != sources["node_manifest"]["data"]["count"]:
            sources["node_manifest"]["state"] = "count_mismatch"
    return {
        "schema": "nutsy.federation-receipt.v1",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "host": {"name": host, "os": os_name, "kernel": platform.release(), "machine": platform.machine(),
                 "logical_cpu_count": os.cpu_count(),
                 "memory_bytes": os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES"),
                 "filesystem": str(filesystem), "disk_total_bytes": volume.total,
                 "disk_free_bytes": volume.free},
        "design_constants": {"pi_anchor": str(Decimal("3.14")), "phi_anchor": str(Decimal("1.618"))},
        "anchors": {"build_binary": format(0b1 + 0b1, "b"), "clear_binary": format(0b1 - 0b1, "b")},
        "sources": sources,
    }


def write_receipt(path, document):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, mode="w", encoding="utf-8", delete=False) as tmp:
        staging = Path(tmp.name)
        try:
            tmp.write(document)
            tmp.flush()
            os.fsync(tmp.fileno())
            os.replace(staging, path)
        finally:
            staging.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--filesystem", type=Path, default=Path("/"))
    parser.add_argument("--expect-host")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        receipt = capture(args.filesystem, args.expect_host)
        document = json.dumps(receipt, indent=2) + "\n"
        if args.output:
            write_receipt(args.output, document)
        else:
            print(document, end="")
    except (OSError, ValueError) as err:
        parser.exit(1, f"{err}\n")
    return 0 if all(source["state"] == "observed" for source in receipt["sources"].values()) else 2


if __name__ == "__main__":
    raise SystemExit(main())
