import { DurableObject } from "cloudflare:workers";
import { endpoint, json } from "./shared.mjs";

export class Room extends DurableObject {
  async fetch(request) {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") return json({ error: "websocket_required" }, 426);
    if (this.ctx.getWebSockets().length >= 50) return json({ error: "room_full" }, 429);
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  webSocketMessage(socket, message) {
    if (typeof message !== "string" || new TextEncoder().encode(message).length > 2048 || !message.trim()) {
      socket.close(1008, "Invalid message");
      return;
    }
    const now = Date.now();
    const previous = socket.deserializeAttachment();
    if (previous && now - previous < 300) {
      socket.close(1008, "Message rate exceeded");
      return;
    }
    socket.serializeAttachment(now);
    const payload = JSON.stringify({ text: message, timestamp: now });
    for (const client of this.ctx.getWebSockets()) {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
  }
}

export default endpoint(86, (request, url, env) => {
  const room = /^\/rooms\/([a-z0-9-]{1,48})$/.exec(url.pathname);
  if (request.method === "GET" && room) return env.ROOMS.getByName(room[1]).fetch(request);
});
