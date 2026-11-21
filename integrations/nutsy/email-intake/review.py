"""Private NUTSY Ear 2 review and explicit owner GO for a captured email."""

import base64
import hmac
import json
import re
import sqlite3
from contextlib import closing
from hashlib import sha256
from html import escape
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

REPOSITORY = "NathanAIoxr/Nathan-AI-Sovereign-Core"
DESTINATIONS = ("R2_UPLOAD", "D1_WRITE", "GIT_PUSH")
RECEIPT = r"/ear2/review/([a-f0-9]{64})"
ORIGIN = "http://127.0.0.1:{port}"


def initialize(db_path):
    with closing(sqlite3.connect(db_path)) as db, db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS email_dispatch (
                receipt_id TEXT PRIMARY KEY REFERENCES email_inbox(receipt_id),
                task_type TEXT NOT NULL,
                packet_sha256 TEXT NOT NULL,
                state TEXT NOT NULL,
                http_status INTEGER,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


def packet_for(receipt_id, task_type, source):
    record_id = "nutsy-email-" + receipt_id
    if task_type == "R2_UPLOAD":
        payload = {
            "id": record_id,
            "content_type": "text/plain",
            "content_base64": base64.b64encode(source.encode("utf-8")).decode("ascii"),
        }
    elif task_type == "D1_WRITE":
        payload = {"id": record_id, "data": {"source_text": source, "source": "nutsy-email"}}
    elif task_type == "GIT_PUSH":
        payload = {
            "repo": REPOSITORY,
            "path": f"nutsy-reviewed-email/{receipt_id}.txt",
            "content": source,
            "message": f"NUTSY reviewed email {receipt_id[:12]}",
        }
    else:
        raise ValueError("Unknown destination")
    return json.dumps({"task_type": task_type, "payload": payload}, ensure_ascii=True).encode("ascii")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *_args, **_kwargs):
        return None


