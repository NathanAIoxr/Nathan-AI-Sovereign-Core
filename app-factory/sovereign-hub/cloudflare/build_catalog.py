#!/usr/bin/env python3
"""Inventory public active app entry points; registration is separate from adoption."""
from html.parser import HTMLParser
import hashlib
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
class Title(HTMLParser):
 def __init__(self):super().__init__();self.inside=False;self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag=='title':self.inside=True
 def handle_endtag(self,tag):
  if tag=='title':self.inside=False
 def handle_data(self,text):
  if self.inside:self.parts.append(text)

def main():
 entries=[]
 files=list((REPO/'app-factory').rglob('index.html'))+list((REPO/'standalone-apps').rglob('index.html'))+list((REPO/'standalone-apps').rglob('index.html.in'))
 for file in sorted(set(files)):
  relative=file.relative_to(REPO)
  if any(part in ('node_modules','__pycache__','private-samples','private','archive','originals','recovered-source') for part in relative.parts):continue
  if str(relative)=='app-factory/sovereign-hub/cloudflare/public/index.html':continue
  parser=Title();parser.feed(file.read_text(errors='replace'))
  path=str(relative);label=' '.join(''.join(parser.parts).split())[:180] or file.parent.name
  integrated=path in ('app-factory/sovereign-hub/index.html','app-factory/app-shell/index.html')
  app_root=(REPO/'standalone-apps'/relative.parts[1]) if relative.parts[0]=='standalone-apps' else (file.parent.parent if file.parent.name=='public' else file.parent)
  deployed=None
  readme=app_root/'README.md'
  if readme.exists():
   import re
   matches=re.findall(r'https://[a-zA-Z0-9-]+\.nathantaboract\.workers\.dev/?',readme.read_text(errors='replace'))
   if matches:deployed=matches[0]
  entries.append({'id':'app-'+hashlib.sha256(path.encode()).hexdigest()[:16],'title':label,'entry':path,'group':relative.parts[1],
   'url':deployed or 'https://nathanaiOxr.github.io/Nathan-AI-Sovereign-Core/'+path,
   'adoption':'hub_runtime' if path.startswith('app-factory/sovereign-hub/') else ('registered_shell' if integrated else 'integration_required')})
 payload={'schema':'one.public-app-catalog.v1','scope':'active public app-factory and standalone entry points/templates; historical archives excluded','count':len(entries),'gateway':'https://one-sovereign-hub.nathantaboract.workers.dev','apps':entries}
 (HERE/'public/apps.json').write_text(json.dumps(payload,indent=2)+'\n')
 print(f'Catalogued {len(entries)} entry points; per-app integration status retained')
if __name__=='__main__':main()
