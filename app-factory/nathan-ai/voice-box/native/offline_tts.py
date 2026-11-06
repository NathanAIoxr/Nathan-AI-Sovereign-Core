#!/usr/bin/env python3
"""NATHAN AI — device-held WAV synthesis with an independently installed eSpeak NG.
No cloud, model downloads, microphone access, shell commands or speaker cloning.
eSpeak NG is GPL-3.0-or-later; install separately under its applicable terms.
"""
import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

MAX_UTF8 = 16384
VOICE_PATTERN = re.compile(r"^[A-Za-z0-9_+@.-]{1,72}$")

def synthesize(text: str, voice: str, destination: Path, binary: str | None = None):
    if not isinstance(text, str) or not text.strip() or len(text.encode("utf-8")) > MAX_UTF8:
        raise ValueError("A nonempty owner-supplied text of at most 16KiB is required")
    if not VOICE_PATTERN.fullmatch(voice):
        raise ValueError("Invalid installed voice name")
    executable = binary or shutil.which("espeak-ng")
    if not executable:
        raise RuntimeError("eSpeak NG is not installed; no online fallback will be attempted")
    destination = Path(destination).expanduser().resolve()
    if destination.exists():
        raise FileExistsError("Refusing to overwrite existing output: " + str(destination))
    if not destination.parent.is_dir():
        raise FileNotFoundError("Output parent directory must exist")
    # "--stdin" prevents text from appearing in a process argument list.
    command = [executable, "-v", voice, "-w", str(destination), "--stdin"]
    try:
        subprocess.run(command, input=text, text=True, capture_output=True, check=True, timeout=90)
    except Exception:
        if destination.exists():
            try: destination.unlink()
            except OSError: pass
        raise
    if not destination.exists() or destination.stat().st_size < 44:
        raise RuntimeError("No complete WAV was produced")
    return destination

def main():
    parser = argparse.ArgumentParser(description="Offline synthetic voice from a locally installed eSpeak NG")
    parser.add_argument("--voice", default="en", help="An installed eSpeak NG voice (default: en)")
    parser.add_argument("--output", type=Path, help="New WAV output path; never overwritten")
    parser.add_argument("--list", action="store_true", help="List locally installed voices")
    args = parser.parse_args()
    binary = shutil.which("espeak-ng")
    if not binary: parser.error("eSpeak NG not installed locally; no online fallback")
    if args.list:
        return subprocess.run([binary,"--voices"],check=False).returncode
    if not args.output: parser.error("--output is required unless --list is selected")
    if sys.stdin.isatty(): parser.error("Pipe text through stdin; no prompt data is sent to cloud")
    source = sys.stdin.read(MAX_UTF8+1)
    try: synthesize(source,args.voice,args.output,binary)
    except (ValueError,FileNotFoundError,FileExistsError,RuntimeError,subprocess.CalledProcessError) as exc:
        parser.error(str(exc))
    print("WAV saved locally:",args.output)
    return 0

if __name__=="__main__":
    raise SystemExit(main())
