#!/usr/bin/env python3
"""Offline ChatGPT export + Library download indexer. MIT licensed."""
import argparse, collections, hashlib, html, io, json, pathlib, re, zipfile
from html.parser import HTMLParser

MAX_FILE=128*1024*1024
MAX_TOTAL=2*1024*1024*1024
MAX_TEXT=100000
IMAGE={'.png','.jpg','.jpeg','.webp','.gif','.svg','.heic','.avif','.tiff','.bmp'}
CODE={'.py','.js','.ts','.tsx','.jsx','.mjs','.cjs','.swift','.java','.c','.cpp','.h','.rs','.go','.sh','.css','.html','.sql'}
TEXT=CODE|{'.txt','.md','.csv','.tsv','.json','.jsonl','.yaml','.yml','.xml','.toml'}
SKIP={'.git','.ssh','.aws','.codex','node_modules','.venv','__pycache__'}
SECRET=re.compile(r'-----BEGIN[^\n]*PRIVATE KEY-----[\s\S]*?(?:-----END[^\n]*PRIVATE KEY-----|$)|\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]{20,}|(?i:\b(?:password|passphrase|seed phrase|recovery phrase|private[_ -]?key|api[_ -]?key|access[_ -]?token)\s*[:=]\s*)[^\r\n]+')

def redact(text):
 text=SECRET.sub('[REDACTED POSSIBLE CREDENTIAL]',text)
 return re.sub(r'(?i)\b(?:password|passphrase|seed phrase|recovery phrase|private[_ -]?key|api[_ -]?key|access[_ -]?token)"?\s*[:=][^\r\n]+','[REDACTED POSSIBLE CREDENTIAL]',text)
def line_count(text):return len(text.splitlines())
def excluded(name):
 p=pathlib.PurePosixPath(name.replace('\\','/'));b=p.name.lower()
 return any(x in SKIP for x in p.parts) or b.startswith('.env') or b in {'credentials','credentials.json','secrets.json','id_rsa','id_ed25519'} or p.suffix.lower() in {'.pem','.key','.pfx','.p12'}
class PlainHTML(HTMLParser):
 def __init__(self):super().__init__();self.parts=[];self.hidden=0
 def handle_starttag(self,tag,attrs):
  if tag in {'script','style'}:self.hidden+=1
 def handle_endtag(self,tag):
  if tag in {'script','style'}:self.hidden=max(0,self.hidden-1)
 def handle_data(self,s):
  if not self.hidden:self.parts.append(s)

def conversation_rows(value,source):
 conversations=value if isinstance(value,list) else value.get('conversations',[]) if isinstance(value,dict) else []
 for conversation in conversations:
  if not isinstance(conversation,dict) or not isinstance(conversation.get('mapping'),dict):continue
  title=redact(str(conversation.get('title','Untitled conversation')))
  for key,node in conversation['mapping'].items():
   if not isinstance(node,dict):continue
   message=node.get('message')
   if not isinstance(message,dict):continue
   content=message.get('content') or {};parts=content.get('parts',[]) if isinstance(content,dict) else []
   text=[];references=[]
   for part in parts:
    if isinstance(part,str):text.append(part)
    elif isinstance(part,dict):
     if isinstance(part.get('text'),str):text.append(part['text'])
     for field in ['asset_pointer','image_asset_pointer','file_id','file_name']:
      if isinstance(part.get(field),str):references.append(part[field])
   attachments=(message.get('metadata') or {}).get('attachments',[])
   if isinstance(attachments,list):
    for attachment in attachments:
     if isinstance(attachment,dict):
      references.extend(str(attachment[k]) for k in ['id','name'] if attachment.get(k))
   original='\n'.join(text);safe=redact(original)
   role=(message.get('author') or {}).get('role','unknown')
   yield {'kind':'conversation-message','title':title,'source':source,'conversation_id':str(conversation.get('id','')),'message_id':str(message.get('id',key)),'parent_node':str(node.get('parent') or ''),'role':role,'text':safe[:MAX_TEXT],'text_truncated':len(safe)>MAX_TEXT,'redacted':safe!=original,'references':references,'fenced_code_lines':sum(line_count(x) for x in re.findall(r'```[^\n]*\n(.*?)```',safe,re.S))}

