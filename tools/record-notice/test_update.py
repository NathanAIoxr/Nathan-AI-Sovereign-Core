import hashlib
import json
from pathlib import Path
import unittest
import update


class NoticeTests(unittest.TestCase):
    def test_notice_insertion_preserves_every_other_byte_and_is_idempotent(self):
        samples=[b'<!doctype html><body class="app"><main>Original</main></body>',
                 b'<!doctype html><html><title>Original</title><style>p{color:red}</style><main>Text</main></html>',
                 b'<html><head><script>const s="<main>";</script></head><body><p>Original</p></body></html>']
        for source in samples:
            result=update.insert_notice(source,'app-factory/example/index.html')
            self.assertEqual(result.replace(update.notice('app-factory/example/index.html').encode(),b''),source)
            self.assertEqual(update.insert_notice(result,'app-factory/example/index.html'),result)
            from html.parser import HTMLParser
            class Probe(HTMLParser):
                def handle_starttag(self,tag,attrs):
                    if tag=='aside':self.found=True
            parser=Probe();parser.found=False;parser.feed(result.decode());self.assertTrue(parser.found)

    def test_all_maintained_pages_link_to_record_and_keep_original_content(self):
        doc=json.loads((update.ROOT/'docs/record/NOTICE-COVERAGE.json').read_text())
        self.assertGreater(len(doc['noticePages']),300)
        import subprocess
        names=subprocess.check_output(['git','ls-files','-z'],cwd=update.ROOT).decode().split('\0')
        expected={p for p in names if p.endswith(('.html','.htm')) and not update.retained_original(p)}
        self.assertEqual({r['path'] for r in doc['noticePages']},expected)
        for row in doc['noticePages']:
            data=(update.ROOT/row['path']).read_bytes()
            notice=update.notice(row['path']).encode()
            self.assertEqual(data.count(notice),1,row['path'])
            self.assertEqual(hashlib.sha256(data.replace(notice,b'')).hexdigest(),row['originalSha256'],row['path'])
            self.assertEqual(row['recordLink'],update.record_link(row['path']))
            self.assertTrue((update.ROOT/update.RECORD).is_file())

    def test_original_archives_keep_exact_bytes(self):
        doc=json.loads((update.ROOT/'docs/record/NOTICE-COVERAGE.json').read_text())
        for row in doc['bytePreservedOriginals']:
            data=(update.ROOT/row['path']).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(),row['sha256'],row['path'])
            self.assertNotIn(update.MARKER.encode(),data,row['path'])

    def test_record_matches_its_fingerprint_and_displayed_text(self):
        root=update.ROOT/'docs/record'
        data=(root/'RECORD.md').read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(),(root/'RECORD.sha256').read_text().split()[0])
        import html
        page=(root/'index.html').read_text()
        self.assertIn(html.escape(data.decode()),page)


if __name__=='__main__':unittest.main()
