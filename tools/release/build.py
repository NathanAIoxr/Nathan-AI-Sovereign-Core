#!/usr/bin/env python3
"""Build deterministic public Nathan AI site/source release archives from tracked files."""
import argparse, hashlib, json, pathlib, subprocess, zipfile, datetime
import posixpath, urllib.parse
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parents[2]
STATIC={'.html','.htm','.js','.mjs','.cjs','.css','.json','.webmanifest','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.avif','.wasm','.pdf','.md','.txt','.csv','.tsv','.xml','.woff','.woff2','.ttf','.mp3','.mp4','.ogg','.wav','.zip','.docx','.xlsx','.pptx','.epub','.odt','.rtf'}
PUBLIC_ROOTS=('app-factory/','docs/','archive-index/','landing/','standalone-apps/','branding/')
SOURCE_DOWNLOADS={'archive-index/alphabet/g/source-catalog-g.json.gz','app-factory/nathan-ai/brainstormer/originals/NathanAI_Brainstormer_Python_v002.py','app-factory/nathan-ai/sovereign-coins/anchored/bench_matrix.py','app-factory/octopus-root/sovereign-continuum/advanced.py','app-factory/octopus-root/sovereign-continuum/test_advanced.py'}
def git(*args):return subprocess.check_output(['git','-C',str(ROOT),*args],text=True).strip()
def tracked():return subprocess.check_output(['git','-C',str(ROOT),'ls-files','-z']).decode().split('\0')[:-1]
def safe(path):
    parts=pathlib.PurePosixPath(path).parts
    return not any(p.lower() in {'.git','.env','.aws','.ssh','private-samples','node_modules','__pycache__'} or (p.lower().startswith('.env.') and p.lower()!='.env.example') for p in parts) and pathlib.PurePosixPath(path).suffix.lower() not in {'.pem','.pfx','.p12','.key'}
def site_file(path):
    p=pathlib.PurePosixPath(path)
    return safe(path) and (path=='LICENSE' or path in SOURCE_DOWNLOADS or (len(p.parts)==1 and p.suffix=='.md') or ((path=='index.html' or path.startswith(PUBLIC_ROOTS)) and p.suffix.lower() in STATIC and '/tests/' not in path and '.test.' not in p.name and not p.name.startswith('test_')))
def check_links(files):
    missing=[]
    class Links(HTMLParser):
        def handle_starttag(self,tag,attrs):
            for key,value in attrs:
                if key not in {'href','src'} or not value:continue
                url=urllib.parse.urlsplit(value)
                if url.scheme or url.netloc or not url.path:continue
                target=posixpath.normpath(posixpath.join(posixpath.dirname(self.name),urllib.parse.unquote(url.path))) if not url.path.startswith('/') else url.path.lstrip('/')
                # Root-relative links on the project's GitHub Pages site include its repository prefix.
                if url.path.startswith('/Nathan-AI-Sovereign-Core/'):
                    target=target.removeprefix('Nathan-AI-Sovereign-Core/')
                if target == '.':target = ''
                if target not in files and (target.rstrip('/')+'/' if target else '')+'index.html' not in files:missing.append(self.name+' -> '+value)
    for name,data in files.items():
        # This historical root-page snapshot is intentionally byte-preserved at a new path.
        if name.endswith('.html') and name != 'landing/original-chat-landing.html':
            parser=Links();parser.name=name;parser.feed(data.decode('utf8'))
    if missing:raise ValueError('Missing packaged relative links: '+'; '.join(missing[:20]))
def digest(data):return hashlib.sha256(data).hexdigest()
def check_published_downloads(files):
    base='app-factory/one/library-mind/'
    publication=json.loads(files[base+'publication.json'])
    for record in publication['downloads']:
        name=base+record['file']
        if name not in files:raise ValueError('Original download missing from site: '+name)
        data=files[name]
        if len(data)!=record['bytes'] or digest(data)!=record['sha256']:raise ValueError('Original download integrity mismatch: '+name)
