import { sections } from "./corpus.mjs";

export const records = sections.flatMap(({ letter, core, related }) =>
  [...core.map(row => [true, row]), ...related.map(row => [false, row])]
    .map(([central, [name, tradition, detail]], index) => ({
      id: letter.toLowerCase() + "-" + (index + 1), letter, name, tradition, detail, central,
    })));

export function queryEntries(entries, query = "", letter = "") {
  const normalize = value => String(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return entries.filter(record => (!letter || record.letter === letter.toUpperCase()) &&
    words.every(word => normalize([record.name, record.tradition, record.detail].join(" ")).includes(word)));
}

export const findEntries = (query, letter) => queryEntries(records, query, letter);

export function readState(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function saveState(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}