class Indexer:
 def __init__(self):self.rows=[];self.errors=[];self.skipped=[];self.total=0;self.hashes={};self.input_files=0
 def add(self,name,data):
  self.input_files+=1;self.total+=len(data)
  if self.total>MAX_TOTAL:raise RuntimeError('Total read limit exceeded (2 GiB). Split the input into batches.')
  ext=pathlib.PurePosixPath(name).suffix.lower();sha=hashlib.sha256(data).hexdigest();duplicate=self.hashes.get(sha);self.hashes.setdefault(sha,name)
  row={'kind':'image' if ext in IMAGE else 'code-file' if ext in CODE else 'document','title':redact(pathlib.PurePosixPath(name).name),'source':redact(name),'bytes':len(data),'sha256':sha,'duplicate_of':redact(duplicate) if duplicate else None,'text':'','extraction':'metadata only','references':[]}
  if duplicate:self.rows.append(row);return
  text=None
  if ext in TEXT:
   try:text=data.decode('utf-8-sig')
   except UnicodeDecodeError:row['extraction']='text decoding unavailable'
   if text is not None and '\0' in text:text=None;row['extraction']='binary data; metadata only'
   if text is not None and ext=='.json':
    try:
     value=json.loads(text);messages=list(conversation_rows(value,redact(name)))
     if messages:
      row['kind']='conversation-export';row['extraction']='conversation messages indexed';row['message_count']=len(messages);self.rows.append(row);self.rows.extend(messages);return
    except (ValueError,TypeError) as e:self.errors.append({'source':redact(name),'error':'JSON parsing failed: '+type(e).__name__})
   if text is not None and ext=='.html':
    parser=PlainHTML();parser.feed(text);text='\n'.join(parser.parts);row['kind']='document'
  elif ext=='.pdf':
   try:
    from pypdf import PdfReader
    pdf=PdfReader(io.BytesIO(data));text='\n'.join(page.extract_text() or '' for page in pdf.pages);row['pages']=len(pdf.pages)
    if not text.strip():row['extraction']='no extractable text; OCR required';text=None
   except ImportError:row['extraction']='PDF text needs optional pypdf package'
   except Exception as e:self.errors.append({'source':redact(name),'error':'PDF extraction failed: '+type(e).__name__})
  elif ext in {'.docx','.pptx','.xlsx'}:
   try:
    import xml.etree.ElementTree as ET
    with zipfile.ZipFile(io.BytesIO(data)) as z:
     chunks=[];remaining=MAX_FILE
     for info in z.infolist():
      wanted=info.filename=='word/document.xml' or re.fullmatch(r'ppt/slides/slide\d+\.xml',info.filename) or info.filename=='xl/sharedStrings.xml'
      if wanted:
       if info.file_size>remaining:raise ValueError('Office XML limit')
       remaining-=info.file_size;chunks.extend(ET.fromstring(z.read(info)).itertext())
     text=' '.join(chunks);row['extraction']='Office text only; layout, formulas and embedded files not extracted'
   except Exception as e:self.errors.append({'source':redact(name),'error':'Office extraction failed: '+type(e).__name__})
  if ext in IMAGE:
   try:
    from PIL import Image
    with Image.open(io.BytesIO(data)) as image:row['dimensions']=list(image.size)
   except Exception:pass
   row['extraction']='image metadata; no OCR or visual interpretation'
  if text is not None:
   safe=redact(text);row.update(text=safe[:MAX_TEXT],text_truncated=len(safe)>MAX_TEXT,redacted=safe!=text)
   if row['extraction']=='metadata only':row['extraction']='text extracted'
   if row['kind']=='code-file':row['physical_code_lines']=line_count(text)
  self.rows.append(row)
 def ingest(self,path):
  path=path.resolve()
  if path.is_dir():
   import os
   def err(e):self.errors.append({'source':str(path),'error':str(e)})
   for base,dirs,files in os.walk(path,followlinks=False,onerror=err):
    dirs[:]=[d for d in dirs if d not in SKIP and not (pathlib.Path(base)/d).is_symlink()]
    for name in sorted(files):
     p=pathlib.Path(base)/name
     if not p.is_symlink():self.ingest(p)
  elif path.suffix.lower()=='.zip':
   with zipfile.ZipFile(path) as z:
    for info in z.infolist():
     if info.is_dir():continue
     name=str(path)+'!/'+info.filename
     if excluded(info.filename):self.skipped.append({'source':redact(name),'reason':'credential/config/cache path'});continue
     if info.file_size>MAX_FILE or (info.compress_size and info.file_size/info.compress_size>1000):self.skipped.append({'source':redact(name),'reason':'archive size/compression limit'});continue
     try:
      if info.file_size+self.total>MAX_TOTAL:raise RuntimeError('Total read limit exceeded')
      self.add(name,z.read(info))
     except RuntimeError:raise
     except Exception as e:self.errors.append({'source':redact(name),'error':type(e).__name__})
  else:
   if excluded(str(path)):self.skipped.append({'source':redact(str(path)),'reason':'credential/config/cache path'});return
   if path.stat().st_size>MAX_FILE:self.skipped.append({'source':redact(str(path)),'reason':'128 MiB per-file limit'});return
   if path.stat().st_size+self.total>MAX_TOTAL:raise RuntimeError('Total read limit exceeded')
   try:self.add(str(path),path.read_bytes())
   except RuntimeError:raise
   except Exception as e:self.errors.append({'source':redact(str(path)),'error':type(e).__name__})
 def result(self):
  refs=[]
  for row in self.rows:
   for reference in row.get('references',[]):refs.append({'conversation_id':row.get('conversation_id'),'message_id':row.get('message_id'),'reference':redact(reference),'status':'reference only; original file not verified'})
  return {'summary':{'scope':'Only supplied local exports and files; no automatic account or ChatGPT Library access.','files_read':self.input_files,'records':len(self.rows),'by_kind':dict(collections.Counter(r['kind'] for r in self.rows)),'unique_content_files':len(self.hashes),'physical_code_lines_in_unique_source_files':sum(r.get('physical_code_lines',0) for r in self.rows),'fenced_code_lines_in_messages_not_deduplicated':sum(r.get('fenced_code_lines',0) for r in self.rows),'unverified_file_references':len(refs),'errors':self.errors,'skipped':self.skipped,'limits':'128 MiB/file, 2 GiB/input, 100,000 search characters/record. Nested ZIPs metadata only.','privacy':'Private local output. Original inputs unchanged. Recognizable credentials redacted from extracted text; review output before sharing.'},'records':self.rows,'file_references':refs}

