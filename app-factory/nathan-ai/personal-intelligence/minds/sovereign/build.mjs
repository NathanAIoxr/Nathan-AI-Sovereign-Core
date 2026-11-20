import { readFile, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = resolve(process.env.MIND_SOURCE_ROOT || resolve(here, "../../../../.."));
const sourceRevision = process.env.MIND_SOURCE_REVISION ||
  execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(sourceRevision)) throw new Error("A full Git source revision is required");
const git = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const published = path => git + "/blob/" + sourceRevision + "/" + path;
const local = name => readFile(join(here, name), "utf8");
const roots = {
  atlas: "app-factory/nathan-ai/personal-intelligence/minds/mind-of-minds/catalog.json",
  box: "app-factory/sovereign-boxes/registry.json",
  chat: "app-factory/nathan-ai/minds-chat/sources.json",
  mirror: "app-factory/nathan-ai/agents-of-innocence/release-manifest.json",
  lasso: "app-factory/nathan-ai/minds-chat/lasso-evidence.json",
  prompts: "app-factory/nathan-ai/minds-chat/lasso-prompts.json",
};
const [atlas, boxes, chat, mirrors, lasso, sharedPrompts] = await Promise.all(Object.values(roots).map(async path =>
  JSON.parse(await readFile(resolve(repo, path), "utf8"))));
const [binary, author, fleet, runtime] = await Promise.all(
  ["binary.json", "author-source.txt", "fleet-source.json", "worker.mjs"].map(local));
if (lasso.schema !== "nathan-ai.minds.lasso-evidence.v1" ||
    sharedPrompts.schema !== "nathan-ai.minds.conductor-prompts.v1" ||
    !lasso.records.every(record => !record.url || new URL(record.url).protocol === "https:")) {
  throw new Error("Invalid reviewed Lasso sources");
}

function registryRows(rows, origin, map) {
  return rows.map(item => ({ ...map(item), origin, source: published(roots[origin]) }));
}

const priority = Object.values(JSON.parse(binary)).map(mind => {
  if (!author.includes(mind.sourceQuote)) throw new Error("Binary quote differs from the original");
  return { ...mind, origin: "binary", type: "symbolic-mind",
    source: git + "/blob/main/app-factory/nathan-ai/personal-intelligence/minds/sovereign/author-source.txt",
    catalogId: mind.symbol, purpose: mind.facets.mind, provenance: "Creator’s design and named exercise roles" };
});
const catalog = [
  ...priority,
  ...registryRows(atlas.minds, "atlas", item => ({
    id: "atlas." + item.id, catalogId: item.id, name: item.name, type: item.type,
    purpose: item.purpose, provenance: item.sourceId, status: item.status, group: item.group,
  })),
  ...registryRows(boxes.records, "box", item => ({
    id: "box." + item.id, catalogId: item.id, name: item.title || item.id,
    type: item.kind, purpose: item.title
      ? "Study this independent record using the source catalog."
      : "Private concept slot. Its public record supplies an identifier.",
    provenance: item.source, status: item.status, group: item.kind,
  })),
  ...registryRows(chat.entries, "chat", item => ({
    id: "chat." + item.id, catalogId: item.id, name: item.name, type: item.type,
    purpose: item.purpose, provenance: item.sourceId, group: item.group,
  })),
  ...registryRows(mirrors.mirror_agents, "mirror", item => ({
    id: "mirror." + item.id, catalogId: item.id, name: item.name,
    type: "creator-defined-mirror", purpose: "Study the creator-defined mirror specification within its documented limits.",
    provenance: item.designation, status: item.status,
  })),
  ...registryRows(lasso.profiles, "lasso", item => ({
    id: "lasso." + item.id, catalogId: item.id, name: item.name, type: item.type,
    purpose: item.purpose, provenance: item.sourceId, group: item.group,
  })),
  ...lasso.council.map((item, index) => {
    const catalogId = "council." + String(index + 1).padStart(2, "0");
    return { id: catalogId, catalogId, name: item.name, type: "council-role", origin: "council",
      group: "OMNI My Council", purpose: item.description, source: published(roots.lasso),
      provenance: "Published Lasso of Truth council role" };
  }),
  ...JSON.parse(fleet).workers.map(worker => ({
    id: worker, catalogId: worker.replace("tabor-nathan-mind-", "").toUpperCase(), name: worker.replace("tabor-nathan-mind-", "").toUpperCase(),
    origin: "fleet", type: "existing-worker-record", purpose: "Trace this individually deployed Nathan Tabor Way Mind.",
    source: git + "/blob/main/app-factory/nathan-ai/personal-intelligence/minds/sovereign/fleet-source.json",
    provenance: "Observed Cloudflare account Worker roster",
  })),
].map(item => ({
  ...item,
  evidence: lasso.records.filter(record => record.subjects.includes(item.catalogId)).map(record => ({
    id: record.id, kind: record.kind, status: record.status, text: record.text,
    source: record.source, url: record.url ?? published(roots.lasso),
  })),
}));
if (!catalog.every(mind => typeof mind.id === "string" && mind.id.length <= 220 && mind.name && mind.type && mind.source) ||
    new Set(catalog.map(mind => mind.id)).size !== catalog.length) throw new Error("Invalid or duplicate Mind identity");

const out = resolve(process.argv[2] || join(here, "build"));
await mkdir(out, { recursive: true });
const manifests = [["registry", catalog], ...catalog.filter(mind => mind.origin === "binary").map(mind => [mind.id, [mind]])];
await Promise.all(manifests.map(async ([id, data]) => {
  const packed = gzipSync(JSON.stringify(data), { level: 9 }).toString("base64");
  const configuration = { id, sourceRevision, count: data.length };
  const prefix = "const packageInfo = " + JSON.stringify(configuration) + ";\nconst packedCatalog = " + JSON.stringify(packed) +
    ";\nconst conductorPrompts = " + JSON.stringify(sharedPrompts) + ";\n";
  await writeFile(join(out, id + ".mjs"), prefix + runtime);
}));
console.log(JSON.stringify({ total: catalog.length, counts: Object.fromEntries(
  [...new Set(catalog.map(mind => mind.origin))].map(origin => [origin, catalog.filter(mind => mind.origin === origin).length])) }));
