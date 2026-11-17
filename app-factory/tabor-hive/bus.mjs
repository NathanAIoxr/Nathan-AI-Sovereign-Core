import {bees, priorities, prioritiesByType} from "./registry.mjs";

const eventId = /^[\w.-]{1,96}$/;
const domains = /^[a-z][a-z0-9-]{1,47}$/;
const gestureTypes = new Set(["tap", "hold", "flick", "swipe", "swirl", "wheel", "pinch", "tilt", "snap",
  "trace", "orbit", "dial", "line", "arc", "spiral", "circle", "grip", "gesture", "release"]);
const surfaces = new Set(["library", "arcade", "track-baller", "circuit"]);
const deviceStates = new Set(["ready", "degraded", "offline"]);
const boundaryCodes = new Set(["contradiction", "authorship", "consent", "data-boundary"]);
const safeInteger = (v, upper, lower = 0) => Number.isInteger(v) && v >= lower && v <= upper;
const inRange = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
const quaternion = v => Array.isArray(v) && v.length === 4 && v.every(n => inRange(n, -1, 1)) &&
  Math.abs(Math.hypot(...v) - 1) < .01;
const rule = (required, optional = {}) => ({required, optional});
const moduleId = n => safeInteger(n, 101, 1);
const shapes = Object.freeze({
  "module.open": rule({module: moduleId, surface: x => surfaces.has(x)}),
  "module.complete": rule({module: moduleId}),
  "interaction.summary": rule({surface: x => surfaces.has(x), kind: x => gestureTypes.has(x)},
    {module: moduleId, orientation: quaternion, field: x => inRange(x, 0, 20), successes: x => safeInteger(x, 100)}),
  "bridge.clear": rule({attempts: x => safeInteger(x, 100), shield: x => safeInteger(x, 1000),
    attack: x => safeInteger(x, 1000), charge: x => safeInteger(x, 1000)}),
  "device.status": rule({device: x => typeof x === "string" && eventId.test(x), status: x => deviceStates.has(x)}),
  "boundary.report": rule({code: x => boundaryCodes.has(x)}),
  "worker.heartbeat": rule({worker: x => typeof x === "string" && domains.test(x)}),
  "worker.request": rule({domain: x => typeof x === "string" && Object.hasOwn(bees, x),
    task: x => typeof x === "string" && domains.test(x), ttl: x => safeInteger(x, 900_000, 1_000)}),
});

function exactShape(value, {required, optional}) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.entries(required).every(([key, check]) => Object.hasOwn(value, key) && check(value[key])) &&
    Object.entries(value).every(([key, field]) => Object.hasOwn(required, key) ||
      Object.hasOwn(optional, key) && optional[key](field));
}

export function makeEvent(source, type, payload, clock = Date.now) {
  return {version: 1, id: crypto.randomUUID(), at: clock(), source, type,
    priority: prioritiesByType[type], payload};
}

export function validateEvent(message, now = Date.now()) {
  const messageShape = rule({
    version: v => v === 1, id: v => typeof v === "string" && eventId.test(v),
    at: v => Number.isSafeInteger(v) && Math.abs(now - v) <= 120_000,
    source: v => v === "surface" || v === "hive" || typeof v === "string" && domains.test(v),
    type: v => typeof v === "string" && Object.hasOwn(shapes, v),
    priority: v => typeof v === "string" && Object.hasOwn(priorities, v), payload: () => true,
  });
  if (!exactShape(message, messageShape) || message.priority !== prioritiesByType[message.type] ||
      !exactShape(message.payload, shapes[message.type])) throw new TypeError("Invalid Hive Bus event.");
  return message;
}

const text = new TextEncoder(), decoder = new TextDecoder("utf-8", {fatal: true});
const bytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
const base64 = value => btoa(String.fromCharCode(...value));
export async function busKey(secret) {
  const raw = bytes(secret);
  if (raw.length !== 32) throw new Error("Hive Bus requires a 256-bit key.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function packetParams(iv, identity, direction) {
  return {name: "AES-GCM", iv, additionalData: text.encode("tabor-hive-v9:" + direction + ":" + identity)};
}

export async function sealPacket(value, key, identity, direction) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = text.encode(JSON.stringify(value));
  if (payload.length > 4096) throw new RangeError("Hive Bus payload exceeds 4 KiB.");
  const ciphertext = await crypto.subtle.encrypt(packetParams(iv, identity, direction), key, payload);
  return {version: 1, iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext))};
}

export async function openPacket(packet, key, identity, direction) {
  if (packet?.version !== 1 || typeof packet.iv !== "string" ||
      typeof packet.ciphertext !== "string" || packet.iv.length !== 16 || packet.ciphertext.length > 5500) {
    throw new TypeError("Invalid Hive Bus envelope.");
  }
  const iv = bytes(packet.iv), encrypted = bytes(packet.ciphertext);
  const plaintext = await crypto.subtle.decrypt(packetParams(iv, identity, direction), key, encrypted);
  return JSON.parse(decoder.decode(plaintext));
}
