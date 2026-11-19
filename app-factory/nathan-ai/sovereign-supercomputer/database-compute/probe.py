from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import math
import os
from tempfile import TemporaryFile


class Probe(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/probe":
            self.send_error(404)
            return
        sample = bytearray(1024 * 1024)
        sample[0] = 7
        with TemporaryFile() as disk:
            disk.write(sample)
            disk.seek(0)
            disk_verified = disk.read(1) == b"\x07"
        result = {
            "fp64_checksum": math.fsum(float(i) * 0.5 for i in range(1, 65537)),
            "memory_probe_bytes": len(sample),
            "scratch_disk_verified": disk_verified,
        }
        payload = json.dumps(result).encode("utf-8")
        self.send_response(200 if disk_verified else 500)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


HTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), Probe).serve_forever()
