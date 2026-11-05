"""Standard-library unittest coverage for Six Dogs edge and macro layers.

Encrypted store tests use separately declared cryptography dependency.
"""
import os
from pathlib import Path
import tempfile
import unittest

from micro_edge import MicroEdgeEngine, quantize, MAX_BUFFER
from macro_fabric import MacroNetworkFabric
from runner import run_pipeline

try:
    from cryptography.exceptions import InvalidTag
    from encrypted_store import EncryptedVectorStore, DELETE_CONFIRMATION
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False


class MicroEdgeTests(unittest.TestCase):
    def test_knick_bounded_stage_and_explicit_drain(self):
        engine = MicroEdgeEngine("node", "INT4")
        self.assertFalse(engine.step_1_knick(" "))
        self.assertTrue(engine.step_1_knick("  Alpha  "))
        self.assertEqual(engine.memory_buffer, ["Alpha"])
        self.assertEqual(engine.drain_tokens(), ("Alpha",))
        self.assertEqual(engine.memory_buffer, [])
        with self.assertRaises(ValueError):
            engine.step_1_knick("x" * 10001)
        with self.assertRaises(TypeError):
            engine.step_1_knick(None)

    def test_knick_full_buffer_not_silently_dropped(self):
        engine = MicroEdgeEngine("edge")
        for i in range(MAX_BUFFER):
            self.assertTrue(engine.step_1_knick(str(i)))
        with self.assertRaises(BufferError):
            engine.step_1_knick("overflow")

    def test_knack_real_packed_int4_roundtrip_with_error_bound(self):
        block = [[12.5, -4.2, 0.8], [19.1, -7.0, 0.0]]
        q = quantize(block, "INT4")
        self.assertEqual(q.shape, (2, 3))
        self.assertEqual(q.bits, 4)
        self.assertEqual(q.storage_bytes, 3)  # six values, two nibbles per byte
        result = q.dequantize()
        for old_row, new_row in zip(block, result):
            for old, new in zip(old_row, new_row):
                self.assertLessEqual(abs(old - new), q.scale / 2 + 1e-9)

    def test_knack_int8_even_and_odd_lengths(self):
        q4 = quantize([[0, -3, 7]], "INT4")
        self.assertEqual(q4.storage_bytes, 2)
        self.assertEqual(len(q4.integers()), 3)
        q8 = quantize([[-13.2, 2.1], [0.1, 11.4]], "INT8")
        self.assertEqual(q8.storage_bytes, 4)
        self.assertEqual(q8.bits, 8)
        self.assertEqual(len(q8.dequantize()), 2)

    def test_numpy_compatible_tolist_and_bad_matrix(self):
        class MockArray:
            def tolist(self):
                return [[1.0, 2.0]]
        self.assertEqual(quantize(MockArray()).items, 2)
        with self.assertRaises(ValueError):
            quantize([[1], [1, 2]])
        with self.assertRaises(ValueError):
            quantize([[float("nan")]])
        with self.assertRaises(ValueError):
            quantize([[1]], "INT2")

    def test_paddy_paces_without_thermal_claim(self):
        recorded = []
        engine = MicroEdgeEngine("node", sleep_fn=recorded.append)
        result = engine.step_3_paddy(["a", "b", "c"], interval_s=0.01)
        self.assertEqual(len(result), 3)
        self.assertEqual(recorded, [0.01, 0.01, 0.01])
        with self.assertRaises(ValueError):
            engine.step_3_paddy(["bad"], interval_s=-2)


