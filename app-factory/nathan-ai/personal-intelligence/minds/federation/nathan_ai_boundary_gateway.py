"""Nathan AI core adapter: do not compute dates, endpoints or counts here.

Forward typed requests to the isolated Fencepost Error Syndrome workers.
There is intentionally no arithmetic fallback or external patch execution.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

WORKER_FILE = Path(__file__).resolve().parent / "fencepost-error-syndrome" / "boundary_engine.py"


def dispatch_boundary_request(payload):
    spec = importlib.util.spec_from_file_location("nathan_one_boundary_workers", WORKER_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError("Boundary worker unavailable: fail closed; no core arithmetic fallback")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.execute(payload)
