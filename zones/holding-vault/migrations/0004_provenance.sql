CREATE TABLE IF NOT EXISTS zone_reader_provenance_nodes (
  node_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  locator TEXT NOT NULL,
  resolution TEXT NOT NULL CHECK(resolution IN ('indexed','verified-leaf','external-reference','unresolved')),
  details_json TEXT NOT NULL CHECK(json_valid(details_json))
) STRICT;

CREATE TABLE IF NOT EXISTS zone_reader_provenance_edges (
  source_key TEXT NOT NULL REFERENCES zone_reader_provenance_nodes(node_key),
  target_key TEXT NOT NULL REFERENCES zone_reader_provenance_nodes(node_key),
  relation TEXT NOT NULL,
  PRIMARY KEY(source_key,target_key,relation)
) STRICT;

CREATE INDEX IF NOT EXISTS zone_reader_provenance_reverse_idx
  ON zone_reader_provenance_edges(target_key,source_key,relation);