def dispatch_packet(packet, token, port):
    request = Request(
        f"http://127.0.0.1:{port}/dispatch",
        data=packet,
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with build_opener(ProxyHandler({}), NoRedirect()).open(request, timeout=8) as response:
            status = response.status
    except HTTPError as error:
        status = error.code
        error.close()
    except (OSError, URLError):
        return "unconfirmed", None
    return ("accepted" if 200 <= status < 300 else "unconfirmed"), status


def create_server(db_path, owner_password, conductor_token, review_port=8792, conductor_port=8000):
    initialize(db_path)
    auth = "Basic " + base64.b64encode(("owner:" + owner_password).encode()).decode("ascii")

    class Review(BaseHTTPRequestHandler):
        timeout = 10

        def log_message(self, *_args):
            pass

        def page(self, status, title, body, challenge=False):
            data = (
                '<!doctype html><html lang="en"><meta charset="utf-8">'
                '<meta name="viewport" content="width=device-width, initial-scale=1">'
                f'<title>{title}</title><body><main style="max-width:60rem;margin:2rem auto;padding:1rem;'
                f'font:1rem system-ui"><h1>{title}</h1>{body}</main></body></html>'
            ).encode()
            self.send_response(status)
            if challenge:
                self.send_header("WWW-Authenticate", 'Basic realm="NUTSY owner review"')
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(data)

        def authorized(self):
            if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
                self.page(421, "Open the loopback address", "")
                return False
            supplied = self.headers.get("Authorization", "").encode("utf-8")
            if not hmac.compare_digest(supplied, auth.encode("ascii")):
                self.page(401, "NUTSY owner sign-in", "", challenge=True)
                return False
            return True

        def do_GET(self):
            if not self.authorized():
                return
            with closing(sqlite3.connect(db_path)) as db:
                if self.path == "/ear2/inbox":
                    rows = db.execute("""
                        SELECT i.receipt_id, i.subject, i.received_at, COALESCE(d.state, 'captured')
                        FROM email_inbox i LEFT JOIN email_dispatch d USING (receipt_id)
                        ORDER BY i.received_at DESC, i.receipt_id DESC LIMIT 50
                    """).fetchall()
                    listing = "".join(
                        f'<li><a href="/ear2/review/{receipt_id}">{escape(subject or "(No subject)")}</a> '
                        f'{escape(received_at)} UTC · {escape(state)}</li>'
                        for receipt_id, subject, received_at, state in rows
                    )
                    return self.page(200, "NUTSY · Ear 2", f"<ul>{listing}</ul>" if rows else "<p>No email captured.</p>")
                match = re.fullmatch(RECEIPT + r"(?:\?destination=([A-Z0-9_]+))?", self.path)
                if not match:
                    return self.page(404, "Email review unavailable", "")
                receipt_id, destination = match.groups()
                row = db.execute("""
                    SELECT i.subject, i.source_text, i.body_sha256, d.state
                    FROM email_inbox i LEFT JOIN email_dispatch d USING (receipt_id)
                    WHERE i.receipt_id = ?
                """, (receipt_id,)).fetchone()
            if row is None or (destination and destination not in DESTINATIONS):
                return self.page(404, "Email review unavailable", "")
            subject, source, text_hash, state = row
            body = (
                '<p><a href="/ear2/inbox">Inbox</a></p>'
                f'<p>Subject <strong>{escape(subject)}</strong></p>'
                f'<p>Source SHA-256 <code style="overflow-wrap:anywhere">{text_hash}</code></p>'
                f'<h2>Original text</h2><pre style="white-space:pre-wrap;overflow-wrap:anywhere">{escape(source)}</pre>'
            )
            if state:
                return self.page(200, "NUTSY · Email already reviewed", body + f"<p>Dispatch status {escape(state)}.</p>")
            if not destination:
                links = "".join(
                    f'<li><a href="?destination={task}">{task}</a></li>' for task in DESTINATIONS
                )
                return self.page(200, "NUTSY · Select a destination", body + f"<ul>{links}</ul>")
            packet = packet_for(receipt_id, destination, source)
            proof = hmac.new(owner_password.encode(), packet, sha256).hexdigest()
            if destination == "GIT_PUSH":
                body += "<p>GitHub may expose this email text in the repository or pull request.</p>"
            body += (
                f'<h2>{destination} request</h2>'
                f'<pre style="white-space:pre-wrap;overflow-wrap:anywhere">{escape(packet.decode())}</pre>'
                f'<form action="/mouth/go/{receipt_id}" method="post">'
                f'<input type="hidden" name="destination" value="{destination}">'
                f'<input type="hidden" name="approval" value="{proof}">'
                '<label><input type="checkbox" name="confirmed" value="yes" required> '
                'I reviewed the exact destination and content.</label> <button type="submit">GO</button></form>'
            )
            return self.page(200, "NUTSY · One Mouth", body)

        def do_POST(self):
            if not self.authorized():
                return
            match = re.fullmatch(r"/mouth/go/([a-f0-9]{64})", self.path)
            if not match:
                return self.page(404, "Unknown request", "")
            if self.headers.get("Origin") != ORIGIN.format(port=self.server.server_port):
                return self.page(403, "Open GO from the review page", "")
            lengths = self.headers.get_all("Content-Length", [])
            if (len(lengths) != 1 or not re.fullmatch(r"[0-9]{1,3}", lengths[0])
                    or self.headers.get("Transfer-Encoding")
                    or self.headers.get_content_type() != "application/x-www-form-urlencoded"):
                return self.page(400, "Invalid GO request", "")
            try:
                fields = parse_qs(self.rfile.read(int(lengths[0])).decode("ascii"), max_num_fields=3)
            except (ValueError, TimeoutError):
                return self.page(400, "Invalid GO request", "")
            destination = fields.get("destination", [""])
            if (len(destination) != 1 or destination[0] not in DESTINATIONS
                    or fields.get("confirmed") != ["yes"]):
                return self.page(400, "Review and confirm the exact request", "")
            task = destination[0]
            receipt_id = match[1]
            with closing(sqlite3.connect(db_path)) as db, db:
                row = db.execute("SELECT source_text FROM email_inbox WHERE receipt_id = ?", (receipt_id,)).fetchone()
                if row is None:
                    return self.page(404, "Email review unavailable", "")
                packet = packet_for(receipt_id, task, row[0])
                proof = hmac.new(owner_password.encode(), packet, sha256).hexdigest()
                if fields.get("approval") != [proof]:
                    return self.page(403, "Open a new review for this request", "")
                reserved = db.execute("""
                    INSERT INTO email_dispatch (receipt_id, task_type, packet_sha256, state)
                    VALUES (?, ?, ?, 'sending') ON CONFLICT(receipt_id) DO NOTHING
                """, (receipt_id, task, sha256(packet).hexdigest()))
                if reserved.rowcount != 1:
                    return self.page(409, "A GO attempt already exists", "")
            state, status = dispatch_packet(packet, conductor_token, conductor_port)
            with closing(sqlite3.connect(db_path)) as db, db:
                db.execute("""
                    UPDATE email_dispatch SET state = ?, http_status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE receipt_id = ?
                """, (state, status, receipt_id))
            http = f" HTTP {status}." if status is not None else ""
            if state == "accepted":
                return self.page(200, "Conductor accepted GO",
                                 f"<p>{task}.{http} Check the queue and destination for completion.</p>")
            return self.page(502, "GO delivery unconfirmed",
                             f"<p>{task}.{http} Check the Conductor ledger before any further attempt.</p>")

    return HTTPServer(("127.0.0.1", review_port), Review)