class MacroFabricTests(unittest.TestCase):
    def test_whack_requires_registered_peers_and_does_not_execute(self):
        fabric = MacroNetworkFabric()
        with self.assertRaises(RuntimeError):
            fabric.step_4_whack("job", ["seg"])
        fabric.register_peer("peer_B")
        fabric.register_peer("peer_A")
        assigned = fabric.step_4_whack("job", ["s0", "s1", "s2"])
        self.assertEqual(assigned["peer_A"][0]["position"], 0)
        self.assertEqual(assigned["peer_B"][0]["position"], 1)
        self.assertEqual(assigned["peer_A"][1]["position"], 2)
        self.assertEqual(fabric.audit()[0]["operation"], "WHACK_PLAN_ONLY")

    def test_dog_canonical_digest_is_repeatable_and_local(self):
        first, second = MacroNetworkFabric(), MacroNetworkFabric()
        v = [0.125, -0.984, 0.441]
        h = first.step_5_dog("session", v)
        self.assertEqual(h, second.step_5_dog("session", v))
        self.assertEqual(first.distributed_hash_table["session"], h)
        self.assertEqual(len(h), 64)
        with self.assertRaises(ValueError):
            first.step_5_dog("session", [float("inf")])

    def test_bone_hash_is_not_zk_proof_or_consensus(self):
        f = MacroNetworkFabric()
        result = f.step_6_bone(["Innocence", "Retained", "System", "Stable"])
        self.assertEqual(result["status"], "LOCALLY_ASSEMBLED")
        self.assertFalse(result["peer_consensus"])
        self.assertEqual(result["proof_type"], "content_digest_only_not_zk")
        self.assertTrue(f.verify_bone(result["payload"], result["proof"]))
        self.assertFalse(f.verify_bone(result["payload"] + "!", result["proof"]))

    def test_end_to_end_six_stage_local_demo(self):
        summary = run_pipeline(no_wait=True)
        self.assertEqual(summary["pipeline"], "KNICK > KNACK > PADDY > WHACK > DOG > BONE")
        self.assertEqual(summary["knack_packed_bytes"], 2)
        self.assertTrue(summary["bone"]["integrity_verified"])
        self.assertEqual(summary["encrypted_storage"], "disabled")


@unittest.skipUnless(CRYPTO_AVAILABLE, "cryptography optional dependency not installed")
class EncryptedFileTests(unittest.TestCase):
    def test_authentication_roundtrip_explicit_delete(self):
        with tempfile.TemporaryDirectory() as path:
            vault = EncryptedVectorStore(path, b"\x12" * 32)
            name = "user_context_alpha"
            loc = vault.save(name, [0.125, -0.984, 0.441])
            self.assertTrue(loc.exists())
            self.assertNotIn(b"0.125", loc.read_bytes())
            self.assertEqual(vault.load(name), [0.125, -0.984, 0.441])
            with self.assertRaises(PermissionError):
                vault.delete(name, "wrong")
            self.assertTrue(vault.delete(name, DELETE_CONFIRMATION))
            with self.assertRaises(FileNotFoundError):
                vault.load(name)

    def test_ciphertext_tampering_and_wrong_key_fail_closed(self):
        with tempfile.TemporaryDirectory() as path:
            vault = EncryptedVectorStore(path, b"\x01" * 32)
            file = vault.save("context", [1.0, 2.0])
            wrong = EncryptedVectorStore(path, b"\x02" * 32)
            with self.assertRaises(InvalidTag):
                wrong.load("context")
            import json
            payload = json.loads(file.read_text())
            import base64
            ct = bytearray(base64.b64decode(payload["ciphertext"]))
            ct[0] ^= 1
            payload["ciphertext"] = base64.b64encode(ct).decode()
            file.write_text(json.dumps(payload))
            with self.assertRaises(InvalidTag):
                vault.load("context")

    def test_vector_path_traversal_is_rejected(self):
        with tempfile.TemporaryDirectory() as path:
            vault = EncryptedVectorStore(path, b"\x03" * 32)
            with self.assertRaises(ValueError):
                vault.save("../outside", [1.0])
            with self.assertRaises(ValueError):
                vault.save("bad", [float("nan")])

    def test_runner_store_requires_explicit_external_key_file(self):
        with tempfile.TemporaryDirectory() as path:
            with self.assertRaises(ValueError):
                run_pipeline(store=True, no_wait=True, data_dir=path)
            secret = Path(path) / "secret.key"
            secret.write_bytes(b"\x07" * 32)
            result = run_pipeline(store=True, key_file=str(secret), data_dir=str(Path(path) / "data"), no_wait=True)
            self.assertEqual(result["encrypted_storage"], "encrypted-local-file")


if __name__ == "__main__":
    unittest.main()
