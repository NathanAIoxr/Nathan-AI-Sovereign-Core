import assert from "node:assert/strict";
import test from "node:test";
import {classes, modules} from "../tabor-tracker-ball/public/loc101-catalog.mjs";
import {advanceAntFarm, configureAntFarm, createAntFarm, routeAnts} from "./ant-farm.mjs";
import {busKey, makeEvent, openPacket, sealPacket} from "./bus.mjs";
import {createHive} from "./hive.mjs";
import {bees} from "./registry.mjs";
import worker, {HiveState} from "./worker.mjs";
import v7 from "../tabor-universal-library-engine/public/catalog.json" with {type: "json"};

test("Ant Farm runs independent opposing phases, advances hidden and changes route order vertically", () => {
  const farm = createAntFarm(), eligible = ["library", "physics", "curriculum", "index"];
  assert.equal(farm.visible, false);
  const phases = advanceAntFarm(farm, Math.PI);
  assert.equal(phases.left, Math.PI);
  assert.equal(phases.right, Math.PI);
  const next = advanceAntFarm(farm, .2);
  assert.ok(next.left < Math.PI && next.right > Math.PI);
  assert.deepEqual(routeAnts(farm, eligible), ["library", "index", "physics", "curriculum"]);
  const vertical = createAntFarm();
  configureAntFarm(vertical, {mode: "counterspin", plane: "vertical", visible: false});
  assert.deepEqual(routeAnts(vertical, eligible), eligible);
  assert.equal(advanceAntFarm(vertical, .1).axis, Math.atan2(1, 0));
  const reverse = createAntFarm();
  configureAntFarm(reverse, {mode: "reverse", plane: "linear", visible: true});
  assert.deepEqual(routeAnts(reverse, eligible), [...eligible].reverse());
  assert.equal(advanceAntFarm(reverse, .5).right, 0);
  const forward = createAntFarm();
  configureAntFarm(forward, {mode: "forward", plane: "linear", visible: true});
  assert.deepEqual(routeAnts(forward, eligible), eligible);
  assert.equal(advanceAntFarm(forward, .5).left, 0);
});

test("all 101 modules load through the Hive with provenance, local cast and progress", () => {
  const {surface, owner} = createHive({modules, classes});
  assert.equal(Object.keys(bees).length, 21);
  for (const module of modules) {
    surface.emit("module.open", {module: module.id, surface: "library"});
    assert.equal(surface.read().provenance.classCode, module.classCode);
    assert.equal(surface.read().provenance.callNumber, null);
    assert.equal(surface.read().voice.text, module.task);
  }
  assert.equal(surface.read().provenance.cartridge, "LC-Z-101");
  assert.equal(surface.read().vault.id, "Z-101");
  assert.ok(surface.search("radar", "U").some(item => item.id === 87));
  surface.emit("interaction.summary", {surface: "library", module: 101, kind: "tap", successes: 3});
  assert.equal(surface.read().learning.level, 2);
  surface.emit("module.complete", {module: 101});
  surface.emit("module.complete", {module: 101});
  assert.equal(surface.read().economy.coins, 1);
  owner.setCast({voice: "pk", chaos: true});
  assert.match(surface.read().voice.text, /Wild Card is on/);
  surface.emit("bridge.clear", {attempts: 4, shield: 0, attack: 2, charge: 1});
  assert.equal(surface.read().physics.bridge.attack, 2);
  assert.equal(surface.read().economy.bridgeClears, 1);
});

test("the v.7 authored ledger and Track Baller keep separate cartridge state and provenance", () => {
  const {surface, owner} = createHive({modules, classes, v7Ledger: v7.ledger});
  owner.setCast({voice: "curator", chaos: false});
  surface.emit("module.open", {module: 67, surface: "universal-library"});
  assert.match(surface.read().voice.text, /ripple sources/);
  assert.equal(surface.read().provenance.cartridge, "V7-067");
  surface.emit("interaction.summary", {surface: "universal-library", module: 67, kind: "release", successes: 3});
  assert.equal(surface.read().learning.level, 2);
  surface.emit("module.open", {module: 67, surface: "library"});
  assert.equal(surface.read().learning.level, 1);
  assert.equal(surface.read().provenance.cartridge, "LC-Q-067");
  assert.notEqual(surface.read().voice.text, v7.ledger.find(item => item.id === 67).description);
});

