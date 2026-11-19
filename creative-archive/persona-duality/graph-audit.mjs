/** Public-only graph integrity audit; never dereferences private archives or external URLs. */
export function auditGraph(nodes, edges) {
  const errors = [];
  const ids = new Set();
  for (const node of nodes) {
    if (typeof node.id !== "string" || !node.id) errors.push("missing_node_id");
    if (ids.has(node.id)) errors.push("duplicate_node:" + node.id);
    ids.add(node.id);
    if (node.kind === "scriptural_anchor" && !/scriptur|KJV|textual/i.test(node.summary || "")) errors.push("scripture_unlabeled:" + node.id);
  }
  for (const [i, edge] of edges.entries()) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push("dangling_edge:" + i);
    if (edge.from === edge.to) errors.push("self_identity:" + i);
    if (edge.assertion !== "creative_crosslink") errors.push("unlabeled_interpretation:" + i);
    if (/^(same_as|is_identical_to|verified_historical_fact)$/.test(edge.relation)) errors.push("identity_or_fact_claim:" + i);
  }
  return { ok: errors.length === 0, errors, node_count: nodes.length, edge_count: edges.length };
}
