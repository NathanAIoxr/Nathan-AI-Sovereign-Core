"""Nathan AI SovereignUnit: local deterministic micro-engine.

No deception inference, network calls, mutable clear side effects or clinical claims.
A status of 1 means the particular structural check passed or a human review
was recorded with a source; it does NOT establish truth or innocence.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Mapping

RETAIN = 1
HOLD = 0
CLEAR_CONFIRMATION = "CLEAR_LOCAL_ATTRIBUTES"


@dataclass(frozen=True)
class Inspection:
    forward: str
    backward: str
    restored: str
    structural_gate: int
    review_gate: int
    reference: str | None
    review_status: str
    note: str = (
        "Round-trip equivalence does not prove truth, detect a lie, "
        "validate consent, or establish innocence."
    )


class SovereignUnit:
    """Minimal ports-and-adapters friendly packet processor."""

    def __init__(self, raw_attributes: Mapping[str, Any]):
        if not isinstance(raw_attributes, Mapping):
            raise TypeError("raw_attributes must be a mapping")
        self._attributes = dict(raw_attributes)
        self.firewall_active = True

    @property
    def attributes(self) -> dict[str, Any]:
        """Defensive copy; never expose internal mutable state."""
        return dict(self._attributes)

    @staticmethod
    def build(a: int, b: int) -> int:
        if type(a) is not int or type(b) is not int:
            raise TypeError("whole integer operands required")
        return a + b

    @staticmethod
    def clear(a: int, b: int) -> int:
        if type(a) is not int or type(b) is not int:
            raise TypeError("whole integer operands required")
        return a - b

    def process_dual_axis(
        self,
        data_packet: str,
        *,
        reference: str | None = None,
        review_status: str = "unreviewed",
    ) -> Inspection:
        if not isinstance(data_packet, str):
            raise TypeError("data_packet must be text")
        if len(data_packet) > 10000:
            raise ValueError("data_packet too long")
        if review_status not in {"unreviewed", "supported", "contradicted", "mixed"}:
            raise ValueError("invalid review_status")
        if reference is not None and not isinstance(reference, str):
            raise TypeError("reference must be text or None")
        forward = data_packet
        # Unicode code-point reversal is intentionally a structural demonstration.
        # Complex grapheme cluster reversal is handled by the browser JS module.
        backward = forward[::-1]
        restored = backward[::-1]
        structural_gate = RETAIN if restored == forward else HOLD
        reviewed = bool(reference and reference.strip()) and review_status == "supported"
        return Inspection(
            forward=forward,
            backward=backward,
            restored=restored,
            structural_gate=structural_gate,
            review_gate=RETAIN if reviewed else HOLD,
            reference=reference.strip() if reference else None,
            review_status=review_status,
        )

    def execute_absolute_clearing(self, confirmation: str) -> "SovereignUnit":
        """Return a new empty unit only on exact, explicit confirmation.

        The source unit and caller-owned dictionary are never altered.
        """
        if confirmation != CLEAR_CONFIRMATION:
            raise PermissionError("Explicit local clearing confirmation required")
        return SovereignUnit({})


__all__ = [
    "RETAIN", "HOLD", "CLEAR_CONFIRMATION", "Inspection", "SovereignUnit"
]
