import { answerKeys, canonicalAnswers } from "../shared/merkle.js";

const descriptorKeys = ["tier","domain","item_a_label","item_b_label","item_c_label","clue_prompt"];
const allowedTiers = new Set(["Tier 1: Kids","Tier 2: Youth","Tier 3: Adults"]);
const allowedDomains = new Set(["Biology","Mechanics","Physics","Nature","Energy"]);
const ambiguous = /\b(?:maybe|perhaps|it\s+seems|might\s+be)\b/iu;
const draftKeys = new Set([...descriptorKeys, ...answerKeys]);
export const twoItemPair = "N/A — Two-Item Pair";

export function checkDraft(draft) {
  if (!draft || typeof draft !== "object" || Array.isArray(draft) ||
      Object.keys(draft).length !== draftKeys.size ||
      [...draftKeys].some(key => !Object.hasOwn(draft,key))) {
    throw new TypeError("Expected exactly the Blueprint descriptor and answer fields");
  }
  if (!allowedTiers.has(draft.tier) || !allowedDomains.has(draft.domain)) {
    throw new TypeError("Invalid tier or domain");
  }
  const clean = { ...draft, item_c_label: draft.item_c_label === null ? twoItemPair : draft.item_c_label };
  for (const [key, value] of Object.entries(clean)) {
    if (typeof value !== "string" || value.length > 1200 || !value.trim() || value.includes("\0")) {
      throw new TypeError("Invalid Blueprint field: " + key);
    }
    if ((answerKeys.includes(key) || key === "clue_prompt") && ambiguous.test(value)) {
      throw new TypeError("Claim requires clarification in: " + key);
    }
  }
  canonicalAnswers(clean);
  return clean;
}
