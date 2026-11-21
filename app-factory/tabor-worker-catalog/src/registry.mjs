import catalog from "../data/catalog.json" with { type: "json" };
import fleet from "../data/fleet.json" with { type: "json" };
import release from "../data/release.json" with { type: "json" };

export { catalog, fleet, release };
export const prefix = "/worker-catalog";
export const catalogBody = JSON.stringify(catalog) + "\n";
export const entryById = new Map(catalog.entries.map(item => [item.id,item]));
export const slotSet = new Set(fleet.slots);
export const replicaPrefix = `worker-catalog/${fleet.cohort}/${release.sha256}/`;
export const replicaKey = id => replicaPrefix + id + ".json";
export const officialHost = "https://tabor-worker-catalog.nathantaboract.workers.dev";
export const proofHeaders = {
  "x-catalog-sha256":release.sha256,
  "x-catalog-release":catalog.release,
  "x-content-type-options":"nosniff",
  "referrer-policy":"no-referrer"
};

export const sourceLabels = {
  repository:"Repository checked",
  archived:"Archived repository",
  template:"Source template checked",
  "index-match":"Project matched in source index",
  related:"Related official source",
  reference:"Reference index only",
  unresolved:"Source unresolved"
};
