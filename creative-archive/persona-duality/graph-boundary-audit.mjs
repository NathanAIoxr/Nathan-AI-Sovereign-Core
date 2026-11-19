// PD-010: validate public graph integrity without rewriting source canon.
const allowedAssertions = new Set(["creative_crosslink"]);
export function auditGraph(nodes, edges, owner = "Nathan Tabor") {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) throw new TypeError("Graph arrays required");
  const ids = new Set(), names = new Map(), errors = [];
  for (const node of nodes) {
    if (typeof node.id !== "string" || !node.id.trim() || ids.has(node.id)) errors.push("Invalid or duplicate node ID");
    ids.add(node.id);
    if (typeof node.name !== "string" || !node.name.trim()) errors.push("Missing node name");
    if (node.kind === "creator") names.set(node.id, node.name);
    if (Object.keys(node).some(k => /password|token|secret|private_?key|email|address/i.test(k))) errors.push("Private field in public node");
  }
  if (![...names.values()].includes(owner)) errors.push("Missing creator attribution");
  for (const edge of edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push("Dangling edge");
    if (typeof edge.relation !== "string" || !edge.relation.trim()) errors.push("Unlabeled relationship");
    if (!allowedAssertions.has(edge.assertion)) errors.push("Unreviewed factual assertion");
  }
  const variants = ["SANTA SUPMALG", "SANTA SUPMALS"];
  for (const variant of variants) if (!nodes.some(n => n.name === variant)) errors.push("Missing literal spelling variant: " + variant);
  return {ok: errors.length === 0, errors, nodeCount: nodes.length, edgeCount: edges.length, modifiesCanon: false, publishesPrivateAssets: false};
}
