/** PD-009: public reference only. No Santa Factory assets or code are copied. */
export const santaFactoryReference = Object.freeze({
  id: "santa-factory",
  project: "Santa Claus Factory",
  sourcePath: "app-factory/sites/santa-claus-factory/index.html",
  atlasPath: "creative-archive/persona-duality/registry.mjs",
  sourceClass: "existing_project_reference",
  relationship: "creative_crosslink_not_identity",
  transport: "none",
  permissions: "read_only",
  deploy: false,
  dispatch: false,
  originalAssetsIncluded: false,
  authorWordingModified: false
});
export function validateSantaFactoryReference(reference = santaFactoryReference) {
  if (reference.id !== "santa-factory" || reference.sourcePath !== "app-factory/sites/santa-claus-factory/index.html") throw new Error("Unexpected source identity");
  if (reference.transport !== "none" || reference.permissions !== "read_only" || reference.deploy !== false || reference.dispatch !== false || reference.originalAssetsIncluded !== false || reference.authorWordingModified !== false) throw new Error("Reference-only boundary violated");
  return true;
}
