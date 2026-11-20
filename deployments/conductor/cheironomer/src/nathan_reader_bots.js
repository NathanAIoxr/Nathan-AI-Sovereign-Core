const queries = Object.freeze({
  github: ["kind LIKE 'GitHub %'", "GitHub"],
  cloudflare: ["(kind LIKE 'D1 %' OR kind LIKE 'Cloudflare %' OR kind IN ('Holding zone','Staged record'))", "Cloudflare"],
  links: ["1=1", "Provenance"]
});

export async function readOwnedGraph(env, source, cursor = "") {
  if (!Object.hasOwn(queries,source) || typeof cursor !== "string" || cursor.length>1024) throw new TypeError("invalid_source");
  const [condition,label] = queries[source];
  const out = await env.VAULT_READ.prepare(
    `SELECT node_key,kind,resolution,CASE WHEN json_valid(details_json) THEN json_extract(details_json,'$.scan_status') END AS scan_status
      FROM zone_reader_provenance_nodes WHERE node_key>? AND ${condition} ORDER BY node_key LIMIT 26`
  ).bind(cursor).all();
  const rows=out.results.slice(0,25).map(row=>({
    nodeId:row.node_key,kind:row.kind,status:row.scan_status??row.resolution,
    isTerminalRoot:row.scan_status==="no-static-reference"
  }));
  return {source:label,rows,next:out.results.length>25?rows.at(-1).nodeId:null};
}
