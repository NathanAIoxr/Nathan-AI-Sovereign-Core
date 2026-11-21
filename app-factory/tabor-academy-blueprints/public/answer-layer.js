export const answerColumns = [
  ["core_parts", "Core parts"], ["operations", "Operations"],
  ["traits_attributes", "Traits and attributes"], ["scale_medium", "Scale and medium"],
  ["input_output", "Input and output"], ["flow_direction", "Flow direction"],
  ["modification_exemption", "Modification or exemption"], ["blind_spot_note", "Blind spot"],
];

export function answerLayer(document, lesson, open) {
  const container = document.createElement(open ? "dl" : "div");
  container.id = `answers-${lesson.id}`;
  container.hidden = !open;
  if (!open) return container;
  container.className = "answers";
  for (const [key, label] of answerColumns) {
    const pair = document.createElement("div");
    pair.className = "answer";
    const term = document.createElement("dt");
    term.textContent = label;
    const definition = document.createElement("dd");
    definition.textContent = lesson[key];
    pair.append(term, definition);
    container.append(pair);
  }
  return container;
}
