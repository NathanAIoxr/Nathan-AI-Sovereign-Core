"""Loopback-only HTTP and receive-only WebSocket stream for local render state."""
import asyncio
import base64
import binascii
import hashlib
import json

from core.hive_bus import HiveBus, HivePacket

HTML = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Tabor Hive v.10 · Local Runtime</title>
<style>
body{margin:20px;background:#151914;color:#edece0;font:1rem system-ui}
main{display:grid;grid-template-rows:minmax(160px,45fr) minmax(40px,10fr) minmax(160px,45fr);gap:8px}
section{background:#21291e;padding:14px;border-radius:8px;overflow:auto}
pre{white-space:pre-wrap}
</style>
<h1>Tabor Hive v.10</h1><main>
<section><h2>Cartridge and Track Baller state</h2><pre id="upper"></pre></section>
<section aria-live="polite" id="bridge">Connecting to local Hive…</section>
<section><h2>Ant Farm</h2><pre id="lower"></pre></section></main>
<script>
const get = id => document.getElementById(id);
const socket = new WebSocket("ws://" + location.host + "/ws");
socket.onmessage = e => {
  const {antFarm, fleet, ...upper} = JSON.parse(e.data);
  get("upper").textContent = JSON.stringify(upper, null, 2);
  get("bridge").textContent = fleet.configuredWorkers.toLocaleString() + " worker addresses · " +
    fleet.represented + " represented in this local session";
  get("lower").textContent = JSON.stringify(antFarm, null, 2);
};
socket.onclose = () => { get("bridge").textContent = "Local Hive disconnected"; };
</script>"""

GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def frame(data: bytes) -> bytes:
    size = len(data)
    if size < 126:
        return bytes((129, size)) + data
    if size < 65536:
        return bytes((129, 126)) + size.to_bytes(2, "big") + data
    return bytes((129, 127)) + size.to_bytes(8, "big") + data


class Surface:
    def __init__(self, bus: HiveBus, worker_address: str, fleet_state):
        self.state: dict = {}
        self.fleet_state = fleet_state
        bus.subscribe(worker_address, self.receive)

    async def receive(self, packet: HivePacket) -> None:
        if packet.action == "RENDER_STATE":
            self.state.update(packet.payload)

    def snapshot(self) -> dict:
        return {**self.state, "fleet": self.fleet_state()}

    async def serve(self, port: int):
        return await asyncio.start_server(self.handle, "127.0.0.1", port, limit=8192)

    async def handle(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            request = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 3)
            first, *lines = request.decode("ascii").strip().split("\r\n")
            method, path, version = first.split(" ")
            headers = {}
            for line in lines:
                name, value = line.split(":", 1)
                headers[name.lower()] = value.strip()
            port = writer.get_extra_info("sockname")[1]
            host = f"127.0.0.1:{port}"
            if method != "GET" or headers.get("host") != host or version != "HTTP/1.1":
                await self.http(writer, "400 Bad Request", "text/plain", b"Invalid loopback request")
            elif path == "/":
                await self.http(writer, "200 OK", "text/html; charset=utf-8", HTML.encode())
            elif path == "/ws":
                await self.stream(reader, writer, headers, host)
            else:
                await self.http(writer, "404 Not Found", "text/plain", b"Not found")
        except (asyncio.IncompleteReadError, asyncio.LimitOverrunError, TimeoutError, ValueError, OSError):
            pass
        finally:
            writer.close()
            try:
                await writer.wait_closed()
            except OSError:
                pass

    @staticmethod
    async def http(writer, status, content_type, body):
        writer.write((f"HTTP/1.1 {status}\r\nContent-Type: {content_type}\r\nContent-Length: {len(body)}\r\n"
                      "Connection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n\r\n").encode() + body)
        await writer.drain()

    async def stream(self, reader, writer, headers, host):
        key = headers.get("sec-websocket-key", "")
        try:
            valid_key = len(base64.b64decode(key, validate=True)) == 16
        except (binascii.Error, ValueError):
            valid_key = False
        connection = {item.strip() for item in headers.get("connection", "").lower().split(",")}
        if (headers.get("origin") != f"http://{host}" or headers.get("upgrade", "").lower() != "websocket"
                or "upgrade" not in connection or headers.get("sec-websocket-version") != "13" or not valid_key):
            await self.http(writer, "403 Forbidden", "text/plain", b"Local render stream requires a same-origin browser")
            return
        acceptance = base64.b64encode(hashlib.sha1((key + GUID).encode()).digest()).decode()
        writer.write(("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                      f"Sec-WebSocket-Accept: {acceptance}\r\n\r\n").encode())
        while True:
            writer.write(frame(json.dumps(self.snapshot()).encode()))
            await asyncio.wait_for(writer.drain(), 3)
            try:
                await asyncio.wait_for(reader.read(1), 0.5)
                return
            except TimeoutError:
                continue
