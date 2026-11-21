import { idempotencyKey, observationPayload } from "../shared/merkle.js";
import { syncCurriculum } from "./integrity.js";

const databaseName = "tabor-academy-field";
let pendingDatabase;
let syncing;

function database() {
  pendingDatabase ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 2);
    request.onupgradeneeded = event => {
      if (event.oldVersion === 0) {
        request.result.createObjectStore("outbox", { keyPath: "id" });
        request.result.createObjectStore("progress", { keyPath: "id" });
      }
      request.result.createObjectStore("curriculum", { keyPath: "id" });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); pendingDatabase = undefined; };
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  }).catch(error => {
    pendingDatabase = undefined;
    throw error;
  });
  return pendingDatabase;
}

async function store(name, operation, mode = "readonly") {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, mode);
    const request = operation(tx.objectStore(name));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error ?? new Error("Field storage transaction aborted"));
  });
}

const all = name => store(name, collection => collection.getAll());
const put = (name, item) => store(name, collection => collection.put(item), "readwrite");
const remove = (name, id) => store(name, collection => collection.delete(id), "readwrite");

export async function saveObservation(fields) {
  const entry = { ...fields, id: crypto.randomUUID(), createdAt: Date.now() };
  await put("outbox", entry);
  return entry.id;
}

export function pendingObservations() {
  return all("outbox");
}

export function discardObservation(id) {
  return remove("outbox", id);
}

export function saveHunt(lesson, layers) {
  return put("progress", { id: lesson.id, domain: lesson.domain, layers: [...layers] });
}

export function hunts() {
  return all("progress");
}

async function flush(fetcher) {
  const queued = await all("outbox");
  for (const { error, createdAt, ...entry } of queued) {
    if (error) continue;
    let result;
    try {
      result = await fetcher("/api/sightings", {
        method: "POST", headers: { "Content-Type": "application/json",
          "Idempotency-Key": await idempotencyKey("field-observation", "tabor-academy", observationPayload(entry)) },
        body: JSON.stringify(entry), credentials: "same-origin",
      });
    } catch {
      return;
    }
    if (result.ok) {
      await remove("outbox", entry.id);
    } else if ([400, 404, 409, 413, 415].includes(result.status)) {
      const failure = await result.json().catch(() => ({}));
      await put("outbox", { ...entry, createdAt, error: failure.error ?? "Submission needs attention." });
    } else {
      return;
    }
  }
}

export function flushOutbox(fetcher = globalThis.fetch.bind(globalThis)) {
  syncing ??= flush(fetcher).finally(() => { syncing = undefined; });
  return syncing;
}

export async function queueBackgroundSync() {
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration?.sync) await registration.sync.register("academy-outbox");
}

export function offlineCurriculum() {
  return store("curriculum", data => data.get("published"));
}

async function saveCurriculum(snapshot, oldRoot) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("curriculum", "readwrite");
    const item = tx.objectStore("curriculum");
    const request = item.get("published");
    request.onsuccess = () => {
      if ((request.result?.manifest?.root ?? null) === oldRoot) {
        item.put({ id: "published", ...snapshot });
      }
    };
    tx.oncomplete = resolve;
    tx.onabort = () => reject(tx.error ?? new Error("Offline curriculum could not be updated"));
  });
}

export async function verifiedCurriculum(signal) {
  const local = await offlineCurriculum().catch(() => null);
  const snapshot = await syncCurriculum(local, fetch, signal);
  if (snapshot && snapshot !== local) {
    await saveCurriculum(snapshot, local?.manifest?.root ?? null).catch(() => {});
  }
  return snapshot;
}
