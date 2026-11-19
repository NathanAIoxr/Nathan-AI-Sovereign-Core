"""Verify boot and all four profile selections in a networkless QEMU guest."""

import json
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time


def wait_for(predicate, description):
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        value = predicate()
        if value:
            return value
        time.sleep(0.04)
    raise RuntimeError(description)


def main(out):
    image = out / "hat-os-boot.img"
    output = out / "serial.txt"
    output.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory(prefix="hat-qemu-") as directory:
        qmp = Path(directory) / "qmp.sock"
        command = [
            "qemu-system-i386", "-m", "32M", "-nic", "none", "-display", "none",
            "-monitor", "none", "-serial", f"file:{output}",
            "-drive", f"file={image},format=raw,readonly=on,if=floppy", "-boot", "a",
            "-qmp", f"unix:{qmp},server=on,wait=off",
        ]
        process = subprocess.Popen(command)
        try:
            wait_for(qmp.exists, "QEMU QMP socket unavailable")
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as connection:
                connection.settimeout(3)
                connection.connect(str(qmp))
                with connection.makefile("rb") as reader:
                    json.loads(reader.readline())

                    def execute(name, arguments=None):
                        request = {"execute": name}
                        if arguments is not None:
                            request["arguments"] = arguments
                        connection.sendall((json.dumps(request) + "\n").encode())
                        while True:
                            response = json.loads(reader.readline())
                            if "error" in response:
                                raise RuntimeError(response["error"])
                            if "return" in response:
                                return response["return"]

                    def seen(marker):
                        return output.exists() and marker in output.read_text(errors="replace")

                    execute("qmp_capabilities")
                    wait_for(lambda: seen("HATOS:BOOT_READY"), "BIOS boot marker missing")
                    for key, profile in enumerate(("WORK", "CREATOR", "GAMING", "GHOST"), start=1):
                        execute("human-monitor-command", {"command-line": f"sendkey {key}"})
                        wait_for(lambda: seen(f"HATOS:{profile}"), f"Profile did not open: {profile}")
                    execute("quit")
            if process.wait(timeout=4) != 0:
                raise RuntimeError("QEMU exited with an error")
            print("QEMU boot and four profile markers verified")
        finally:
            if process.poll() is None:
                process.terminate()
                process.wait(timeout=4)


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
