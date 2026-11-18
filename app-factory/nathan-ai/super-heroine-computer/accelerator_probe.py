"""Run the same deterministic tensor check on NumPy or local JAX devices."""
import argparse
import hashlib
import json
import time

import numpy as np


def jax_product(left, right, platform, count):
    import jax
    import jax.numpy as jnp
    from jax.sharding import Mesh, NamedSharding, PartitionSpec

    devices = jax.local_devices(backend=platform)
    if len(devices) < count or any(device.platform != platform for device in devices[:count]):
        raise ValueError(f"{count} local {platform} devices requested, found {len(devices)}")
    devices = devices[:count]
    mesh = Mesh(np.array(devices), ("row",))
    rows = NamedSharding(mesh, PartitionSpec("row", None))
    shared = NamedSharding(mesh, PartitionSpec())
    a = jax.device_put(left, rows)
    b = jax.device_put(right, shared)
    operation = jax.jit(lambda x, y: jnp.matmul(x, y, precision="highest"), out_shardings=rows)
    operation(a, b).block_until_ready()
    started = time.perf_counter()
    result = operation(a, b).block_until_ready()
    elapsed = time.perf_counter() - started
    return np.asarray(result), elapsed, [str(device) for device in devices]


def run(backend, count, size):
    row = np.arange(size, dtype=np.int32)[:, None]
    col = np.arange(size, dtype=np.int32)[None, :]
    left = (row * 7 + col * 11 + 3) % 19 - 9
    right = (row * 13 + col * 5 + 2) % 23 - 11
    if backend == "numpy":
        a, b = left.astype(np.float32), right.astype(np.float32)
        started = time.perf_counter()
        result = a @ b
        elapsed = time.perf_counter() - started
        devices = ["CPU"]
    else:
        result, elapsed, devices = jax_product(
            left.astype(np.float32), right.astype(np.float32), backend.removeprefix("jax-"), count
        )
    expected = left @ right
    if not np.array_equal(result, expected):
        raise ValueError("accelerator result differs from the exact integer reference")
    output = result.astype("<i4").tobytes()
    return {
        "schema": 1,
        "workload": "tensor-matrix-v1",
        "backend": backend,
        "size": size,
        "devices": devices,
        "verified": True,
        "execution_ms": elapsed * 1000,
        "output_encoding": "row-major little-endian int32",
        "output_sha256": hashlib.sha256(output).hexdigest(),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", choices=["numpy", "jax-cpu", "jax-gpu", "jax-tpu"], default="numpy")
    parser.add_argument("--devices", type=int, default=1)
    parser.add_argument("--size", type=int, default=256)
    args = parser.parse_args()
    if not 1 <= args.devices <= 16 or not 1 <= args.size <= 2048 or args.size % args.devices:
        parser.error("use 1–16 devices and a matrix size of 1–2048 divisible by the device count")
    if args.backend == "numpy" and args.devices != 1:
        parser.error("the NumPy baseline uses one host")
    try:
        print(json.dumps(run(args.backend, args.devices, args.size)))
    except (ImportError, RuntimeError, ValueError) as error:
        parser.exit(1, f"Benchmark failed: {error}\n")
