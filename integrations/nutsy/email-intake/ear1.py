"""Private email capture for NUTSY. Run behind the existing access boundary."""

import hmac
import json
import os
import sqlite3
from contextlib import closing
from email import policy
from email.parser import BytesParser
from hashlib import sha256
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

MAX_BYTES = 128 * 1024


def initialize(db_path):
    with closing(sqlite3.connect(db_path)) as db, db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS email_inbox (
                receipt_id TEXT PRIMARY KEY,
                body_sha256 TEXT NOT NULL,
                subject TEXT NOT NULL,
                source_text TEXT NOT NULL,
                source_email BLOB NOT NULL,
                received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


def stage_email(db_path, raw, authorized_sender):
    message = BytesParser(policy=policy.default).parsebytes(raw)
    from_headers = message.get_all("From", [])
    addresses = from_headers[0].addresses if len(from_headers) == 1 else ()
    if len(addresses) != 1 or addresses[0].addr_spec.casefold() != authorized_sender.casefold():
        raise ValueError("Unauthorized From")
    part = message.get_body(preferencelist=("plain",))
    if part is None:
        raise ValueError("No plain-text body")
    body = part.get_content(errors="strict")
    if not body.strip():
        raise ValueError("Empty plain-text body")
    receipt_id = sha256(raw).hexdigest()
    text_hash = sha256(body.encode("utf-8")).hexdigest()
    with closing(sqlite3.connect(db_path)) as db, db:
        row = db.execute(
            """
            INSERT INTO email_inbox (receipt_id, body_sha256, subject, source_text, source_email)
            VALUES (?, ?, ?, ?, ?) ON CONFLICT(receipt_id) DO NOTHING
            """,
            (receipt_id, text_hash, str(message.get("Subject", "")), body, raw),
        )
        created = row.rowcount == 1
    return created, {"receipt_id": receipt_id, "body_sha256": text_hash, "status": "captured"}


def intake_handler(db_path, token, sender):
    class Intake(BaseHTTPRequestHandler):
        timeout = 5

        def log_message(self, *_args):
            # Keep request metadata and message contents out of the service log.
            pass

        def reply(self, status, document):
            data = json.dumps(document).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_POST(self):
            if self.path != "/ear1/hear":
                return self.reply(404, {"error": "unknown route"})
            credentials = self.headers.get_all("Authorization", [])
            if len(credentials) != 1 or not hmac.compare_digest(
                credentials[0].encode("utf-8"), ("Bearer " + token).encode("utf-8")
            ):
                return self.reply(401, {"error": "authentication required"})
            if self.headers.get_content_type() != "message/rfc822":
                return self.reply(415, {"error": "expected message/rfc822"})
            lengths = self.headers.get_all("Content-Length", [])
            if (len(lengths) != 1 or not lengths[0].isascii() or not lengths[0].isdigit()
                    or len(lengths[0]) > 6 or self.headers.get("Transfer-Encoding")):
                return self.reply(400, {"error": "expected a single valid Content-Length"})
            size = int(lengths[0])
            if not 1 <= size <= MAX_BYTES:
                return self.reply(413, {"error": "invalid email size"})
            self.connection.settimeout(5)
            try:
                raw = self.rfile.read(size)
            except TimeoutError:
                return self.reply(408, {"error": "timed out reading email"})
            if len(raw) != size:
                return self.reply(400, {"error": "incomplete email"})
            try:
                created, receipt = stage_email(db_path, raw, sender)
            except (ValueError, LookupError, TypeError):
                return self.reply(422, {"error": "invalid plain-text email"})
            except sqlite3.Error:
                return self.reply(503, {"error": "email inbox unavailable"})
            return self.reply(201 if created else 200, receipt)

    return Intake


if __name__ == "__main__":
    os.umask(0o077)
    token = os.environ["NUTSY_EMAIL_TOKEN"]
    sender = os.environ["NUTSY_EMAIL_SENDER"]
    if len(token) < 32 or not token.isascii() or any(ch.isspace() for ch in token) or not sender:
        raise SystemExit("Set a dedicated intake token and an authorized sender")
    database = Path(os.environ["STATE_DIRECTORY"]) / "email-inbox.sqlite3"
    initialize(database)
    with HTTPServer(("127.0.0.1", 8791), intake_handler(database, token, sender)) as server:
        server.timeout = 5
        server.serve_forever()
