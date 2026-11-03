#!/usr/bin/env python3
"""Start a private localhost server; never exposes the site to the network."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import argparse

class PrivacyHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.webmanifest': 'application/manifest+json', '.js': 'text/javascript'}

    def end_headers(self):
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'")
        if '/private-samples/' in self.path:
            self.send_header('Cache-Control','no-store, private')
        super().end_headers()

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description='EYEPRINTS × HANDPRINTS private local server')
    parser.add_argument('--port',type=int,default=8765)
    args=parser.parse_args()
    root=Path(__file__).resolve().parent
    httpd=ThreadingHTTPServer(('127.0.0.1',args.port),partial(PrivacyHandler,directory=str(root)))
    print(f'EYEPRINTS × HANDPRINTS: http://127.0.0.1:{args.port}/index.html')
    print('Localhost only. The private sample images must never be hosted publicly.')
    httpd.serve_forever()
