import { checkSnapshot, lessonProjection } from "../shared/snapshot.js";
import { readVerifiedCurriculum, saveVerifiedCurriculum } from "./sync.js";

let refresh;
export function refreshCurriculum() {
  refresh ??= (async () => {
    const response = await fetch("/api/curriculum-snapshot",{cache:"no-store"});
    if (!response.ok) throw new Error("Live Academy snapshot is unavailable");
    const snapshot = await response.json();
    await checkSnapshot(snapshot);
    await saveVerifiedCurriculum(snapshot);
  })().finally(() => { refresh = undefined; });
  return refresh;
}

export async function offlineLessons(signal) {
  let snapshot = globalThis.ACADEMY_OFFLINE;
  if (!snapshot) {
    try {
      const local = await readVerifiedCurriculum();
      if (local) return (await checkSnapshot(local)).map(lessonProjection);
    } catch { /* The bundled release is a second verified copy. */ }
    const paths = ["/exports/blueprints-integrity.json", "/exports/blueprints-v7.json"];
    const [proof,rows] = await Promise.all(paths.map(async path => {
      const response = await fetch(path,{signal});
      if (!response.ok) throw new Error("Academy offline release is unavailable");
      return response.json();
    }));
    snapshot = { proof, rows };
  }
  return (await checkSnapshot(snapshot)).map(lessonProjection);
}
