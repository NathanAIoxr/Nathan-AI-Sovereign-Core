# NATHAN AI — Six Dogs Micro Edge + Macro Fabric

**Status:** Actual, runnable local Python components and tests; not a full AI model-serving engine or P2P network.

This is an additive extension to the existing Six Dogs module in Nathan AI and ONE. The exact sequence is:

| Step | Class / method | Actual implementation | Not claimed |
|---|---|---|---|
| 1. KNICK | MicroEdgeEngine.step_1_knick | Validated, bounded user-supplied text staging | Interrupt hooks into GPUs, NPUs, kernel tokens |
| 2. KNACK | MicroEdgeEngine.step_2_knack | Per-tensor symmetric quantization with **packed signed INT4** (2 values/byte) or INT8, scale and dequantization | Production LLM checkpoint conversion or equivalent accuracy |
| 3. PADDY | MicroEdgeEngine.step_3_paddy | Controlled software wait between bounded local batches | NPU clocks, thermal sensors or hardware throttling |
| 4. WHACK | MacroNetworkFabric.step_4_whack | Deterministic assignment of ordered segments to **explicitly registered** mock peers | Network dispatch, tensor parallelism, Ray/DeepSpeed all-reduce |
| 5. DOG | MacroNetworkFabric.step_5_dog | SHA-256 hash of canonical local numeric vectors, kept in a local dictionary | libp2p DHT, global conversation synchronization |
| 6. BONE | MacroNetworkFabric.step_6_bone | Ordered local string assembly and SHA-256 integrity check | ZK proof, consensus, signatures, origin attestation |

The technical paths are separate from the metaphorical grief/emotional coping interpretation and from the literary Mind/Body/Shadow tracks. No diagnoses or emotional sensing happen here.

## Directory

- micro_edge.py — bounded text buffer, 4-bit packed numeric quantization and software pacing
- macro_fabric.py — peer registration, local partition plan, vector digest and output integrity
- encrypted_store.py — optional AES-256-GCM authenticated, file-backed vector storage
- runner.py — small six-stage demonstration
- test_edge_mesh.py — regression tests, including tampering and explicit erase
- Dockerfile + compose.yaml — offline-running local container
- requirements.txt — cryptography dependency for encrypted file adapter
- .gitignore / .dockerignore — block local keys and vector records from Git/container build context

## Run locally

Requirements: Python 3.11+; no GPU or NumPy required for this particular demonstration.

    cd app-factory/nathan-ai/six-dogs/edge-mesh
    python3 runner.py --demo --no-wait

The engine accepts a NumPy 2D ndarray through its public tolist() method when NumPy is installed, but NumPy is not required. The INT4 result is a QuantizedTensor structure with packed byte storage, shape, a per-tensor scale and a dequantize method. This is real numeric quantization in memory, but not loading or quantizing model weights.

To test encrypted vector storage, install dependencies first:

    python3 -m pip install -r requirements.txt
    python3 -m unittest discover -s . -p 'test_*.py' -v

The tests use ephemeral random/temp files and do not use any real user's data.

## User-controlled encrypted file storage

Vector storage is **opt-in** through the --store flag. It requires a raw **32-byte encryption key**, sourced from a file supplied by the user. No fallback, built-in password, key generation or key upload is performed by the service. Encrypted records are kept as authenticated AES-256-GCM envelopes; filenames contain only a SHA-256 digest of a locally chosen context ID.

This is protected local **filesystem** storage, *not* an on-chip secure element or hardware-backed key store. A host with full control, malware, compromised RAM or leaked keys can still access data. Back up the key securely and separately; loss of it makes recovery impossible. Deletion removes the file but does not physically overwrite SSD cells, snapshots or backups.

## Docker: one-machine deployment

Docker Compose setup (run inside this directory):

    mkdir -p secrets
    python3 -c 'import os; fd=os.open("secrets/vector_key", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600); os.write(fd, os.urandom(32)); os.close(fd)'
    docker compose build
    docker compose run --rm edge

The generated secret file must remain **outside Git** and should be backed up in an appropriate secret store. The command intentionally fails if the key already exists rather than overwriting it.

To opt into encrypted vector writing:

    docker compose run --rm edge python runner.py --demo --store --key-file /run/secrets/vector_key --data-dir /data

At runtime the container has **network_mode: none**, no listening ports, read-only root filesystem, nonroot execution, dropped capabilities, and a named volume for encrypted records. The build step normally downloads a Python base image and cryptography package; for genuinely air-gapped construction, prefetch/verify the base image and approved wheels before disconnecting the network. Docker runtime network isolation does not establish immunity to host compromise or all legal obligations.

## Hardware and wider platform integration

The current, separately versioned [Arduino Six Dogs reference](../hardware/README.md) uses six LEDs and one button. The Python edge-mesh demonstration does not connect to or program that device. The earlier Six Dogs browser console and DATA–ATAD/MIDA modules remain intact. This Python package does not silently sync conversations or transmit anything to foreign or domestic servers.

Future explicit ports and adapters can support authenticated peer messaging, verified remote work acknowledgements, NPU/temperature telemetry, model-serving runtimes (vLLM or llama.cpp where compatible), tamper-evident event logs, and hardware-backed key management. None of those are shipped by this code.

## Invariants and truth boundaries

- **1 + 1 = 2 BUILD; 1 - 1 = 0 CLEAR** are arithmetic identities. They do not by themselves prove a claim true, identify deception, or authorize automatic erasure.
- For the six-stage workflow, names and order remain immutable. Micro stages 1–3 and macro stages 4–6 compose but do not require changing the existing emotional support protocol.
- SHA-256 compares content integrity, not source trust or zero-knowledge correctness.
- No deployed peer-to-peer network, model inference, "sovereign frequency", physics effect, or clinical stress prevention is claimed.

Run the regression suite and see the GitHub Actions workflow for independent execution evidence.
