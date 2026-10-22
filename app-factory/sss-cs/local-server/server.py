#!/usr/bin/env python3
"""SSS-CS loopback-only web server and password-encrypted PDF evidence exporter.

Runs on 127.0.0.1 only, does not persist or transmit submitted evidence.
Requires: pip install reportlab pypdf
"""
from __future__ import annotations

import hashlib
import io
import json
import os
from html import escape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

BASE = Path(__file__).resolve().parents[1] / "ios" / "SSSCS" / "Web"
MAX_BYTES = 4_000_000
HOST = '127.0.0.1'
PORT = int(os.environ.get('SSS_CS_PORT', '8765'))


def validate_chain(events):
    if not isinstance(events, list) or len(events) > 2500:
        raise ValueError('Expected an event array with at most 2500 entries.')
    prev = 'GENESIS'
    for n, event in enumerate(events, 1):
        if not isinstance(event, dict):
            raise ValueError('Invalid event entry.')
        if event.get('seq') != n or event.get('prev') != prev:
            raise ValueError(f'Chain reference mismatch at entry {n}.')
        payload = {k: event[k] for k in ('seq', 'time', 'kind', 'status', 'details', 'prev')}
        raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        expected = hashlib.sha256(raw).hexdigest()
        if expected != event.get('hash'):
            raise ValueError(f'Hash mismatch at entry {n}.')
        prev = expected
    return prev


