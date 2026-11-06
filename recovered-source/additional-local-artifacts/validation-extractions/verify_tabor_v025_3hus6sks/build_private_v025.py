#!/usr/bin/env python3
"""Build a private ONE v025 ZIP and a self-contained THE 33 game. No upload."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile
import subprocess

ROOT = Path(__file__).resolve().parent
GAME = ROOT / 'app-factory/one/trial-matrix'
SCRIPTS = ['expansion.js', 'strategy.js', 'engine.js', 'profile.js', 'save-store.js', 'active-clock.js', 'game-ui.js']

def build(output):
    output.mkdir(parents=True, exist_ok=True)
    html = (GAME / 'index.html').read_text()
    html = html.replace('href="../index.html"', 'href="./app-factory/one/index.html"')
    html = html.replace('href="./README.md"', 'href="./README_PRIVATE_V025.md"')
    html = html.replace('href="./studio/index.html"', 'href="./AZ_STUDIO_PRIVATE_v025.html"')
    html = html.replace('href="./realm/index.html"', 'href="./ROOTKEEP_PRIVATE_v025.html"')
    for script in SCRIPTS:
        tag = f'<script src="./{script}"></script>'
        if tag not in html:
            raise RuntimeError('Missing script entry: ' + script)
        code = (GAME / script).read_text().replace('</script', '<\\/script')
        html = html.replace(tag, '<script>\n' + code + '\n</script>')
    standalone = output / 'THE_33_PRIVATE_v025.html'
    standalone.write_text(html)
    studio_html = (GAME / 'studio/index.html').read_text()
    studio_html = studio_html.replace('href="../index.html"', 'href="./THE_33_PRIVATE_v025.html"').replace('href="../../index.html"', 'href="./app-factory/one/index.html"')
    studio_html = studio_html.replace('href="../realm/index.html"', 'href="./ROOTKEEP_PRIVATE_v025.html"')
    for script in ['studio-engine.js', 'architecture.js', 'save-store.js', 'studio-ui.js']:
        tag = f'<script src="../{script}"></script>'
        if tag not in studio_html:
            raise RuntimeError('Missing Studio script: ' + script)
        studio_html = studio_html.replace(tag, '<script>\n' + (GAME / script).read_text().replace('</script', '<\\/script') + '\n</script>')
    studio = output / 'AZ_STUDIO_PRIVATE_v025.html'
    studio.write_text(studio_html)
    realm_html = (GAME / 'realm/index.html').read_text()
    realm_html = realm_html.replace('href="../index.html"', 'href="./THE_33_PRIVATE_v025.html"').replace('href="../studio/index.html"', 'href="./AZ_STUDIO_PRIVATE_v025.html"').replace('href="../../index.html"', 'href="./app-factory/one/index.html"')
    for relative in ['../expansion.js', '../strategy.js', '../engine.js', '../save-store.js', './tabor.js', './catalog.js', './combat.js', './world.js', './realm-ui.js']:
        tag = f'<script src="{relative}"></script>'
        if tag not in realm_html:
            raise RuntimeError('Missing Rootkeep script: ' + relative)
        code = (GAME / 'realm' / relative).read_text().replace('</script', '<\\/script')
        realm_html = realm_html.replace(tag, '<script>\n' + code + '\n</script>')
    realm = output / 'ROOTKEEP_PRIVATE_v025.html'
    realm.write_text(realm_html)
    definitions = json.loads(subprocess.check_output(['node', '-e', "const a=require(process.argv[1]);console.log(JSON.stringify({layers:a.MATRIX,blueprint:a.document()}));", str(GAME / 'architecture.js')]))
    matrix = output / 'AZ_52_LAYERS_v025.json'
    matrix.write_text(json.dumps({'schema':'one.v025.az.matrix.v1','author':'Nathan Tabor','entries':52,'layers':definitions['layers']},indent=2)+'\n')
    blueprint = output / 'AZ_TECHNICAL_BLUEPRINT_v025.md'
    blueprint.write_text(definitions['blueprint'])
    generated = [standalone, studio, realm, matrix, blueprint]
    manifest = {}
    files = []
    for file in sorted(ROOT.rglob('*')):
        if not file.is_file() or file.is_symlink():
            continue
        relative = file.relative_to(ROOT)
        if any(part in {'.git', '__pycache__', 'node_modules'} for part in relative.parts):
            continue
        if output == file.parent or output in file.parents:
            continue
        if file.suffix == '.zip' and relative.parts[0] != 'preserved':
            continue
        files.append((file, str(relative)))
        manifest[str(relative)] = hashlib.sha256(file.read_bytes()).hexdigest()
    for artifact in generated:
        manifest[artifact.name] = hashlib.sha256(artifact.read_bytes()).hexdigest()
    archive_path = output / 'PRIVATE_ONE_v025.zip'
    pending_archive = output / 'PRIVATE_ONE_v025.zip.building'
    with zipfile.ZipFile(pending_archive, 'w', zipfile.ZIP_DEFLATED) as archive:
        for file, name in files:
            archive.write(file, name)
        for artifact in generated:
            archive.write(artifact, artifact.name)
        archive.writestr('BUILD_SHA256.json', json.dumps(manifest, indent=2) + '\n')
    with zipfile.ZipFile(pending_archive) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('Archive CRC verification failed')
        for name, digest in manifest.items():
            if hashlib.sha256(archive.read(name)).hexdigest() != digest:
                raise RuntimeError('Archive hash mismatch: ' + name)
    checksum = hashlib.sha256(pending_archive.read_bytes()).hexdigest()
    pending_archive.replace(archive_path)
    (output / (archive_path.name + '.sha256')).write_text(checksum + '  ' + archive_path.name + '\n')
    print(json.dumps({'sha256':checksum,'version': '025', 'private': True, 'archive': str(archive_path),
                      'standalone': str(standalone), 'studio': str(studio), 'realm': str(realm), 'matrix':str(matrix), 'files_verified': len(manifest),
                      'bytes': archive_path.stat().st_size}, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', type=Path, default=ROOT.parent / 'exports')
    args = parser.parse_args()
    build(args.output_dir.resolve())
