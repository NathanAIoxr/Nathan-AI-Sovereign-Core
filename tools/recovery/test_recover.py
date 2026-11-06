import json
from pathlib import Path
import tempfile
import unittest
import recover


class RecoveryTests(unittest.TestCase):
    def test_originals_and_git_objects_are_byte_exact(self):
        result = recover.verify()
        self.assertGreater(result['verifiedFiles'], 1600)
        self.assertEqual(result['branches'], 148)

    def test_path_traversal_and_git_metadata_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for path in ['../escape', '/absolute', '.git/config', 'a/../../escape', 'a\\escape']:
                with self.assertRaises(ValueError):
                    recover.safe_target(root, path)

    def test_corrupted_preserved_original_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'SHA256-MANIFEST.json').write_text(json.dumps({'files': [
                {'path': 'original.txt', 'bytes': 3, 'sha256': '0' * 64}]}))
            (root / 'original.txt').write_text('bad')
            with self.assertRaisesRegex(ValueError, 'integrity mismatch'):
                recover.verify(root)

    def test_restore_refuses_existing_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, 'nonexistent'):
                recover.restore('anything', Path(tmp))


if __name__ == '__main__':
    unittest.main()
