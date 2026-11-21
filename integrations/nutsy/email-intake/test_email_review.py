import base64
import json
import re
import tempfile
import unittest
from contextlib import ExitStack
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from ear1 import initialize, intake_handler
from review import create_server


class EmailReviewTest(unittest.TestCase):
    def test_email_through_explicit_go(self):
        outgoing = []

        class Conductor(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass

            def do_POST(self):
                body = self.rfile.read(int(self.headers["Content-Length"]))
                outgoing.append((self.path, self.headers["Authorization"], json.loads(body)))
                self.send_response(202)
                self.end_headers()

        def serve(stack, server):
            stack.enter_context(server)
            thread = Thread(target=server.serve_forever)
            thread.start()
            stack.callback(thread.join)
            stack.callback(server.shutdown)
            return f"http://127.0.0.1:{server.server_port}"

        def call(url, auth=None, body=None, mime=None, origin=None):
            headers = {key: value for key, value in {
                "Authorization": auth, "Content-Type": mime, "Origin": origin,
            }.items() if value is not None}
            try:
                response = urlopen(Request(url, body, headers), timeout=4)
            except HTTPError as error:
                response = error
            with response:
                return response.status, response.read().decode()

        with ExitStack() as stack:
            directory = stack.enter_context(tempfile.TemporaryDirectory())
            database = Path(directory) / "email.db"
            initialize(database)
            conductor = HTTPServer(("127.0.0.1", 0), Conductor)
            serve(stack, conductor)
            intake = serve(stack, HTTPServer(
                ("127.0.0.1", 0), intake_handler(database, "intake-secret", "owner@example.com")
            ))
            review = serve(stack, create_server(database, "review-secret", "conductor-secret",
                                               review_port=0, conductor_port=conductor.server_port))
            auth = "Basic " + base64.b64encode(b"owner:review-secret").decode()
            email = (b"From: owner@example.com\r\nSubject: HEAR YA\r\n"
                     b"Content-Type: text/plain; charset=utf-8\r\n\r\n  <original>  \r\n")
            status, receipt = call(intake + "/ear1/hear", "Bearer intake-secret", email, "message/rfc822")
            self.assertEqual(status, 201)
            receipt_id = json.loads(receipt)["receipt_id"]
            self.assertEqual(call(review + "/ear2/inbox")[0], 401)
            self.assertIn("HEAR YA", call(review + "/ear2/inbox", auth)[1])
            path = f"/ear2/review/{receipt_id}"
            status, page = call(review + path + "?destination=R2_UPLOAD", auth)
            self.assertEqual(status, 200)
            self.assertIn("&lt;original&gt;", page)
            proof = re.search(r'name="approval" value="([a-f0-9]+)"', page)[1]
            go = review + f"/mouth/go/{receipt_id}"

            def submit(task, approved, origin=review, confirmed="yes"):
                form = urlencode({"destination": task, "approval": approved, "confirmed": confirmed}).encode()
                return call(go, auth, form, "application/x-www-form-urlencoded", origin)[0]

            self.assertEqual(submit("GIT_PUSH", proof), 403)
            self.assertEqual(submit("R2_UPLOAD", proof, "https://example.com"), 403)
            self.assertEqual(submit("R2_UPLOAD", proof, confirmed="no"), 400)
            self.assertEqual(outgoing, [])
            self.assertEqual(submit("R2_UPLOAD", proof), 200)
            self.assertEqual(submit("R2_UPLOAD", proof), 409)
            self.assertEqual(len(outgoing), 1)
            route, credential, packet = outgoing[0]
            self.assertEqual((route, credential, packet["task_type"]),
                             ("/dispatch", "Bearer conductor-secret", "R2_UPLOAD"))
            self.assertEqual(base64.b64decode(packet["payload"]["content_base64"]), b"  <original>  \r\n")
            self.assertIn("accepted", call(review + path, auth)[1])


if __name__ == "__main__":
    unittest.main()
