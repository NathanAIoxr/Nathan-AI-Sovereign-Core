"""Bounded in-process message routing for the local Hive runtime."""
import asyncio
from dataclasses import dataclass, field
from itertools import count
from typing import Awaitable, Callable


@dataclass(frozen=True)
class HivePacket:
    priority: int
    source: str
    target: str
    action: str
    payload: dict = field(default_factory=dict)


Handler = Callable[[HivePacket], Awaitable[None]]


class HiveBus:
    def __init__(self, pending_limit: int = 256):
        self.queue = asyncio.PriorityQueue(maxsize=pending_limit)
        self.sequence = count()
        self.routes: dict[str, list[Handler]] = {}
        self.errors: list[tuple[HivePacket, Exception]] = []

    def subscribe(self, target: str, handler: Handler) -> None:
        handlers = self.routes.setdefault(target, [])
        if handler not in handlers:
            handlers.append(handler)

    def publish(self, packet: HivePacket) -> None:
        self.queue.put_nowait((packet.priority, next(self.sequence), packet))

    async def dispatch(self) -> None:
        while True:
            _, _, packet = await self.queue.get()
            targets = self.routes.get(packet.target, ())
            try:
                for handler in targets:
                    try:
                        await handler(packet)
                    except Exception as error:
                        self.errors.append((packet, error))
            finally:
                self.queue.task_done()
