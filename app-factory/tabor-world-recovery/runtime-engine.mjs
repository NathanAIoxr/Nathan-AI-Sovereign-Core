import { collections, recordTitle, repoUrl, snapshot, sourceRows } from "./collections.mjs";

const actorGroups = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 19, 25, 26, 29];
export const runtimeGroups = actorGroups.map(index => {
  const [name, path, selector] = collections[index];
  return { id: "g" + index, name, path, selector };
});
runtimeGroups.unshift({ id: "tabor", name: "Tabor Light and Dark · field devices" });

const devices = [
  { name: "Tabor Light Slayer", attributes: "Sword made of light with a physical handle.", characteristics: "The wielder thinks of a form after grasping the handle. The blade decides if the wielder takes too long.", functionality: "Manifest a blade suited to the obstacle and clear the path.", traits: "Responsive to the wielder’s intent.", actions: ["manifest"] },
  { name: "Tabor Light Sleyer", attributes: "Loom, web, and deployable traps.", characteristics: "A spider’s web holds a shadow in place while it changes.", functionality: "Manage Dream Weavers, move through time, work with the fabric of matrix reality, and convert a captured shadow.", traits: "Patient, precise, and transformative.", actions: ["weave", "dream", "timeline"] },
  { name: "Tabor Dark Slayer", attributes: "Agent of Death.", characteristics: "Controlled mentally by the wielder.", functionality: "Carry out a stated command to retire a shadow or decoy in the fictional scene.", traits: "Direct, with a defined target.", actions: ["retire"] },
  { name: "Tabor Dark Sleyer", attributes: "Loom of the New World.", characteristics: "The New World follows the canon ‘Innocence is God’.", functionality: "Weave recovered threads into a new sanctuary.", traits: "Deliberate and protective.", actions: ["sanctuary"] },
];

const verbs = {
  observe: "Preserve the exact input and record its structure",
  classify: "Group source lines by explicit markers and text cues",
  relate: "Identify shared terms across the two inputs",
  plan: "Turn an objective into an ordered work list",
  clear: "Remove duplicate working lines while retaining the original",
  verify: "Compute SHA-256 and check an expected digest",
  restore: "Reconstruct the original input and verify its round trip",
  compose: "Join distinct source lines into an editable draft",
  manifest: "Manifest a blade form and apply it to the scene",
  weave: "Cast the Loom’s web or weave a held shadow into a thread",
  dream: "Record a dream on the Loom",
  timeline: "Visit an earlier scene snapshot",
  retire: "Command the Dark Slayer to retire a fictional shadow",
  sanctuary: "Weave the New World’s sanctuary",
};
const fieldNames = {
  attributes: ["attributes", "attribute", "features", "domains", "symbols", "powers"],
  characteristics: ["characteristics", "characteristic", "description", "summary", "group", "role_type", "domain", "identity"],
  functionality: ["functionality", "functionalities", "function", "functions", "purpose", "mission", "action", "role", "task", "application", "responsibility", "responsibilities", "method", "capabilities"],
  traits: ["traits", "trait", "values", "qualities", "principles", "constraints", "ethos", "tags"],
};
const cues = [
  ["verify", /verif|audit|test|validat|integrity|proof|check|digest|review/],
  ["restore", /restor|recover|reconstruct|archiv|preserv|reproduc/],
  ["clear", /dedup|clear|purge|filter|noise|reduc|normaliz/],
  ["relate", /relat|cross.reference|connect|bridge|match|compar|pattern|correl/],
  ["classify", /classif|categor|index|sort|label|cluster|taxonom|tag|triag/],
  ["plan", /design|plan|build|orchestrat|coordinat|execut|strateg|roadmap|engineer/],
  ["compose", /creat|write|compos|construct|assembl|produc|craft|generat|teach|weav/],
];
const keys = field => field.toLowerCase().replace(/[^a-z]/g, "");

export function profileFor(group, row, position, revision = snapshot) {
  const entry = row?.record && typeof row.record === "object" ? row.record : row;
  const facets = Object.fromEntries(Object.entries(fieldNames).map(([facet, names]) => [
    facet, Object.entries({ ...entry?.metadata, ...entry })
      .filter(([field, value]) => names.includes(keys(field)) && value !== null && value !== "")
      .map(([field, value]) => ({ field, value })),
  ]));
  const abilityText = JSON.stringify(facets).toLowerCase();
  const actions = group.id === "tabor" ? row.actions :
    ["observe", ...cues.filter(([, expression]) => expression.test(abilityText)).map(([action]) => action)];
  const display = group.id === "tabor" ? row.name : recordTitle(row, position);
  return {
    id: group.id + ":" + position, name: display, collection: group.name, facets,
    capabilities: actions.map(id => ({ id, label: verbs[id] })),
    source: group.path ? { revision, path: group.path, row: position, url: repoUrl + "/blob/" + revision + "/" + group.path }
      : { revision, path: "app-factory/tabor-world-recovery/runtime-engine.mjs", row: position },
    original: row,
  };
}

