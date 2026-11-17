import {advanceAntFarm, configureAntFarm, createAntFarm, routeAnts} from "./ant-farm.mjs";
import {makeEvent, validateEvent} from "./bus.mjs";
import {createLibraryBee} from "./library.mjs";
import {bees, deviceDomains, priorities, voices} from "./registry.mjs";
import {createMemoryBee} from "./vault.mjs";

const effects = {
  "module.open": ["library", "physics", "curriculum", "provenance", "index", "interface"],
  "module.complete": ["curriculum", "economy", "index", "memory"],
  "interaction.summary": ["physics", "sensor", "interface"],
  "bridge.clear": ["physics", "economy"],
  "boundary.report": ["shadow", "security"],
  "worker.heartbeat": ["queen"],
  "worker.request": ["replication"],
};
const bridgeInitial = () => ({attempts: 0, shield: 0, attack: 0, charge: 0});
const identity = /^[a-z][a-z0-9-]{1,47}$/;
const deviceId = /^[\w.-]{1,96}$/;
const addBounded = (current, earned) => Math.min(100000, current + earned);
const capabilities = ["observe", "simulate", "project"];
const observedBy = device => [...new Set([device.domain, "integration", "security"])];

export function createHive({modules, classes, storage, initial, clock = Date.now}) {
  const library = createLibraryBee(modules, classes);
  const memory = storage ? createMemoryBee(storage) : null;
  const state = initial ?? {
    ant: createAntFarm(), workers: {}, devices: {}, groups: {}, seen: {}, modules: {},
    active: null, cast: "nathan", pk: false, physics: {orientation: [1, 0, 0, 0], field: 0, bridge: bridgeInitial()},
    economy: {coins: 0, bridgeClears: 0}, shadow: {reports: 0, last: null},
    lifeMandate: null, lawOfOrder: null, indexedClasses: [], lastRoute: [], serial: 0,
  };
  const subscribers = new Set();

  function prune() {
    const now = clock();
    for (const [id, at] of Object.entries(state.seen)) if (now - at > 240000) delete state.seen[id];
    for (const [id, worker] of Object.entries(state.workers)) if (worker.expiresAt <= now) delete state.workers[id];
    for (const [id, group] of Object.entries(state.groups)) {
      group.members = group.members.filter(member => Object.hasOwn(state.workers, member));
      if (!group.members.length) delete state.groups[id];
    }
  }

  function worker(id) {
    prune();
    if (!Object.hasOwn(state.workers, id)) throw new Error("Bee registration is required.");
    return state.workers[id];
  }

  function spawn({domain, task, ttl}) {
    prune();
    if (!Object.hasOwn(bees, domain) || typeof task !== "string" || !identity.test(task) ||
        !Number.isInteger(ttl) || ttl < 1000 || ttl > 900000) throw new Error("Invalid specialist lease.");
    if (Object.keys(state.workers).length >= 32) throw new Error("Hive specialist capacity reached.");
    const id = domain + "-" + crypto.randomUUID().slice(0, 12);
    const group = "swarm-" + crypto.randomUUID().slice(0, 12);
    const now = clock();
    state.workers[id] = {id, domain, task, group, registeredAt: now, heartbeatAt: null, expiresAt: now + ttl};
    state.groups[group] = {id: group, task, members: [id]};
    return structuredClone(state.workers[id]);
  }

  function activeModule() {
    return state.active ? library.load(state.active.module) : null;
  }

  function say() {
    const module = activeModule();
    const selected = voices[state.cast];
    if (!module) return {...selected, text: "Choose an LC cartridge or open an interaction surface."};
    const lesson = state.modules[module.id];
    const challenge = state.pk ? " Use the secondary control path on your next attempt." : "";
    const lines = {
      nathan: lesson.completed ? "Module complete. Try a linked subject or replay the challenge." : module.task,
      pk: state.pk ? "Wild Card is on." + challenge : "Play the standard round. Wild Card is available from the Hive.",
      curator: module.brief + " · Class " + module.classCode + " · " + library.reference(module.id).className,
    };
    return {...selected, text: lines[state.cast]};
  }

  function snapshot() {
    prune();
    const module = activeModule();
    return {
      version: 9, active: state.active, voice: say(), pk: state.pk, ant: state.ant,
      physics: state.physics, economy: state.economy, shadow: state.shadow, lastRoute: state.lastRoute,
      learning: module ? state.modules[module.id] : null, indexedClasses: state.indexedClasses,
      provenance: module ? library.reference(module.id) : null,
      workers: Object.values(state.workers).map(record => ({...record, healthy: record.heartbeatAt !== null &&
        clock() - record.heartbeatAt <= 30000})),
      groups: Object.values(state.groups), devices: Object.values(state.devices),
      vault: {id: "Z-101", unlocked: memory?.unlocked ?? false},
    };
  }

  function checkSender(event, sender) {
    if (event.source !== sender) throw new Error("Hive Bus sender identity mismatch.");
    if (sender === "surface") {
      if (!["module.open", "module.complete", "interaction.summary", "bridge.clear"].includes(event.type)) {
        throw new Error("Surface event outside the allowed scope.");
      }
      return;
    }
    if (sender === "hive") return;
    const reporter = worker(sender);
    if (event.type === "worker.heartbeat" && event.payload.worker === sender || event.type === "worker.request") return;
    if (event.type === "boundary.report" && ["shadow", "security"].includes(reporter.domain)) return;
    if (event.type === "device.status" && Object.hasOwn(state.devices, event.payload.device) &&
        reporter.domain === state.devices[event.payload.device].domain) return;
    throw new Error("Bee event outside the registered domain.");
  }

  function handle(event) {
    const payload = event.payload;
    let result;
    switch (event.type) {
      case "module.open": {
        const module = library.load(payload.module);
        state.active = payload;
        state.modules[module.id] ??= {attempts: 0, successes: 0, level: 1, completed: false};
        state.indexedClasses = library.links(module.id);
        state.physics = {orientation: [1, 0, 0, 0], field: 0, bridge: bridgeInitial()};
        break;
      }
      case "module.complete": {
        const lesson = state.modules[payload.module];
        if (!lesson || state.active.module !== payload.module) throw new Error("Open the module before completing it.");
        if (!lesson.completed) state.economy.coins = addBounded(state.economy.coins, 1);
        lesson.completed = true;
        break;
      }
      case "interaction.summary": {
        if (payload.module !== undefined && payload.module !== state.active?.module) {
          throw new Error("Summary belongs to another cartridge.");
        }
        if (payload.orientation) state.physics.orientation = payload.orientation;
        if (payload.field !== undefined) state.physics.field = payload.field;
        const lesson = payload.module ? state.modules[payload.module] : null;
        if (lesson) {
          lesson.attempts = addBounded(lesson.attempts, 1);
          lesson.successes = addBounded(lesson.successes, payload.successes ?? 0);
          lesson.level = lesson.successes >= 8 ? 3 : lesson.successes >= 3 ? 2 : 1;
        }
        break;
      }
      case "bridge.clear":
        state.physics.bridge = payload;
        state.economy.bridgeClears = addBounded(state.economy.bridgeClears, 1);
        state.economy.coins = addBounded(state.economy.coins, 1);
        break;
      case "boundary.report":
        state.shadow = {reports: addBounded(state.shadow.reports, 1), last: {code: payload.code, at: event.at}};
        break;
      case "worker.request":
        // Requests are recorded as Hive decisions. Only the owner grants leases.
        result = {domain: payload.domain, task: payload.task, ttl: payload.ttl, status: "owner-review"};
        state.pending = [...(state.pending ?? []).slice(-19), {id: event.id, source: event.source, ...result}];
        break;
      case "worker.heartbeat":
        worker(payload.worker).heartbeatAt = clock();
        break;
      case "device.status": {
        const device = Object.hasOwn(state.devices, payload.device) ? state.devices[payload.device] : null;
        if (!device) throw new Error("Device must be registered.");
        device.status = payload.status;
        break;
      }
    }
    const route = event.type === "device.status" ? observedBy(state.devices[payload.device]) : effects[event.type];
    state.lastRoute = ["queen", ...routeAnts(state.ant, route.filter(bee => bee !== "queen"))];
    state.seen[event.id] = event.at;
    state.serial += 1;
    for (const callback of subscribers) {
      try { callback({serial: state.serial, type: event.type, snapshot: structuredClone(snapshot())}); }
      catch (error) { globalThis.reportError?.(error); }
    }
    return {id: event.id, serial: state.serial, route: [...state.lastRoute], result};
  }

  function receiveBatch(messages, sender) {
    prune();
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 32) throw new RangeError("Invalid Hive Bus batch.");
    const events = messages.map(event => validateEvent(structuredClone(event), clock()));
    for (const event of events) checkSender(event, sender);
    const newIds = new Set(events.filter(event => !Object.hasOwn(state.seen, event.id)).map(event => event.id));
    if (Object.keys(state.seen).length + newIds.size > 2048) throw new Error("Hive Bus event window is full.");
    events.sort((a, b) => priorities[a.priority] - priorities[b.priority]);
    return events.map(event => Object.hasOwn(state.seen, event.id)
      ? {id: event.id, duplicate: true}
      : handle(event));
  }

  function setCast({voice, chaos}) {
    if (!Object.hasOwn(voices, voice) || typeof chaos !== "boolean") throw new Error("Invalid Hive cast setting.");
    state.cast = voice;
    state.pk = chaos;
    return say();
  }

  function registerDevice({id, name, domain, grants, consent}) {
    if (typeof id !== "string" || !deviceId.test(id) || typeof name !== "string" || !name.trim() || name.length > 80 ||
        !deviceDomains.includes(domain) || !Array.isArray(grants) || !grants.length ||
        grants.some(grant => !capabilities.includes(grant)) || consent !== true) {
      throw new Error("Device registration requires owner permission, a domain and bounded capabilities.");
    }
    if (Object.hasOwn(state.devices, id) || Object.keys(state.devices).length >= 64) {
      throw new Error("Device name is already registered or capacity is reached.");
    }
    Object.defineProperty(state.devices, id, {value: {id, name, domain, grants: [...new Set(grants)],
      status: "offline"}, enumerable: true, configurable: true});
    return structuredClone(state.devices[id]);
  }

  function authorizeDevice({id, capability}) {
    const device = Object.hasOwn(state.devices, id) ? state.devices[id] : null;
    if (!device?.grants.includes(capability)) throw new Error("Device capability requires a Hive grant.");
    return {device: id, capability, issuer: "nathan-ai-hive"};
  }

  function merge(ids) {
    prune();
    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 8 || new Set(ids).size !== ids.length ||
        ids.some(id => !Object.hasOwn(state.groups, id))) throw new Error("Select 2–8 temporary work-groups.");
    const group = state.groups[ids[0]];
    for (const id of ids.slice(1)) {
      for (const member of state.groups[id].members) {
        group.members.push(member);
        state.workers[member].group = group.id;
      }
      delete state.groups[id];
    }
    return structuredClone(group);
  }

  return {
    surface: {
      emit: (type, payload) => receiveBatch([makeEvent("surface", type, payload, clock)], "surface")[0],
      read: () => structuredClone(snapshot()),
      subscribe(callback) { subscribers.add(callback); return () => subscribers.delete(callback); },
      search: library.search.bind(library),
    },
    worker: {receiveBatch, identity: id => structuredClone(worker(id))},
    owner: {
      read: () => structuredClone({...snapshot(), mandate: state.lifeMandate, order: state.lawOfOrder,
        pending: state.pending ?? []}),
      exportState: () => structuredClone(state),
      setCast,
      setAnt: settings => configureAntFarm(state.ant, settings),
      tickAnt: radians => advanceAntFarm(state.ant, radians),
      registerDevice, authorizeDevice,
      revokeDevice(id) { delete state.devices[id]; },
      spawn, merge,
      approve(id) {
        const request = (state.pending ?? []).find(item => item.id === id);
        if (!request) throw new Error("No pending specialist request.");
        const lease = spawn(request);
        state.pending = state.pending.filter(item => item.id !== id);
        return lease;
      },
      dissolve(id) {
        prune();
        const ids = Object.hasOwn(state.groups, id) ? [...state.groups[id].members] : [id];
        for (const member of ids) delete state.workers[member];
        prune();
      },
      policy({lifeMandate, lawOfOrder}) {
        for (const value of [lifeMandate, lawOfOrder]) {
          if (typeof value !== "string" || !value.trim() || value.length > 2000) throw new Error("Supply both owner policies.");
        }
        state.lifeMandate = lifeMandate;
        state.lawOfOrder = lawOfOrder;
      },
      report: code => receiveBatch([makeEvent("hive", "boundary.report", {code}, clock)], "hive")[0],
      memory: memory && {
        unlock: passphrase => memory.unlock(passphrase),
        lock: () => memory.lock(),
        read: () => memory.read(),
        write: ({consent, module, note, remove}) => {
          if (remove === undefined) library.load(module);
          return memory.write({consent, module, note, remove});
        },
      },
    },
  };
}
