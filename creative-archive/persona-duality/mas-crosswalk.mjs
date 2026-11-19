// PD-008: read-only, source-separated relationship crosswalk.
export const RELATIONSHIPS = Object.freeze([
  { left: "SANTA KRAMPUS", right: "SANTA SUPMARK", group: "MAS", provenance: "repository_canon", status: "recorded" },
  { left: "SANTA GLAMPUS", right: "SANTA SUPMALG", group: "SPIRIT", provenance: "repository_canon", status: "recorded" }
]);
export const SPELLINGS = Object.freeze([
  { spelling: "SANTA SUPMALG", source: "creative-archive/nexus-mas-spirit/canon.json", role: "repository_current" },
  { spelling: "SANTA SUPMALS", source: "creative-archive/nexus-mas-spirit/canon.json", role: "repository_earlier_variant" }
]);
export function crosswalk(canon) {
  if (!canon || !Array.isArray(canon.nodes)) throw new TypeError("canon.nodes required");
  const names = new Set(canon.nodes.map(n => n.name));
  for (const {left,right} of RELATIONSHIPS) {
    if (!names.has(left) || !names.has(right)) throw new Error("Missing source-canon relationship node");
  }
  for (const {spelling} of SPELLINGS) if (!names.has(spelling)) throw new Error("Missing source spelling");
  return { schema: 1, sourceVersion: canon.version, relationships: RELATIONSHIPS.map(x=>({...x})), spellings: SPELLINGS.map(x=>({...x})), unresolved: ["Prior material conflicts with the repository's latest-spelling claim; verify against original author source before changing canon."], publishesPrivateAssets: false };
}
