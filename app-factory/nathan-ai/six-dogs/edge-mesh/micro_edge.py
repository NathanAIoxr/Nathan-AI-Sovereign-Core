"""Nathan AI: Six Dogs MICRO edge engine, dependency-free local processing.

KNICK: opt-in local text staging (not hardware interrupts)
KNACK: deterministic per-tensor symmetric INT4/INT8 quantization with packed bytes
PADDY: explicit software batching delay (not thermal feedback or NPU control)

No model weights or cloud APIs are bundled. No personal text is printed.
"""
from __future__ import annotations

from dataclasses import dataclass
import math
import time
from typing import Callable, Iterable, Sequence

MAX_TOKEN_CHARS = 10_000
MAX_BUFFER = 128
MAX_TENSOR_ITEMS = 1_000_000
MAX_BATCH = 1000


@dataclass(frozen=True)
class QuantizedTensor:
    """Quantized numeric tensor; INT4 uses two signed nibbles per byte."""
    bits: int
    shape: tuple[int, int]
    scale: float
    packed: bytes

    @property
    def storage_bytes(self) -> int:
        return len(self.packed)

    @property
    def items(self) -> int:
        return self.shape[0] * self.shape[1]

    def integers(self) -> tuple[int, ...]:
        n = self.items
        if self.bits == 4:
            if len(self.packed) != (n + 1) // 2:
                raise ValueError("INT4 storage size mismatch")
            values = []
            for byte in self.packed:
                for shift in (0, 4):
                    nibble = (byte >> shift) & 0xF
                    values.append(nibble if nibble < 8 else nibble - 16)
            return tuple(values[:n])
        if self.bits == 8:
            if len(self.packed) != n:
                raise ValueError("INT8 storage size mismatch")
            return tuple(byte if byte < 128 else byte - 256 for byte in self.packed)
        raise ValueError("Unsupported bit width")

    def dequantize(self) -> list[list[float]]:
        if not math.isfinite(self.scale) or self.scale <= 0:
            raise ValueError("Invalid quantization scale")
        flat = [v * self.scale for v in self.integers()]
        cols = self.shape[1]
        return [flat[i:i + cols] for i in range(0, len(flat), cols)]


def _rectangular_matrix(block: object) -> tuple[list[float], tuple[int, int]]:
    # NumPy arrays are supported through their public tolist() method, but not required.
    if not isinstance(block, (list, tuple)) and callable(getattr(block, "tolist", None)):
        block = block.tolist()
    if not isinstance(block, (list, tuple)) or not block:
        raise ValueError("Expected nonempty 2D numeric matrix")
    flat: list[float] = []
    columns = None
    for row in block:
        if not isinstance(row, (list, tuple)) or not row:
            raise ValueError("Every row must be nonempty")
        if columns is None:
            columns = len(row)
        elif len(row) != columns:
            raise ValueError("Ragged tensor is not supported")
        if len(flat) + len(row) > MAX_TENSOR_ITEMS:
            raise ValueError("Tensor exceeds maximum number of values")
        for value in row:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise TypeError("Matrix values must be real numbers")
            number = float(value)
            if not math.isfinite(number):
                raise ValueError("NaN or infinity not allowed")
            flat.append(number)
    return flat, (len(block), int(columns))


def quantize(block: object, precision: str = "INT4") -> QuantizedTensor:
    """Per-tensor symmetric quantization; stores quantized values, not the input.

    INT4 values are symmetric [-7,7] packed into 4-bit two's-complement nibbles;
    INT8 values use signed [-127,127] bytes. Scale is needed to reconstruct.
    This is numeric array quantization, NOT full model conversion.
    """
    if precision not in ("INT4", "INT8"):
        raise ValueError("Precision must be INT4 or INT8")
    flat, shape = _rectangular_matrix(block)
    bits = 4 if precision == "INT4" else 8
    limit = 7 if bits == 4 else 127
    largest = max(abs(value) for value in flat)
    scale = largest / limit if largest else 1.0
    values = [max(-limit, min(limit, int(round(v / scale)))) for v in flat]
    if bits == 8:
        packed = bytes(v & 0xFF for v in values)
    else:
        out = bytearray()
        for i in range(0, len(values), 2):
            lo = values[i] & 0x0F
            hi = values[i + 1] & 0x0F if i + 1 < len(values) else 0
            out.append(lo | (hi << 4))
        packed = bytes(out)
    return QuantizedTensor(bits=bits, shape=shape, scale=scale, packed=packed)


class MicroEdgeEngine:
    """Local, explicitly invoked stage processor. No runtime hooks or API calls."""

    def __init__(
        self,
        node_id: str,
        precision: str = "INT4",
        *,
        sleep_fn: Callable[[float], None] = time.sleep,
    ) -> None:
        if not isinstance(node_id, str) or not (1 <= len(node_id) <= 80):
            raise ValueError("node_id must be 1..80 characters")
        if precision not in ("INT4", "INT8"):
            raise ValueError("Precision must be INT4 or INT8")
        self.node_id = node_id
        self.precision = precision
        self.memory_buffer: list[str] = []
        self.is_active = True
        self._sleep = sleep_fn

    def step_1_knick(self, raw_streaming_token: str) -> bool:
        """Stage a local token; bounded buffer; no logging its contents."""
        if not self.is_active:
            raise RuntimeError("Edge node is inactive")
        if not isinstance(raw_streaming_token, str):
            raise TypeError("Token must be text")
        if len(raw_streaming_token) > MAX_TOKEN_CHARS:
            raise ValueError("Token too large")
        sanitized_token = raw_streaming_token.strip()
        if not sanitized_token:
            return False
        if len(self.memory_buffer) >= MAX_BUFFER:
            raise BufferError("Local buffer is full; explicit drain required")
        self.memory_buffer.append(sanitized_token)
        return True

    def drain_tokens(self) -> tuple[str, ...]:
        """Explicitly take and clear the in-memory buffer."""
        data = tuple(self.memory_buffer)
        self.memory_buffer.clear()
        return data

    def step_2_knack(self, tensor_block: object) -> QuantizedTensor:
        if not self.is_active:
            raise RuntimeError("Edge node is inactive")
        return quantize(tensor_block, self.precision)

    def step_3_paddy(
        self, batch_queue: Sequence[object], *, interval_s: float = 0.01
    ) -> list[dict[str, object]]:
        """Software-level timing only. No thermal telemetry or NPU control."""
        if not self.is_active:
            raise RuntimeError("Edge node is inactive")
        if not isinstance(batch_queue, (list, tuple)) or len(batch_queue) > MAX_BATCH:
            raise ValueError("Batch queue must be bounded list or tuple")
        if not isinstance(interval_s, (int, float)) or not (0 <= interval_s <= 0.5):
            raise ValueError("Pacing must be between 0 and 0.5 seconds")
        result = []
        for index, item in enumerate(batch_queue):
            self._sleep(float(interval_s))
            result.append({"batch": index, "payload": item})
        return result
