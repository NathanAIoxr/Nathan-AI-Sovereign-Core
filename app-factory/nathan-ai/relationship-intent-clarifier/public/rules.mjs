export const INTENTS = Object.freeze([
  "Friendship", "Dating", "Casual dating", "Long-term relationship",
  "Non-monogamous relationship", "Intimacy", "Discuss boundaries", "Unsure",
]);

export function evaluateIntent(input) {
  if (!input || !INTENTS.includes(input.firstIntent) || !INTENTS.includes(input.secondIntent) ||
      typeof input.blocked !== "boolean" || typeof input.expired !== "boolean") {
    throw new TypeError("Choose two valid intents and provide the conversation status.");
  }

  if (input.blocked) {
    return { state: "blocked", detail: "A participant has blocked the conversation." };
  }
  if (input.expired) {
    return { state: "expired", detail: "The conversation window has expired. Ask for a new invitation." };
  }
  if (input.firstIntent === "Unsure" || input.secondIntent === "Unsure" || input.firstIntent !== input.secondIntent) {
    return { state: "clarify", detail: "Ask what each person wants before making plans." };
  }
  return { state: "aligned", detail: "Both selected the same intent. Ask directly before taking any next step." };
}
