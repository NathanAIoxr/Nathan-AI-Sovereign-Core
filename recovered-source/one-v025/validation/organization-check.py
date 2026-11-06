#!/usr/bin/env python3
"""Audit the private layout without changing user data or game state."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.values = []

    def handle_starttag(self, tag, attrs):
        self.values.extend(v for k, v in attrs if k in ('href', 'src') and v)

count = 0
for page in sorted(ROOT.rglob('*.html')):
    parser = Links()
    parser.feed(page.read_text())
    for value in parser.values:
        parsed = urlsplit(value)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        target = (ROOT if parsed.path.startswith('/') else page.parent) / unquote(parsed.path.lstrip('/'))
        assert target.resolve().is_relative_to(ROOT), (page, value, 'outside source')
        assert target.exists(), (page, value, 'missing target')
        count += 1

inventory = json.loads((ROOT / 'ORGANIZATION.json').read_text())
previous = ROOT.parent / 'history/v025-before-organization/PRIVATE_ONE_v025.zip'
verified_moves = 0
if previous.exists():
    with zipfile.ZipFile(previous) as archive:
        for item in inventory['moves']:
            original = archive.read(item['from'])
            assert hashlib.sha256(original).hexdigest() == item['originalSha256']
            # Manuals only rebase their links to the new docs folder.
            expected = original
            if item['to'].startswith('docs/'):
                text = original.decode()
                for old, new in {
                    'README_PRIVATE_V025.md':'campaign-rules.md',
                    'ROOTKEEP.md':'rootkeep.md',
                    'TABOR_DECIMAL_SYSTEM.md':'tabor-decimal-system.md',
                    'REFINEMENT_V025.md':'refinement-notes.md',
                }.items():
                    text = text.replace('](' + old + ')', '](' + new + ')')
                expected = text.encode()
            assert (ROOT / item['to']).read_bytes() == expected, item['to']
            verified_moves += 1

baseline = json.loads((ROOT / 'BASE_SNAPSHOT_SHA256.json').read_text())
with zipfile.ZipFile(ROOT / 'preserved/ONE_BASE_BEFORE_v025.zip') as archive:
    for name, digest in baseline.items():
        assert hashlib.sha256(archive.read(name)).hexdigest() == digest, name

print(json.dumps({
    'passed': True, 'localHtmlLinksVerified': count,
    'movedFilesVerifiedAgainstPreviousPackage': verified_moves,
    'originalBackupFilesVerified': len(baseline),
    'entry': inventory['entry'], 'gamePathsAndSaveKeysRetained': True,
    'note': 'Previous milestone ZIP is workspace history and is not required by an extracted release.'
}, indent=2))
