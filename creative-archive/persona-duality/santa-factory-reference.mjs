import { INTEGRATIONS, NODES } from "./registry.mjs";

/** Read-only integration plan. Never modifies Santa Claus Factory or its storage. */
export function santaFactoryReference() {
  const ref = INTEGRATIONS.find(x => x.id === "santa-factory");
  if (!ref || ref.type !== "github_path" || ref.mode !== "reference_only" ||
      ref.value !== "app-factory/sites/santa-claus-factory") {
    throw new Error("Santa Factory reference is missing or not read-only");
  }
  const santa = NODES.find(x => x.id === "santa");
  if (!santa || santa.kind !== "persona") throw new Error("Santa persona missing");
  return Object.freeze({
    project: "Santa Claus Factory",
    source_path: ref.value,
    relationship: "thematically_related",
    persona_id: santa.id,
    mode: "reference_only",
    allowed_operations: Object.freeze(["read"]),
    deployment_requested: false,
    external_dispatch: false,
    status: "review_only_not_connected"
  });
}