def zip_bytes(files,epoch):
    stream=__import__('io').BytesIO();stamp=datetime.datetime.fromtimestamp(max(epoch,315532800),datetime.timezone.utc).timetuple()[:6]
    with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,data in sorted(files.items()):
            info=zipfile.ZipInfo(name,stamp);info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data)
    return stream.getvalue()
def build(out,allow_dirty=False):
    out=out.resolve()
    if out==ROOT or out.is_relative_to(ROOT):raise ValueError('Release output must be outside the source checkout.')
    dirty=bool(git('status','--porcelain'))
    if dirty and not allow_dirty:raise ValueError('Commit or preserve pending changes before creating a final release. Use --allow-dirty only for a development preview.')
    commit=git('rev-parse','HEAD');epoch=int(git('show','-s','--format=%ct','HEAD'));all_files={}
    for name in tracked():
        path=ROOT/name
        if not safe(name):raise ValueError('Disallowed private/configuration path is tracked: '+name)
        if path.is_symlink() or not path.is_file():raise ValueError('Unsupported tracked path: '+name)
        all_files[name]=path.read_bytes()
    site={name:data for name,data in all_files.items() if site_file(name)}
    for required in ['index.html','app-factory/nathan-ai/index.html','app-factory/nathan-ai/manifest.webmanifest','app-factory/one/library/file-index.js']:
        if required not in site:raise ValueError('Missing release entry: '+required)
    site['.nojekyll']=b''
    check_links(site)
    check_published_downloads(site)
    manifest={'schema':'nathan-ai.release.v1','version':'2026.11.04-rc2','commit':commit,'dirty_preview':dirty,'delivery':'Public browser app; optional local services require separate configuration.','files':[{'path':p,'bytes':len(data),'sha256':digest(data)} for p,data in sorted(site.items())]}
    site['release-manifest.json']=(json.dumps(manifest,indent=2)+'\n').encode()
    out.mkdir(parents=True,exist_ok=True)
    names={'nathan-ai-site.zip':zip_bytes(site,epoch),'nathan-ai-source.zip':zip_bytes(all_files,epoch)}
    for name,data in names.items():(out/name).write_bytes(data)
    (out/'release-manifest.json').write_bytes(site['release-manifest.json'])
    checksums=''.join(digest(data)+'  '+name+'\n' for name,data in sorted(names.items()))
    (out/'SHA256SUMS').write_text(checksums)
    print(json.dumps({'commit':commit,'dirty_preview':dirty,'site_files':len(site),'source_files':len(all_files),'output':str(out),'archives':{name:len(data) for name,data in names.items()}},indent=2))
    return manifest
def verify(archive):
    with zipfile.ZipFile(archive) as z:
        names=z.namelist()
        if len(names)!=len(set(names)) or any(n.startswith('/') or '..' in pathlib.PurePosixPath(n).parts for n in names):raise ValueError('Unsafe or duplicate archive path.')
        manifest=json.loads(z.read('release-manifest.json'))
        expected={row['path'] for row in manifest['files']}|{'release-manifest.json'}
        if set(names)!=expected:raise ValueError('Archive contents do not match the manifest.')
        for row in manifest['files']:
            data=z.read(row['path'])
            if len(data)!=row['bytes'] or digest(data)!=row['sha256']:raise ValueError('Integrity mismatch: '+row['path'])
    print('Verified '+str(len(manifest['files']))+' site files at '+manifest['commit'])
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out',type=pathlib.Path);p.add_argument('--verify',type=pathlib.Path);p.add_argument('--allow-dirty',action='store_true');a=p.parse_args()
    if a.verify:verify(a.verify)
    elif a.out:build(a.out,a.allow_dirty)
    else:p.error('Use --out DIRECTORY or --verify SITE_ZIP')
