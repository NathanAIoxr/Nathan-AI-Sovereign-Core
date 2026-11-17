"""ONE sovereign hub: owner-scoped identity, memory, sync and diagnostics.

Provider-free functionality runs locally. External accounts, hardware and models
are never reported connected without an actual configured adapter.
"""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
from fractions import Fraction
import base64
import hashlib
import hmac
import json
from pathlib import Path
import secrets
import sqlite3
import sys
import time
from urllib.parse import urlsplit

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

ENGINE = Path(__file__).resolve().parents[1] / "nathan-ai/personal-intelligence/minds/federation/fencepost-error-syndrome"
sys.path.insert(0, str(ENGINE))
from core_primitives import ContractViolation, HalfOpen, Money, exact_int, require_text
from production_boundaries import BookingService, arithmetic_health, fields, i64, split_money

SCOPES = frozenset({"diagnostics:read", "diagnostics:write", "context:read", "context:write",
                    "sync:read", "sync:write", "quant:run", "simulation:run", "commands:run",
                    "attest:verify", "microapps:run", "bookings:read", "bookings:write"})
CAPABILITIES = {
 "agent_identity": "implemented: expiring capabilities, Ed25519 request proof, revocation",
 "context_memory": "implemented: owner and per-agent grants, versions, expiry",
 "diagnostics": "implemented: scoped trouble codes, telemetry and allowlisted commands",
 "sync": "implemented: durable idempotency, compare-and-swap conflict records, change cursors",
 "microapps": "implemented: bounded declarative budget/duration/room-fit tools",
 "edge_ai": "local extractive summary implemented; neural inference provider required",
 "world_models": "deterministic AABB geometry implemented; learned camera/world model provider required",
 "quantitative": "exact rational and currency calculations implemented; no zero-error model claim",
 "human_authenticity": "Ed25519 issuer claims implemented; human/hardware issuer required",
 "discovery": "implemented: OpenAPI, MCP tools and public capabilities",
 "external_payments": "signed intent and verified callback implemented; checkout provider required",
 "mobile_intents": "HTTP/MCP action surface implemented; native OS packaging required",
 "multimodal": "consented typed events implemented; physical sensor adapters required",
 "self_healing": "boundary service projection recovery implemented; other repairs allowlisted",
 "offline": "local SQLite and PWA queue implemented; remote sync connectors require configuration"
}


def canonical(value):
    try:
        return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False, ensure_ascii=True)
    except (TypeError, ValueError) as exc:
        raise ContractViolation("canonical JSON required") from exc


def b64(data): return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def unb64(text):
    if not isinstance(text, str) or len(text) > 32_768:
        raise ContractViolation("invalid encoded field")
    try:
        decoded = base64.b64decode(text + "=" * (-len(text) % 4), altchars=b"-_", validate=True)
    except (ValueError, UnicodeError) as exc:
        raise ContractViolation("invalid encoding") from exc
    if b64(decoded) != text:
        raise ContractViolation("noncanonical encoding")
    return decoded


def identifier(value):
    value = require_text(value, "identifier")
    if len(value) > 120 or any(not (c.isascii() and (c.isalnum() or c in "-_.:")) for c in value):
        raise ContractViolation("invalid identifier")
    return value


def public_key(raw):
    try: return Ed25519PublicKey.from_public_bytes(unb64(raw))
    except (ValueError, TypeError) as exc: raise ContractViolation("Ed25519 key required") from exc


@dataclass(frozen=True)
class Principal:
    owner: str
    agent: str
    scopes: frozenset[str]
    admin: bool = False
    resources: frozenset[str] = frozenset()

    def need(self, scope):
        if not self.admin and scope not in self.scopes:
            raise PermissionError("capability denied")


SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS hub_agents(owner TEXT, agent TEXT, public_key TEXT NOT NULL,
 scopes TEXT NOT NULL, resources TEXT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(owner,agent));
