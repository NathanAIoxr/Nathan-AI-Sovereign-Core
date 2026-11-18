const edge = (name, path = "/") => `https://${name}.nathantaboract.workers.dev${path}`;
export const namespace = "nathan-tabor-platforms";
export const hubName = "nathan-tabor-hyper-federation";
export const owner = "Nathan Tabor";
export const languageTarget = 66666;
export const source = {
  title: "Glottolog CLDF v5.4",
  credits: "Harald Hammarström, Robert Forkel, Martin Haspelmath and Sebastian Bank",
  license: "CC BY 4.0",
  page: "https://glottolog.org/meta/downloads",
  download: "https://raw.githubusercontent.com/glottolog/glottolog-cldf/v5.4/cldf/languages.csv",
  sha256: "ecadbfd440f3d0c28182f676b7e49c6e38fd3d40774c7ae3d90bf28ca137fe90"
};
export const platforms = [
  ["languages", "Human Languages and Tower of Babel", "Ancient and modern language, dialect, family and sign-language discovery.", [["Tower of Babel", edge("tower-of-babel-by-nathan-tabor")]]],
  ["wordplay", "Wordplay and Sound", "Phonetics, intrusive R, S forms, cadence and rhythm.", [["Wordplay Matrix", edge("epenthesis-word-matrix", "/explore")], ["Rhythm Matrix", edge("tabor-rhythm-matrix")]]],
  ["compute", "Super Heroine and Compute", "Hypercomputer plans, matrix experiments, the 50-node federation and bounded AI jobs.", [["Hypercomputer", edge("tabor-supercomputer-federation", "/v1/hypercomputer")], ["Federation", edge("tabor-supercomputer-federation")], ["AI pipeline health", edge("tabor-federation-pipeline", "/health")]]],
  ["memory", "Memory and Storage", "Memory tiers, storage models and capacity planning.", [["RAM and storage", edge("tabor-raw-memory-storage")], ["450 TB capacity model", edge("tabor-supercomputer-federation", "/v1/plan?systems=1")]]],
  ["cloud", "Cloud, Networks and Satellite Models", "Digital infrastructure and edge network models.", [["Sovereign Digital Stack demo", edge("tabor-sovereign-digital-stack", "/v1/demo")], ["Connected infrastructure health", edge("tabor-supercomputer-federation", "/v1/services")]]],
  ["bitcoin", "Bitcoin and Cryptocurrency", "Mining infrastructure planning and a bounded proof-of-work demonstration.", [["Mining Hub service status", edge("tabor-supercomputer-federation", "/v1/services")], ["Synthetic Bitcoin demo", edge("tabor-supercomputer-federation", "/v1/bitcoin-demo")]]],
  ["moment", "MOMENT Gaming", "Gaming latency models, the 1,000-seat digital allocation, and existing games.", [["Digital allocation", edge("tabor-supercomputer-federation", "/v1/digital")], ["Dual Screen Arcade", edge("dual-screen-arcade")]]],
  ["outside-box", "Outside Box and Lisssarrr", "Defensive provenance, evidence preservation and recovery exercises.", [["Security project register", edge("tabor-security-project-register")], ["Recovery exercises", edge("tabor-supercomputer-federation", "/v1/nodes/node-050/lisssarrr?exercise=backup-restore")]]],
  ["world", "Tabor World and Family", "Tabor World, Saturday Morning, and the Family Federation.", [["World Hub", edge("tabor-world-hub")], ["Saturday Morning", edge("tabor-saturday-morning")], ["Family Federation", edge("tabor-family-federation")], ["Cannonball Stack", edge("tabor-cannonball-stack")]]],
  ["library", "Library, History and Scripture", "Independent gateways to books, research and scripture projects.", [["Nathan Tabor Library (sign-in required)", edge("nathan-tabor-library")], ["Bibletopia", edge("bibletopia")], ["Universal Library Engine", edge("tabor-universal-library-engine")]]],
  ["github", "GitHub Source and Releases", "Source control and review for the federation and existing projects.", [["Sovereign Core", "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core"], ["Federation source", "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/tabor/workers-platforms-federation/workers-platforms"], ["Outside Box draft", "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/320"], ["Wordplay draft", "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/328"]]]
].map(([id, title, purpose, links]) => ({
  id, title, purpose, links: links.map(([label, url]) => ({ label, url })),
  route: `/p/${id}/`, limits: { cpuMs: 30, subRequests: 5 }
}));
