#!/usr/bin/env python3
"""Loopback ONE hub. Requires an explicit DB path and owner secret."""
import argparse
import hashlib
import hmac
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path
import secrets
import sqlite3
from urllib.parse import parse_qs, urlsplit

from hub import (CAPABILITIES, SCOPES, ContractViolation, Hub, Principal, ambient_event,
                 b64, canonical, fields, local_summary, run_microapp, unb64)
from boundary_api import decode_json, safe_wire

TOOLS = [
 {"name": "diagnostics.list", "description": "Read authorized connector diagnostics", "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False}},
 {"name": "context.read", "description": "Read an explicitly granted context key", "inputSchema": {"type": "object", "properties": {"key": {"type": "string"}}, "required": ["key"], "additionalProperties": False}},
 {"name": "microapp.run", "description": "Run an allowlisted deterministic micro-app", "inputSchema": {"type": "object", "properties": {"spec": {"type": "object"}}, "required": ["spec"], "additionalProperties": False}}
]


def dispatch(hub, principal, route, body):
    if route=="/api/booking-fences":
        fields(body,("resource",))
        resource = hub.booking_resource(principal,body["resource"],"bookings:write")
        return {"token":hub.boundaries.acquire(resource)}
    if route=="/api/bookings":
        fields(body,("resource","key","range","token"))
        resource = hub.booking_resource(principal,body["resource"],"bookings:write")
        result = hub.boundaries.book(resource,body["key"],body["range"],body["token"])
        return {**result,"resource":body["resource"]}
    if route=="/api/agents":
        fields(body, ("agent", "public_key", "scopes", "resources"))
        return hub.register(principal, body["agent"], body["public_key"], body["scopes"], body["resources"])
    if route=="/api/tokens":
        fields(body, ("agent", "scopes", "ttl"))
        return hub.issue(principal, **body)
    if route=="/api/revoke":
        fields(body, ("jti",)); return hub.revoke(principal, **body)
    if route=="/api/connectors":
        fields(body, ("connector", "mode")); return hub.connector(principal, **body)
    if route=="/api/context":
        fields(body, ("key", "value", "expected", "readers", "ttl"))
        return hub.put_context(principal, **body)
    if route=="/api/sync":
        fields(body, ("connector", "record", "value", "expected", "key"))
        return hub.sync(principal, **body)
    if route=="/api/conflicts/resolve":
        fields(body, ("conflict", "choice")); return hub.resolve_conflict(principal, **body)
    if route=="/api/faults":
        fields(body, ("connector", "code", "severity", "detail")); return hub.fault(principal, **body)
    if route=="/api/commands":
        fields(body, ("connector", "action", "key")); return hub.command(principal, **body)
    if route=="/api/microapps":
        return run_microapp(principal, body)
    if route=="/api/edge-summary":
        principal.need("microapps:run")
        fields(body, ("text", "sentences")); return local_summary(**body)
    if route=="/api/ambient": return ambient_event(principal, body)
    if route=="/api/issuers":
        fields(body, ("issuer", "key")); return hub.add_issuer(principal, **body)
    if route=="/api/attestations":
        fields(body, ("claims", "signature")); return hub.verify_attestation(principal, **body)
    if route=="/api/invites":
        fields(body, ("ttl",)); return hub.invite(principal, **body)
    if route=="/api/redeem":
        fields(body, ("invite", "member")); return hub.redeem(principal, **body)
    if route=="/api/payment-intents":
        fields(body, ("amount", "currency", "checkout_origin")); return hub.payment_intent(principal, **body)
    if route=="/mcp":
        if type(body) is not dict or body.get("jsonrpc")!="2.0" or not isinstance(body.get("method"), str):
            raise ContractViolation("JSON-RPC request required")
        method, params = body["method"], body.get("params", {})
        if method=="initialize":
            result = {"protocolVersion": "2025-03-26", "capabilities": {"tools": {}}, "serverInfo": {"name": "one-sovereign-hub", "version": "1.0.0"}}
        elif method=="tools/list": result = {"tools": TOOLS}
        elif method=="tools/call":
            fields(params, ("name", "arguments"))
            if params["name"]=="diagnostics.list":
                fields(params["arguments"], ()); answer = hub.snapshot(principal)
            elif params["name"]=="context.read":
                fields(params["arguments"], ("key",)); answer = hub.get_context(principal, **params["arguments"])
            elif params["name"]=="microapp.run":
                fields(params["arguments"], ("spec",)); answer = run_microapp(principal, **params["arguments"])
            else: raise ContractViolation("unknown MCP tool")
            result = {"content": [{"type": "text", "text": canonical(answer)}], "isError": False}
        else: raise ContractViolation("unsupported MCP method")
        return {"jsonrpc": "2.0", "id": body.get("id"), "result": result}
    raise KeyError("unknown route")


def make_handler(hub, owner_token, owner_id, webhook_keys=None):
    expected_owner = hashlib.sha256(owner_token.encode()).digest()
    admin = Principal(owner_id, "owner", SCOPES, admin=True)
    assets = {"/": ("index.html", "text/html"), "/index.html": ("index.html", "text/html"),
              "/app.js": ("app.js", "text/javascript"), "/style.css": ("style.css", "text/css"),
              "/service-worker.js": ("service-worker.js", "text/javascript"),
              "/manifest.webmanifest": ("manifest.webmanifest", "application/manifest+json"),
              "/icon.svg": ("icon.svg", "image/svg+xml"), "/openapi.json": ("openapi.json", "application/json")}
    webhook_keys = {} if webhook_keys is None else webhook_keys

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args): pass
        def setup(self):
            super().setup()
            self.connection.settimeout(5)

        def check_origin(self):
            host = f"127.0.0.1:{self.server.server_port}"
            if self.headers.get("Host")!=host or self.headers.get("Origin") not in (None, "http://"+host):
                raise PermissionError("local origin required")

        def principal(self, raw=b""):
            header = self.headers.get("Authorization", "")
            if not header.startswith("Bearer "): raise PermissionError("authentication required")
            token = header.removeprefix("Bearer ")
            if hmac.compare_digest(hashlib.sha256(token.encode()).digest(), expected_owner): return admin
            try: timestamp = int(self.headers.get("X-Agent-Time", ""))
            except ValueError as exc: raise PermissionError("signed agent request required") from exc
            principal = hub.authenticate(token, self.command, self.path, raw, timestamp,
                                         self.headers.get("X-Agent-Nonce"), self.headers.get("X-Agent-Signature"))
            if principal.owner!=owner_id: raise PermissionError("wrong owner")
            return principal

        def send(self, status, value):
            if not safe_wire(value): status, value = 503, {"error": "wire integer outside safe range"}
            raw = canonical(value).encode()
            self.respond(status, raw, "application/json")

        def respond(self, status, raw, mime):
            self.send_response(status)
            self.send_header("Content-Type", mime+"; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'")
            self.end_headers()
            self.wfile.write(raw)

        def do_GET(self):
            try:
                self.check_origin()
                url = urlsplit(self.path)
                if url.path in assets and not url.query:
                    file, mime = assets[url.path]
                    self.respond(200, Path(__file__).with_name(file).read_bytes(), mime)
                    return
                if url.path in ("/api/catalog", "/.well-known/one-actions.json") and not url.query:
                    self.send(200, {"name": "ONE Sovereign Hub", "capabilities": CAPABILITIES, "openapi": "/openapi.json", "mcp": "/mcp", "authentication": "owner bearer or expiring agent token with Ed25519 request proof"})
                    return
                p = self.principal()
                query = parse_qs(url.query, keep_blank_values=True)
                if any(len(value)!=1 for value in query.values()): raise ContractViolation("duplicate parameter")
                if url.path=="/api/snapshot" and not query: result = hub.snapshot(p)
                elif url.path=="/api/export" and not query: result = hub.export_owner(p)
                elif url.path=="/api/telemetry" and not query: result = hub.telemetry(p)
                elif url.path=="/api/audit-health" and not query:
                    if not p.admin: raise PermissionError("owner required")
                    result = {"valid": hub.audit_valid()}
                elif url.path=="/api/context" and set(query)=={"key"}: result = hub.get_context(p, query["key"][0])
                elif url.path=="/api/changes" and "connector" in query and not set(query)-{"connector", "after", "until", "size"}:
                    options = {key: int(query[key][0]) for key in ("after", "until", "size") if key in query}
                    result = hub.changes(p, query["connector"][0], **options)
                elif url.path=="/api/bookings" and "resource" in query and not set(query)-{"resource","after","until","size"}:
                    resource = hub.booking_resource(p,query["resource"][0],"bookings:read")
                    options = {key:int(query[key][0]) for key in ("after","until","size") if key in query}
                    result = hub.boundaries.page(resource,**options)
                    result["items"] = [{**item,"resource":query["resource"][0]} for item in result["items"]]
                else: raise KeyError("unknown route")
                self.send(200, result)
            except PermissionError: self.send(403, {"error": "permission denied"})
            except KeyError: self.send(404, {"error": "resource unavailable"})
            except (ValueError, TypeError, UnicodeError, RecursionError): self.send(400, {"error": "invalid boundary contract"})
            except (sqlite3.Error, OSError): self.send(503, {"error": "local service unavailable"})

        def do_POST(self):
            try:
                self.check_origin()
                if self.headers.get_content_type()!="application/json" or self.headers.get("Transfer-Encoding"):
                    raise ContractViolation("JSON body required")
                lengths = self.headers.get_all("Content-Length", [])
                if len(lengths)!=1: raise ContractViolation("one content length required")
                length = int(lengths[0])
                if not 0<length<=65_536:
                    self.close_connection=True
                    self.send(413, {"error": "body outside limit"}); return
                raw = self.rfile.read(length)
                if len(raw)!=length: raise ContractViolation("truncated body")
                if self.path=="/api/payment-confirmations":
                    secret = webhook_keys.get("payments")
                    if secret is None: raise PermissionError("payment provider not configured")
                    result = hub.confirm_payment(admin, decode_json(raw), int(self.headers.get("X-Event-Time", "")),
                                                 self.headers.get("X-Event-Signature"), secret)
                elif self.path.startswith("/api/webhooks/"):
                    connector = self.path.removeprefix("/api/webhooks/")
                    secret = webhook_keys.get(connector)
                    if secret is None: raise PermissionError("webhook provider not configured")
                    result = hub.webhook(admin, connector, self.headers.get("X-Event-ID"), raw,
                                         int(self.headers.get("X-Event-Time", "")), self.headers.get("X-Event-Signature"), secret)
                else:
                    p = self.principal(raw)
                    result = dispatch(hub, p, self.path, decode_json(raw))
                self.send(200, result)
            except PermissionError: self.send(403, {"error": "permission denied"})
            except KeyError: self.send(404, {"error": "resource unavailable"})
            except (ValueError, TypeError, UnicodeError, RecursionError): self.send(400, {"error": "invalid boundary contract"})
            except sqlite3.Error: self.send(503, {"error": "storage transaction failed"})
    return Handler


