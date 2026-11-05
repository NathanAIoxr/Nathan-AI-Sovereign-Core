"""Nathan AI Six Dogs: MACRO network-fabric planning, local-only.

WHACK plans partitions for explicitly registered peers (no network transmission).
DOG records canonical SHA-256 context digests, not actual DHT synchronization.
BONE assembles ordered local outputs with an integrity hash (NOT a zk proof).
"""
from __future__ import annotations

import hashlib
import hmac
import json
import math
import re
from typing import Any, Sequence

MAX_PEERS = 64
MAX_SEGMENTS = 1024
MAX_CONTEXT_ITEMS = 8192
MAX_OUTPUT_CHARS = 1_000_000
PEER_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{0,63}$")
KEY_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")


def _canonical_bytes(data: object) -> bytes:
    def check_finite(x: object) -> None:
        if isinstance(x, float) and not math.isfinite(x):
            raise ValueError("Nonfinite values are unsupported")
        if isinstance(x, (list, tuple)):
            for v in x:
                check_finite(v)
        if isinstance(x, dict):
            for k, v in x.items():
                if not isinstance(k, str):
                    raise TypeError("JSON object keys must be strings")
                check_finite(v)
    check_finite(data)
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


class MacroNetworkFabric:
    """A deterministic routing plan and local digest registry.

    A fully distributed fabric requires adapters for peer authentication, data
    transport, remote execution, acknowledgements, retries and all-reduce.
    Those are intentionally absent.
    """

    def __init__(self) -> None:
        self.peer_registry: dict[str, dict[str, str]] = {}
        self.distributed_hash_table: dict[str, str] = {}
        self._audit: list[dict[str, Any]] = []

    def register_peer(self, peer_id: str, *, capability: str = "local") -> None:
        if not isinstance(peer_id, str) or not PEER_PATTERN.fullmatch(peer_id):
            raise ValueError("Invalid peer ID")
        if not isinstance(capability, str) or not (1 <= len(capability) <= 64):
            raise ValueError("Invalid capability")
        if peer_id not in self.peer_registry and len(self.peer_registry) >= MAX_PEERS:
            raise ValueError("Peer capacity reached")
        self.peer_registry[peer_id] = {"capability": capability}

    def step_4_whack(self, workload_id: str, heavy_matrix_segments: Sequence[object]) -> dict[str, list[dict[str, object]]]:
        """Assign segments in deterministic round-robin order. NO remote dispatch."""
        if not isinstance(workload_id, str) or not KEY_PATTERN.fullmatch(workload_id):
            raise ValueError("Invalid workload ID")
        if not isinstance(heavy_matrix_segments, (list, tuple)) or len(heavy_matrix_segments) > MAX_SEGMENTS:
            raise ValueError("Expected bounded segments list")
        if not self.peer_registry:
            raise RuntimeError("No explicitly registered peers")
        peers = sorted(self.peer_registry)
        assignments: dict[str, list[dict[str, object]]] = {peer: [] for peer in peers}
        for index, segment in enumerate(heavy_matrix_segments):
            assignments[peers[index % len(peers)]].append({"position": index, "segment": segment})
        self._audit.append({"operation": "WHACK_PLAN_ONLY", "workload_id": workload_id, "segments": len(heavy_matrix_segments)})
        self._audit[:] = self._audit[-128:]
        return assignments

    def step_5_dog(self, context_key: str, vector_embeddings: Sequence[float]) -> str:
        """Digest canonical numeric vector and index the digest locally."""
        if not isinstance(context_key, str) or not KEY_PATTERN.fullmatch(context_key):
            raise ValueError("Invalid context key")
        if not isinstance(vector_embeddings, (tuple, list)) or len(vector_embeddings) > MAX_CONTEXT_ITEMS:
            raise ValueError("Embedding must be a bounded list")
        values: list[float] = []
        for value in vector_embeddings:
            if isinstance(value, bool) or not isinstance(value, (float, int)):
                raise TypeError("Embedding values must be numeric")
            n = float(value)
            if not math.isfinite(n):
                raise ValueError("Nonfinite embedding")
            values.append(n)
        digest = hashlib.sha256(_canonical_bytes(values)).hexdigest()
        self.distributed_hash_table[context_key] = digest
        return digest

    def step_6_bone(self, final_compiled_array: Sequence[str]) -> dict[str, object]:
        """Integrity-tag a local output. SHA-256 is NOT a zero-knowledge proof."""
        if not isinstance(final_compiled_array, (tuple, list)):
            raise TypeError("Output must be an ordered list of strings")
        if any(not isinstance(x, str) for x in final_compiled_array):
            raise TypeError("Output elements must be text")
        payload = " ".join(final_compiled_array)
        if len(payload) > MAX_OUTPUT_CHARS:
            raise ValueError("Output exceeds size limit")
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return {
            "status": "LOCALLY_ASSEMBLED",
            "integrity_algorithm": "sha256",
            "proof_type": "content_digest_only_not_zk",
            "proof": digest,  # legacy key name, explicitly not cryptographic proof of consensus
            "payload": payload,
            "peer_consensus": False,
            "remote_execution": False,
        }

    @staticmethod
    def verify_bone(payload: str, expected_sha256: str) -> bool:
        """Verify an existing digest; does not attest payload origin."""
        if not isinstance(payload, str) or not isinstance(expected_sha256, str):
            return False
        if not re.fullmatch(r"[a-f0-9]{64}", expected_sha256):
            return False
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return hmac.compare_digest(digest, expected_sha256)

    def audit(self) -> tuple[dict[str, Any], ...]:
        return tuple(dict(x) for x in self._audit)
