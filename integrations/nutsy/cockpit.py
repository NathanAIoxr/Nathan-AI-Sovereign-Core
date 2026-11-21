"""Serve the owner's NUTSY dashboard on Linux loopback."""

import argparse
from base64 import b64encode
from datetime import datetime, timezone
from hashlib import sha256
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import platform
import re


ASSETS = Path(__file__).resolve().parent
MAX_RECEIPT_BYTES = 2 * 1024 * 1024


def number(value):
    return value if type(value) is int and value >= 0 else None


def load(path, schema=None):
    try:
        with path.open("rb") as stream:
            raw = stream.read(MAX_RECEIPT_BYTES + 1)
        if len(raw) > MAX_RECEIPT_BYTES:
            return {}, "invalid"
        obj = json.loads(raw)
        if not isinstance(obj, dict) or (schema and obj.get("schema") != schema):
            return {}, "invalid"
        return obj, "present"
    except FileNotFoundError:
        return {}, "missing"
    except (OSError, ValueError):
        return {}, "invalid"


def receipt_status(fed, fed_state, profile, profile_state, queues, queue_state, host):
    origin = fed.get("host")
    if fed_state == "present" and (not isinstance(origin, dict) or origin.get("name") != host):
        fed, fed_state = {}, "different host"
    if fed_state != "present":
        origin = {}
    if profile_state == "present" and profile.get("host") != host:
        profile, profile_state = {}, "different host"

    source = fed.get("sources")
    if not isinstance(source, dict):
        source = {}
    fields = {
        "federation": ("assigned", "verified", "pending"),
        "node_manifest": ("count",),
        "rocket": ("super2x_reserved", "hypercomputer_reserved", "enrolled_hardware", "hardware_heartbeats"),
        "dmsp_dit": ("departments",),
    }
    cloud = {}
    for key, allowed in fields.items():
        item = source.get(key)
        item = item if isinstance(item, dict) else {}
        data = item.get("data")
        data = data if isinstance(data, dict) else {}
        status = item.get("state")
        if status not in ("observed", "unavailable", "count_mismatch"):
            status = "missing"
        cloud[key] = {
            "status": status,
            "metrics": {name: number(data.get(name)) for name in allowed},
        }
    clean_rows = []
    rows = queues.get("ubuntu")
    if isinstance(rows, list):
        for row in rows[:100]:
            if not isinstance(row, dict):
                continue
            task_type, status, count = row.get("task_type"), row.get("status"), number(row.get("count"))
            if (count is not None and isinstance(task_type, str) and isinstance(status, str)
                    and re.fullmatch(r"[A-Z0-9_]{1,40}", task_type)
                    and re.fullmatch(r"[A-Z0-9_]{1,40}", status)):
                clean_rows.append(dict(task=task_type, state=status, count=count))
    observed_at = fed.get("observed_at")
    if not isinstance(observed_at, str) or len(observed_at) > 48:
        observed_at = None
    totals = queues.get("cloudflare_totals")
    totals = totals if isinstance(totals, dict) else {}

    return {
        "mode": "local",
        "host": host,
        "resources": {
            "os": origin.get("os") if isinstance(origin.get("os"), str) else None,
            **{key: number(origin.get(key)) for key in
               ("logical_cpu_count", "memory_bytes", "disk_total_bytes", "disk_free_bytes")},
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "federation_receipt": fed_state,
        "federation_observed_at": observed_at,
        "profile_receipt": profile_state,
        "queue_receipt": queue_state,
        "cloud": cloud,
        "profile": {key: number(profile.get(key)) for key in
                    ("cpu_affinity_count", "selected_workers", "measured_terms_per_second", "source_compatible_checksum")},
        "ubuntu_queue": clean_rows,
        "cloudflare_queue": {key: number(totals.get(key)) for key in ("queued", "blocked", "verified", "complete")},
    }


def capture(state):
    fed, fed_state = load(state / "federation.json", "nutsy.federation-receipt.v1")
    profile, profile_state = load(state / "processing.json", "nutsy.processing-profile.v1")
    queues, queue_state = load(state / "queue-reconciliation.json")
    return receipt_status(fed, fed_state, profile, profile_state, queues, queue_state, platform.node())


def handler(state, port):
    html = (ASSETS / "cockpit.html").read_bytes()
    css = re.search(rb"<style>(.*?)</style>", html, re.S)[1]
    js = re.search(rb"<script>(.*?)</script>", html, re.S)[1]
    def hash_source(data):
        return "'sha256-" + b64encode(sha256(data).digest()).decode("ascii") + "'"
    policy = ("default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; "
              f"style-src {hash_source(css)}; script-src {hash_source(js)}; connect-src 'self'")

    class Cockpit(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.headers.get("Host") not in (f"127.0.0.1:{port}", f"localhost:{port}"):
                self.send_error(421)
                return
            if self.path == "/":
                mime, body = "text/html; charset=utf-8", html
            elif self.path == "/api/status":
                mime, body = "application/json", json.dumps(capture(state)).encode("utf-8")
            else:
                self.send_error(404)
                return

            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Security-Policy", policy)
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)

    return Cockpit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, default=Path.home() / ".local/state/nutsy")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--expect-host")
    args = parser.parse_args()
    if args.expect_host and args.expect_host != platform.node():
        parser.error(f"Expected {args.expect_host}; running on {platform.node()}")
    if not 1024 <= args.port <= 65535:
        parser.error("Choose a port in 1024–65535")
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler(args.state_dir, args.port)) as server:
        print(f"NUTSY owner cockpit: http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
