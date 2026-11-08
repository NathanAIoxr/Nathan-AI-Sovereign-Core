#!/usr/bin/env python3
"""Install verified offline Nathan AI speech model packs from explicit local archives.

No URL fetching, package execution, pickle loading, subprocess, remote APIs or telemetry.
Only install archives you have independently licensed and trust; ONNX model execution
may still contain third-party/runtime risks. A manifest's rights flag is an attestation,
not third-party verification of consent.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import tempfile
import zipfile

from voicebox import ROOT, LANGUAGE, PERMITTED_BASES, VoiceBoxError, load_pack

MODEL_ROOT = ROOT / "private-packs"
ID_PATTERN = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")
MAX_ITEMS = 128
MAX_UNPACKED = 2_147_483_648  # 2 GiB; large enough for compact model packs.
MAX_FILE = 1_610_612_736
MAX_MANIFEST = 128_000
VALID_RUNTIMES = {
    "sherpa-onnx-vits": ("model", "tokens", "data_dir"),
    "sherpa-onnx-zipvoice": ("encoder", "decoder", "vocoder", "tokens", "lexicon"),
    "sherpa-onnx-whisper-asr": ("encoder", "decoder", "tokens"),
}


def sha256_file(path: Path):
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def safe_archive_name(name):
    if not isinstance(name, str) or not name or len(name) > 255:
        raise VoiceBoxError("Unsafe archive path")
    if "\\" in name or "\x00" in name or ":" in name or name.startswith("/"):
        raise VoiceBoxError("Unsafe archive path")
    path = PurePosixPath(name)
    if path.is_absolute() or any(part in ("", ".", "..") for part in name.split("/")):
        raise VoiceBoxError("Archive contains unsafe path")
    if len(path.parts) > 5:
        raise VoiceBoxError("Archive path nesting too deep")
    return path


def validate_archive_members(infos):
    if len(infos) > MAX_ITEMS:
        raise VoiceBoxError("Too many files in local pack")
    seen = set()
    total = 0
    names = set()
    for item in infos:
        path = safe_archive_name(item.filename)
        key = item.filename.casefold()
        if key in seen:
            raise VoiceBoxError("Archive has repeated paths")
        seen.add(key)
        if item.is_dir():
            continue
        mode = (item.external_attr >> 16) & 0xFFFF
        if stat.S_IFMT(mode) == stat.S_IFLNK:
            raise VoiceBoxError("Archive contains symlinks")
        if item.file_size > MAX_FILE:
            raise VoiceBoxError("Local pack contains an oversized file")
        total += item.file_size
        if total > MAX_UNPACKED:
            raise VoiceBoxError("Local pack exceeds the 2 GiB limit")
        names.add(str(path))
    if "manifest.json" not in names:
        raise VoiceBoxError("Archive requires manifest.json at its root")
    return names


def validate_manifest(data: dict, file_names: set[str]):
    if not isinstance(data, dict):
        raise VoiceBoxError("Pack manifest must be an object")
    ident = data.get("id")
    if not isinstance(ident, str) or not ID_PATTERN.fullmatch(ident):
        raise VoiceBoxError("Invalid model pack ID")
    if data.get("runtime") not in VALID_RUNTIMES:
        raise VoiceBoxError("Unsupported model runtime")
    if data.get("authorized") is not True or data.get("rights_basis") not in PERMITTED_BASES:
        raise VoiceBoxError("Model pack rights attestation is required")
    if not isinstance(data.get("license"), str) or not data["license"].strip():
        raise VoiceBoxError("Declare the local model's actual license")
    if data.get("runtime") != "sherpa-onnx-vits":
        languages = data.get("languages")
        if not isinstance(languages, list) or not languages or not all(
            isinstance(lang, str) and LANGUAGE.fullmatch(lang) for lang in languages
        ):
            raise VoiceBoxError("Declare the actual supported languages")
    required = VALID_RUNTIMES[data["runtime"]]
    for field in required:
        path = data.get(field)
        if not isinstance(path, str) or not path.strip():
            raise VoiceBoxError("Missing required pack asset: " + field)
        safe_archive_name(path)
        if field != "data_dir" and path not in file_names:
            raise VoiceBoxError("Model asset absent from archive: " + field)
        if field == "data_dir" and not any(x.startswith(path.rstrip("/") + "/") for x in file_names):
            raise VoiceBoxError("Phonemizer data directory absent from archive")
    if data.get("runtime") == "sherpa-onnx-zipvoice" and data.get("data_dir"):
        safe_archive_name(data["data_dir"])
        if not any(x.startswith(data["data_dir"].rstrip("/") + "/") for x in file_names):
            raise VoiceBoxError("ZipVoice phonemizer directory absent")
    hashes = data.get("sha256")
    if not isinstance(hashes, dict):
        raise VoiceBoxError("Archive requires a per-file SHA-256 manifest")
    if set(hashes) != file_names - {"manifest.json"}:
        raise VoiceBoxError("Checksums must cover every archive payload file")
    for name, hash_text in hashes.items():
        safe_archive_name(name)
        if not isinstance(hash_text, str) or re.fullmatch(r"[0-9a-fA-F]{64}", hash_text) is None:
            raise VoiceBoxError("Invalid SHA-256 checksum entry")
    return ident


def install_zip(path: Path) -> str:
    if not path.is_file() or not zipfile.is_zipfile(path):
        raise VoiceBoxError("Select a local ZIP or .nvoicepack archive")
    MODEL_ROOT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "r") as archive:
        infos = archive.infolist()
        names = validate_archive_members(infos)
        info = archive.getinfo("manifest.json")
        if info.file_size > MAX_MANIFEST:
            raise VoiceBoxError("Manifest is too large")
        manifest = json.loads(archive.read("manifest.json").decode("utf-8"))
        ident = validate_manifest(manifest, names)
        dest = MODEL_ROOT / ident
        if dest.exists():
            raise VoiceBoxError("Pack already installed; remove it explicitly before replacing")
        temp = Path(tempfile.mkdtemp(prefix=".install-", dir=MODEL_ROOT))
        completed = False
        try:
            for member in infos:
                if member.is_dir():
                    continue
                rel = safe_archive_name(member.filename)
                target = temp.joinpath(*rel.parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                checksum = hashlib.sha256()
                with archive.open(member, "r") as stream, target.open("xb") as out:
                    size = 0
                    while True:
                        block = stream.read(1024 * 1024)
                        if not block: break
                        size += len(block)
                        if size > member.file_size or size > MAX_FILE:
                            raise VoiceBoxError("Archive file size mismatch")
                        checksum.update(block)
                        out.write(block)
                    if size != member.file_size:
                        raise VoiceBoxError("Truncated archive payload")
                if member.filename != "manifest.json":
                    expected = manifest["sha256"][member.filename].lower()
                    if checksum.hexdigest() != expected:
                        raise VoiceBoxError("SHA-256 mismatch: " + member.filename)
            if dest.exists():
                raise VoiceBoxError("Destination exists")
            temp.rename(dest)
            completed = True
            return ident
        finally:
            if not completed:
                shutil.rmtree(temp, ignore_errors=True)


def installed():
    if not MODEL_ROOT.exists():
        return []
    result = []
    for manifest in sorted(MODEL_ROOT.glob("*/manifest.json")):
        try:
            pack = load_pack(manifest.parent.name)
            result.append({
                "id": pack["id"],
                "runtime": pack["runtime"],
                "languages": pack.get("languages", [pack.get("language", "unknown")]),
                "license": pack.get("license", "not recorded"),
            })
        except (ValueError, VoiceBoxError, OSError, KeyError):
            continue
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description="Offline speech pack manager; no downloads")
    sub = parser.add_subparsers(dest="action", required=True)
    s = sub.add_parser("install", help="Install from a local checksum-protected archive")
    s.add_argument("archive", type=Path)
    s = sub.add_parser("sha256", help="Compute digest when preparing a local pack")
    s.add_argument("file", type=Path)
    sub.add_parser("list", help="List installed authorized model packs")
    args = parser.parse_args(argv)
    try:
        if args.action == "install":
            print("Installed local pack:", install_zip(args.archive))
        elif args.action == "sha256":
            print(sha256_file(args.file))
        else:
            print(json.dumps(installed(), ensure_ascii=False, indent=2))
        return 0
    except (OSError, VoiceBoxError, ValueError, json.JSONDecodeError, zipfile.BadZipFile) as exc:
        parser.exit(1, "Voice Box pack error: " + str(exc) + "\n")


if __name__ == "__main__":
    raise SystemExit(main())
