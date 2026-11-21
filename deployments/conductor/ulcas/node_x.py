"""ULCAS Node X: typed intents, isolated producers, and durable reconciliation."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
from threading import BoundedSemaphore
from urllib.parse import parse_qs, urlsplit
from urllib.request import HTTPRedirectHandler, build_opener

LIMIT = 16_384
CID = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_-]{7,63}")
SHA = re.compile(r"[a-f0-9]{40}")
UNIT = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_.@-]{0,120}\.service")
LABEL = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_./:-]{0,127}")
FORWARD = {
    "service.status": 1, "service.restart": 1,
    "github.propose": 2, "github.verify": 2, "edge.health": 3, "edge.change": 3,
    "system.snapshot": 4, "config.validate": 5, "config.apply": 5,
    "audit.record": 6,
}
REVERSE = {"alert": 7, "ci": 8, "edge": 9, "pulse": 10, "drift": 11}
MUTATIONS = {"service.restart", "github.propose", "edge.change", "config.apply"}


class Problem(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message


def canonical(data):
    return json.dumps(data, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def merkle(hashes):
    nodes = [hashlib.sha256(b"\x00" + bytes.fromhex(value)).digest() for value in hashes]
    while len(nodes) > 1:
        if len(nodes) % 2:
            nodes.append(nodes[-1])
        nodes = [hashlib.sha256(b"\x01" + nodes[i] + nodes[i + 1]).digest()
                 for i in range(0, len(nodes), 2)]
    return nodes[0].hex()


def shape(data, fields, optional=()):
    if not isinstance(data, dict) or set(fields) - data.keys() or data.keys() - set(fields) - set(optional):
        raise Problem(400, "invalid_fields")


def match(pattern, value):
    return isinstance(value, str) and pattern.fullmatch(value) is not None


def require(condition, message="invalid_value"):
    if not condition:
        raise Problem(400, message)


def reject_constant(_):
    raise ValueError("non-finite number")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class Node:
    def __init__(self, db_path, tokens, key, units=(), repo="", edge_url="", probe=None):
        values = list(tokens.values()) + [key]
        if "operator" not in tokens or any(not v.isascii() or len(v) < 32 or
                                            v == "replace-with-strong-token" or
                                            any(c.isspace() for c in v) for v in values):
            raise ValueError("configured operator and ledger secrets must be ASCII and at least 32 characters")
        if len(set(values)) != len(values) or set(tokens) - {"operator", *REVERSE}:
            raise ValueError("every role and the ledger need distinct secrets")
        if any(not match(UNIT, u) for u in units):
            raise ValueError("invalid service allowlist")
        if edge_url:
            parsed = urlsplit(edge_url)
            if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.fragment:
                raise ValueError("edge health must use an operator-configured HTTPS URL")
        self.db_path, self.tokens, self.key = db_path, tokens, key.encode()
        self.units, self.repo, self.edge_url = frozenset(units), repo, edge_url
        self.probe = probe or self.run_probe
        with self.db() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS crossings (
                    cid TEXT PRIMARY KEY, fingerprint TEXT NOT NULL,
                    state TEXT NOT NULL, request TEXT NOT NULL, receipt TEXT
                );
                CREATE TABLE IF NOT EXISTS ulcas_events (
                    seq INTEGER PRIMARY KEY, cid TEXT NOT NULL, lane INTEGER NOT NULL,
                    entry TEXT NOT NULL, hash TEXT NOT NULL UNIQUE
                );
                CREATE TABLE IF NOT EXISTS ulcas_checkpoints (
                    first_seq INTEGER PRIMARY KEY, last_seq INTEGER UNIQUE NOT NULL,
                    root TEXT NOT NULL, signature TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS ulcas_producer_keys (
                    role TEXT NOT NULL, event_id TEXT NOT NULL, fingerprint TEXT NOT NULL,
                    seq INTEGER NOT NULL, PRIMARY KEY (role, event_id)
                );
                CREATE TRIGGER IF NOT EXISTS ulcas_events_no_update BEFORE UPDATE ON ulcas_events
                BEGIN SELECT RAISE(ABORT, 'append only'); END;
                CREATE TRIGGER IF NOT EXISTS ulcas_events_no_delete BEFORE DELETE ON ulcas_events
                BEGIN SELECT RAISE(ABORT, 'append only'); END;
                CREATE TRIGGER IF NOT EXISTS ulcas_checkpoints_no_update BEFORE UPDATE ON ulcas_checkpoints
                BEGIN SELECT RAISE(ABORT, 'append only'); END;
                CREATE TRIGGER IF NOT EXISTS ulcas_checkpoints_no_delete BEFORE DELETE ON ulcas_checkpoints
                BEGIN SELECT RAISE(ABORT, 'append only'); END;
            """)

    @contextmanager
    def db(self, write=False):
        conn = sqlite3.connect(self.db_path, timeout=5, isolation_level=None)
        conn.row_factory = sqlite3.Row
        try:
            if write:
                conn.execute("BEGIN IMMEDIATE")
            yield conn
            if write:
                conn.commit()
        except BaseException:
            conn.rollback()
            raise
        finally:
            conn.close()

    def authenticate(self, authorization):
        supplied = authorization or ""
        role = None
        for name, token in self.tokens.items():
            if hmac.compare_digest(supplied.encode(), ("Bearer " + token).encode()):
                role = name
        if role is None:
            raise Problem(401, "unauthorized")
        return role

    @staticmethod
    def operator(role):
        if role != "operator":
            raise Problem(403, "operator_required")

    @staticmethod
    def append(db, cid, lane, kind, data):
        prev = db.execute("SELECT seq, hash FROM ulcas_events ORDER BY seq DESC LIMIT 1").fetchone()
        seq, prior = (prev["seq"] + 1, prev["hash"]) if prev else (1, "0" * 64)
        entry = canonical({"seq": seq, "cid": cid, "lane": lane, "kind": kind,
                           "time": datetime.now(timezone.utc).isoformat(),
                           "data": data, "previous_sha256": prior})
        checksum = digest(entry)
        db.execute("INSERT INTO ulcas_events VALUES (?, ?, ?, ?, ?)", (seq, cid, lane, entry, checksum))
        return seq

    def translate(self, request):
        shape(request, ("cid", "intent"), ("target", "arguments"))
        cid, intent = request["cid"], request["intent"]
        require(match(CID, cid) and isinstance(intent, str) and intent in FORWARD,
                "invalid_cid_or_intent")
        target, args = request.get("target", ""), request.get("arguments", {})
        require(isinstance(args, dict))
        if intent.startswith("service."):
            require(isinstance(target, str) and target in self.units, "service_not_registered")
            shape(args, ())
        elif intent in ("github.propose", "github.verify"):
            require(bool(self.repo) and target == self.repo, "repository_not_registered")
            shape(args, ("expected_sha", "change_digest") if intent == "github.propose" else ("expected_sha",))
            require(match(SHA, args["expected_sha"]))
            if intent == "github.propose":
                require(match(re.compile(r"[a-f0-9]{64}"), args["change_digest"]))
        elif intent.startswith("edge."):
            require(target == "registered-edge" and bool(self.edge_url), "edge_not_registered")
            shape(args, () if intent == "edge.health" else ("change_digest",))
            if intent == "edge.change":
                require(match(re.compile(r"[a-f0-9]{64}"), args["change_digest"]))
        elif intent == "config.validate":
            require(target == "node-x")
            shape(args, ("revision", "services"))
            require(match(SHA, args["revision"]) and isinstance(args["services"], list))
            require(len(args["services"]) <= 64 and all(match(UNIT, value) for value in args["services"]))
            require(len(set(args["services"])) == len(args["services"]))
        elif intent == "config.apply":
            require(target == "node-x")
            shape(args, ("change_digest",))
            require(match(re.compile(r"[a-f0-9]{64}"), args["change_digest"]))
        else:
            require(target == "")
            shape(args, () if intent == "system.snapshot" else ("evidence_sha256",))
            if args:
                require(match(re.compile(r"[a-f0-9]{64}"), args["evidence_sha256"]))
        return {"cid": cid, "lane": FORWARD[intent], "intent": intent, "target": target, "arguments": args}

    def run_probe(self, intent, target):
        if intent == "service.status":
            proc = subprocess.run(
                ["/usr/bin/systemctl", "is-active", "--", target],
                capture_output=True, text=True, timeout=3, check=False,
            )
            state = proc.stdout.strip()
            evidence = {"exit_code": proc.returncode, "unit_state": state if state in
                        {"active", "inactive", "failed", "activating", "deactivating", "unknown"} else "unknown"}
            return ("succeeded" if proc.returncode == 0 and state == "active" else "failed"), evidence
        if intent == "edge.health":
            with build_opener(NoRedirect).open(self.edge_url, timeout=5) as response:
                status = response.status
            return ("succeeded" if 200 <= status < 300 else "failed"), {"http_status": status}
        disk = shutil.disk_usage(Path(self.db_path).parent)
        return "succeeded", {"load_average": list(os.getloadavg()), "disk_free_bytes": disk.free}

    def record_miss(self, role, method, path, error):
        lane = REVERSE.get(role, 6)
        if error.status == 409:
            disposition = "quarantined"
        elif error.status == 403:
            disposition = "discarded"
        else:
            disposition = "fix_and_resubmit"
        with self.db(write=True) as db:
            self.append(db, "miss-" + os.urandom(12).hex(), lane, "missed_x", {
                "role": role, "method": method, "route": path,
                "reason": error.message, "disposition": disposition,
            })
        return disposition

    def drive(self, role, request):
        self.operator(role)
        packet = self.translate(request)
        cid, lane, intent = packet["cid"], packet["lane"], packet["intent"]
        encoded = canonical(packet)
        fingerprint = digest(encoded)
        with self.db(write=True) as db:
            row = db.execute("SELECT * FROM crossings WHERE cid = ?", (cid,)).fetchone()
            if row:
                if row["fingerprint"] != fingerprint:
                    raise Problem(409, "cid_conflict")
                if row["receipt"]:
                    return json.loads(row["receipt"])
            else:
                db.execute("INSERT INTO crossings VALUES (?, ?, ?, ?, NULL)",
                           (cid, fingerprint, "accepted", encoded))
                self.append(db, cid, lane, "forward_hit_x", packet)
                self.append(db, cid, 6, "forward_audit", {"request_sha256": fingerprint, "forward_lane": lane})
        if intent in MUTATIONS:
            state, evidence = "awaiting_approval", {"request_sha256": fingerprint}
        elif intent == "github.verify":
            state, evidence = "awaiting_ci", {"expected_sha": packet["arguments"]["expected_sha"]}
        elif intent == "config.validate":
            state, evidence = "succeeded", {"schema": "registered-services/v1", "request_sha256": fingerprint}
        elif intent == "audit.record":
            state, evidence = "succeeded", packet["arguments"]
        else:
            try:
                state, evidence = self.probe(intent, packet["target"])
            except (OSError, subprocess.TimeoutExpired):
                state, evidence = "failed", {"reason": "adapter_error"}
        receipt = {"cid": cid, "lane": lane, "state": state, "evidence": evidence}
        with self.db(write=True) as db:
            row = db.execute("SELECT receipt FROM crossings WHERE cid = ?", (cid,)).fetchone()
            if row["receipt"]:
                return json.loads(row["receipt"])
            self.append(db, cid, 12, "return_hit_x", receipt)
            db.execute("UPDATE crossings SET state=?, receipt=? WHERE cid=?",
                       (state, canonical(receipt), cid))
        return receipt

    def ingest(self, role, payload):
        if role not in REVERSE:
            raise Problem(403, "producer_required")
        shape(payload, ("event_id", "data"), ("cid",))
        event_id, data = payload["event_id"], payload["data"]
        cid = payload.get("cid", event_id)
        require(match(CID, event_id) and match(CID, cid))
        if role == "ci":
            require("cid" in payload, "ci_requires_original_cid")
            shape(data, ("sha", "run_id", "conclusion"))
            require(match(SHA, data["sha"]) and type(data["run_id"]) is int and data["run_id"] > 0 and
                    data["conclusion"] in ("success", "failure", "cancelled", "skipped"))
        elif role == "alert":
            shape(data, ("code", "severity"))
            require(match(LABEL, data["code"]) and data["severity"] in ("warning", "critical"))
        elif role == "edge":
            shape(data, ("colo", "status", "duration_ms"))
            require(match(re.compile(r"[A-Z]{3}"), data["colo"]) and type(data["status"]) is int and
                    100 <= data["status"] <= 599 and type(data["duration_ms"]) is int and
                    0 <= data["duration_ms"] <= 600_000)
        elif role == "pulse":
            shape(data, ("host", "uptime_seconds", "disk_free_bytes"))
            require(match(LABEL, data["host"]) and all(type(data[k]) is int and data[k] >= 0
                    for k in ("uptime_seconds", "disk_free_bytes")))
        else:
            shape(data, ("repository", "action", "number"))
            require(bool(self.repo) and data["repository"] == self.repo and
                    data["action"] in ("opened", "closed", "synchronize") and
                    type(data["number"]) is int and data["number"] > 0)
        fingerprint = digest(canonical(payload))
        with self.db(write=True) as db:
            existing = db.execute("SELECT fingerprint,seq FROM ulcas_producer_keys WHERE role=? AND event_id=?",
                                  (role, event_id)).fetchone()
            if existing:
                if existing["fingerprint"] != fingerprint:
                    raise Problem(409, "producer_event_conflict")
                return {"event_seq": existing["seq"], "state": "recorded"}
            if role == "ci":
                row = db.execute("SELECT request,state FROM crossings WHERE cid=?", (cid,)).fetchone()
                if not row:
                    raise Problem(409, "unknown_ci_cid")
                crossing = json.loads(row["request"])
                if crossing["intent"] != "github.verify" or crossing["arguments"]["expected_sha"] != data["sha"]:
                    raise Problem(409, "ci_sha_mismatch")
                if row["state"] != "awaiting_ci":
                    raise Problem(409, "ci_already_reconciled")
            seq = self.append(db, cid, REVERSE[role], "reverse_hit_x", {"producer": role, **data})
            if role == "ci":
                state = "succeeded" if data["conclusion"] == "success" else "failed"
                receipt = {"cid": cid, "lane": 2, "state": state, "evidence": data}
                self.append(db, cid, 12, "return_hit_x", receipt)
                db.execute("UPDATE crossings SET state=?,receipt=? WHERE cid=?",
                           (state, canonical(receipt), cid))
            db.execute("INSERT INTO ulcas_producer_keys VALUES (?, ?, ?, ?)", (role, event_id, fingerprint, seq))
        return {"event_seq": seq, "state": "recorded"}

    def entries(self, role, after, limit, cid=None):
        self.operator(role)
        require(0 <= after <= 2**63 - 1 and 1 <= limit <= 100)
        with self.db() as db:
            if cid is None:
                rows = db.execute(
                    "SELECT entry,hash FROM ulcas_events WHERE seq > ? AND lane >= 7 ORDER BY seq LIMIT ?",
                    (after, limit),
                ).fetchall()
            else:
                require(match(CID, cid))
                rows = db.execute(
                    "SELECT entry,hash FROM ulcas_events WHERE seq > ? AND cid=? ORDER BY seq LIMIT ?",
                    (after, cid, limit),
                ).fetchall()
        return {"events": [dict(json.loads(row["entry"]), sha256=row["hash"]) for row in rows]}

    def checkpoint(self, role):
        self.operator(role)
        with self.db(write=True) as db:
            after = db.execute("SELECT coalesce(max(last_seq),0) FROM ulcas_checkpoints").fetchone()[0]
            rows = db.execute("SELECT seq,hash FROM ulcas_events WHERE seq > ? ORDER BY seq LIMIT 256",
                              (after,)).fetchall()
            if not rows:
                return {"state": "no_new_events"}
            summary = {"first_seq": rows[0]["seq"], "last_seq": rows[-1]["seq"],
                       "root": merkle([row["hash"] for row in rows])}
            sig = hmac.new(self.key, canonical(summary).encode(), hashlib.sha256).hexdigest()
            db.execute("INSERT INTO ulcas_checkpoints VALUES (?, ?, ?, ?)", (*summary.values(), sig))
            return dict(summary, algorithm="HMAC-SHA256", signature=sig)


class NodeServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, request_handler):
        self.slots = BoundedSemaphore(16)
        super().__init__(address, request_handler)

    def process_request(self, request, client_address):
        if not self.slots.acquire(blocking=False):
            try:
                request.settimeout(1)
                request.sendall(b"HTTP/1.0 503 Service Unavailable\r\nContent-Length: 0\r\n\r\n")
            except OSError:
                pass
            finally:
                self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except Exception:
            self.slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try:
            super().process_request_thread(request, client_address)
        finally:
            self.slots.release()


def handler(node):
    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            self.request.settimeout(10)
            super().setup()

        def reply(self, status, data):
            body = canonical(data).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def read_json(self):
            require(self.headers.get_content_type() == "application/json", "json_required")
            require(len(self.headers.get_all("Content-Length", [])) == 1)
            size = int(self.headers["Content-Length"])
            if size > LIMIT:
                raise Problem(413, "request_too_large")
            require(size > 0 and not self.headers.get("Transfer-Encoding"))
            return json.loads(self.rfile.read(size), parse_constant=reject_constant)

        def handle_request(self, method):
            role, path = None, None
            try:
                url = urlsplit(self.path)
                path = url.path
                role = node.authenticate(self.headers.get("Authorization"))
                if method == "POST" and url.path == "/x/drive":
                    data = node.drive(role, self.read_json())
                elif method == "POST" and url.path == "/x/reverse_egress":
                    data = node.ingest(role, self.read_json())
                elif method == "POST" and url.path == "/x/checkpoint":
                    data = node.checkpoint(role)
                elif method == "GET" and url.path in ("/x/oncoming", "/x/ledger"):
                    args = parse_qs(url.query, max_num_fields=4)
                    cid = args.get("cid", [None])[0]
                    require(url.path != "/x/ledger" or cid is not None, "cid_required")
                    data = node.entries(role, int(args.get("after", [0])[0]),
                                        int(args.get("limit", [25])[0]), cid if url.path == "/x/ledger" else None)
                elif method == "GET" and url.path == "/health":
                    node.operator(role)
                    with node.db() as db:
                        db.execute("SELECT 1 FROM crossings LIMIT 1").fetchone()
                    data = {"status": "ready", "system": "ULCAS-Node-X", "lanes": 12}
                else:
                    raise Problem(404, "route_not_found")
            except Problem as error:
                result = {"error": error.message}
                if role and path in ("/x/drive", "/x/reverse_egress"):
                    try:
                        result["disposition"] = node.record_miss(role, method, path, error)
                    except sqlite3.Error:
                        return self.reply(503, {"error": "ledger_unavailable"})
                return self.reply(error.status, result)
            except (ValueError, RecursionError, TimeoutError):
                return self.reply(400, {"error": "invalid_request"})
            except sqlite3.Error:
                return self.reply(503, {"error": "ledger_unavailable"})
            return self.reply(200, data)

        def do_GET(self):
            self.handle_request("GET")

        def do_POST(self):
            self.handle_request("POST")

        def log_message(self, *_):
            # The ledger records typed evidence. Raw URLs may contain sensitive input.
            pass

    return Handler


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default="/var/lib/ulcas-node-x/ledger.sqlite3")
    parser.add_argument("--port", type=int, default=8072)
    options = parser.parse_args()
    os.umask(0o077)
    tokens = {r: os.environ["ULCAS_" + r.upper() + "_TOKEN"] for r in ("operator", *REVERSE)
              if "ULCAS_" + r.upper() + "_TOKEN" in os.environ}
    node = Node(options.db, tokens, os.environ.get("ULCAS_LEDGER_KEY", ""),
                os.environ.get("ULCAS_UNITS", "").split(), os.environ.get("ULCAS_REPO", ""),
                os.environ.get("ULCAS_EDGE_HEALTH", ""))
    with NodeServer(("127.0.0.1", options.port), handler(node)) as server:
        server.serve_forever()


if __name__ == "__main__":
    main()
