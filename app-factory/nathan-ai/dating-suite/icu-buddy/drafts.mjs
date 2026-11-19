export const TEMPLATES = Object.freeze({
  reflect: "I want to take a little time to think this through before I reply.",
  clarify: "I want to understand what each of us is looking for. How do you see it?",
  boundary: "I want to be clear about a boundary that matters to me. Can we talk about it?",
  stepBack: "I need to step back from this conversation for now. Please give me some space.",
});

export function makeDraft(intent, note = "") {
  if (!Object.hasOwn(TEMPLATES, intent) || typeof note !== "string" || note.length > 300) {
    throw new TypeError("Choose a starting point and keep your note within 300 characters.");
  }
  const context = note.trim();
  return context ? `${TEMPLATES[intent]}\n\n${context}` : TEMPLATES[intent];
}
