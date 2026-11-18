#!/usr/bin/env python3
import hashlib, json, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
class Handler(BaseHTTPRequestHandler):
    def send_json(self,code,data):
        body=json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path=="/health": return self.send_json(200,{"server":"Tabor Linux Server","runtime":"Python on Linux container","ready":True})
        return self.send_json(404,{"error":"not found"})
    def do_POST(self):
        if self.path!="/compute/sha256":return self.send_json(404,{"error":"not found"})
        try:
            size=int(self.headers.get("Content-Length","0"))
            if size<1 or size>2048:raise ValueError()
            payload=json.loads(self.rfile.read(size))
            n=payload["iterations"]; seed=payload["seed"]
            if type(n) is not int or n<1 or n>10000 or not isinstance(seed,str) or len(seed)>128:raise ValueError()
        except (ValueError,KeyError,TypeError):return self.send_json(400,{"error":"invalid request"})
        t=time.perf_counter(); x=seed.encode()
        for _ in range(n):x=hashlib.sha256(x).digest()
        return self.send_json(200,{"sha256":x.hex(),"iterations":n,"elapsed_seconds":round(time.perf_counter()-t,6)})
if __name__=="__main__":ThreadingHTTPServer(("0.0.0.0",8080),Handler).serve_forever()
