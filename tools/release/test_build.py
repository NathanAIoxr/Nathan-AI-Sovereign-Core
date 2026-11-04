import unittest, tempfile, pathlib, json, zipfile, io
import build

class ReleaseTests(unittest.TestCase):
    def test_static_boundary(self):
        for name in ['index.html','LICENSE','app-factory/nathan-ai/index.html','app-factory/one/library/file-index.js','docs/LAUNCH.md']:self.assertTrue(build.site_file(name),name)
        for name in ['.env','app-factory/.env.local','app-factory/private-samples/photo.jpg','app-factory/a.test.cjs','app-factory/tests/a.js','app-factory/nathan-ai/assistant/server.py','.github/workflows/ci.yml']:self.assertFalse(build.site_file(name),name)
    def test_deterministic_archive(self):
        a=build.zip_bytes({'b.txt':b'b','a.txt':b'a'},1700000000)
        self.assertEqual(a,build.zip_bytes({'a.txt':b'a','b.txt':b'b'},1700000000))
        with zipfile.ZipFile(io.BytesIO(a)) as z:self.assertEqual(z.namelist(),['a.txt','b.txt'])
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