export async function loadProfiles(id, load, revision) {
  const group = runtimeGroups.find(entry => entry.id === id);
  if (!group) throw new RangeError("Unknown roster");
  const rows = group.id === "tabor" ? devices : sourceRows(await load(group.path), group.selector);
  const version = group.path && !group.path.endsWith("/federation.json") ? snapshot : revision;
  return rows.map((row, index) => ({ id: group.id + ":" + index, name: recordTitle(row, index),
    run: () => profileFor(group, row, index, version) }));
}

export function rosterSearch(profiles, query, page) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const found = profiles.filter(row => terms.every(term => row.name.toLowerCase().includes(term)));
  return { count: found.length, page, profiles: found.slice(page * 80, (page + 1) * 80).map(({ id, name }) => ({ id, name })) };
}

export const initialScene = { turn: 0, obstacle: "Snag", shadow: "roaming", threads: 0, sanctuary: false, dreams: [], history: [] };
const obstacles = ["Snag", "Fracture", "Fog", "Clear"];
const shadows = ["roaming", "held", "converted", "retired"];
const bladeForms = { Snag: "Fine Edge", Fracture: "Bridged Edge", Fog: "Wide Edge" };
const safeDreams = dreams => Array.isArray(dreams) ? dreams.filter(v => typeof v === "string").slice(-5).map(v => v.slice(0, 160)) : [];
const frame = ({ obstacle, shadow, threads, sanctuary, dreams }) => ({ obstacle, shadow, threads, sanctuary, dreams: [...dreams] });
const words = input => new Set(input.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);

export function safeScene(value) {
  if (!value || typeof value !== "object") return structuredClone(initialScene);
  const sanitizeFrame = row => ({
    obstacle: obstacles.includes(row?.obstacle) ? row.obstacle : "Snag",
    shadow: shadows.includes(row?.shadow) ? row.shadow : "roaming",
    threads: Number.isInteger(row?.threads) ? Math.min(6, Math.max(0, row.threads)) : 0,
    sanctuary: row?.sanctuary === true,
    dreams: safeDreams(row?.dreams),
  });
  return {
    ...sanitizeFrame(value), turn: Number.isInteger(value.turn) ? Math.max(0, Math.min(value.turn, 9999)) : 0,
    history: Array.isArray(value.history) ? value.history.slice(-10).map(sanitizeFrame) : [],
  };
}

function turn(action, input, previous) {
  const scene = safeScene(previous);
  const remember = () => {
    scene.history = [...scene.history, frame(scene)].slice(-10);
    scene.turn = Math.min(scene.turn + 1, 9999);
  };
  if (action === "manifest") {
    const wanted = bladeForms[scene.obstacle];
    const known = Object.values(bladeForms);
    const hand = input.choice || "automatic";
    if (hand !== "automatic" && !known.includes(hand)) return { scene, event: "Choose a blade form before attempting the obstacle." };
    const form = hand === "automatic" ? wanted : hand;
    if (!wanted) return { scene, event: "The path is already clear." };
    remember();
    if (form === wanted) {
      scene.obstacle = "Clear";
      return { scene, event: form + " manifested and cleared the path.", form, chosenBy: hand === "automatic" ? "blade" : "wielder" };
    }
    return { scene, event: form + " manifested. The obstacle remains.", form, chosenBy: "wielder" };
  }
  if (action === "weave") {
    if (!["roaming", "held"].includes(scene.shadow)) return { scene, event: "The Loom has finished with this shadow." };
    remember();
    if (scene.shadow === "roaming") {
      scene.shadow = "held";
      return { scene, event: "The web holds the shadow. Weave again to transform it." };
    }
    scene.shadow = "converted";
    scene.threads = Math.min(6, scene.threads + 1);
    return { scene, event: "The Loom converted the held shadow into a thread of light." };
  }
  if (action === "dream") {
    if (!input.text.trim()) return { scene, event: "Enter a dream for the Dream Weavers." };
    remember();
    scene.dreams = [...scene.dreams, input.text.slice(0, 160)].slice(-5);
    return { scene, event: "The Dream Weavers recorded the dream." };
  }
  if (action === "timeline") {
    const previousFrame = scene.history.pop();
    if (!previousFrame) return { scene, event: "There is no earlier scene to visit." };
    Object.assign(scene, previousFrame);
    scene.turn = Math.min(scene.turn + 1, 9999);
    return { scene, event: "The Loom returned to the previous scene state." };
  }
  if (action === "retire") {
    if (!["roaming", "held"].includes(scene.shadow)) return { scene, event: "There is no active shadow in this scene." };
    remember();
    scene.shadow = "retired";
    return { scene, event: "The Dark Slayer retired the shadow in this scene." };
  }
  if (!scene.threads) return { scene, event: "The sanctuary needs a thread recovered by the Loom." };
  if (scene.sanctuary) return { scene, event: "The sanctuary is already woven." };
  remember();
  scene.threads--;
  scene.sanctuary = true;
  return { scene, event: "The Dark Sleyer wove the New World’s sanctuary.", canon: "Innocence is God" };
}

