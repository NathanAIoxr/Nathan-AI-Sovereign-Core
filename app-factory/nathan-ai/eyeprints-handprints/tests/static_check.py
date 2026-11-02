from pathlib import Path
from html.parser import HTMLParser
import re,json
root=Path(__file__).resolve().parents[1]
class IDs(HTMLParser):
    ids=set()
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d: self.ids.add(d['id'])
p=IDs();p.feed((root/'index.html').read_text())
code=(root/'app.js').read_text()
refs=set(re.findall(r"\$\('([^']+)'\)",code))
assert refs<=p.ids,'Missing HTML IDs: '+str(refs-p.ids)
for filename in ['app.js','vault.js','analysis.js','styles.css','manifest.webmanifest','sw.js','assets/icon.svg','archive/EYEPRINTS_original_research.html']:
 assert (root/filename).is_file(),filename
manifest=json.loads((root/'manifest.webmanifest').read_text());assert manifest['display']=='standalone'
sw=(root/'sw.js').read_text();assert 'private-samples/' in sw
assert "https://" not in (root/'index.html').read_text() # no external scripts or CSS
assert "http://" not in (root/'index.html').read_text()
assert "<script type=\"module\" src=\"./app.js\"" in (root/'index.html').read_text()
print(f'PASS: {len(refs)} UI references, {len(p.ids)} element IDs, assets and privacy markers')
