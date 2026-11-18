"""Create and verify a SHA-256 manifest for explicit archive files."""
import argparse
import hashlib
import json
import stat
from pathlib import Path


def measure(root, name):
    relative = Path(name)
    if relative.is_absolute() or relative == Path(".") or ".." in relative.parts:
        raise ValueError(f"expected archive-relative file path: {name}")
    path = (root / relative).resolve(strict=True)
    if not path.is_relative_to(root) or not stat.S_ISREG(path.stat().st_mode):
        raise ValueError(f"expected regular file inside archive root: {name}")
    with path.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    return {"path": relative.as_posix(), "sha256": digest}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("create", "verify"))
    parser.add_argument("root", type=Path)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("files", nargs="*")
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    if not root.is_dir():
        parser.error("root must be a directory")
    try:
        if args.mode == "create":
            if not args.files:
                parser.error("provide at least one archive-relative filename")
            files = sorted({Path(name).as_posix() for name in args.files})
            entries = [measure(root, name) for name in files]
            with args.manifest.open("x", encoding="utf-8") as stream:
                json.dump({"schema": 1, "algorithm": "SHA-256", "entries": entries}, stream, indent=2)
                stream.write("\n")
            return
        if args.files:
            parser.error("verify takes its file list from the manifest")
        with args.manifest.open(encoding="utf-8") as stream:
            manifest = json.load(stream)
        if manifest["schema"] != 1 or manifest["algorithm"] != "SHA-256" or not manifest["entries"]:
            raise ValueError("unsupported or empty manifest")
        failures = []
        for entry in manifest["entries"]:
            name = entry["path"]
            try:
                if measure(root, name) != entry:
                    failures.append(name)
            except (OSError, ValueError):
                failures.append(name)
        print(json.dumps({"verified": not failures, "files": len(manifest["entries"]), "failed": failures}))
        raise SystemExit(bool(failures))
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