class HubServer(HTTPServer):
    def __init__(self,address,hub,owner_token,owner_id,webhook_keys=None):
        self.hub=hub
        super().__init__(address,make_handler(hub,owner_token,owner_id,webhook_keys))

    def service_actions(self):
        try:
            if not self.hub.boundaries.health()["healthy"]:
                self.hub.boundaries.telemetry.record("health_failed")
        except (sqlite3.Error,ContractViolation):
            self.hub.boundaries.telemetry.record("health_failed")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", required=True)
    parser.add_argument("--port", default=8780, type=int)
    parser.add_argument("--owner", default="local-owner")
    args = parser.parse_args()
    token = os.environ.get("ONE_HUB_OWNER_TOKEN", "")
    if len(token)<32: parser.error("ONE_HUB_OWNER_TOKEN must contain at least 32 characters")
    key = unb64(os.environ["ONE_HUB_SIGNING_KEY"]) if "ONE_HUB_SIGNING_KEY" in os.environ else secrets.token_bytes(32)
    config = json.loads(os.environ.get("ONE_HUB_WEBHOOK_KEYS", "{}"))
    webhook_keys = {name: unb64(value) for name, value in config.items()}
    descriptor = os.open(args.db, os.O_CREAT | os.O_RDWR, 0o600)
    os.close(descriptor)
    os.chmod(args.db, 0o600)
    with sqlite3.connect(args.db) as db:
        hub = Hub(db, key)
        with HubServer(("127.0.0.1", args.port), hub, token, args.owner, webhook_keys) as server:
            print(f"ONE Sovereign Hub: http://127.0.0.1:{server.server_port}", flush=True)
            server.serve_forever()


if __name__=="__main__": main()
