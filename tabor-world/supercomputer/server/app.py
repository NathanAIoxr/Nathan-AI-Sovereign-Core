#!/usr/bin/env python3
"""Tabor World compute server: authenticated, bounded benchmark service."""
import hashlib, hmac, json, os, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_ITERATIONS=100000
class Handler(BaseHTTPRequestHandler):
    def reply(self,status,data):
        body=json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(body)))
        self.send_header("Cache-Control","no-store")
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path=="/health":return self.reply(200,{"service":"tabor-compute-server","status":"online","role":"bounded-cpu-worker"})
        return self.reply(404,{"error":"not_found"})
    def do_POST(self):
        if self.path!="/compute/sha256":return self.reply(404,{"error":"not_found"})
        secret=os.environ.get("TABOR_SERVER_TOKEN")
        supplied=self.headers.get("Authorization","")
        if not secret or not hmac.compare_digest(supplied,"Bearer "+secret):
            return self.reply(401,{"error":"unauthorized"})
        try:
            size=int(self.headers.get("Content-Length","0"))
            if size<1 or size>2048:raise ValueError("invalid payload size")
            data=json.loads(self.rfile.read(size))
            iterations=data["iterations"]
            if type(iterations) is not int or not 1<=iterations<=MAX_ITERATIONS:raise ValueError("iterations out of bounds")
            seed=data.get("seed","tabor")
            if not isinstance(seed,str) or len(seed)>128:raise ValueError("invalid seed")
        except (ValueError,KeyError,TypeError,json.JSONDecodeError):
            return self.reply(400,{"error":"invalid request"})
        start=time.perf_counter()
        digest=seed.encode()
        for _ in range(iterations):digest=hashlib.sha256(digest).digest()
        return self.reply(200,{"iterations":iterations,"sha256":digest.hex(),"elapsed_seconds":round(time.perf_counter()-start,6),"benchmark":"SHA256 demo, not FP64 HPL"})
if __name__=="__main__":
    ThreadingHTTPServer(("0.0.0.0",int(os.getenv("PORT","8080"))),Handler).serve_forever()
