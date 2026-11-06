#!/usr/bin/env python3
"""Verify preserved original bytes or restore a historical branch to a new local folder."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess

ROOT = Path(__file__).resolve().parents[2]
RECOVERY = ROOT / 'recovered-source'


def safe_target(root, name):
    path = PurePosixPath(name)
    if not name or path.is_absolute() or any(p in {'..', '.git'} for p in path.parts) or '\\' in name:
        raise ValueError('Unsafe recovery path')
    target = root.joinpath(*path.parts)
    if not target.resolve().is_relative_to(root.resolve()):
        raise ValueError('Recovery path escapes destination')
    return target


def verify(root=RECOVERY):
    manifest = json.loads((root / 'SHA256-MANIFEST.json').read_text())
    for row in manifest['files']:
        path = safe_target(root, row['path'])
        data = path.read_bytes()
        if len(data) != row['bytes'] or hashlib.sha256(data).hexdigest() != row['sha256']:
            raise ValueError('Preserved source integrity mismatch: ' + row['path'])
    branches = json.loads((root / 'github-branches/manifest.json').read_text())
    for path in (root / 'github-branches/objects').glob('*.source'):
        data = path.read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        if blob != path.stem:
            raise ValueError('Git source object mismatch: ' + path.name)
    return {'verifiedFiles': len(manifest['files']), 'branches': len(branches['branches'])}


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def restore(branch_name, out):
    out = out.resolve()
    if out.is_relative_to(ROOT) or out.exists():
        raise ValueError('Use a new, nonexistent directory outside this checkout')
    doc = json.loads((RECOVERY / 'github-branches/manifest.json').read_text())
    branch = next((b for b in doc['branches'] if b['name'] == branch_name), None)
    if branch is None:
        raise ValueError('Branch not present in recovery manifest')
    tree = {}
    for line in git('ls-tree', '-r', '-z', doc['baseCommit']).split(b'\0'):
        if not line:
            continue
        meta, name = line.split(b'\t', 1)
        mode, kind, blob = meta.decode().split()
        if kind != 'blob':
            raise ValueError('Unsupported baseline object')
        tree[name.decode()] = {'mode': mode, 'blob': blob}
    for name in branch['removed']:
        tree.pop(name, None)
    tree.update(branch['changed'])
    # Validate the whole plan before creating files. Source is never executed.
    for name, row in tree.items():
        safe_target(out, name)
        if row['mode'] not in {'100644', '100755'}:
            raise ValueError('Unsupported file mode: ' + row['mode'])
    out.mkdir(parents=True)
    for name, row in sorted(tree.items()):
        archived = RECOVERY / 'github-branches/objects' / (row['blob'] + '.source')
        data = archived.read_bytes() if archived.exists() else git('cat-file', 'blob', row['blob'])
        actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        if actual != row['blob']:
            raise ValueError('Source object mismatch: ' + name)
        path = safe_target(out, name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        path.chmod(0o755 if row['mode'] == '100755' else 0o644)
    return {'branch': branch_name, 'commit': branch['commit'], 'files': len(tree), 'output': str(out)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--branch')
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    if args.verify:
        print(json.dumps(verify(), indent=2))
    elif args.branch and args.out:
        print(json.dumps(restore(args.branch, args.out), indent=2))
    else:
        parser.error('Use --verify or --branch NAME --out NEW_DIRECTORY')