def write(result,out):
 out.mkdir(parents=True,exist_ok=True);(out/'index.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
 (out/'coverage.json').write_text(json.dumps(result['summary'],indent=2),encoding='utf8')
 payload=json.dumps(result,ensure_ascii=False).replace('<','\\u003c').replace('&','\\u0026')
 page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'"><title>ONE · Private ChatGPT Index</title><style>body{background:#101720;color:#edf1f7;font:17px system-ui;max-width:1000px;margin:auto;padding:24px;overflow-wrap:anywhere}input,select,button{font:inherit;padding:12px;max-width:100%;box-sizing:border-box}article,pre{background:#1b2934;padding:18px;border-radius:12px}article{margin:16px 0}pre{white-space:pre-wrap}small{color:#b8c7d7}</style><h1>ONE · Private ChatGPT Index</h1><p>Search your supplied exports and files. No account connection. Keep this index private.</p><details><summary>Coverage and missing files</summary><pre id="coverage"></pre></details><p><input id="query" type="search" placeholder="Search conversations, filenames and text" aria-label="Search index"> <select id="kind" aria-label="Record type"><option value="">Every type</option></select></p><p id="count" role="status"></p><main id="results"></main><button id="more">Show more</button><script type="application/json" id="data">PAYLOAD</script><script>
const data=JSON.parse(document.getElementById('data').textContent),$=id=>document.getElementById(id);let limit=40;
$('coverage').textContent=JSON.stringify(data.summary,null,2);for(const kind of new Set(data.records.map(r=>r.kind))){const o=document.createElement('option');o.value=kind;o.textContent=kind;$('kind').append(o);}
function render(){const q=$('query').value.toLowerCase(),kind=$('kind').value,rows=data.records.filter(r=>(!kind||r.kind===kind)&&(!q||(r.title+' '+r.source+' '+(r.text||'')).toLowerCase().includes(q)));$('count').textContent=rows.length+' matches';$('results').replaceChildren();for(const r of rows.slice(0,limit)){const a=document.createElement('article'),h=document.createElement('h2'),s=document.createElement('small'),p=document.createElement('pre');h.textContent=r.title;s.textContent=r.kind+' · '+(r.role||'')+' · '+r.source+(r.duplicate_of?' · duplicate copy':'');p.textContent=r.text||r.extraction||'No extracted text';a.append(h,s,p);$('results').append(a);}$('more').hidden=rows.length<=limit;}
$('query').oninput=$('kind').onchange=()=>{limit=40;render()};$('more').onclick=()=>{limit+=40;render()};render();</script></html>'''.replace('PAYLOAD',payload)
 (out/'search.html').write_text(page,encoding='utf8')

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('inputs',nargs='+',type=pathlib.Path);parser.add_argument('--out',required=True,type=pathlib.Path);args=parser.parse_args()
 out=args.out.resolve()
 for path in args.inputs:
  resolved=path.resolve()
  if resolved==out or (resolved.is_dir() and out.is_relative_to(resolved)):parser.error('Output must be outside every input folder.')
 index=Indexer()
 for path in args.inputs:index.ingest(path)
 result=index.result();write(result,out);print(json.dumps(result['summary'],indent=2))
if __name__=='__main__':main()
