import pathlib
import tempfile
import unittest

import check


class DiscoveryTests(unittest.TestCase):
    def test_discovers_every_public_tree_without_dependency_tests(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            expected = []
            for folder in check.TEST_ROOTS:
                path = root / folder / 'nested' / 'engine.test.mjs'
                path.parent.mkdir(parents=True)
                path.touch()
                expected.append(path)
            dependency = root / 'app-factory/node_modules/vendor/engine.test.cjs'
            dependency.parent.mkdir(parents=True)
            dependency.touch()
            self.assertEqual(check.discover_node_tests(root), sorted(expected))


if __name__ == '__main__':
    unittest.main()
