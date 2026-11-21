"""Start the Tabor Super 2X + Hypercomputer owner kit on a Linux server."""

import argparse
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import platform

from cockpit import handler
from federation import capture, write_receipt
from processing import profile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, default=Path.home() / ".local/state/nutsy")
    parser.add_argument("--filesystem", type=Path, default=Path("/"))
    parser.add_argument("--expect-host", help="require this hostname before collecting or serving")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--benchmark", action="store_true", help="run the bounded local compute profile")
    parser.add_argument("--tabor-cloud", action="store_true", help="read the existing public Tabor Cloudflare inventory")
    parser.add_argument("--collect-only", action="store_true", help="write receipts and exit")
    args = parser.parse_args()

    if platform.system() != "Linux":
        parser.error("Run this server kit on Linux")
    if not 1024 <= args.port <= 65535:
        parser.error("Choose a port in 1024–65535")
    try:
        receipt = capture(args.filesystem, args.expect_host, include_tabor_cloud=args.tabor_cloud)
        write_receipt(args.state_dir / "federation.json", json.dumps(receipt, indent=2) + "\n")
        if args.benchmark:
            result = profile(seed=73, terms=32768, jobs=48)
            write_receipt(args.state_dir / "processing.json", json.dumps(result, indent=2) + "\n")
        failed_sources = [key for key, item in receipt["sources"].items() if item["state"] != "observed"]
        if failed_sources:
            print("Unavailable or inconsistent Cloudflare sources: " + ", ".join(failed_sources), flush=True)
        if args.collect_only:
            return 2 if failed_sources else 0
        with ThreadingHTTPServer(("127.0.0.1", args.port), handler(args.state_dir, args.port)) as server:
            print(f"Tabor owner cockpit: http://127.0.0.1:{args.port}/", flush=True)
            server.serve_forever()
    except KeyboardInterrupt:
        return 0
    except (OSError, ValueError) as err:
        parser.exit(1, f"{err}\n")


if __name__ == "__main__":
    raise SystemExit(main())
