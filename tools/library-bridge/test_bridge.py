import unittest,tempfile,pathlib,json,zipfile
import bridge
class Tests(unittest.TestCase):
 def test_conversations_and_missing_references(self):
  c=[{'id':'c','title':'Original chat','mapping':{'n':{'parent':None,'message':{'id':'m','author':{'role':'user'},'content':{'parts':['```python\nx=1\n```',{'image_asset_pointer':'file-unavailable'}]}}}}}]
  x=bridge.Indexer();x.add('conversations.json',json.dumps(c).encode());r=x.result();self.assertEqual(r['summary']['by_kind']['conversation-message'],1);self.assertEqual(r['summary']['fenced_code_lines_in_messages_not_deduplicated'],1);self.assertEqual(r['file_references'][0]['status'],'reference only; original file not verified')
 def test_duplicate_source_counts(self):
  x=bridge.Indexer();x.add('one.py',b'# comment\n\nx=1\n');x.add('copy.py',b'# comment\n\nx=1\n');self.assertEqual(x.result()['summary']['physical_code_lines_in_unique_source_files'],3)
 def test_redaction(self):
  self.assertNotIn('example-value',bridge.redact('password: example-value'));self.assertNotIn('example-value',bridge.redact('{"password": "example-value"}'));self.assertEqual(bridge.redact('sk-'+'a'*32),'[REDACTED POSSIBLE CREDENTIAL]')
 def test_zip_and_exclusions(self):
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t)/'data.zip'
   with zipfile.ZipFile(p,'w') as z:z.writestr('docs/a.txt','Original words');z.writestr('.env','PRIVATE=example')
   x=bridge.Indexer();x.ingest(p);r=x.result();self.assertEqual(r['summary']['files_read'],1);self.assertEqual(len(r['summary']['skipped']),1)
 def test_no_html_execution_or_requests(self):
  with tempfile.TemporaryDirectory() as t:
   x=bridge.Indexer();x.add('danger.txt',b'</script><script>alert(1)</script>');bridge.write(x.result(),pathlib.Path(t));page=(pathlib.Path(t)/'search.html').read_text();self.assertNotIn('</script><script>alert',page);self.assertIn("connect-src 'none'",page);self.assertNotIn('innerHTML',page)
if __name__=='__main__':unittest.main()
