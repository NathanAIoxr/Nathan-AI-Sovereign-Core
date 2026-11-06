#!/usr/bin/env python3
"""Add the approved record link without replacing existing page content."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import html
import json
import posixpath
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
RECORD = 'docs/record/index.html'
PUBLIC_RECORD = '/Nathan-AI-Sovereign-Core/docs/record/'
MARKER = 'id="nathan-record-notice"'
# These are historical exhibits/original source, not editable site presentations.
PRESERVED = {'landing/original-chat-landing.html'}


def retained_original(name):
    return name.startswith('recovered-source/') or '/originals/' in name or name in PRESERVED


def record_link(name):
    # Native/browser mirror pairs must retain identical HTML and have no remote URLs.
    mirrors=('app-factory/stewie-mr-finn/polar-middle-c/',
             'app-factory/stewie-mr-finn/Resources/PolarMiddleC/')
    return PUBLIC_RECORD if name.startswith(mirrors) else posixpath.relpath(RECORD,posixpath.dirname(name) or '.')


def notice(name):
    target = record_link(name)
    return ('\n<aside '+MARKER+' aria-label="Timestamped record" '
            'style="display:block!important;position:relative!important;box-sizing:border-box!important;'
            'grid-column:1/-1;flex:0 0 100%;width:100%;padding:12px 16px;margin:0;'
            'background:#fff0b3!important;color:#161616!important;border-bottom:3px solid #161616;'
            'font:600 16px/1.5 system-ui,sans-serif;text-align:left;overflow-wrap:anywhere;">'
            '<a href="'+target+'" style="color:#161616!important;text-decoration:underline!important;">'
            'READ THE TIMESTAMPED RECORD — Nathan Tabor / ChatGPT</a>'
            '<span style="display:block;font-size:14px;font-weight:400;color:#161616!important;">'
            'Repository changes, authorship complaints, correction claims, and unfinished work. '
            'Record opened November 5, 2026, 7:42:08 p.m. EST.</span></aside>\n')


def insert_notice(data, name):
    if MARKER.encode() in data:
        return data
    text=data.decode('utf8')
    class Position(HTMLParser):
        insertion_index=None
        def handle_starttag(self,tag,attrs):
            if self.insertion_index is not None:return
            if tag=='body' or tag in {'main','header','div','section','h1','h2','p','nav','iframe','canvas','table','form','ul','article'}:
                line,col=self.getpos()
                start=sum(len(row) for row in text.splitlines(keepends=True)[:line-1])+col
                self.insertion_index=start+len(self.get_starttag_text()) if tag=='body' else start
    parser=Position();parser.feed(text)
    if parser.insertion_index is None:raise ValueError('Cannot locate page content: '+name)
    offset=len(text[:parser.insertion_index].encode('utf8'))
    return data[:offset] + notice(name).encode('utf8') + data[offset:]



def main():
    names=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
    names=sorted({p for p in names if p.endswith(('.html','.htm'))} | {RECORD})
    rows=[];preserved=[]
    for name in names:
        path=ROOT/name
        if not path.is_file():continue
        data=re.sub(rb'\n<aside id="nathan-record-notice"[\s\S]*?</aside>\n',b"",path.read_bytes())
        if retained_original(name):
            preserved.append({'path':name,'sha256':hashlib.sha256(data).hexdigest()})
            continue
        result=insert_notice(data,name)
        path.write_bytes(result)
        rows.append({'path':name,'originalSha256':hashlib.sha256(data).hexdigest(),
                     'withNoticeSha256':hashlib.sha256(result).hexdigest(),
                     'recordLink':record_link(name)})
    report={'schema':'nathan.record-notice.coverage.v1','noticePages':rows,'bytePreservedOriginals':preserved,
            'scope':'Maintained website HTML pages receive the notice. Historical original HTML and recovered-source artifacts retain exact original bytes.'}
    (ROOT/'docs/record/NOTICE-COVERAGE.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'noticePages':len(rows),'bytePreservedOriginals':len(preserved)},indent=2))


if __name__=='__main__':main()
