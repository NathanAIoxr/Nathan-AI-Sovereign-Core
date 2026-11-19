"""Mirror and verify only the encrypted archive objects listed by the release."""
from hashlib import file_digest
import json
from pathlib import Path
import re
import shutil
from urllib.request import Request, urlopen

base = "https://tabor-ancient-traditions-sealed.nathantaboract.workers.dev/"
agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
archive = json.loads(Path("backup-manifest.json").read_text())
folder = Path("sealed-v1")
folder.mkdir(exist_ok=True)
for part in archive["parts"]:
    name = part["file"]
    if not re.fullmatch(r"sealed-\d{3}\.bin", name):
        raise ValueError("Invalid release part")
    destination = folder / name
    pending = destination.with_suffix(".part")
    request = Request(base + name, headers={"User-Agent": agent})
    try:
        with urlopen(request, timeout=70) as stream, pending.open("wb") as output:
            shutil.copyfileobj(stream, output)
        with pending.open("rb") as output:
            digest = file_digest(output, "sha256").hexdigest()
        if pending.stat().st_size != part["size"] or digest != part["sha256"]:
            raise ValueError("Encrypted object mismatch: " + name)
        pending.replace(destination)
        print("Verified", name)
    finally:
        pending.unlink(missing_ok=True)
