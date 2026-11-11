"""meSPARK memory matrix: generic, dependency-free core."""
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4
import json

@dataclass
class DataNode:
    name: str
    attributes: dict
    latitude: float | None = None
    longitude: float | None = None
    evidence_class: str = "personal-memory"
    source: str | None = None
    node_id: str = field(default_factory=lambda: str(uuid4()))
    created: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def __post_init__(self):
        if self.latitude is not None and not -90 <= self.latitude <= 90:
            raise ValueError("Latitude out of range")
        if self.longitude is not None and not -180 <= self.longitude <= 180:
            raise ValueError("Longitude out of range")
        if self.evidence_class not in {"personal-memory", "documented", "hypothesis", "analogy", "fiction"}:
            raise ValueError("Invalid evidence class")

class MemoryMatrixEngine:
    def __init__(self):
        self.nodes: dict[str, DataNode] = {}
        self.shared_total = Decimal("0")

    def add_anchor(self, name, attributes, latitude=None, longitude=None, evidence_class="personal-memory", source=None):
        node = DataNode(name, attributes, latitude, longitude, evidence_class, source)
        self.nodes[node.node_id] = node
        return node

    def split(self, value, percent=20):
        amount = Decimal(str(value))
        pct = Decimal(str(percent))
        if amount < 0 or not 0 <= pct <= 100:
            raise ValueError("Invalid value or percent")
        shared = (amount * pct / 100).quantize(Decimal(".01"), rounding=ROUND_HALF_UP)
        retained = amount - shared
        self.shared_total += shared
        return {"retained": str(retained), "shared": str(shared)}

    def phonetic_text_filter(self, raw_text):
        words = raw_text.split()
        return {"linear": words, "character_reversals": [w[::-1] for w in words],
                "note": "Spelling reversal is not phonetic analysis."}

    def export_json(self):
        return json.dumps({"schema": "mespark-python-v1", "nodes": [asdict(n) for n in self.nodes.values()]}, indent=2)

    def missing_sources(self):
        return [n.node_id for n in self.nodes.values() if n.evidence_class == "documented" and not n.source]
