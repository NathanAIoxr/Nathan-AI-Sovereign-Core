import unittest
from bench_matrix import canonical_packet, run_benchmark, MAX_SAMPLES


class AnchoredBenchmarkTests(unittest.TestCase):
    def test_forward_packet_schema_and_nonce(self):
        self.assertIn(b'"nonce",7', canonical_packet(7))
        self.assertIn(b'nathan-ai.anchored-packet.v1', canonical_packet(7))

    def test_bounded_two_axis_integrity(self):
        result = run_benchmark(12)
        self.assertEqual(result['samples'], 12)
        self.assertEqual(result['sha256_operations'], 24)
        self.assertEqual(result['integrity_mismatches'], 0)
        self.assertGreater(result['samples_per_second'], 0)
        self.assertIsNone(result['watts_measured'])
        self.assertIsNone(result['realized_output_usd'])
        self.assertFalse(result['16_to_1_cost_efficiency_verified'])
        self.assertEqual(result['proxy_connections_created'], 0)

    def test_rejects_overload_and_fractional_samples(self):
        for value in (0, MAX_SAMPLES+1, 0.5, True):
            with self.subTest(value=value), self.assertRaises(ValueError):
                run_benchmark(value)


if __name__ == '__main__':
    unittest.main()
