import { byteOrder, describe, directions, paths, REFLECT_X, REFLECT_Y, REVERSE, splitText, textOrder } from "./engine.mjs";

const el = id => document.getElementById(id);
const entry = el("entry");
const file = el("file");
const message = el("message");
const encoder = new TextEncoder();
const cards = [];
const results = [];
const maxFileSize = 16 * 1024 * 1024;
let source = null;
let trail = [];
let fileRead = 0;

function flip(element, bits) {
  element.classList.add("flip-view");
  element.dataset.x = Boolean(bits & REFLECT_X);
  element.dataset.y = Boolean(bits & REFLECT_Y);
}

function preview(bits, limit) {
  if (!source) return "0";
  if (source.kind === "Text") return textOrder(source.parts, bits, limit);
  return Array.from(byteOrder(source.bytes, bits, limit), b => b.toString(16).padStart(2, "0")).join(" ");
}

function current() {
  return trail.at(-1)?.after ?? 0;
}

function render() {
  const bits = current();
  const input = el("input-state");
  input.dataset.state = source ? "1" : "0";
  input.textContent = source ? "1 · " + source.kind : "0 · Nothing";
  el("mode").textContent = describe(bits);
  const content = el("reflection");
  content.dataset.empty = !source;
  content.textContent = source?.bytes.length === 0 ? "∅" : preview(bits, source?.kind === "File" ? 64 : 240);
  flip(content, bits);

  const size = source ? source.bytes.length.toLocaleString() + " bytes" : "Nothing in the box.";
  const clipped = source?.kind === "Text" ? source.parts.length > 240 : source?.bytes.length > 64;
  const format = source?.kind === "File" ? " · Hex view" : "";
  const shown = clipped ? " · Preview" : "";
  el("reflection-note").textContent = size + format + shown;
  el("file-note").textContent = source?.name ?? "Files up to 16 MiB. Processing stays on this device.";
  el("export").disabled = !source;
  el("undo").disabled = !trail.length;
  el("reset").disabled = !trail.length;
  const text = trail.slice(-6).map(item => item.label).join(" → ");
  el("trail").textContent = !trail.length ? "Starting frame" : (trail.length > 6 ? "… → " : "") + text;

  for (const card of cards) {
    const next = bits ^ card.route.bits;
    card.button.setAttribute("aria-pressed", String(trail.at(-1)?.index === card.index));
    card.sample.textContent = source?.bytes.length === 0 ? "∅" : (preview(next, source?.kind === "File" ? 2 : 5).replace(/\s+/g, " ") || "·");
    flip(card.sample, next);
  }
  for (const [value, button] of results.entries()) {
    button.setAttribute("aria-pressed", String(value === bits));
  }
}

function apply(label, after, index) {
  trail.push({ label, before: current(), after, index });
  render();
  message.textContent = label + ". " + describe(after) + ".";
}

for (const [rowIndex, direction] of directions.entries()) {
  const row = document.createElement("section");
  const heading = document.createElement("h3");
  heading.className = "row-title";
  heading.textContent = direction.mark + "  " + direction.label;
  row.append(heading);
  const grid = document.createElement("div");
  grid.className = "row-cards";
  const start = rowIndex * 3;
  for (const [offset, route] of paths.slice(start, start + 3).entries()) {
    const index = start + offset;
    const button = document.createElement("button");
    const label = document.createElement("span");
    const sample = document.createElement("span");
    label.textContent = route.mirror;
    sample.className = "preview";
    sample.setAttribute("aria-hidden", "true");
    button.className = "card";
    button.setAttribute("aria-label", route.direction + " · " + route.mirror);
    button.append(label, sample);
    button.onclick = () => apply(route.direction + " · " + route.mirror, current() ^ route.bits, index);
    grid.append(button);
    cards.push({ route, button, sample, index });
  }
  row.append(grid);
  el("matrix").append(row);
}

for (let bits = 0; bits < 8; bits++) {
  const button = document.createElement("button");
  button.textContent = describe(bits);
  button.onclick = () => apply("View " + describe(bits), bits, null);
  el("all-states").append(button);
  results.push(button);
}

entry.addEventListener("input", () => {
  fileRead++;
  file.value = "";
  const value = entry.value;
  source = value.length ? { kind: "Text", bytes: encoder.encode(value), parts: splitText(value) } : null;
  message.textContent = "";
  render();
});

file.addEventListener("change", async () => {
  const selection = file.files[0];
  if (!selection) return;
  const request = ++fileRead;
  if (selection.size > maxFileSize) {
    file.value = "";
    message.textContent = "This file exceeds the 16 MiB limit.";
    return;
  }
  try {
    const bytes = new Uint8Array(await selection.arrayBuffer());
    if (request !== fileRead) return;
    entry.value = "";
    source = { kind: "File", bytes, name: selection.name };
    message.textContent = "File loaded.";
    render();
  } catch {
    if (request === fileRead) message.textContent = "The file could not be read.";
  }
});

el("undo").onclick = () => {
  trail.pop();
  render();
  message.textContent = "Previous reflection restored.";
};
el("reset").onclick = () => {
  trail = [];
  render();
  message.textContent = "Starting frame restored.";
};
el("clear").onclick = () => {
  fileRead++;
  source = null;
  entry.value = "";
  file.value = "";
  render();
  message.textContent = "Box cleared to 0.";
};

function output(snapshot, bits) {
  if (snapshot.kind === "Text") return encoder.encode(textOrder(snapshot.parts, bits));
  return byteOrder(snapshot.bytes, bits);
}

function save(bytes, type, name) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

el("export").onclick = () => {
  const bits = current();
  if (!source) return;
  const isText = source.kind === "Text";
  save(output(source, bits), isText ? "text/plain;charset=utf-8" : "application/octet-stream",
    isText ? "sovereignty-output.txt" : "sovereignty-output.bin");
  message.textContent = "Output saved. The receipt records the visual orientation.";
};

async function hash(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

el("receipt").onclick = async () => {
  const snapshot = source;
  const bits = current();
  const path = trail.map(({ label, before, after }) => ({ label, before, after }));
  const where = el("where").value;
  const when = el("when").value;
  try {
    const [original, result] = snapshot ? await Promise.all([
      hash(snapshot.bytes), hash(output(snapshot, bits)),
    ]) : [null, null];
    const receipt = {
      version: 1, state: snapshot ? 1 : 0, kind: snapshot?.kind ?? "Nothing",
      where, when, bytes: snapshot?.bytes.length ?? 0,
      original_sha256: original, output_sha256: result,
      frame: {
        reverse_order: Boolean(bits & REVERSE),
        flip_left_right: Boolean(bits & REFLECT_X),
        flip_top_bottom: Boolean(bits & REFLECT_Y),
      },
      path,
    };
    save(JSON.stringify(receipt, null, 2) + "\n", "application/json", "sovereignty-receipt.json");
    message.textContent = "Receipt saved.";
  } catch {
    message.textContent = "The receipt could not be created in this browser.";
  }
};

render();
