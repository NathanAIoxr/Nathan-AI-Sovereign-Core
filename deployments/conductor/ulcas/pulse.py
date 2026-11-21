"""Send one typed Lane 10 observation to the local Node X service."""
import json
import os
from pathlib import Path
import shutil
import socket
import uuid
from urllib.request import Request, urlopen


def main():
    fields = {
        "host": socket.gethostname(),
        "uptime_seconds": int(float(Path("/proc/uptime").read_text().split()[0])),
        "disk_free_bytes": shutil.disk_usage("/var/lib").free,
    }
    body = json.dumps({"event_id": uuid.uuid4().hex, "data": fields}).encode()
    request = Request("http://127.0.0.1:8072/x/reverse_egress", body, {
        "Authorization": "Bearer " + os.environ["ULCAS_PULSE_TOKEN"],
        "Content-Type": "application/json",
    })
    with urlopen(request, timeout=5) as response:
        if json.load(response).get("state") != "recorded":
            raise RuntimeError("Node X did not record the heartbeat")


if __name__ == "__main__":
    main()
