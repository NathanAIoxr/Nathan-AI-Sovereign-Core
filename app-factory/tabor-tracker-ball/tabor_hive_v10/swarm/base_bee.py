"""Unambiguous worker IDs drawn at need from the shared fleet manifest."""
from dataclasses import dataclass
from itertools import repeat
import json
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[2] / "public"


@dataclass(frozen=True)
class Fleet:
    configured_workers: int
    workers_per_hive: int
    configured_hives: int

    @classmethod
    def load(cls):
        data = json.loads((PUBLIC / "hive-population.json").read_text(encoding="utf-8"))
        return cls(data["configuredWorkers"], data["referenceWorkersPerHive"], data["configuredHives"])

    def verify_total(self) -> bool:
        return sum(repeat(self.workers_per_hive, self.configured_hives)) == self.configured_workers

    def address(self, hive: int, slot: int) -> str:
        if type(hive) is not int or not 1 <= hive <= self.configured_hives:
            raise ValueError("Hive is outside the configured fleet")
        if type(slot) is not int or not 1 <= slot <= self.workers_per_hive:
            raise ValueError("Worker is outside this hive")
        return f"H{hive:07d}-B{slot:05d}"


@dataclass(frozen=True)
class BaseBee:
    """The role is an assignment. The address identifies this worker."""
    address: str
    role: str
