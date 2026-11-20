export const archive = Object.freeze({
  title: "Tabor Academy integrated blueprint",
  bytes: 15947,
  sha256: "a183c2a0e24d77c546056c948f6adb97a3cc2a9a83d9833b530f766cd0d43f3a",
  access: "owner archive"
});

export const sources = Object.freeze({
  edubba: { title: "The Old Babylonian School · ORACC", url: "https://build-oracc.museum.upenn.edu/obmc/OldBabylonianSchool/index.html" },
  buddha: { title: "Monier-Williams Sanskrit-English Dictionary · University of Hyderabad", url: "https://sanskrit.uohyd.ac.in/SKT/MW/180.html" },
  egypt: { title: "Hieroglyphs: Unlocking Ancient Egypt · British Museum", url: "https://www.britishmuseum.org/sites/default/files/2022-10/Hieroglyphs_unlocking_ancient_Egypt_large_print_guide_The_British_Museum.pdf" },
  schole: { title: "σχολή · Logeion", url: "https://www.logeion.org/%CF%83%CF%87%CE%BF%CE%BB%CE%AE" },
  akademeia: { title: "Plato: The Academy · Internet Encyclopedia of Philosophy", url: "https://iep.utm.edu/plato-academy/" },
  paideia: { title: "παιδεία · Logeion", url: "https://logeion.uchicago.edu/%CF%80%CE%B1%CE%B9%CE%B4%CE%B5%CE%B9%CC%81%CE%B1" },
  froebel: { title: "Froebel Trust timeline", url: "https://www.froebel.org.uk/about-us/about-the-trust" },
  header: { title: "Bitcoin block header reference", url: "https://developer.bitcoin.org/reference/block_chain.html#block-headers" },
  goose: { title: "Golden Goose mining methods and Bitcoin Core regtest", url: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/zone/modern-day-real-life-golden-goose/app-factory/nathan-ai/modern-day-real-life-golden-goose" },
  octopus: { title: "Octopus Mirror Engine source", url: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/octopus-mirror-engine" },
  pooper: { title: "Cryptocurrency Pooper source and tests", url: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/zone/cryptocurrency-pooper/app-factory/nathan-ai/cryptocurrency-pooper" },
  sovereignty: { title: "Sovereignty OS sources", url: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/projects/sovereignty-os" }
});

export const records = Object.freeze([
  { id: "new-sovereignty", title: "New Sovereignty", kind: "independent project",
    detail: "A shared path between Academy lessons, primary sources, verification and independent running projects." },
  { id: "tabor-academy", title: "Tabor Academy", kind: "independent project",
    detail: "Z → A for seeing how an outcome works. A → Z for building it again. 1 → ∞ → 0 for expansion and clearing.", deployment: "tabor-academy/tabor-academy" },
  { id: "library-of-tabor", title: "Library of Tabor", kind: "Academy pillar",
    detail: "Preserves the manuscript and Voice Box transcript as exact source bytes. Uses separate title, timeline, source and classification fields." },
  { id: "tabor-concordance", title: "Tabor Concordance", kind: "Academy pillar",
    detail: "Compares sound, spelling, structure and documented roots. Each sound-alike retains its own language and meaning." },
  { id: "hop-in", title: "Hop In Chatbox & MAKE AI YOURS", kind: "Academy pillar",
    detail: "Go from a result to its source, rebuild it, and check whether your result matches. Swap the direction to start at the source." },
  { id: "innocence-firewall", title: "Sovereign Innocence Firewall", kind: "Academy pillar",
    detail: "RETAIN_1 passes checks for consent, protection and reproducibility. PURGE_0 keeps an entry out of execution and preserves its audit trail." },
  { id: "edubba-buddha", title: "Edubba → Buddha", kind: "Academy lesson",
    detail: "The author's reading starts from Edubba as the physical blueprint and turns toward Buddha as the later title.",
    observation: "ORACC documents é-dub-ba-a as a Mesopotamian school, library and scriptorium. The Sanskrit dictionary documents buddha with senses including awakened and understood.",
    authorInterpretation: "Edubba came first as the physical blueprint. Buddha came afterward in the proposed structural rotation.",
    historicalStatus: "The cited sources document the two terms separately. A line of historical transmission between them remains unverified.",
    sources: ["edubba", "buddha"] },
  { id: "egyptian-instruction", title: "Egyptian scribal instruction", kind: "Academy lesson",
    detail: "The attachment gives At-sebayt as a room or house of instruction. The museum evidence describes copying, dictation and writing exercises in scribal training. The proposed transliteration remains to be checked.", sources: ["egypt"] },
  { id: "schole", title: "Scholē", kind: "Academy lesson",
    detail: "Trace σχολή from leisure and rest to learned discussion and the place where instruction happens.", sources: ["schole"] },
  { id: "akademeia", title: "Akadēmeia", kind: "Academy lesson",
    detail: "Trace Plato’s Academy back to the Athenian site and public gymnasium where the name was already in use.", sources: ["akademeia"] },
  { id: "paideia", title: "Paideia", kind: "Academy lesson",
    detail: "Compare the senses of παιδεία in child-rearing, education, training and culture.", sources: ["paideia"] },
  { id: "kindergarten", title: "Kindergarten", kind: "Academy lesson",
    detail: "Compare the plant-and-garden analogy with Fröbel’s 1837 play institute and his later use of the name Kindergarten.", sources: ["froebel"] },
  { id: "golden-goose", title: "The Modern-Day Real-Life Golden Goose by Nathan Tabor", kind: "independent project",
    detail: "Owns the nine Bitcoin traversal modes, eight-arm refinery, receipts and allocations. The original lab and regtest continue to use their own code.",
    deployment: "modern-day-real-life-golden-goose-holding/modern-day-real-life-golden-goose", sources: ["goose"],
    lab: "https://tabor-bridge.nathantaboract.workers.dev/golden-goose/" },
  { id: "bitcoin-genesis", title: "Bitcoin genesis proof", kind: "reproducible lesson",
    detail: "Begin with the matching hash, then trace back through the numeric target, 80-byte header and nonce. Rebuild the result using two SHA-256 passes.",
    sources: ["header", "goose"] },
  { id: "octopus-mirror-engine", title: "Octopus Mirror Engine", kind: "independent project",
    detail: "Bounded forward and reverse work verification and Conductor dispatch. Its original source stays in its own project.", sources: ["octopus"] },
  { id: "cryptocurrency-pooper", title: "The Cryptocurrency Pooper by Nathan Tabor", kind: "independent project",
    detail: "Delftia outer filter, Cupriavidus inner refinery, signed cleanup receipts, and an independent capped POOPER contract tested on a local chain.",
    deployment: "cryptocurrency-pooper-holding/cryptocurrency-pooper", sources: ["pooper"] },
  { id: "sovereignty-os", title: "Sovereignty OS", kind: "independent project",
    detail: "Existing independent-apps registry and permissioned project links.", sources: ["sovereignty"] }
]);

export const links = Object.freeze([
  ["new-sovereignty", "tabor-academy", "connects to the Academy", "opens New Sovereignty"],
  ["new-sovereignty", "sovereignty-os", "references the independent-project registry", "references the New Sovereignty project"],
  ["tabor-academy", "library-of-tabor", "anchors lessons in original records", "provides source records to"],
  ["tabor-academy", "tabor-concordance", "looks up phonetics and documented roots in", "contributes linguistic material to"],
  ["tabor-academy", "hop-in", "teaches through", "returns learner checks to"],
  ["tabor-academy", "innocence-firewall", "gates publication and execution through", "applies its checks to"],
  ["tabor-concordance", "edubba-buddha", "examines the phonetic rotation in", "returns terms and independent sources to"],
  ["tabor-concordance", "egyptian-instruction", "examines", "returns a scribal training example to"],
  ["tabor-concordance", "schole", "traces", "returns Greek usage to"],
  ["tabor-concordance", "akademeia", "traces", "returns an institutional place name to"],
  ["tabor-concordance", "paideia", "traces", "returns Greek senses of education to"],
  ["tabor-concordance", "kindergarten", "traces", "returns a tool-and-metaphor example to"],
  ["hop-in", "bitcoin-genesis", "reconstructs", "supplies a practical exercise for"],
  ["innocence-firewall", "bitcoin-genesis", "requires reproducible proof from", "returns its pass or fail to"],
  ["bitcoin-genesis", "golden-goose", "uses the deployed method as a worked example from", "has its method checked by"],
  ["golden-goose", "octopus-mirror-engine", "references the forward-and-reverse verification method in", "supplies reference mechanics to"],
  ["golden-goose", "cryptocurrency-pooper", "compares cleanup receipts with", "supplies its independent receipt model to"]
]);

const byId = new Map(records.map(record => [record.id, record]));
export function trace(from, to) {
  if (!byId.has(from) || !byId.has(to)) return null;
  const previous = new Map([[from, null]]);
  const waiting = [from];
  while (waiting.length) {
    const here = waiting.shift();
    if (here === to) {
      const route = [];
      let step = here;
      while (step !== from) {
        const { before, relation } = previous.get(step);
        route.push({ from: before, relation, to: step });
        step = before;
      }
      return route.reverse();
    }
    for (const [left, right, forward, reverse] of links) {
      if (left !== here && right !== here) continue;
      const [next, relation] = left === here ? [right, forward] : [left, reverse];
      if (previous.has(next)) continue;
      previous.set(next, { before: here, relation });
      waiting.push(next);
    }
  }
  return null;
}

export function gate({ consent, protectsInnocence, reproducible } = {}) {
  return consent === true && protectsInnocence === true && reproducible === true ? "RETAIN_1" : "PURGE_0";
}
