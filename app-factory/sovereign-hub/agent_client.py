#!/usr/bin/env python3
"""Call the local hub using an issued capability and an Ed25519 request proof."""
import argparse
import os
from pathlib import Path
import secrets
import time
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from hub import ContractViolation, Hub, b64, canonical, unb64
from boundary_api import decode_json


def signed_headers(private_key, token, method, path, body, timestamp=None, nonce=None):
    timestamp = int(time.time()) if timestamp is None else timestamp
    nonce = secrets.token_hex(24) if nonce is None else nonce
    message = Hub.proof_message(token, method, path, body, timestamp, nonce)
    return {"Authorization": "Bearer "+token, "X-Agent-Time": str(timestamp),
            "X-Agent-Nonce": nonce, "X-Agent-Signature": b64(private_key.sign(message)),
            "Content-Type": "application/json"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url",default="http://127.0.0.1:8780")
    parser.add_argument("--private-key",type=Path,required=True)
    parser.add_argument("--path",default="/api/snapshot")
    parser.add_argument("--body",type=Path)
    args = parser.parse_args()
    parsed = urlsplit(args.url)
    if parsed.scheme!="http" or parsed.hostname!="127.0.0.1" or parsed.path not in ("", "/") or parsed.username or parsed.password or parsed.query or parsed.fragment:
        parser.error("explicit loopback hub URL required")
    if not args.path.startswith("/") or args.path.startswith("//") or "#" in args.path:
        parser.error("absolute local request path required")
    if args.private_key.stat().st_mode & 0o077:
        parser.error("private key must be owner-only (chmod 600)")
    token = os.environ.get("ONE_AGENT_TOKEN","")
    if not token: parser.error("ONE_AGENT_TOKEN is required")
    key = Ed25519PrivateKey.from_private_bytes(unb64(args.private_key.read_text().strip()))
    body = canonical(decode_json(args.body.read_bytes())).encode() if args.body else b""
    method = "POST" if args.body else "GET"
    headers = signed_headers(key,token,method,args.path,body)
    request = Request(args.url.rstrip("/")+args.path,data=body if args.body else None,method=method,headers=headers)
    with urlopen(request,timeout=10) as response: print(response.read().decode())


if __name__=="__main__": main()
