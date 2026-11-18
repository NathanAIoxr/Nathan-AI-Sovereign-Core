const minds = "app-factory/nathan-ai/personal-intelligence/minds";
const fed = minds + "/federation";
const world = "app-factory/tabor-universal-library-engine/public";
const myth = "app-factory/mythology";
const accord = "app-factory/one/tabor-recovered";

export const collections = [
  ["Mind of Minds", minds + "/mind-of-minds/catalog.json", "minds"],
  ["Worker Bot Families v21", fed + "/families-v21/registry.v21.json", "minds"],
  ["Worker Bot Families v40", fed + "/families-v40/registry.v40.json", "minds"],
  ["Figurative Families v48", fed + "/families-v48/registry.v48.json", "minds"],
  ["Literal Families v56", fed + "/families-v56/registry.v56.json", "minds"],
  ["Family 65–75 definitions", fed + "/families-v75/registry.v75.json", "families"],
  ["Family 65–75 numbered members", fed + "/families-v75/registry.v75.json", "minds"],
  ["Continuity v496 · positions 164–496", fed + "/continuity-v496/registry.v496.json", "minds"],
  ["Continuity v496 · families", fed + "/continuity-v496/registry.v496.json", "families"],
  ["Full Stack · Technology 108", fed + "/technology-v108/registry.tech108.json", "minds"],
  ["Dimensions 0–69", fed + "/dimensions-v70/registry.v70.json", "dimensions"],
  ["Dimensional units", fed + "/dimensions-v70/registry.v70.json", "units"],
  ["Creator Teams", fed + "/creator-teams.v074.json", "teams"],
  ["Specialist Bees", fed + "/hive-swarm/specialist_bees.v2.json", "roles"],
  ["Seven Stations", fed + "/hive-swarm/stations.v1.json", "stations"],
  ["Atomic Hive · source and roster", fed + "/hive-swarm/atomic-hive/ONE_ATOMIC_HIVE_KNOWLEDGE_PACK.json", "*"],
  ["1332/2272-era Hive source manifests", fed + "/hive-swarm/atomic-hive/SOURCE_MANIFEST.json", "*"],
  ["Tabor World scenes and worlds", world + "/world/world.json", ""],
  ["Tabor World public destinations", world + "/world/destinations.json", ""],
  ["Tabor World cast", world + "/world/cast-and-props.json", "cast"],
  ["Tabor World World Engine · 101 Applications", world + "/world/source-catalog.json", "cartridges"],
  ["Tabor World Tracker drafts", world + "/world/source-catalog.json", "trackerDraft"],
  ["Tabor World release history", world + "/world/release-ledger.json", "history"],
  ["Library of Tabor", world + "/library/catalog.json", "*"],
  ["Standalone apps", "standalone-apps/catalog.json", "entries"],
  ["Greek Mythology Atlas", myth + "/greek/atlas.json", "*"],
  ["Ancient Roots Atlas", myth + "/ancient-roots/atlas.json", "*"],
  ["Knave of Hearts Atlas", myth + "/knave/atlas.json", "*"],
  ["Tabor Accords", accord + "/Tabor_Accords_Recovery_Registry_2026-11-01.json", "*"],
  ["World Federation · architecture, adapters and archetypes", "app-factory/tabor-world-recovery/federation.json", "records"],
];

export const repoUrl = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
export const snapshot = "43f859ba279dc1e28f6b0e997403915e03c55974";

export function sourceRows(data, selector) {
  if (selector === "") {
    if (!Array.isArray(data)) throw new Error("Expected an array");
    return data;
  }
  if (selector !== "*") {
    if (!Array.isArray(data[selector])) throw new Error("Expected an array at " + selector);
    return data[selector];
  }
  if (Array.isArray(data)) return data;
  return Object.entries(data).flatMap(([key, value]) => Array.isArray(value)
    ? value.map((record, index) => ({ section: key, index: index + 1, record }))
    : [{ section: key, record: value }]);
}

export function recordTitle(value, index) {
  if (value === null || typeof value !== "object") return String(value);
  const row = value.record && typeof value.record === "object" ? value.record : value;
  for (const key of ["title", "name", "label", "item", "displayName", "application", "role", "archetype", "project", "term", "section", "slug", "id"]) {
    const field = row[key];
    if ((typeof field === "string" && field.trim()) || typeof field === "number") return String(field);
  }
  return value.section ? value.section + (value.index ? " · " + value.index : "") : "Record " + (index + 1);
}

export const atlasModule = world + "/world/world-core.mjs";
export const atlasSources = {
  ledger: world + "/catalog.json",
  library: world + "/world/source-catalog.json",
  castAndProps: world + "/world/cast-and-props.json",
  atlas: "app-factory/nathan-ai/anatomy/cosmic-body/atlas.json",
  places: "app-factory/one/mespark-memory-matrix/worlds-atlas.json",
  entries: world + "/world/world.json",
};

export async function assembleAtlas(load, loadModule) {
  const [{ createWorld }, pairs] = await Promise.all([
    loadModule(atlasModule),
    Promise.all(Object.entries(atlasSources).map(async ([key, path]) => [key, await load(path)])),
  ]);
  return { name: "Tabor World · complete 832-record Atlas", source: repoUrl + "/blob/" + snapshot + "/" + atlasModule,
    rows: createWorld(Object.fromEntries(pairs)).records };
}
