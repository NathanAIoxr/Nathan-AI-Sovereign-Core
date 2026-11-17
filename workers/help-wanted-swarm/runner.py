#!/usr/bin/env python3
"""Consume leased repair jobs using rootless Podman job images."""

import argparse
import json
import logging
import os
from pathlib import Path
import random
import signal
import subprocess
import tempfile
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import uuid4


LOG = logging.getLogger("nathan-repair")
STOP = threading.Event()


class LeaseLost(Exception):
    pass


class RetryJob(Exception):
    pass


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class QueueClient:
    def __init__(self, endpoint, token):
        url = urlsplit(endpoint)
        if url.scheme != "https" or not url.hostname or url.query or url.fragment or url.username:
            raise ValueError("QUEUE_URL must be an HTTPS URL")
        if len(token) < 32:
            raise ValueError("REPAIR_RUNNER_TOKEN is missing")
        self.url = endpoint.rstrip("/")
        self.token = token
        self.opener = build_opener(NoRedirects())

    def post(self, action, body):
        request = Request(
            f"{self.url}/api/repair/{action}",
            data=json.dumps(body, separators=(",", ":")).encode(),
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        for attempt in range(3):
            try:
                with self.opener.open(request, timeout=8) as response:
                    return json.loads(response.read(128_000))
            except HTTPError as exc:
                if exc.code == 409:
                    raise LeaseLost(action) from exc
                if exc.code not in (429, 500, 502, 503, 504):
                    raise
                LOG.warning("%s returned HTTP %s", action, exc.code)
                retry_after = exc.headers.get("Retry-After", "")
                wait = min(int(retry_after), 15) if retry_after.isdigit() else 2 ** attempt
            except (URLError, TimeoutError):
                wait = 2 ** attempt
            if attempt < 2:
                time.sleep(wait + random.random())
        raise RetryJob(f"{action} unavailable")


def remove_container(name):
    try:
        subprocess.run(["podman", "rm", "-f", "--ignore", name], check=False,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20)
    except subprocess.TimeoutExpired:
        LOG.warning("Timed out removing %s", name)


def run_sandbox(task, profile, lost):
    lease = task["lease_id"]
    name = f"nathan-repair-{lease}"
    deadline = time.monotonic() + profile.get("timeoutSeconds", 600)
    with tempfile.TemporaryDirectory(prefix="nathan-repair-") as temp:
        directory = Path(temp)
        (directory / "task.json").write_text(json.dumps(task), encoding="utf-8")
        network = "slirp4netns" if profile.get("network") else "none"
        command = [
            "podman", "run", "--rm", "--pull=never", "--name", name,
            "--userns=keep-id", "--user", f"{os.getuid()}:{os.getgid()}",
            "--cap-drop=all", "--security-opt=no-new-privileges",
            "--read-only", "--network", network, "--pids-limit=128",
            "--memory=2g", "--cpus=2", "--tmpfs", "/tmp:rw,size=256m",
            "--volume", f"{directory}:/job:Z", "--workdir", "/job",
            profile["image"], *profile.get("args", []),
        ]
        with subprocess.Popen(command, stdout=subprocess.DEVNULL,
                              stderr=subprocess.DEVNULL) as process:
            try:
                while process.poll() is None:
                    if lost.is_set() or STOP.is_set():
                        raise LeaseLost("sandbox canceled")
                    if time.monotonic() >= deadline:
                        raise RetryJob("sandbox exceeded its deadline")
                    lost.wait(0.25)
                if process.returncode:
                    raise RetryJob(f"sandbox exit {process.returncode}")
            finally:
                if process.poll() is None:
                    remove_container(name)
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()
                remove_container(name)
        result_file = directory / "result.json"
        if result_file.is_symlink() or not result_file.is_file() or result_file.stat().st_size > 58_000:
            raise RetryJob("sandbox did not return a bounded result")
        result = json.loads(result_file.read_text(encoding="utf-8"))
        if not isinstance(result, dict) or not isinstance(result.get("receipt"), dict) or result.get("status") not in ("PATCH_READY", "VERIFIED", "NEEDS_REVIEW", "RETRY_WAIT"):
            raise RetryJob("sandbox returned an unrecognized status")
        return result


def process_task(client, worker_id, task, profile):
    lease = {"id": task["id"], "lease": task["lease_id"], "worker": worker_id}
    finished = threading.Event()
    lost = threading.Event()

    def heartbeat():
        while not finished.wait(25):
            try:
                client.post("heartbeat", lease)
            except (LeaseLost, RetryJob, HTTPError):
                lost.set()
                return

    thread = threading.Thread(target=heartbeat, daemon=True)
    thread.start()
    try:
        try:
            result = run_sandbox(task, profile, lost)
        except (RetryJob, OSError, ValueError) as exc:
            result = {"status": "RETRY_WAIT", "receipt": {"reason": str(exc)[:400]}}
        if lost.is_set():
            raise LeaseLost("heartbeat rejected")
        receipt = client.post("finish", {**lease, "status": result["status"], "receipt": result["receipt"]})
        LOG.info("%s %s", task["id"], receipt["task"]["status"])
    except LeaseLost:
        LOG.warning("Lease lost for %s", task["id"])
    finally:
        finished.set()
        thread.join(timeout=12)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    settings = json.loads(Path(args.config).read_text(encoding="utf-8"))
    worker_id = settings["worker"]
    scope = settings["scope"]
    profile = settings["profile"]
    repositories = settings["repositories"]
    if scope not in ("INTERNAL", "GLOBAL", "ANY") or not 1 <= len(repositories) <= 50:
        raise ValueError("Choose one scope and one to fifty repository identities")
    if not isinstance(profile.get("image"), str) or not profile["image"].strip():
        raise ValueError("A locally installed, trusted job image is required")
    rootless = subprocess.run(
        ["podman", "info", "--format", "{{.Host.Security.Rootless}}"],
        check=True, capture_output=True, text=True, timeout=15,
    )
    if rootless.stdout.strip() != "true":
        raise ValueError("A rootless Podman service account is required")
    client = QueueClient(settings["url"], os.environ["REPAIR_RUNNER_TOKEN"])
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    for kind in (signal.SIGTERM, signal.SIGINT):
        signal.signal(kind, lambda *_: STOP.set())
    request_id = str(uuid4())
    while not STOP.is_set():
        try:
            claim = client.post("claim", {
                "scope": scope, "worker": worker_id, "requestId": request_id,
                "repositories": repositories,
            })
            request_id = str(uuid4())
            if claim["status"] == "IDLE":
                STOP.wait(10 + random.random() * 5)
                continue
            process_task(client, worker_id, claim["task"], profile)
        except (RetryJob, HTTPError, OSError, ValueError) as exc:
            LOG.warning("Queue operation failed: %s", exc)
            STOP.wait(10 + random.random() * 5)


if __name__ == "__main__":
    main()
