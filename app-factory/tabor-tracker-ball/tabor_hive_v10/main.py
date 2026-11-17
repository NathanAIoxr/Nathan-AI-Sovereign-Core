"""Tabor Hive v.10 demo. Run with Python, without API tokens."""
import argparse
import asyncio
import json

from core.hive_bus import HiveBus, HivePacket
from core.hive_core import NathanAIHive
from substrate.ant_farm import AntFarm
from surface.dual_screen_ui import Surface
from swarm.base_bee import Fleet
from swarm.domain_bees import BeeDirectory, LibraryBee, PhysicsBee


async def boot(cartridge: int, remote_hive: int, remote_slot: int, port: int | None = None):
    fleet = Fleet.load()
    if not fleet.verify_total():
        raise ValueError("Fleet manifest totals do not reconcile")
    directory = BeeDirectory(fleet)
    library = directory.register(remote_hive, remote_slot, "Library")
    spare = (slot for slot in range(1, 6) if fleet.address(1, slot) != library.address)
    addresses = {role: directory.register(1, next(spare), role).address
                 for role in ("Physics", "Memory", "Shadow", "Interface")}

    bus = HiveBus()
    hive = NathanAIHive(bus, addresses["Memory"], addresses["Shadow"])
    ant_farm = AntFarm(bus, addresses["Interface"])
    surface = Surface(bus, addresses["Interface"], lambda: {
        "configuredWorkers": fleet.configured_workers, "configuredHives": fleet.configured_hives,
        "referenceWorkersPerHive": fleet.workers_per_hive, "represented": len(directory.represented),
        "selectedAddress": library.address, "libraryWorkerAddress": library.address
    })
    LibraryBee(library, bus, addresses["Physics"])
    PhysicsBee(directory.represented[addresses["Physics"]], bus, addresses["Interface"])
    dispatcher = asyncio.create_task(bus.dispatch())
    ant_task = None
    try:
        bus.publish(HivePacket(2, "NATHAN_AI", "HIVE_CORE", "VOICE_UTTERANCE", {
            "voice": "NATHAN_AI", "text": "Tabor Hive v.10 local runtime."
        }))
        bus.publish(HivePacket(2, addresses["Interface"], library.address, "LOAD_CARTRIDGE", {"id": cartridge}))
        bus.publish(HivePacket(7, "ANT_FARM", addresses["Interface"], "RENDER_STATE", {"antFarm": ant_farm.step()}))
        await bus.queue.join()
        if bus.errors:
            raise RuntimeError("The local Hive could not finish its boot sequence") from bus.errors[0][1]
        surface.state["voices"] = hive.voices
        if port is None:
            return surface.snapshot()
        ant_task = asyncio.create_task(ant_farm.run())
        async with await surface.serve(port) as server:
            print(f"Tabor Hive v.10 · http://127.0.0.1:{server.sockets[0].getsockname()[1]}", flush=True)
            await server.serve_forever()
    finally:
        tasks = [dispatcher] if ant_task is None else [dispatcher, ant_task]
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cartridge", type=int, default=1)
    parser.add_argument("--hive", type=int, default=2_520_000)
    parser.add_argument("--worker", type=int, default=50_000)
    parser.add_argument("--serve", type=int, metavar="PORT")
    args = parser.parse_args()
    try:
        result = asyncio.run(boot(args.cartridge, args.hive, args.worker, args.serve))
    except KeyboardInterrupt:
        return
    except (ValueError, RuntimeError, OSError) as error:
        parser.exit(1, f"Error: {error}\n")
    if result is not None:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
