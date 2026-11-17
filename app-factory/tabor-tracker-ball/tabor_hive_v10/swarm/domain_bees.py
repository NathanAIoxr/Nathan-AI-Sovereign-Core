"""Role registry and local catalog and state handlers."""
import json
from math import isfinite

from core.hive_bus import HiveBus, HivePacket
from swarm.base_bee import PUBLIC, BaseBee, Fleet

ROLES = frozenset((
    "Queen", "Library", "Physics", "Memory", "Curriculum", "Provenance", "Index",
    "Economy", "Shadow", "Replication", "Hardware", "Firmware", "OS", "Network",
    "Security", "Sensor", "Actuator", "Storage", "Compute", "Interface", "Integration",
))


class BeeDirectory:
    def __init__(self, fleet: Fleet):
        self.fleet = fleet
        self.represented: dict[str, BaseBee] = {}

    def register(self, hive: int, slot: int, role: str) -> BaseBee:
        if role not in ROLES:
            raise ValueError("Unknown role")
        address = self.fleet.address(hive, slot)
        assigned = self.represented.get(address)
        if assigned:
            if assigned.role != role:
                raise ValueError("Worker address already has a different role")
            return assigned
        bee = BaseBee(address, role)
        self.represented[address] = bee
        return bee


class LibraryBee:
    def __init__(self, worker: BaseBee, bus: HiveBus, physics_target: str):
        self.worker, self.bus, self.physics_target = worker, bus, physics_target
        rows = json.loads((PUBLIC / "library-catalog.json").read_text(encoding="utf-8"))["cartridges"]
        self.catalog = {row["id"]: row for row in rows}
        bus.subscribe(worker.address, self.receive)

    async def receive(self, packet: HivePacket) -> None:
        if packet.action == "LOAD_CARTRIDGE":
            row = self.catalog.get(packet.payload.get("id"))
            if row is None:
                raise ValueError("Unknown cartridge ID")
            self.bus.publish(HivePacket(3, self.worker.address, self.physics_target, "INIT_PHYSICS_PARAMS", {
                "id": row["id"], "title": row["title"], "profile": row["profile"]
            }))


class PhysicsBee:
    def __init__(self, worker: BaseBee, bus: HiveBus, surface_target: str):
        self.worker, self.bus, self.surface_target = worker, bus, surface_target
        bus.subscribe(worker.address, self.receive)

    async def receive(self, packet: HivePacket) -> None:
        if packet.action == "INIT_PHYSICS_PARAMS":
            self.bus.publish(HivePacket(3, self.worker.address, self.surface_target, "RENDER_STATE", packet.payload))
        if packet.action == "SENSOR_VECTOR":
            vector = packet.payload.get("delta")
            if not isinstance(vector, (list, tuple)) or len(vector) != 3:
                raise ValueError("Sensor vector must have three coordinates")
            if any(type(value) not in (int, float) or not isfinite(value) for value in vector):
                raise ValueError("Sensor coordinates must be finite numbers")
            self.bus.publish(HivePacket(3, self.worker.address, self.surface_target, "RENDER_STATE", {"sensorVector": list(vector)}))
