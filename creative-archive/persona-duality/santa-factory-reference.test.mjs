import test from "node:test";
import assert from "node:assert/strict";
import { santaFactoryReference, validateSantaFactoryReference } from "./santa-factory-reference.mjs";
test("Santa Factory link remains source-specific and read-only", () => {
  assert.equal(validateSantaFactoryReference(), true);
  assert.equal(santaFactoryReference.relationship, "creative_crosslink_not_identity");
});
test("rejects dispatch, publishing, copied assets or altered source identity", () => {
  for (const patch of [{dispatch:true},{deploy:true},{originalAssetsIncluded:true},{authorWordingModified:true},{sourcePath:"private/source"},{transport:"fetch"}]) {
    assert.throws(() => validateSantaFactoryReference({...santaFactoryReference,...patch}));
  }
});
