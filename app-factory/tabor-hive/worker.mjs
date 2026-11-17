import {busKey, openPacket, sealPacket} from "./bus.mjs";
import {createHive} from "./hive.mjs";
import {bees} from "./registry.mjs";
import {classes, modules} from "../tabor-tracker-ball/public/loc101-catalog.mjs";
import assets from "./asset-bundle.mjs";

const root = "/app-factory/tabor-tracker-ball/public/";
const text = new TextEncoder();
const mime = {
  html: "text/html; charset=utf-8", mjs: "text/javascript; charset=utf-8", js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8", json: "application/json; charset=utf-8", svg: "image/svg+xml",
  webmanifest: "application/manifest+json", md: "text/plain; charset=utf-8",
};
const headers = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "cache-control": "no-store",
};
const json = (value, status = 200) => Response.json(value, {status, headers});
const status = (env) => ({
  ok: true, app: "tabor-hive-v9", version: 9, cartridges: modules.length, classes: Object.keys(classes).length,
  bees: Object.keys(bees).length, technologyBees: Object.values(bees).filter(bee => bee.technology).length,
  ownerBus: Boolean(env.HIVE_STATE && validSecret(env.HIVE_OWNER_TOKEN) && validSecret(env.HIVE_BUS_KEY)),
  ant: {modes: ["forward", "reverse", "counterspin"], axes: ["linear", "vertical"]},
});

function validSecret(value) {
  return typeof value === "string" && /^[A-Za-z0-9+/]{43}=$/.test(value);
}

async function authorized(request, token) {
  const header = request.headers.get("authorization") ?? "";
  if (!validSecret(token) || !header.startsWith("Bearer ") || header.length !== 51) return false;
  const [a, b] = await Promise.all([header.slice(7), token].map(s => crypto.subtle.digest("SHA-256", text.encode(s))));
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let mismatch = 0;
  for (const [i, byte] of left.entries()) mismatch |= byte ^ right[i];
  return mismatch === 0;
}

async function readJSON(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is required.");
  const decoder = new TextDecoder("utf-8", {fatal: true});
  let size = 0, body = "";
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) throw new RangeError("Request exceeds 8 KiB.");
      body += decoder.decode(value, {stream: true});
    }
    return JSON.parse(body + decoder.decode());
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

async function workerSecret(master, id) {
  const raw = Uint8Array.from(atob(master), character => character.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", raw, {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, text.encode("tabor-bee-v9:" + id));
  return btoa(String.fromCharCode(...new Uint8Array(signed)));
}

export class HiveState {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.queue = Promise.resolve();
  }

  fetch(request) {
    const route = this.queue.then(() => this.dispatch(request));
    this.queue = route.catch(() => {});
    return route;
  }

  async dispatch(request) {
    const path = new URL(request.url).pathname;
    const isOwner = path === "/api/owner";
    if (isOwner && !await authorized(request, this.env.HIVE_OWNER_TOKEN)) return json({error: "Hive owner authorization required."}, 401);
    const sender = request.headers.get("x-tabor-bee");
    if (!isOwner && (typeof sender !== "string" || !/^[a-z][a-z0-9-]{1,47}$/.test(sender))) {
      return json({error: "Hive Bus Bee identity missing."}, 401);
    }

    const initial = await this.ctx.storage.get("hive-v9");
    const hive = createHive({modules, classes, initial});
    const owner = hive.owner;
    try {
      if (isOwner) {
        if (request.method === "GET") return json(owner.read());
        const input = await readJSON(request);
        let result;
        switch (input.action) {
          case "spawn": case "approve": {
            const lease = input.action === "spawn" ? owner.spawn(input) : owner.approve(input.id);
            result = {lease, key: await workerSecret(this.env.HIVE_BUS_KEY, lease.id)};
            break;
          }
          case "merge": result = owner.merge(input.groups); break;
          case "dissolve": owner.dissolve(input.id); break;
          case "register-device": result = owner.registerDevice(input); break;
          case "revoke-device": owner.revokeDevice(input.id); break;
          case "authorize-device": result = owner.authorizeDevice(input); break;
          case "policy": owner.policy(input); break;
          case "cast": result = owner.setCast(input); break;
          case "ant": owner.setAnt(input); break;
          default: return json({error: "Unknown Hive owner action."}, 400);
        }
        await this.ctx.storage.put("hive-v9", owner.exportState());
        return json({ok: true, result});
      }

      try { hive.worker.identity(sender); }
      catch { return json({error: "Bee lease is absent or expired."}, 401); }
      const key = await busKey(await workerSecret(this.env.HIVE_BUS_KEY, sender));
      let message;
      try { message = await openPacket(await readJSON(request), key, sender, "up"); }
      catch { return json({error: "Hive Bus packet authentication failed."}, 401); }
      const result = hive.worker.receiveBatch(Array.isArray(message) ? message : [message], sender);
      const response = await sealPacket({receipts: result}, key, sender, "down");
      await this.ctx.storage.put("hive-v9", owner.exportState());
      return json(response);
    } catch (error) {
      return json({error: error instanceof TypeError || error instanceof RangeError ? "Invalid Hive request." :
        "Hive request could not be applied."}, 400);
    }
  }
}

let arcadeHash;
async function assetResponse(request, path) {
  const content = assets[path];
  if (content === undefined) return new Response(null, {status: 404, headers});
  const suffix = path.split(".").at(-1);
  const arcade = path === "/app-factory/games/dual-screen-arcade/index.html";
  const tracker = path === root + "index.html";
  if (arcade && !arcadeHash) {
    const script = content.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
    const digest = await crypto.subtle.digest("SHA-256", text.encode(script));
    arcadeHash = " 'sha256-" + btoa(String.fromCharCode(...new Uint8Array(digest))) + "'";
  }
  const policy = "default-src 'self'; script-src 'self'" + (arcade ? arcadeHash : "") +
    "; style-src 'self'" + (arcade || tracker ? " 'unsafe-inline'" : "") +
    "; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'";
  return new Response(request.method === "HEAD" ? null : content, {
    headers: {...headers, "content-type": mime[suffix] ?? "application/octet-stream", "content-security-policy": policy},
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), path = url.pathname;
    if (path === "/api/owner" || path === "/api/bus") {
      const methods = path === "/api/owner" ? ["GET", "POST"] : ["POST"];
      if (!methods.includes(request.method)) return json({error: "Method not allowed."}, 405);
      if (!status(env).ownerBus) return json({error: "Cloud Hive Bus is awaiting owner credentials."}, 503);
      return env.HIVE_STATE.getByName("sovereign-core-v9").fetch(request);
    }
    if (!["GET", "HEAD"].includes(request.method)) return json({error: "Method not allowed."}, 405);
    if (path === "/api/status" || path === "/health") return request.method === "HEAD"
      ? new Response(null, {headers}) : json(status(env));
    if (path === "/api/catalog") return request.method === "HEAD"
      ? new Response(null, {headers}) : json({classes, modules});
    if (path === "/" || path === "/library") {
      const destination = new URL(root + "loc101.html", request.url);
      destination.search = url.search;
      return Response.redirect(destination, 302);
    }
    if (path === "/docs/record/index.html") {
      return Response.redirect("https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/docs/record/", 302);
    }
    return assetResponse(request, path);
  },
};
