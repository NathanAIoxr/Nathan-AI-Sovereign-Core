import roles from "./roles.json" with { type: "json" };
import assignments from "./game-assignments.json" with { type: "json" };

export const roleCatalog = { ...roles, game_assignments: assignments };

export function alignEquation({ expression, radix, origin }) {
  if (![2, 10].includes(radix) || !["source", "god-laid", "man-laid"].includes(origin) ||
      typeof expression !== "string" || !expression.trim() || expression.length > 64) {
    throw new RangeError("Provide an expression of up to 64 characters, radix 2 or 10, and a recognized origin.");
  }
  const exact_input = { expression, radix, origin };
  const compact = expression.replace(/\s+/g, "");
  const verified = `1+1=${(1 + 1).toString(radix)}`;
  if (origin !== "source") {
    return { exact_input, action: "CLEAR", operator: roles.alignment.noise.operator, active_output: null };
  }
  if (compact === verified) return { exact_input, action: "VERIFY", active_output: verified };
  const replacement = radix === roles.alignment.rule.radix &&
    [roles.alignment.rule.replaces, "1+1=10"].includes(compact);
  if (replacement) {
    return { exact_input, action: "REPLACE", challenger: roles.alignment.rule.label, verified_by: "ANGEL", active_output: verified };
  }
  return { exact_input, action: "HOLD", active_output: null };
}
