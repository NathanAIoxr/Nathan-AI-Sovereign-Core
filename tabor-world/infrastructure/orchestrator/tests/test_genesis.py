"""Deterministic Bitcoin genesis header verification; no external network or mining."""
import hashlib
import unittest

GENESIS_HEADER = (
    "01000000" + "00" * 32
    + "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a"
    + "29ab5f49" + "ffff001d" + "1dac2b7c"
)
EXPECTED = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"

class GenesisTest(unittest.TestCase):
    def test_header_size(self):
        self.assertEqual(len(bytes.fromhex(GENESIS_HEADER)), 80)

    def test_double_sha256(self):
        header = bytes.fromhex(GENESIS_HEADER)
        digest = hashlib.sha256(hashlib.sha256(header).digest()).digest()[::-1].hex()
        self.assertEqual(digest, EXPECTED)

if __name__ == "__main__":
    unittest.main()
