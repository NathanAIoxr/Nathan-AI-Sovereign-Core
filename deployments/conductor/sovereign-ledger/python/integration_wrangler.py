"""Exercise signed ledger requests against Wrangler and a disposable local D1."""

from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
from tempfile import TemporaryDirectory
from threading import Barrier
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from ledger import FORMAT_ANCHOR, client_hash, sign_request, validate_record

ROOT = Path(__file__).resolve().parents[1]
WRANGLER = ROOT / "node_modules" / ".bin" / "wrangler"


def request(base_url, path, body=None, headers=None):
    data = body.encode("utf-8") if body is not None else None
    req = Request(base_url + path, data=data, headers=headers or {})
    try:
        response = urlopen(req, timeout=5)
    except HTTPError as error:
        response = error
    with response:
        try:
            return response.status, json.load(response)
        except ValueError as error:
            raise AssertionError(f"{path}: HTTP {response.status} with invalid JSON") from error


def signed_headers(secret, method, path, body="", age=0):
    ts = str(int(time.time()) - age)
    return {
        "Content-Type": "application/json",
        "X-Sovereign-Anchor": FORMAT_ANCHOR,
        "X-Ledger-Timestamp": ts,
        "X-Ledger-Signature": sign_request(secret, ts, method, path, body),
    }


def batch(*sigla):
    records = []
    for siglum in sigla:
        record = {
            "scroll_siglum": siglum,
            "cave_or_site": "Wrangler local fixture",
            "medium": "parchment",
            "script_lang": "Hebrew",
            "epigraphic_status": "reconstructed",
            "raw_text": "שָׁלוֹם — " + siglum,
        }
        record["client_sha256"] = client_hash(validate_record(record))
        records.append(record)
    return json.dumps({"records": records}, ensure_ascii=False, separators=(",", ":"))


def expect(result, status):
    actual, payload = result
    if actual != status:
        raise AssertionError(f"expected HTTP {status}, got {actual}: {payload}")
    return payload


def wait_ready(process, base_url):
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline and process.poll() is None:
        try:
            if request(base_url, "/health") == (200, {"status": "online"}):
                return
        except (URLError, ConnectionError, TimeoutError):
            pass
        time.sleep(0.15)
    raise RuntimeError("Wrangler local Worker did not become ready")


def test_requests(base_url, secret):
    body = batch("LOCAL-A", "LOCAL-B", "LOCAL-C")
    headers = signed_headers(secret, "POST", "/ingest", body)
    committed = expect(request(base_url, "/ingest", body, headers), 200)
    assert committed["count"] == 3

    verified = expect(request(base_url, "/verify", headers=signed_headers(secret, "GET", "/verify")), 200)
    assert verified["ok"] and verified["checked"] == 3 and verified["done"]
    assert verified["last_hash"] == committed["head_sha256"]

    expect(request(base_url, "/ingest", body, headers), 409)
    expect(request(base_url, "/ingest", body.replace("LOCAL-A", "LOCAL-X"), headers), 401)
    stale = signed_headers(secret, "POST", "/ingest", body, age=301)
    expect(request(base_url, "/ingest", body, stale), 401)
    print("PASS: 3 inserts, chain verification, replay 409, tampered body 401, stale timestamp 401")


def test_concurrency(base_url, secret):
    start = Barrier(2, timeout=5)

    def write(siglum):
        body = batch(siglum)
        headers = signed_headers(secret, "POST", "/ingest", body)
        start.wait()
        result = expect(request(base_url, "/ingest", body, headers), 200)
        assert result["count"] == 1
        return result["head_sha256"]

    with ThreadPoolExecutor(max_workers=2) as pool:
        heads = set(pool.map(write, ["LOCAL-D", "LOCAL-E"]))
    assert len(heads) == 2

    verified = expect(request(base_url, "/verify", headers=signed_headers(secret, "GET", "/verify")), 200)
    assert verified["ok"] and verified["checked"] == 5 and verified["done"]
    assert verified["last_hash"] in heads
    print("PASS: both concurrent requests committed and the 5-record chain verified")


def main():
    env = dict(os.environ, CI="true", WRANGLER_SEND_METRICS="false")
    with TemporaryDirectory(prefix="nathan-ledger-d1-") as tmp:
        root = Path(tmp)
        state = root / "state"
        secret = secrets.token_hex(32)
        env_file = root / ".dev.vars"
        env_file.touch(mode=0o600)
        env_file.write_text(f"LEDGER_HMAC_SECRET={secret}\n", encoding="utf-8")

        subprocess.run(
            [WRANGLER, "d1", "migrations", "apply", "nathan-ledger", "--local", "--persist-to", state],
            cwd=ROOT, env=env, check=True, timeout=60,
        )

        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        base_url = f"http://127.0.0.1:{port}"
        log = root / "wrangler.log"
        with log.open("w", encoding="utf-8") as output:
            process = subprocess.Popen(
                [WRANGLER, "dev", "--local", "--ip", "127.0.0.1", "--port", str(port),
                 "--persist-to", state, "--env-file", env_file],
                cwd=ROOT, env=env, stdout=output, stderr=subprocess.STDOUT,
            )
            try:
                wait_ready(process, base_url)
                test_requests(base_url, secret)
                test_concurrency(base_url, secret)
            except Exception:
                print(log.read_text(encoding="utf-8", errors="replace").replace(secret, "[redacted]"))
                raise
            finally:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()


if __name__ == "__main__":
    main()
