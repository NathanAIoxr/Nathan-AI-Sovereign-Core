#!/usr/bin/env python3
"""Local-only reference API. Run with an explicit disposable database path."""
import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import sqlite3
from urllib.parse import parse_qs, urlsplit

from core_primitives import ContractViolation
from production_boundaries import BookingService, fields

MAX_BODY = 16_384
MAX_WIRE_INTEGER = (1 << 53) - 1


def wire_integer(raw):
    value = int(raw)
    if abs(value) > MAX_WIRE_INTEGER:
        raise ContractViolation("integer outside browser-safe wire range")
    return value


def safe_wire(value):
    if type(value) is int:
        return abs(value) <= MAX_WIRE_INTEGER
    if isinstance(value, dict):
        return all(safe_wire(item) for item in value.values())
    if isinstance(value, (tuple, list)):
        return all(safe_wire(item) for item in value)
    return True


def decode_json(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ContractViolation("duplicate JSON field")
            result[key] = value
        return result
    def invalid(value):
        raise ContractViolation("nonfinite JSON value")
    return json.loads(raw, object_pairs_hook=unique, parse_constant=invalid, parse_int=wire_integer)


def handler_for(service):
    class Handler(BaseHTTPRequestHandler):
        def allowed_origin(self):
            authority = f"127.0.0.1:{self.server.server_port}"
            return (self.headers.get("Host") == authority and
                    self.headers.get("Origin") in (None, f"http://{authority}"))

        def log_message(self, *args):
            pass  # Do not print URL parameters or user payloads.

        def send_json(self, status, payload):
            if not safe_wire(payload):
                status, payload = 503, {"error": "integer outside browser-safe wire range"}
            body = json.dumps(payload, ensure_ascii=True, allow_nan=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            try:
                if not self.allowed_origin():
                    self.send_json(403, {"error": "local origin required"})
                    return
                url = urlsplit(self.path)
                query = parse_qs(url.query, keep_blank_values=True)
                if any(len(values) != 1 for values in query.values()):
                    raise ContractViolation("duplicate query parameter")
                assets = {"/": ("boundary_ui.html", "text/html"),
                          "/ui.js": ("boundary_ui.js", "text/javascript"),
                          "/ui.css": ("boundary_ui.css", "text/css")}
                if url.path in assets and not query:
                    filename, mime = assets[url.path]
                    raw = Path(__file__).with_name(filename).read_bytes()
                    self.send_response(200)
                    self.send_header("Content-Type", mime + "; charset=utf-8")
                    self.send_header("Content-Length", str(len(raw)))
                    self.send_header("X-Content-Type-Options", "nosniff")
                    self.send_header("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'")
                    self.end_headers()
                    self.wfile.write(raw)
                elif url.path == "/health" and not query:
                    report = service.health()
                    self.send_json(200 if report["healthy"] else 503, report)
                elif url.path == "/metrics" and not query:
                    self.send_json(200, {
                        "operations": dict(service.telemetry.counts),
                        "recovery": dict(service.recovery.telemetry.counts),
                        "recovery_state": service.recovery.state,
                        "recent_recovery": [{"tick_ns": str(event.tick_ns), "state": event.state,
                                             "reason": event.reason} for event in service.recovery.records]
                    })
                elif url.path == "/bookings":
                    if set(query) - {"resource", "after", "size", "until"} or "resource" not in query:
                        raise ContractViolation("invalid query fields")
                    options = {name: wire_integer(query[name][0]) for name in ("after", "size", "until") if name in query}
                    self.send_json(200, service.page(query["resource"][0], **options))
                else:
                    self.send_json(404, {"error": "unknown route"})
            except (ValueError, TypeError):
                service.telemetry.record("rejected")
                self.send_json(400, {"error": "invalid boundary request"})
            except sqlite3.Error:
                self.send_json(503, {"error": "storage unavailable"})

        def do_POST(self):
            try:
                if not self.allowed_origin():
                    self.send_json(403, {"error": "local origin required"})
                    self.close_connection = True
                    return
                if self.path not in ("/fences", "/bookings"):
                    self.send_json(404, {"error": "unknown route"})
                    return
                if self.headers.get_content_type() != "application/json" or self.headers.get("Transfer-Encoding"):
                    raise ContractViolation("application/json with Content-Length required")
                lengths = self.headers.get_all("Content-Length", [])
                if len(lengths) != 1:
                    raise ContractViolation("one content length required")
                length = int(lengths[0])
                if not 0 < length <= MAX_BODY:
                    self.send_json(413, {"error": "body outside size limit"})
                    self.close_connection = True
                    return
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise ContractViolation("truncated request")
                body = decode_json(raw)
                if self.path == "/fences":
                    fields(body, ("resource",))
                    self.send_json(200, {"token": service.acquire(body["resource"])})
                else:
                    fields(body, ("resource", "key", "range", "token"))
                    result = service.book(body["resource"], body["key"], body["range"], body["token"])
                    self.send_json(200, result)
            except (ValueError, TypeError, UnicodeError, RecursionError):
                service.telemetry.record("rejected")
                self.send_json(400, {"error": "invalid boundary request"})
            except sqlite3.Error:
                self.send_json(503, {"error": "storage unavailable"})

        def setup(self):
            super().setup()
            self.connection.settimeout(5)
    return Handler


class HealingServer(HTTPServer):
    def __init__(self, address, service):
        self.service = service
        super().__init__(address, handler_for(service))

    def service_actions(self):
        # HTTPServer invokes this on its local polling loop, in the DB's thread.
        try:
            if not self.service.health()["healthy"]:
                self.service.telemetry.record("health_failed")
        except (sqlite3.Error, ContractViolation):
            self.service.telemetry.record("health_failed")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", required=True, help="explicit local demo DB, not private master")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    with sqlite3.connect(args.db) as db:
        service = BookingService(db)
        service.initialize()
        with HealingServer(("127.0.0.1", args.port), service) as server:
            print(f"Local reference API: http://127.0.0.1:{server.server_port}", flush=True)
            server.serve_forever()


if __name__ == "__main__":
    main()