CREATE TABLE IF NOT EXISTS hub_tokens(jti TEXT PRIMARY KEY,owner TEXT NOT NULL,agent TEXT NOT NULL,
 expires INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS hub_nonces(jti TEXT,nonce TEXT,expires INTEGER NOT NULL,PRIMARY KEY(jti,nonce));
CREATE TABLE IF NOT EXISTS hub_context(owner TEXT,key TEXT,body TEXT NOT NULL,version INTEGER NOT NULL,
 readers TEXT NOT NULL,expires INTEGER,PRIMARY KEY(owner,key));
CREATE TABLE IF NOT EXISTS hub_records(owner TEXT,connector TEXT,id TEXT,body TEXT NOT NULL,
 version INTEGER NOT NULL,PRIMARY KEY(owner,connector,id));
CREATE TABLE IF NOT EXISTS hub_changes(seq INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT NOT NULL,
 connector TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,version INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS hub_commands(owner TEXT,key TEXT,payload TEXT NOT NULL,result TEXT NOT NULL,
 PRIMARY KEY(owner,key));
CREATE TABLE IF NOT EXISTS hub_conflicts(id INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT,
 connector TEXT,record TEXT,local TEXT NOT NULL,remote TEXT NOT NULL,resolved INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS hub_connectors(owner TEXT,id TEXT,status TEXT NOT NULL,
 config TEXT NOT NULL,PRIMARY KEY(owner,id));
CREATE TABLE IF NOT EXISTS hub_webhooks(owner TEXT,connector TEXT,event TEXT,payload_hash TEXT NOT NULL,
 PRIMARY KEY(owner,connector,event));
CREATE TABLE IF NOT EXISTS hub_faults(owner TEXT,connector TEXT,code TEXT,body TEXT NOT NULL,
 PRIMARY KEY(owner,connector,code));
CREATE TABLE IF NOT EXISTS hub_issuers(owner TEXT,id TEXT,public_key TEXT NOT NULL,PRIMARY KEY(owner,id));
CREATE TABLE IF NOT EXISTS hub_attestations(owner TEXT,id TEXT,payload TEXT NOT NULL,PRIMARY KEY(owner,id));
CREATE TABLE IF NOT EXISTS hub_invites(owner TEXT,id TEXT,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(owner,id));
CREATE TABLE IF NOT EXISTS hub_members(owner TEXT,id TEXT,PRIMARY KEY(owner,id));
CREATE TABLE IF NOT EXISTS hub_payments(owner TEXT,id TEXT,amount INTEGER NOT NULL,currency TEXT NOT NULL,
 expires INTEGER NOT NULL,state TEXT NOT NULL,PRIMARY KEY(owner,id));
CREATE TABLE IF NOT EXISTS hub_audit(seq INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT NOT NULL,
 agent TEXT NOT NULL,action TEXT NOT NULL,at INTEGER NOT NULL,prev TEXT NOT NULL,hash TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS hub_audit_no_update BEFORE UPDATE ON hub_audit
 BEGIN SELECT RAISE(ABORT,'append-only audit'); END;
CREATE TRIGGER IF NOT EXISTS hub_audit_no_delete BEFORE DELETE ON hub_audit
 BEGIN SELECT RAISE(ABORT,'append-only audit'); END;
"""


class Hub:
    def __init__(self, db, signing_key: bytes, clock=time.time):
        if not isinstance(signing_key, bytes) or len(signing_key) < 32:
            raise ContractViolation("32-byte signing key required")
        self.db, self.key, self.clock = db, signing_key, clock
        if db.in_transaction: raise ContractViolation("initialization needs transaction boundary")
        db.executescript(SCHEMA)
        self.boundaries = BookingService(db)
        self.boundaries.initialize()

    def booking_resource(self, principal, resource, scope):
        principal.need(scope)
        resource = identifier(resource)
        if not principal.admin and resource not in principal.resources:
            raise PermissionError("booking resource not granted")
        # JSON tuple encoding avoids delimiter collisions across owner namespaces.
        return canonical([principal.owner, resource])

    def now(self): return int(self.clock())

    def audit(self, principal, action):
        previous = self.db.execute("SELECT hash FROM hub_audit ORDER BY seq DESC LIMIT 1").fetchone()
        previous = previous[0] if previous else "0" * 64
        at = self.now()
        content = canonical([principal.owner, principal.agent, action, at, previous])
        digest = hashlib.sha256(content.encode()).hexdigest()
        self.db.execute("INSERT INTO hub_audit(owner,agent,action,at,prev,hash) VALUES(?,?,?,?,?,?)",
                        (principal.owner, principal.agent, action, at, previous, digest))

    def register(self, admin, agent, key, scopes, resources=None):
        if not admin.admin: raise PermissionError("owner required")
        agent = identifier(agent)
        public_key(key)
        if type(scopes) is not list or not set(scopes) <= SCOPES:
            raise ContractViolation("unknown scope")
        resources = [] if resources is None else resources
        if type(resources) is not list: raise ContractViolation("resource list required")
        resources = [identifier(resource) for resource in resources]
        with self.db:
            # No silent key/scope replacement. Revoke and register a new identity.
            self.db.execute("INSERT INTO hub_agents(owner,agent,public_key,scopes,resources) VALUES(?,?,?,?,?)",
                            (admin.owner, agent, key, canonical(sorted(set(scopes))), canonical(sorted(set(resources)))))
            self.audit(admin, "agent.register")
        return {"agent": agent, "scopes": sorted(set(scopes))}

    def issue(self, admin, agent, scopes, ttl=300):
        if not admin.admin: raise PermissionError("owner required")
        if not 0 < exact_int(ttl, "ttl") <= 3600: raise ContractViolation("token ttl outside 1..3600")
        row = self.db.execute("SELECT scopes,public_key,revoked,resources FROM hub_agents WHERE owner=? AND agent=?", (admin.owner, agent)).fetchone()
        if row is None or row[2]: raise PermissionError("agent unavailable")
        if type(scopes) is not list or not set(scopes) <= set(json.loads(row[0])):
            raise PermissionError("scope escalation")
        claims = {"iss": "one-hub", "aud": "one-hub-actions", "owner": admin.owner, "sub": agent,
                  "scopes": sorted(set(scopes)), "iat": self.now(), "exp": self.now() + ttl,
                  "jti": secrets.token_urlsafe(24), "cnf": hashlib.sha256(unb64(row[1])).hexdigest()}
        claims["resources"] = json.loads(row[3])
        token = self.sign(claims)
        with self.db:
            self.db.execute("INSERT INTO hub_tokens(jti,owner,agent,expires) VALUES(?,?,?,?)",
                            (claims["jti"], admin.owner, agent, claims["exp"]))
            self.audit(admin, "token.issue")
        return {"token": token, "expires": claims["exp"], "jti": claims["jti"]}

    def sign(self, claims):
        body = b64(canonical(claims).encode())
        return body + "." + b64(hmac.digest(self.key, body.encode(), "sha256"))

    def unpack(self, token):
        if not isinstance(token, str) or len(token) > 16_384: raise PermissionError("invalid token")
        try:
            body, signature = token.split(".")
            if not hmac.compare_digest(hmac.digest(self.key, body.encode(), "sha256"), unb64(signature)):
                raise PermissionError("invalid signature")
            claims = json.loads(unb64(body))
            if not isinstance(claims, dict): raise PermissionError("invalid claims")
            return claims
        except (ValueError, UnicodeError, ContractViolation) as exc:
            raise PermissionError("invalid token") from exc

    @staticmethod
    def proof_message(token, method, path, body, timestamp, nonce):
        return canonical([hashlib.sha256(token.encode()).hexdigest(), method, path,
                          hashlib.sha256(body).hexdigest(), timestamp, nonce]).encode()

    def authenticate(self, token, method, path, body, timestamp, nonce, signature):
        claims = self.unpack(token)
        now = self.now()
        if claims.get("iss") != "one-hub" or claims.get("aud") != "one-hub-actions":
            raise PermissionError("invalid audience")
        if type(claims.get("exp")) is not int or type(claims.get("iat")) is not int or not claims["iat"] <= now < claims["exp"]:
            raise PermissionError("expired or premature token")
        if type(timestamp) is not int or abs(now - timestamp) > 60:
            raise PermissionError("stale request proof")
        nonce = identifier(nonce)
        row = self.db.execute("SELECT a.public_key,a.scopes,a.revoked,t.revoked,a.resources FROM hub_agents a JOIN hub_tokens t ON t.owner=a.owner AND t.agent=a.agent WHERE t.jti=? AND a.owner=? AND a.agent=?",
                              (claims.get("jti"), claims.get("owner"), claims.get("sub"))).fetchone()
        if row is None or row[2] or row[3]: raise PermissionError("revoked identity")
        if claims.get("cnf") != hashlib.sha256(unb64(row[0])).hexdigest(): raise PermissionError("key binding mismatch")
        if not isinstance(claims.get("scopes"), list) or not set(claims["scopes"]) <= set(json.loads(row[1])):
            raise PermissionError("invalid scopes")
        if not isinstance(claims.get("resources"), list) or not set(claims["resources"]) <= set(json.loads(row[4])):
            raise PermissionError("invalid resource grants")
        try:
            public_key(row[0]).verify(unb64(signature), self.proof_message(token, method, path, body, timestamp, nonce))
        except (InvalidSignature, ContractViolation) as exc:
            raise PermissionError("request proof invalid") from exc
        try:
            with self.db:
                self.db.execute("DELETE FROM hub_nonces WHERE expires<?", (now,))
                self.db.execute("INSERT INTO hub_nonces VALUES(?,?,?)", (claims["jti"], nonce, claims["exp"]))
        except sqlite3.IntegrityError as exc: raise PermissionError("replayed request") from exc
        return Principal(claims["owner"], claims["sub"], frozenset(claims["scopes"]), resources=frozenset(claims["resources"]))

    def revoke(self, admin, jti):
        if not admin.admin: raise PermissionError("owner required")
        with self.db:
            self.db.execute("UPDATE hub_tokens SET revoked=1 WHERE owner=? AND jti=?", (admin.owner, jti))
            self.audit(admin, "token.revoke")
        return {"revoked": True}

    def put_context(self, principal, key, value, expected, readers=None, ttl=None):
        principal.need("context:write")
        key = identifier(key)
        expected = exact_int(expected, "version")
        if expected < 0: raise ContractViolation("negative version")
        if ttl is not None and not 0 < exact_int(ttl, "ttl") <= 31_536_000:
            raise ContractViolation("invalid context expiry")
        encoded = canonical(value)
        if len(encoded) > 32_768: raise ContractViolation("context too large")
        try:
            self.db.execute("BEGIN IMMEDIATE")
            old = self.db.execute("SELECT version,readers FROM hub_context WHERE owner=? AND key=?", (principal.owner, key)).fetchone()
            if old and not principal.admin and principal.agent not in json.loads(old[1]):
                raise PermissionError("context not granted")
            if (old[0] if old else 0) != expected: raise ContractViolation("context version conflict")
            if not principal.admin:
                if readers is not None: raise PermissionError("only owner changes grants")
                readers = json.loads(old[1]) if old else [principal.agent]
            if readers is None: readers = []
            if type(readers) is not list or any(not isinstance(item, str) for item in readers):
                raise ContractViolation("reader identities required")
            readers = [identifier(item) for item in readers]
            self.db.execute("INSERT INTO hub_context VALUES(?,?,?,?,?,?) ON CONFLICT(owner,key) DO UPDATE SET body=excluded.body,version=excluded.version,readers=excluded.readers,expires=excluded.expires",
                            (principal.owner, key, encoded, expected + 1, canonical(sorted(set(readers))), self.now()+ttl if ttl else None))
            self.audit(principal, "context.write")
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return {"key": key, "version": expected + 1}

    def get_context(self, principal, key):
        principal.need("context:read")
        row = self.db.execute("SELECT body,version,readers,expires FROM hub_context WHERE owner=? AND key=?", (principal.owner, identifier(key))).fetchone()
        if row is None or (row[3] is not None and self.now() >= row[3]): raise KeyError("context unavailable")
        if not principal.admin and principal.agent not in json.loads(row[2]): raise PermissionError("context not granted")
        return {"key": key, "value": json.loads(row[0]), "version": row[1], "expires": row[3]}

    def connector(self, admin, connector, mode="local", config=None):
        if not admin.admin: raise PermissionError("owner required")
        connector = identifier(connector)
        if mode not in ("local", "oauth", "webhook", "device", "model", "payment"):
            raise ContractViolation("unknown connector mode")
        # Secrets are separate runtime configuration; never saved in public manifests.
        config = {} if config is None else config
        if type(config) is not dict or set(config) - {"label", "mode", "checkout_origin"}:
            raise ContractViolation("connector config contains unsupported fields")
        status = "ready" if mode == "local" else "provider_required"
        with self.db:
            self.db.execute("INSERT INTO hub_connectors VALUES(?,?,?,?) ON CONFLICT(owner,id) DO UPDATE SET status=excluded.status,config=excluded.config",
                            (admin.owner, connector, status, canonical({**config, "mode": mode})))
            self.audit(admin, "connector.configure")
        return {"id": connector, "status": status, "mode": mode}

    def _connector_allowed(self, principal, connector):
        identifier(connector)
        if not principal.admin and connector not in principal.resources:
            raise PermissionError("connector not granted")
        row = self.db.execute("SELECT status FROM hub_connectors WHERE owner=? AND id=?", (principal.owner, connector)).fetchone()
        if row is None: raise KeyError("connector unavailable")
        # An external connector remains disabled until an actual adapter exists.
        if row[0] != "ready": raise ContractViolation("connector provider required")
        return connector

    def sync(self, principal, connector, record, value, expected, key):
        principal.need("sync:write")
        connector = self._connector_allowed(principal, connector)
        record, key = identifier(record), identifier(key)
        if exact_int(expected, "version") < 0: raise ContractViolation("negative version")
        encoded = canonical(value)
        if len(encoded) > 32_768: raise ContractViolation("record too large")
        command = canonical(["sync", principal.agent, connector, record, value, expected])
        try:
            self.db.execute("BEGIN IMMEDIATE")
            prior = self.db.execute("SELECT payload,result FROM hub_commands WHERE owner=? AND key=?", (principal.owner, key)).fetchone()
            if prior:
                if prior[0] != command: raise ContractViolation("idempotency conflict")
                self.db.commit()
                return json.loads(prior[1])
            old = self.db.execute("SELECT version,body FROM hub_records WHERE owner=? AND connector=? AND id=?", (principal.owner, connector, record)).fetchone()
            if (old[0] if old else 0) != expected:
                cursor = self.db.execute("INSERT INTO hub_conflicts(owner,connector,record,local,remote) VALUES(?,?,?,?,?)", (principal.owner, connector, record, encoded, old[1] if old else "null"))
                result = {"status": "conflict", "conflict": cursor.lastrowid, "version": old[0] if old else 0}
            else:
                version = i64(expected + 1)
                self.db.execute("INSERT INTO hub_records VALUES(?,?,?,?,?) ON CONFLICT(owner,connector,id) DO UPDATE SET body=excluded.body,version=excluded.version", (principal.owner, connector, record, encoded, version))
                cursor = self.db.execute("INSERT INTO hub_changes(owner,connector,id,body,version) VALUES(?,?,?,?,?)", (principal.owner, connector, record, encoded, version))
                result = {"status": "applied", "version": version, "cursor": cursor.lastrowid}
            self.db.execute("INSERT INTO hub_commands VALUES(?,?,?,?)", (principal.owner, key, command, canonical(result)))
            self.audit(principal, "sync." + result["status"])
            self.db.commit()
            return result
        except Exception:
            self.db.rollback()
            raise

    def changes(self, principal, connector, after=0, until=None, size=50):
        principal.need("sync:read")
        connector = self._connector_allowed(principal, connector)
        if exact_int(after, "cursor") < 0 or not 0 < exact_int(size, "size") <= 100:
            raise ContractViolation("invalid page")
        if until is None:
            until = self.db.execute("SELECT COALESCE(MAX(seq),0) FROM hub_changes WHERE owner=? AND connector=?", (principal.owner, connector)).fetchone()[0]
        if exact_int(until, "until") < after: raise ContractViolation("inverted cursor window")
        rows = self.db.execute("SELECT seq,id,body,version FROM hub_changes WHERE owner=? AND connector=? AND seq>? AND seq<=? ORDER BY seq LIMIT ?", (principal.owner, connector, after, until, size+1)).fetchall()
        items = [{"cursor": row[0], "id": row[1], "value": json.loads(row[2]), "version": row[3]} for row in rows[:size]]
        return {"items": items, "until": until, "next": items[-1]["cursor"] if len(rows)>size else None}

    def fault(self, principal, connector, code, severity, detail):
        principal.need("diagnostics:write")
        self._connector_allowed(principal, connector)
        code = identifier(code)
        if severity not in ("info", "warning", "critical"): raise ContractViolation("invalid severity")
        if not isinstance(detail, str) or len(detail) > 1000: raise ContractViolation("invalid detail")
        body = {"code": code, "severity": severity, "detail": detail, "at": self.now()}
        with self.db:
            self.db.execute("INSERT INTO hub_faults VALUES(?,?,?,?) ON CONFLICT(owner,connector,code) DO UPDATE SET body=excluded.body", (principal.owner, connector, code, canonical(body)))
            self.audit(principal, "diagnostic.report")
        return body

    def command(self, principal, connector, action, key):
        principal.need("commands:run")
        self._connector_allowed(principal, connector)
        key = identifier(key)
        if action not in ("clear-warning-codes", "verify-storage"):
            raise ContractViolation("command not allowlisted")
        command = canonical(["command", principal.agent, connector, action])
        try:
            self.db.execute("BEGIN IMMEDIATE")
            prior = self.db.execute("SELECT payload,result FROM hub_commands WHERE owner=? AND key=?", (principal.owner, key)).fetchone()
            if prior:
                if prior[0] != command: raise ContractViolation("idempotency conflict")
                self.db.commit()
                return json.loads(prior[1])
            if action == "clear-warning-codes":
                rows = self.db.execute("SELECT code,body FROM hub_faults WHERE owner=? AND connector=?", (principal.owner, connector)).fetchall()
                cleared = [row[0] for row in rows if json.loads(row[1])["severity"] != "critical"]
                for code in cleared:
                    self.db.execute("DELETE FROM hub_faults WHERE owner=? AND connector=? AND code=?", (principal.owner, connector, code))
                result = {"cleared": cleared, "critical_preserved": True}
            else:
                result = {"healthy": self.db.execute("PRAGMA quick_check").fetchone()[0] == "ok"}
            self.db.execute("INSERT INTO hub_commands VALUES(?,?,?,?)", (principal.owner, key, command, canonical(result)))
            self.audit(principal, "command." + action)
            self.db.commit()
            return result
        except Exception:
            self.db.rollback()
            raise

    def webhook(self, admin, connector, event, raw, timestamp, signature, secret):
        if not admin.admin: raise PermissionError("configured connector owner required")
        self._connector_allowed(admin, connector)
        event = identifier(event)
        if type(secret) is not bytes or len(secret)<32: raise ContractViolation("webhook key required")
        if type(timestamp) is not int or abs(self.now()-timestamp)>300: raise PermissionError("stale webhook")
        if len(raw)>65_536: raise ContractViolation("webhook too large")
        expected = hmac.digest(secret, str(timestamp).encode()+b"."+raw, "sha256").hex()
        if not isinstance(signature, str) or not hmac.compare_digest(expected, signature): raise PermissionError("invalid webhook signature")
        digest = hashlib.sha256(raw).hexdigest()
        with self.db:
            old = self.db.execute("SELECT payload_hash FROM hub_webhooks WHERE owner=? AND connector=? AND event=?", (admin.owner, connector, event)).fetchone()
            if old:
                if old[0] != digest: raise ContractViolation("webhook event conflict")
                return {"replayed": True}
            self.db.execute("INSERT INTO hub_webhooks VALUES(?,?,?,?)", (admin.owner, connector, event, digest))
            self.audit(admin, "webhook.receive")
        return {"replayed": False}

    def snapshot(self, principal):
        principal.need("diagnostics:read")
        connectors = [{"id": row[0], "status": row[1], "config": json.loads(row[2])} for row in self.db.execute("SELECT id,status,config FROM hub_connectors WHERE owner=? ORDER BY id", (principal.owner,))]
        faults = [{"connector": row[0], **json.loads(row[1])} for row in self.db.execute("SELECT connector,body FROM hub_faults WHERE owner=? ORDER BY connector,code", (principal.owner,))]
        if not principal.admin:
            connectors = [item for item in connectors if item["id"] in principal.resources]
            faults = [item for item in faults if item["connector"] in principal.resources]
        conflicts = sum(1 for row in self.db.execute("SELECT connector FROM hub_conflicts WHERE owner=? AND resolved=0",(principal.owner,))
                        if principal.admin or row[0] in principal.resources)
        return {"owner": principal.owner, "connectors": connectors, "faults": faults, "conflicts": conflicts,
                "integrity": {"audit": self.audit_valid(), "boundary_storage": self.boundaries.health()["healthy"]},
                "anchors": arithmetic_health(), "capabilities": CAPABILITIES}

    def add_issuer(self, admin, issuer, key):
        if not admin.admin: raise PermissionError("owner required")
        public_key(key)
        with self.db:
            self.db.execute("INSERT INTO hub_issuers VALUES(?,?,?)", (admin.owner, identifier(issuer), key))
            self.audit(admin, "issuer.register")
        return {"issuer": issuer}

    def verify_attestation(self, principal, claims, signature):
        principal.need("attest:verify")
        fields(claims, ("id", "issuer", "subject", "kind", "artifact_sha256", "expires"))
        if claims["kind"] not in ("issuer-verified-person", "capture-provenance"):
            raise ContractViolation("unsupported attestation kind")
        if type(claims["expires"]) is not int or not self.now() < claims["expires"] <= self.now()+86400:
            raise PermissionError("expired or excessive attestation lifetime")
        if not isinstance(claims["artifact_sha256"], str) or len(claims["artifact_sha256"])!=64 or any(c not in "0123456789abcdef" for c in claims["artifact_sha256"]):
            raise ContractViolation("SHA256 required")
        identifier(claims["id"]); identifier(claims["subject"])
        row = self.db.execute("SELECT public_key FROM hub_issuers WHERE owner=? AND id=?", (principal.owner, claims["issuer"])).fetchone()
        if row is None: raise PermissionError("untrusted issuer")
        try: public_key(row[0]).verify(unb64(signature), canonical(claims).encode())
        except (InvalidSignature, ContractViolation) as exc: raise PermissionError("invalid attestation") from exc
        with self.db:
            self.db.execute("INSERT INTO hub_attestations VALUES(?,?,?)", (principal.owner, claims["id"], canonical(claims)))
            self.audit(principal, "attestation.verify")
        return {"signature_verified": True, "issuer": claims["issuer"], "kind": claims["kind"],
                "meaning": "trusted issuer claim; not independent proof of humanity or unedited capture"}

    def invite(self, admin, ttl=600):
        if not admin.admin: raise PermissionError("owner required")
        if not 0<exact_int(ttl,"ttl")<=86400: raise ContractViolation("invalid invite ttl")
        claims = {"kind": "community-invite", "owner": admin.owner, "id": secrets.token_urlsafe(24), "exp": self.now()+ttl}
        with self.db:
            self.db.execute("INSERT INTO hub_invites(owner,id,expires) VALUES(?,?,?)", (admin.owner, claims["id"], claims["exp"]))
            self.audit(admin, "invite.create")
        return {"invite": self.sign(claims)}

    def redeem(self, admin, invite, member):
        if not admin.admin: raise PermissionError("owner required")
        claims = self.unpack(invite)
        if claims.get("kind")!="community-invite" or claims.get("owner")!=admin.owner or type(claims.get("exp")) is not int or self.now()>=claims["exp"]:
            raise PermissionError("invalid invitation")
        member = identifier(member)
        with self.db:
            changed = self.db.execute("UPDATE hub_invites SET used=1 WHERE owner=? AND id=? AND used=0 AND expires>?", (admin.owner, claims["id"], self.now())).rowcount
            if changed!=1: raise PermissionError("invite already used")
            self.db.execute("INSERT INTO hub_members VALUES(?,?)", (admin.owner, member))
            self.audit(admin, "invite.redeem")
        return {"member": member}

    def payment_intent(self, admin, amount, currency, checkout_origin):
        if not admin.admin: raise PermissionError("owner required")
        amount = i64(amount)
        if amount<=0: raise ContractViolation("positive amount required")
        Money(amount, currency, 2)
        if currency not in ("USD", "EUR", "GBP"):
            raise ContractViolation("demo checkout requires a declared two-decimal currency")
        url = urlsplit(checkout_origin)
        if url.scheme!="https" or not url.hostname or url.username or url.password or url.query or url.fragment or url.path not in ("", "/"):
            raise ContractViolation("explicit HTTPS checkout origin required")
        # No network request, charge or automatic redirect is performed.
        intent = secrets.token_urlsafe(24)
        claims = {"kind": "payment-intent", "owner": admin.owner, "id": intent, "amount_minor": amount,
                  "currency": currency, "exp": self.now()+600, "checkout_origin": checkout_origin}
        with self.db:
            self.db.execute("INSERT INTO hub_payments VALUES(?,?,?,?,?,?)", (admin.owner, intent, amount, currency, claims["exp"], "pending"))
            self.audit(admin, "payment.intent")
        return {"intent": self.sign(claims), "state": "pending", "provider_required": True}

    def confirm_payment(self, admin, payload, timestamp, signature, secret):
        if not admin.admin: raise PermissionError("configured owner required")
        fields(payload, ("intent", "amount", "currency", "event"))
        if type(secret) is not bytes or len(secret)<32: raise ContractViolation("provider secret required")
        if type(timestamp) is not int or abs(self.now()-timestamp)>300: raise PermissionError("stale provider callback")
        raw = canonical(payload).encode()
        expected_signature = hmac.digest(secret, str(timestamp).encode()+b"."+raw, "sha256").hex()
        if not isinstance(signature, str) or not hmac.compare_digest(expected_signature, signature):
            raise PermissionError("invalid provider signature")
        claims = self.unpack(payload["intent"])
        if claims.get("kind")!="payment-intent" or claims.get("owner")!=admin.owner:
            raise PermissionError("wrong payment intent")
        if i64(payload["amount"])!=claims.get("amount_minor") or payload["currency"]!=claims.get("currency"):
            raise ContractViolation("payment amount or currency mismatch")
        event = identifier(payload["event"])
        digest = hashlib.sha256(raw).hexdigest()
        try:
            self.db.execute("BEGIN IMMEDIATE")
            old = self.db.execute("SELECT payload_hash FROM hub_webhooks WHERE owner=? AND connector='payments' AND event=?", (admin.owner, event)).fetchone()
            if old:
                if old[0]!=digest: raise ContractViolation("payment event conflict")
                self.db.commit()
                return {"state": "confirmed", "replayed": True}
            row = self.db.execute("SELECT amount,currency,expires,state FROM hub_payments WHERE owner=? AND id=?", (admin.owner, claims.get("id"))).fetchone()
            if row is None or row[:2]!=(payload["amount"],payload["currency"]): raise ContractViolation("payment state mismatch")
            if self.now()>=row[2]: raise ContractViolation("expired intent; provider reconciliation required")
            if row[3]!="pending": raise ContractViolation("payment already finalized")
            self.db.execute("INSERT INTO hub_webhooks VALUES(?,?,?,?)", (admin.owner, "payments", event, digest))
            self.db.execute("UPDATE hub_payments SET state='confirmed' WHERE owner=? AND id=?", (admin.owner, claims["id"]))
            self.audit(admin, "payment.confirm")
            self.db.commit()
            return {"state": "confirmed", "replayed": False}
        except Exception:
            self.db.rollback()
            raise

    def resolve_conflict(self, admin, conflict, choice):
        if not admin.admin: raise PermissionError("owner required")
        exact_int(conflict,"conflict")
        if choice not in ("local", "remote"): raise ContractViolation("explicit conflict choice required")
        row = self.db.execute("SELECT connector,record,local,resolved FROM hub_conflicts WHERE owner=? AND id=?", (admin.owner,conflict)).fetchone()
        if row is None: raise KeyError("conflict unavailable")
        if row[3]: return {"resolved": True}
        if choice=="local":
            version = self.db.execute("SELECT version FROM hub_records WHERE owner=? AND connector=? AND id=?", (admin.owner,row[0],row[1])).fetchone()
            applied = self.sync(admin,row[0],row[1],json.loads(row[2]),version[0] if version else 0,"resolution-"+str(conflict))
            if applied["status"]!="applied": return {"resolved": False, "retry_required": True}
        with self.db:
            self.db.execute("UPDATE hub_conflicts SET resolved=1 WHERE owner=? AND id=?", (admin.owner,conflict))
            self.audit(admin,"conflict.resolve")
        return {"resolved": True}

    def audit_valid(self):
        previous = "0"*64
        for owner,agent,action,at,prev,digest in self.db.execute("SELECT owner,agent,action,at,prev,hash FROM hub_audit ORDER BY seq"):
            if prev!=previous or hashlib.sha256(canonical([owner,agent,action,at,prev]).encode()).hexdigest()!=digest:
                return False
            previous = digest
        return True

    def export_owner(self, admin):
        if not admin.admin: raise PermissionError("owner required")
        tables=("hub_context","hub_records","hub_changes","hub_conflicts","hub_connectors","hub_faults","hub_audit")
        result={"schema":"one.sovereign-export.v1","owner":admin.owner,"created_at":self.now(),"tables":{}}
        # Table names are constants; the owner filter is always parameterized.
        for table in tables:
            cursor=self.db.execute(f"SELECT * FROM {table} WHERE owner=?",(admin.owner,))
            names=[column[0] for column in cursor.description]
            result["tables"][table]=[dict(zip(names,row)) for row in cursor.fetchall()]
        return result

    def telemetry(self, principal):
        snapshot=self.snapshot(principal)
        now=str(time.time_ns())
        counts={"one.hub.connectors":len(snapshot["connectors"]),"one.hub.faults":len(snapshot["faults"]),
                "one.hub.sync.conflicts":snapshot["conflicts"],"one.hub.audit.healthy":int(snapshot["integrity"]["audit"])}
        return {"resourceMetrics":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"one-sovereign-hub"}}]},
                 "scopeMetrics":[{"scope":{"name":"one.sovereign"},"metrics":[{"name":name,"gauge":{"dataPoints":[{"asInt":str(value),"timeUnixNano":now}]}}
                     for name,value in counts.items()]}]}]}


class OAuthPKCE:
    """Transient state/verifier store; no token exchange or provider is fabricated."""
    def __init__(self, clock=time.time): self.pending, self.clock = {}, clock

    def begin(self, redirect_uri):
        parsed = urlsplit(redirect_uri)
        if parsed.scheme!="https" and not (parsed.scheme=="http" and parsed.hostname=="127.0.0.1"):
            raise ContractViolation("HTTPS or loopback redirect required")
        if len(self.pending)>=1000: raise ContractViolation("too many pending OAuth requests")
        state, verifier = secrets.token_urlsafe(24), secrets.token_urlsafe(48)
        self.pending[state] = (verifier, redirect_uri, self.clock()+300)
        return {"state": state, "code_challenge": b64(hashlib.sha256(verifier.encode()).digest()), "code_challenge_method": "S256"}

    def consume(self, state, redirect_uri):
        pending = self.pending.pop(state, None)
        if pending is None or self.clock()>=pending[2] or pending[1]!=redirect_uri:
            raise PermissionError("invalid OAuth state or redirect")
        return pending[0]


def run_microapp(principal, spec):
    principal.need("microapps:run")
    if type(spec) is not dict or "kind" not in spec: raise ContractViolation("declarative tool required")
    kind = spec["kind"]
    if kind=="split-budget":
        principal.need("quant:run")
        fields(spec, ("kind", "amount_minor", "currency", "buckets"))
        parts = split_money(Money(i64(spec["amount_minor"]), spec["currency"], 2), spec["buckets"])
        return {"parts_minor": [part.amount_minor for part in parts], "currency": spec["currency"]}
    if kind=="duration":
        fields(spec, ("kind", "start", "end"))
        return {"duration": HalfOpen(spec["start"], spec["end"]).length}
    if kind=="room-fit":
        principal.need("simulation:run")
        fields(spec, ("kind", "room_mm", "object_mm"))
        room, item = spec["room_mm"], spec["object_mm"]
        if type(room) is not list or type(item) is not list or len(room)!=3 or len(item)!=3:
            raise ContractViolation("three integer dimensions in millimetres required")
        for value in room+item:
            if not 0<i64(value)<=1_000_000: raise ContractViolation("dimension outside simulation domain")
        return {"fits_axis_aligned": all(a<=b for a,b in zip(item,room)),
                "model": "deterministic AABB; no camera reconstruction or physical safety guarantee"}
    raise ContractViolation("unknown micro-app; arbitrary generated code is not executed")


def local_summary(text, sentences=2):
    if not isinstance(text, str) or len(text)>32_768 or not 0<exact_int(sentences,"sentences")<=10:
        raise ContractViolation("summary input outside limits")
    import re
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return {"summary": " ".join(parts[:sentences]), "engine": "local deterministic extraction", "neural_model": False}


def ambient_event(principal, event):
    principal.need("diagnostics:write")
    fields(event, ("modality", "consent", "action"))
    if event["consent"] is not True: raise PermissionError("explicit input consent required")
    if event["modality"] not in ("voice", "gesture", "gaze", "touch", "sensor"):
        raise ContractViolation("unknown modality")
    if event["action"] not in ("show-health", "next-step", "previous-step"):
        raise ContractViolation("ambient action not allowlisted")
    return {"accepted": True, "action": event["action"], "hardware_connected": False}