async function hash(value) {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function execute(action, input, scene) {
  const text = input.text;
  const lines = text.split(/\r?\n/);
  const distinct = [...new Set(lines.map(line => line.trim()).filter(Boolean))];
  if (["manifest", "weave", "dream", "timeline", "retire", "sanctuary"].includes(action)) return turn(action, input, scene);
  if (action === "observe") return { exact: text, characters: [...text].length, lines: text ? lines.length : 0, sha256: await hash(text) };
  if (action === "clear") return { cleaned: distinct.join("\n"), removedOrCombined: lines.length - distinct.length, originalHash: await hash(text) };
  if (action === "verify") {
    const actual = await hash(text);
    return { actual, expected: input.expected || null, matches: input.expected ? input.expected.toLowerCase() === actual : null };
  }
  if (action === "restore") {
    const encoded = new TextEncoder().encode(text);
    const restored = new TextDecoder("utf-8", { ignoreBOM: true }).decode(encoded);
    return { restored, bytes: encoded.length, sha256: await hash(restored), exactRoundTrip: restored === text };
  }
  if (action === "relate") {
    const first = words(text), second = words(input.compare);
    const shared = [...first].filter(term => second.has(term)).sort();
    return { sharedTerms: shared, leftOnly: [...first].filter(term => !second.has(term)).sort(), rightOnly: [...second].filter(term => !first.has(term)).sort() };
  }
  if (action === "classify") {
    const groups = { heading: [], action: [], question: [], observation: [] };
    for (const line of distinct) {
      const kind = /\?$/.test(line) ? "question" : /^#\s|:$/.test(line) ? "heading" :
        /^(?:[-*]\s|\d+[.)]\s|todo\b|build\b|verify\b|check\b)/i.test(line) ? "action" : "observation";
      groups[kind].push(line);
    }
    return groups;
  }
  if (action === "plan") return { steps: distinct.map((description, index) => ({
    step: index + 1, description, after: index || null,
  })), verification: ["Review each completed step against its source wording.", "Record the result with its receipt."] };
  return { draft: distinct.join("\n\n"), sourceLines: distinct.length };
}

function boundedText(value, limit) {
  if (typeof value !== "string") return "";
  if (value.length > limit) throw new RangeError("Text exceeds " + limit + " characters");
  return value;
}

export async function runProfile(profile, request) {
  const action = request.action;
  if (!profile.capabilities.some(capability => capability.id === action)) throw new RangeError("This profile does not have that action");
  const input = {
    text: boundedText(request.text, 12000),
    compare: boundedText(request.compare, 12000),
    expected: boundedText(request.expected, 64),
    choice: typeof request.choice === "string" ? request.choice : "",
  };
  const before = safeScene(request.scene);
  const result = await execute(action, input, before);
  const proof = { profile: profile.id, source: profile.source, action, inputSha256: await hash(JSON.stringify({ input, before })),
    outputSha256: await hash(JSON.stringify(result)) };
  return { profile: { id: profile.id, name: profile.name, source: profile.source }, action, result,
    receipt: { ...proof, id: await hash(JSON.stringify(proof)), issuedAt: new Date().toISOString() } };
}

export async function runRelay(plan, request) {
  if (plan.length < 2 || plan.length > 5 ||
      plan.some(({ profile, action }) => !profile.capabilities.some(item => item.id === action))) {
    throw new RangeError("Choose two to five actions from the selected profiles");
  }
  const original = boundedText(request.text, 12000);
  let working = original;
  let scene = safeScene(request.scene);
  const steps = [];
  for (const { profile, action } of plan) {
    const step = await runProfile(profile, { ...request, action, text: working, scene });
    steps.push(step);
    const { result } = step;
    if (result.scene) scene = result.scene;
    if (typeof result.cleaned === "string") working = result.cleaned;
    if (typeof result.draft === "string") working = result.draft;
    if (Array.isArray(result.action) && result.action.length) working = result.action.join("\n");
  }
  const inputSha256 = await hash(original);
  const outputSha256 = await hash(JSON.stringify({ scene, working }));
  const seal = await hash(JSON.stringify({ inputSha256, outputSha256, steps: steps.map(step => step.receipt.id) }));
  return { profile: steps[0].profile, result: { scene, working }, steps,
    receipt: { id: seal, inputSha256, outputSha256, issuedAt: new Date().toISOString() } };
}