def make_pdf(events, password):
    """Generate PDF in memory, then apply PDF AES-256 encryption in memory."""
    chain_head = validate_chain(events)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=58, bottomMargin=60,
                            rightMargin=42, leftMargin=42, title='SSS-CS Evidence Ledger',
                            author='SSS-CS Clause Santa Local Report Service')
    ss = getSampleStyleSheet()
    gold = colors.HexColor('#C39143')
    blue = colors.HexColor('#143B57')
    ink = colors.HexColor('#24303A')
    ss.add(ParagraphStyle(name='SSSTitle', parent=ss['Title'], fontName='Helvetica-Bold',
                          fontSize=19, leading=24, textColor=blue, spaceAfter=8))
    ss.add(ParagraphStyle(name='SSSSub', parent=ss['Normal'], fontName='Helvetica',
                          fontSize=9.5, leading=14, textColor=ink))
    ss.add(ParagraphStyle(name='SSSHead', parent=ss['Heading2'], fontName='Helvetica-Bold',
                          fontSize=12, leading=16, textColor=blue, spaceBefore=14, spaceAfter=6))
    ss.add(ParagraphStyle(name='SSSEvent', parent=ss['BodyText'], fontName='Helvetica',
                          fontSize=8.5, leading=13, textColor=ink, spaceAfter=7,
                          splitLongWords=1))
    story = [Paragraph('SSS-CS | CLAUSE SANTA', ss['SSSTitle']),
             Paragraph('THE YALL LAW - CHRISTMAS GHOST EVIDENCE LEDGER', ss['SSSHead']),
             Paragraph('Local-only audit report | Exported on demand | Encrypted with AES-256', ss['SSSSub']),
             Spacer(1, 14)]
    stats = [['OPERATING SYSTEM','YULL LAW + 4T ENGINE + YALL LAW'],
             ['TOTAL EVENTS',str(len(events))],
             ['CHAIN INTEGRITY','HASH LINKS VERIFIED AT EXPORT'],
             ['CHAIN HEAD',chain_head],
             ['DATA SOURCE','LOCAL APP-GENERATED EVENTS / USER TESTS'],
             ['PROTECTION','PDF AES-256 USER PASSWORD']]
    info = Table(stats, colWidths=[116, 386], hAlign='LEFT')
    info.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(0,-1),colors.HexColor('#E7F0F5')),
        ('TEXTCOLOR',(0,0),(0,-1),blue),
        ('LINEBELOW',(0,0),(-1,-1),.35,colors.HexColor('#A6BBC5')),
        ('BOX',(0,0),(-1,-1),.5,colors.HexColor('#A6BBC5')),
        ('FONTSIZE',(0,0),(-1,-1),8),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
    ]))
    story += [info,Spacer(1, 10),Paragraph('Preservation & verification limits',ss['SSSHead']),
              Paragraph('This chain detects many edits to a retained ledger but does not prove an event originated outside the app, nor prevent a person with full device access from replacing the entire history. A trusted independent checkpoint is needed to detect full-history replacement.',ss['SSSSub']),
              Spacer(1, 14),Paragraph('Recorded events',ss['SSSHead'])]
    if not events:
        story.append(Paragraph('No events submitted.',ss['SSSSub']))
    for event in events:
        eid = escape(str(event['seq']))
        ek = escape(str(event['kind']))
        status = escape(str(event['status']))
        event_time = escape(str(event['time']))
        details = escape(str(event['details'])[:2000]).replace('\n','<br/>')
        hashtext = escape(event['hash'])
        story.append(KeepTogether([
            Paragraph(f'<b>#{eid} &nbsp; {ek} / {status}</b><br/><font color="#576B77">{event_time}</font>',ss['SSSEvent']),
            Paragraph(details,ss['SSSEvent']),
            Paragraph(f'<font color="#576B77">SHA-256: {hashtext}</font>',ss['SSSEvent']),
            Spacer(1,7)
        ]))

    def decorate(canvas, d):
        canvas.saveState()
        w,h=A4
        canvas.setStrokeColor(gold)
        canvas.setLineWidth(1.6)
        canvas.line(42,h-41,w-42,h-41)
        canvas.setFont('Helvetica',8)
        canvas.setFillColor(blue)
        canvas.drawString(42,34,'SSS-CS  |  SIMPLY SENSATIONAL SOFTWARE  |  CLAUSE SANTA')
        canvas.drawRightString(w-42,34,f'PAGE {d.page}')
        canvas.restoreState()
    doc.build(story,onFirstPage=decorate,onLaterPages=decorate)
    buf.seek(0)
    reader=PdfReader(buf)
    writer=PdfWriter()
    writer.append_pages_from_reader(reader)
    writer.add_metadata({'/Title':'SSS-CS Local Evidence Ledger','/Subject':'Password-encrypted on-device report'})
    writer.encrypt(password, algorithm='AES-256')
    out=io.BytesIO()
    writer.write(out)
    return out.getvalue()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**k):
        super().__init__(*a,directory=str(BASE),**k)

    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Frame-Options','DENY')
        super().end_headers()

    def do_GET(self):
        if urlparse(self.path).path=='/api/health':
            self.reply_json({'service':'SSS-CS local report','pdf':'AES-256','network':'loopback-only'})
            return
        return super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path!='/api/report':
            self.send_error(404);return
        # The service listens on loopback and accepts only JSON from its own local origin.
        origin=self.headers.get('Origin')
        expected=f'http://{HOST}:{PORT}'
        if origin and origin not in (expected, f'http://localhost:{PORT}'):
            self.reply_json({'error':'Cross-origin requests are blocked.'},403);return
        if self.headers.get('Content-Type','').split(';')[0].strip()!='application/json':
            self.reply_json({'error':'JSON content type required.'},415);return
        try:
            length=int(self.headers.get('Content-Length','0'))
            if length<1 or length>MAX_BYTES:raise ValueError('Request must be 1 byte to 4 MB.')
            body=json.loads(self.rfile.read(length).decode('utf-8'))
            password=body.get('password')
            if not isinstance(password,str) or len(password)<12 or len(password)>200:
                raise ValueError('A PDF passphrase of 12-200 characters is required.')
            data=make_pdf(body.get('events'),password)
            self.send_response(200)
            self.send_header('Content-Type','application/pdf')
            self.send_header('Content-Length',str(len(data)))
            self.send_header('Content-Disposition','attachment; filename="sss-cs-evidence.pdf"')
            self.end_headers();self.wfile.write(data)
        except (ValueError,KeyError,TypeError) as exc:
            self.reply_json({'error':str(exc)[:240]},400)
        except Exception:
            self.reply_json({'error':'Report generation failed. See local server console.'},500)

    def reply_json(self,body,status=200):
        data=json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers();self.wfile.write(data)


def main():
    server=ThreadingHTTPServer((HOST,PORT),Handler)
    print(f'SSS-CS ready at http://{HOST}:{PORT} (loopback only)')
    print('No remote network binding. Ctrl+C to stop. PDF passwords stay in process memory only.')
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()

if __name__=='__main__':main()
