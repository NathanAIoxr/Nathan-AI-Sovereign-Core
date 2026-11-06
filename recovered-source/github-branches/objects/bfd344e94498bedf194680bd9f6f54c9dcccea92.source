import unittest, tempfile, pathlib, json, zipfile, io
import build

class ReleaseTests(unittest.TestCase):
    def test_static_boundary(self):
        for name in ['index.html','LICENSE','app-factory/nathan-ai/index.html','app-factory/one/library/file-index.js','docs/LAUNCH.md','app-factory/one/library-mind/downloads/source.zip','app-factory/one/library-mind/downloads/source.docx']:self.assertTrue(build.site_file(name),name)
        for name in ['.env','app-factory/.env.local','app-factory/private-samples/photo.jpg','app-factory/a.test.cjs','app-factory/tests/a.js','app-factory/nathan-ai/assistant/server.py','.github/workflows/ci.yml']:self.assertFalse(build.site_file(name),name)
    def test_current_public_site_has_no_missing_packaged_links(self):
        files={name:(build.ROOT/name).read_bytes() for name in build.tracked() if build.site_file(name)}
        for name in ['landing/landing.js','standalone-apps/index.html','archive-index/alphabet/d/index.html','app-factory/nathan-ai/brainstormer/originals/NathanAI_Brainstormer_Python_v002.py']:
            self.assertIn(name,files)
        build.check_links(files)

    def test_site_root_directory_link(self):
        build.check_links({'index.html':b'<a href="./">Home</a>'})

    def test_deterministic_archive(self):
        a=build.zip_bytes({'b.txt':b'b','a.txt':b'a'},1700000000)
        self.assertEqual(a,build.zip_bytes({'a.txt':b'a','b.txt':b'b'},1700000000))
        with zipfile.ZipFile(io.BytesIO(a)) as z:self.assertEqual(z.namelist(),['a.txt','b.txt'])
    def test_packaged_links_require_actual_files(self):
        files={'index.html':b'<a href="docs/guide.html">Guide</a>','docs/guide.html':b'<a href="../index.html">Home</a>'}
        build.check_links(files);del files['docs/guide.html']
        with self.assertRaisesRegex(ValueError,'Missing packaged'):build.check_links(files)
    def test_original_downloads_are_present_and_unchanged(self):
        base='app-factory/one/library-mind/';record={'file':'downloads/original.zip','bytes':3,'sha256':build.digest(b'ZIP')};files={base+'publication.json':json.dumps({'downloads':[record]}).encode()}
        with self.assertRaisesRegex(ValueError,'missing'):build.check_published_downloads(files)
        files[base+record['file']]=b'ZIP';build.check_published_downloads(files)
        files[base+record['file']]=b'BAD'
        with self.assertRaisesRegex(ValueError,'integrity'):build.check_published_downloads(files)
    def test_manifest_rejects_corrupt_and_extra_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=pathlib.Path(tmp)/'site.zip';row={'path':'index.html','bytes':2,'sha256':build.digest(b'OK')};manifest={'commit':'fixture','files':[row]}
            files={'index.html':b'OK','release-manifest.json':json.dumps(manifest).encode()}
            path.write_bytes(build.zip_bytes(files,1700000000));build.verify(path)
            files['index.html']=b'NO';path.write_bytes(build.zip_bytes(files,1700000000))
            with self.assertRaisesRegex(ValueError,'Integrity mismatch'):build.verify(path)
            files['index.html']=b'OK';files['unexpected.txt']=b'x';path.write_bytes(build.zip_bytes(files,1700000000))
            with self.assertRaisesRegex(ValueError,'contents'):build.verify(path)
if __name__=='__main__':unittest.main()
