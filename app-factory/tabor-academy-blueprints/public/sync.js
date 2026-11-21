const databaseName = "tabor-academy-field";
let pendingDatabase;
let syncing;

function database() {
  pendingDatabase ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 2);
    request.onupgradeneeded = () => {
      for (const name of ["outbox","progress","curriculum"]) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name,{keyPath:"id"});
      }
    };
    request.onsuccess = () => resolve(request.result);
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
export async function readVerifiedCurriculum() {
  return (await store("curriculum", collection => collection.get("verified")))?.snapshot;
}
export function saveVerifiedCurriculum(snapshot) {
  return put("curriculum",{ id:"verified", snapshot });
}

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
        method: "POST", headers: { "Content-Type": "application/json" },
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
