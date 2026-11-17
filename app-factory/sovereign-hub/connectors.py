"""Explicit local bridge and provider interfaces. Never inspects other apps silently."""
from dataclasses import dataclass
from pathlib import Path
import hashlib
import resource
import shutil
import time
from typing import Protocol

from hub import ContractViolation, canonical, fields, local_summary


class ModelProvider(Protocol):
    def infer(self, inputs: dict) -> dict: ...


class CaptureVerifier(Protocol):
    def verify(self, artifact: bytes, attestation: dict) -> dict: ...


class ScreenMirrorProvider(Protocol):
    def connect(self, user_consent: bool) -> str: ...


@dataclass(frozen=True)
class PinnedLocalModel:
    """Explicit runtime adapter. Requires owner-supplied ONNX model and inputs.

    No model download, camera capture, or cloud fallback is performed.
    """
    model_path: Path
    sha256: str

    def infer(self, inputs):
        if self.model_path.stat().st_size>512*1024*1024:
            raise ContractViolation("model size outside limit")
        model = self.model_path.read_bytes()
        if len(model)>512*1024*1024 or hashlib.sha256(model).hexdigest()!=self.sha256:
            raise ContractViolation("model digest or size mismatch")
        if type(inputs) is not dict or len(canonical(inputs))>4_000_000:
            raise ContractViolation("bounded named tensor inputs required")
        try:
            import numpy as np
            import onnxruntime as ort
        except ImportError as exc:
            raise ContractViolation("local ONNX runtime provider is not installed") from exc
        arrays = {}
        for name,value in inputs.items():
            array = np.asarray(value)
            if array.size>1_000_000 or array.dtype.kind not in "biuf" or not np.isfinite(array).all():
                raise ContractViolation("tensor outside numeric domain")
            arrays[name]=array
        session = ort.InferenceSession(model,providers=["CPUExecutionProvider"])
        return {output.name:value.tolist() for output,value in zip(session.get_outputs(),session.run(None,arrays))}


def import_local_records(hub, principal, connector, records, batch_key):
    """Caller supplies an authorized export; each record is atomic and retryable."""
    if type(records) is not list or len(records)>1000: raise ContractViolation("import limited to 1000 records")
    results=[]
    for position,record in enumerate(records):
        fields(record,("id","value","expected"))
        results.append(hub.sync(principal,connector,record["id"],record["value"],record["expected"],f"{batch_key}:{position}"))
    return {"results":results,"atomicity":"per record; resume with same batch key and payload order"}


def local_vitals(db_path):
    """Only this process and explicitly selected storage, not all phone apps."""
    usage = resource.getrusage(resource.RUSAGE_SELF)
    free = shutil.disk_usage(Path(db_path).resolve().parent).free
    return {"process_max_rss_platform_units":usage.ru_maxrss,"storage_free_bytes":free,
            "process_cpu_microseconds":int((usage.ru_utime+usage.ru_stime)*1_000_000),
            "monotonic_ns":str(time.monotonic_ns()),"scope":"local hub process"}