test("Hive Bus rejects raw sensor content, spoofing, unauthorized device reports and repeats", () => {
  let now = Date.now();
  const clock = () => now;
  const {surface, owner, worker} = createHive({modules, classes, clock});
  assert.throws(() => surface.emit("interaction.summary", {surface: "library", kind: "tap", stroke: [1, 2]}));
  assert.throws(() => surface.emit("boundary.report", {code: "authorship"}));
  assert.throws(() => owner.registerDevice({id: "board", name: "Circuit", domain: "hardware", grants: ["simulate"]}));
  owner.registerDevice({id: "board", name: "Circuit", domain: "hardware", grants: ["simulate"], consent: true});
  assert.throws(() => owner.authorizeDevice({id: "board", capability: "project"}));
  const a = owner.spawn({domain: "hardware", task: "circuit-check", ttl: 30000});
  const b = owner.spawn({domain: "network", task: "network-health", ttl: 30000});
  assert.throws(() => worker.receiveBatch([makeEvent(b.id, "device.status", {device: "board", status: "ready"}, clock)], b.id));
  const heartbeat = makeEvent(a.id, "worker.heartbeat", {worker: a.id}, clock);
  const report = makeEvent(a.id, "device.status", {device: "board", status: "ready"}, clock);
  assert.deepEqual(worker.receiveBatch([heartbeat, report], a.id).map(r => r.id), [report.id, heartbeat.id]);
  assert.equal(worker.receiveBatch([heartbeat], a.id)[0].duplicate, true);
  assert.equal(owner.read().devices[0].status, "ready");
  assert.equal(owner.read().workers[0].healthy, true);
  const request = makeEvent(a.id, "worker.request", {domain: "actuator", task: "haptic-test", ttl: 8000}, clock);
  worker.receiveBatch([request], a.id);
  assert.equal(owner.read().pending.length, 1);
  const c = owner.approve(request.id);
  const group = owner.merge([a.group, c.group]);
  assert.equal(group.members.length, 2);
  owner.dissolve(group.id);
  assert.throws(() => worker.identity(a.id));
  assert.throws(() => worker.identity(c.id));
  now += 31000;
  assert.throws(() => worker.identity(b.id));
});

test("Z-101 writes only consented encrypted notes and can lock and reopen", async () => {
  const data = new Map();
  const storage = {getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v)};
  const {owner} = createHive({modules, classes, storage});
  await owner.memory.unlock("private-vault-test");
  await assert.rejects(owner.memory.write({module: 65, note: "Private note", consent: false}));
  assert.equal(data.size, 0);
  await owner.memory.write({module: 65, note: "Private note", consent: true});
  assert.ok(![...data.values()][0].includes("Private note"));
  owner.memory.lock();
  assert.throws(() => owner.memory.read());
  await assert.rejects(owner.memory.unlock("wrong-passphrase"));
  await owner.memory.unlock("private-vault-test");
  const [note] = owner.memory.read();
  assert.equal(note.text, "Private note");
  assert.equal(note.module, 65);
  await owner.memory.write({remove: note.id, consent: true});
  assert.deepEqual(owner.memory.read(), []);
});

test("Worker serves 101 cartridges and fails closed without the owner credentials", async () => {
  const fetch = (path, env = {}) => worker.fetch(new Request("https://hive.example" + path), env);
  const catalog = await (await fetch("/api/catalog")).json();
  assert.equal(catalog.modules.length, 101);
  assert.equal(catalog.v7Ledger.length, 37);
  const status = await (await fetch("/api/status")).json();
  assert.equal(status.ownerBus, false);
  assert.equal((await fetch("/api/owner")).status, 503);
  assert.equal((await fetch("/?module=65")).headers.get("location").split("?")[1], "module=65");
  const arcade = await fetch("/app-factory/games/dual-screen-arcade/index.html");
  assert.match(arcade.headers.get("content-security-policy"), /'sha256-/);
  assert.equal((await fetch("/app-factory/tabor-universal-library-engine/public/arcade-core.mjs")).status, 200);
  assert.equal((await fetch("/app-factory/tabor-hive/worker.mjs")).status, 404);
});

test("Cloud Hive validates owner credentials and encrypted per-Bee heartbeat receipts", async () => {
  const secret = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const master = secret(), token = secret(), stored = new Map();
  const ctx = {storage: {get: async k => structuredClone(stored.get(k)), put: async (k, v) => stored.set(k, structuredClone(v))}};
  const backend = new HiveState(ctx, {HIVE_OWNER_TOKEN: token, HIVE_BUS_KEY: master});
  const request = (path, {method = "GET", headers, body} = {}) =>
    backend.fetch(new Request("https://hive.example" + path, {method, headers, body: body && JSON.stringify(body)}));
  assert.equal((await request("/api/owner")).status, 401);
  const auth = {authorization: "Bearer " + token};
  const owner = body => request("/api/owner", {method: "POST", headers: auth, body});
  const {result} = await (await owner({action: "spawn", domain: "physics", task: "track-ball", ttl: 10000})).json();
  const {id} = result.lease;
  const key = await busKey(result.key);
  const event = makeEvent(id, "worker.heartbeat", {worker: id});
  const packet = await sealPacket(event, key, id, "up");
  const bee = body => request("/api/bus", {method: "POST", headers: {"x-tabor-bee": id}, body});
  const received = await (await bee(packet)).json();
  const receipt = await openPacket(received, key, id, "down");
  assert.equal(receipt.receipts[0].id, event.id);
  await assert.rejects(openPacket(received, key, id, "up"));
  assert.equal((await openPacket(await (await bee(packet)).json(), key, id, "down")).receipts[0].duplicate, true);
  const state = await (await request("/api/owner", {headers: auth})).json();
  assert.equal(state.workers[0].healthy, true);
  await owner({action: "dissolve", id});
  assert.equal((await bee(packet)).status, 401);
});
