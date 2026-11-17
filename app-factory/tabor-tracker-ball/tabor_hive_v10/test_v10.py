import asyncio
from contextlib import suppress
import json
import unittest

from core.hive_bus import HiveBus, HivePacket
from core.hive_core import NathanAIHive
from main import boot
from surface.dual_screen_ui import Surface
from swarm.base_bee import Fleet
from swarm.domain_bees import BeeDirectory, ROLES


class FleetTests(unittest.TestCase):
    def test_range_and_distinct_workers_sharing_a_role(self):
        fleet = Fleet.load()
        self.assertTrue(fleet.verify_total())
        self.assertEqual(len(ROLES), 21)
        self.assertEqual(fleet.configured_workers, 126_000_000_000)
        self.assertEqual(fleet.address(1, 1), "H0000001-B00001")
        self.assertEqual(fleet.address(2_520_000, 50_000), "H2520000-B50000")
        directory = BeeDirectory(fleet)
        first = directory.register(1, 1, "Hardware")
        last = directory.register(2_520_000, 50_000, "Hardware")
        self.assertNotEqual(first.address, last.address)
        self.assertIs(directory.register(1, 1, "Hardware"), first)
        self.assertEqual(len(directory.represented), 2)
        for hive, slot in [(0, 1), (1, 0), (2_520_001, 1), (1, 50_001), (True, 1)]:
            with self.assertRaises(ValueError):
                fleet.address(hive, slot)


class RuntimeTests(unittest.IsolatedAsyncioTestCase):
    async def test_local_boot_uses_the_requested_address_and_real_catalog(self):
        for hive, slot, expected in [(1, 2, "H0000001-B00002"), (2_520_000, 50_000, "H2520000-B50000")]:
            result = await boot(101, hive, slot)
            self.assertEqual(result["id"], 101)
            self.assertIn("Knowledge Vault", result["title"])
            self.assertEqual(result["fleet"]["selectedAddress"], expected)
            self.assertEqual(result["fleet"]["libraryWorkerAddress"], expected)
            self.assertEqual(result["fleet"]["represented"], 5)
            self.assertEqual(result["antFarm"]["netSpin"], 0)
            self.assertEqual(result["antFarm"]["vertical"], 1)

    async def test_priority_fifo_and_one_use_vault_authorization(self):
        bus = HiveBus()
        hive = NathanAIHive(bus, "memory", "shadow")
        events = []

        async def log(packet):
            events.append(packet.action)

        bus.subscribe("log", log)
        for priority, action in ((9, "later"), (1, "first"), (1, "second")):
            bus.publish(HivePacket(priority, "source", "log", action))
        bus.publish(HivePacket(2, "HIVE_CORE", "memory", "COMMIT_VAULT_Z101", {"authorized": True}))
        with self.assertRaises(PermissionError):
            hive.authorize_vault_write({"value": 0}, operator_approved=False)
        hive.authorize_vault_write({"value": 1}, operator_approved=True)
        replayed = False

        async def replay_once(packet):
            nonlocal replayed
            if packet.payload.get("permit") and not replayed:
                replayed = True
                bus.publish(packet)

        bus.subscribe("memory", replay_once)
        dispatcher = asyncio.create_task(bus.dispatch())
        try:
            await asyncio.wait_for(bus.queue.join(), 1)
            self.assertEqual(events, ["first", "second", "later"])
            self.assertEqual(hive.vault, [{"value": 1}])
            self.assertEqual(len(hive.alerts), 2)
            self.assertFalse(bus.errors)
        finally:
            dispatcher.cancel()
            with suppress(asyncio.CancelledError):
                await dispatcher

    async def test_read_only_websocket_stream_and_origin_check(self):
        surface = Surface(HiveBus(), "surface", lambda: {"configuredWorkers": 126_000_000_000})
        async with await surface.serve(0) as server:
            port = server.sockets[0].getsockname()[1]
            host = f"127.0.0.1:{port}"
            headers = ("GET /ws HTTP/1.1\r\nHost: " + host + "\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                       "Sec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nOrigin: ")

            async def connect(origin):
                reader, writer = await asyncio.open_connection("127.0.0.1", port)
                writer.write((headers + origin + "\r\n\r\n").encode())
                await writer.drain()
                return reader, writer, await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 2)

            _, writer, response = await connect("http://different.example")
            self.assertIn(b"403 Forbidden", response)
            writer.close()
            await writer.wait_closed()
            reader, writer, response = await connect("http://" + host)
            try:
                self.assertIn(b"101 Switching Protocols", response)
                self.assertIn(b"s3pPLMBiTxaQ9kYGzzhZRbK+xOo=", response)
                first, size = await asyncio.wait_for(reader.readexactly(2), 2)
                self.assertEqual(first, 129)
                payload = json.loads(await asyncio.wait_for(reader.readexactly(size), 2))
                self.assertEqual(payload["fleet"]["configuredWorkers"], 126_000_000_000)
            finally:
                writer.close()
                await writer.wait_closed()
