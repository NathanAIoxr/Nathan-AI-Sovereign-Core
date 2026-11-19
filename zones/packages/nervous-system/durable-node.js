import { DurableObject } from 'cloudflare:workers';

export class SovereignNode extends DurableObject {
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (request.method === 'GET' && pathname === '/socket' &&
        request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].send(JSON.stringify({ connected: true }));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (request.method !== 'POST' || !['/claim', '/release'].includes(pathname)) {
      return new Response(null, { status: 404 });
    }
    const { key, seconds, token } = await request.json();
    if (typeof key !== 'string' || !/^[a-z0-9-]{1,80}$/.test(key)) {
      return Response.json({ error: 'Invalid lock name' }, { status: 400 });
    }
    const storage = this.ctx.storage;
    const id = 'lock:' + key;
    const result = await storage.transaction(async txn => {
      const lock = await txn.get(id);
      const now = Date.now();
      if (pathname === '/release') {
        if (!lock || lock.expiresAt <= now || lock.token !== token) return null;
        await txn.delete(id);
        return { released: true };
      }
      if (lock && lock.expiresAt > now) return null;
      const lifetime = Number.isInteger(seconds) ? Math.min(300, Math.max(1, seconds)) : 30;
      const next = { token: crypto.randomUUID(), expiresAt: now + lifetime * 1000 };
      await txn.put(id, next);
      return next;
    });
    if (!result) return Response.json({ error: 'Lock unavailable' }, { status: 409 });
    for (const socket of this.ctx.getWebSockets()) {
      try { socket.send(JSON.stringify({ event: pathname.slice(1) })); } catch {}
    }
    return Response.json(result);
  }

  webSocketMessage(socket, message) {
    if (message === 'ping') socket.send('pong');
  }
}
