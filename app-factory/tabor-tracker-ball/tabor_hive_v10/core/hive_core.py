"""Coordinator with explicit, one-use approval for local sample vault writes."""
from copy import deepcopy
from dataclasses import dataclass, field

from core.hive_bus import HiveBus, HivePacket


@dataclass
class NathanAIHive:
    bus: HiveBus
    memory_target: str
    shadow_target: str
    voices: list[tuple[str, str]] = field(default_factory=list)
    alerts: list[str] = field(default_factory=list)
    vault: list[dict] = field(default_factory=list)
    _permits: dict[object, dict] = field(default_factory=dict, init=False, repr=False)

    AUTHORIZED_VOICES = frozenset(("NATHAN_AI", "PK", "GRAPE_APPLE_CURATOR"))

    def __post_init__(self):
        self.bus.subscribe("HIVE_CORE", self.on_report)
        self.bus.subscribe(self.memory_target, self.on_memory)
        self.bus.subscribe(self.shadow_target, self.on_shadow)

    async def on_report(self, packet: HivePacket) -> None:
        voice = packet.payload.get("voice")
        if packet.action == "VOICE_UTTERANCE" and voice in self.AUTHORIZED_VOICES and packet.source == voice:
            self.voices.append((voice, str(packet.payload.get("text", ""))))
        elif packet.action == "INTEGRITY_ALERT" and packet.source == self.shadow_target:
            self.alerts.append(str(packet.payload["reason"]))
            self.bus.publish(HivePacket(1, "HIVE_CORE", "ANT_FARM", "REORIENT_SUBSTRATE", {"vertical": True, "spin": "dual"}))

    def authorize_vault_write(self, record: dict, *, operator_approved: bool) -> None:
        if operator_approved is not True:
            raise PermissionError("Operator approval is required")
        permit = object()
        self._permits[permit] = deepcopy(record)
        try:
            self.bus.publish(HivePacket(2, "HIVE_CORE", self.memory_target, "COMMIT_VAULT_Z101", {"permit": permit}))
        except Exception:
            self._permits.pop(permit)
            raise

    async def on_memory(self, packet: HivePacket) -> None:
        if packet.action != "COMMIT_VAULT_Z101":
            return
        permit = packet.payload.get("permit")
        if packet.source == "HIVE_CORE" and type(permit) is object and permit in self._permits:
            self.vault.append(self._permits.pop(permit))
            return
        self.bus.publish(HivePacket(1, self.memory_target, self.shadow_target, "AUDIT_DENIAL", {
            "reason": "A sample vault write lacked a valid one-use permit."
        }))

    async def on_shadow(self, packet: HivePacket) -> None:
        if packet.source == self.memory_target and packet.action == "AUDIT_DENIAL":
            self.bus.publish(HivePacket(1, self.shadow_target, "HIVE_CORE", "INTEGRITY_ALERT", packet.payload))
