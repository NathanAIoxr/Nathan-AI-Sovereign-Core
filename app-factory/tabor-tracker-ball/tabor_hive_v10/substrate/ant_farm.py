"""Concurrent trail, vertical, and counter-spin state in the local model."""
import asyncio

from core.hive_bus import HiveBus, HivePacket


class AntFarm:
    def __init__(self, bus: HiveBus, surface_target: str):
        self.bus, self.surface_target = bus, surface_target
        self.forward = self.reverse = self.vertical = self.left = self.right = 0
        self.vertical_active = True
        self.bus.subscribe("ANT_FARM", self.on_command)

    async def on_command(self, packet: HivePacket) -> None:
        if packet.source == "HIVE_CORE" and packet.action == "REORIENT_SUBSTRATE":
            self.vertical_active = packet.payload.get("vertical") is True

    def step(self) -> dict:
        self.forward += 1
        self.reverse -= 1
        if self.vertical_active:
            self.vertical += 1
        self.left -= 1
        self.right += 1
        return {"normal": self.forward, "reverse": self.reverse, "vertical": self.vertical,
                "left": self.left, "right": self.right, "netSpin": self.left + self.right}

    async def run(self) -> None:
        while True:
            self.bus.publish(HivePacket(7, "ANT_FARM", self.surface_target, "RENDER_STATE", {"antFarm": self.step()}))
            await asyncio.sleep(0.25)
