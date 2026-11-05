"""Six Dogs Python end-to-end demonstration (no cloud and no remote peers).

Run python runner.py --demo
To opt into encrypted vector saving:
    python runner.py --demo --store --key-file /run/secrets/vector_key
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from micro_edge import MicroEdgeEngine
from macro_fabric import MacroNetworkFabric


def run_pipeline(
    *,
    store: bool = False,
    key_file: str | None = None,
    data_dir: str = "./local-vectors",
    no_wait: bool = False,
) -> dict[str, object]:
    edge = MicroEdgeEngine("NODE_EAST_01", precision="INT4", sleep_fn=(lambda _: None) if no_wait else __import__("time").sleep)
    fabric = MacroNetworkFabric()
    fabric.register_peer("peer_alpha")
    fabric.register_peer("peer_beta")

    # 1. KNICK — bounded local input, no implicit microphone or packet interception.
    intercepted = edge.step_1_knick("  Sovereign_Compute_Init  ")
    # 2. KNACK — packed per-tensor 4-bit numeric quantization, not a model loader.
    matrix = edge.step_2_knack([[12.5, -4.2], [0.8, 19.1]])
    # 3. PADDY — pacing of three local software batches.
    paced = edge.step_3_paddy(["Token_A", "Token_B", "Token_C"])
    # 4. WHACK — deterministic assignment plan ONLY, no network calls.
    allocations = fabric.step_4_whack("JOB_99X", ["Part_01", "Part_02", "Part_03"])
    # 5. DOG — locally held SHA-256 digest of canonical numeric vector.
    vector = [0.125, -0.984, 0.441]
    context_hash = fabric.step_5_dog("session_user_delta", vector)
    # 6. BONE — local payload with SHA-256 digest, not ZK proof or peer consensus.
    result = fabric.step_6_bone(["Innocence", "Retained", "System", "Stable"])

    save_status = "disabled"
    if store:
        if not key_file:
            raise ValueError("--store requires --key-file; no built-in secrets")
        from encrypted_store import EncryptedVectorStore
        vault = EncryptedVectorStore.from_key_file(data_dir, key_file)
        vault.save("session_user_delta", vector)
        if vault.load("session_user_delta") != vector:
            raise RuntimeError("Local vector save/load mismatch")
        save_status = "encrypted-local-file"

    return {
        "pipeline": "KNICK > KNACK > PADDY > WHACK > DOG > BONE",
        "knick_staged": intercepted,
        "token_count": len(edge.memory_buffer),
        "knack_precision_bits": matrix.bits,
        "knack_packed_bytes": matrix.storage_bytes,
        "knack_shape": matrix.shape,
        "paddy_batches": len(paced),
        "whack_mode": "local-routing-plan-only",
        "whack_peer_counts": {k: len(v) for k, v in allocations.items()},
        "dog_digest_prefix": context_hash[:12],
        "bone": {
            "status": result["status"],
            "integrity_verified": fabric.verify_bone(result["payload"], result["proof"]),
            "proof_type": result["proof_type"],
            "remote_execution": result["remote_execution"],
        },
        "encrypted_storage": save_status,
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Nathan AI Six Dogs local edge-mesh demo")
    p.add_argument("--demo", action="store_true", help="Run the bounded six-stage demonstration")
    p.add_argument("--store", action="store_true", help="Opt into AES-GCM local vector storage")
    p.add_argument("--key-file", help="Path to a user-created raw 32-byte secret")
    p.add_argument("--data-dir", default="/data" if Path("/data").exists() else "./local-vectors")
    p.add_argument("--no-wait", action="store_true", help="Skip pacing delays in tests")
    args = p.parse_args()
    print(json.dumps(run_pipeline(store=args.store, key_file=args.key_file, data_dir=args.data_dir, no_wait=args.no_wait), indent=2))
