import bidiFactory from "bidi-js";
import { doubleMetaphone } from "double-metaphone";
import { iso6392 } from "iso-639-2";
import { iso6393 } from "iso-639-3";
import { transliterate } from "transliteration";
import { escapeHtml, isolatedHtml, RequestError, reverse, string } from "./shared.mjs";

const bidi = bidiFactory();
const isoIndex = new Map();
for (const row of [...iso6392, ...iso6393]) {
  const codes = [row.iso6391, row.iso6392B, row.iso6392T, row.iso6393].filter(Boolean);
  for (const code of codes) {
    isoIndex.set(code, { ...isoIndex.get(code), ...row });
  }
}

const scripts = [
  "Latin", "Greek", "Cyrillic", "Hebrew", "Arabic", "Syriac", "Thaana", "Nko", "Adlam",
  "Devanagari", "Bengali", "Tamil", "Thai", "Han", "Hiragana", "Katakana", "Hangul",
  "Ethiopic", "Mongolian", "Egyptian_Hieroglyphs", "Cuneiform", "Linear_B",
  "Anatolian_Hieroglyphs", "Old_Italic", "Phoenician", "Ugaritic", "Glagolitic", "Runic", "Ogham",
].map(name => [name, new RegExp(`^\\p{Script=${name}}$`, "u")]);
const common = /^\p{Script=Common}$/u;
const inherited = /^\p{Script=Inherited}$/u;

export function scriptProfile(text) {
  const counts = Object.create(null);
  let total = 0;
  for (const char of text) {
    const key = common.test(char) ? "Common" : inherited.test(char) ? "Inherited" :
      scripts.find(([, test]) => test.test(char))?.[0] ?? "Other";
    counts[key] = (counts[key] ?? 0) + 1;
    total++;
  }
  const percentages = Object.fromEntries(Object.entries(counts)
    .map(([key, count]) => [key, Math.round(count * 10000 / total) / 100]));
  return { total_code_points: total, counts, percentages, other: "Scripts outside the named inventory" };
}

function localeList(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 25) {
    throw new RequestError("supported must contain 1 to 25 BCP 47 locale tags");
  }
  try {
    return Intl.getCanonicalLocales(value);
  } catch {
    throw new RequestError("supported contains an invalid locale tag");
  }
}

function localeRouter(input, { request }) {
  const supported = localeList(input.supported ?? ["en", "es", "fr", "ar", "he"]);
  const header = string(input.acceptLanguage ?? request.headers.get("Accept-Language") ?? "", "acceptLanguage", 1024, true);
  const preferences = header.split(",").map(part => {
    const [tag, quality] = part.trim().split(/\s*;\s*/, 2);
    const q = quality === undefined ? 1 : /^q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/i.test(quality) ? Number(quality.slice(2)) : 0;
    return { tag: tag.toLowerCase(), q };
  }).filter(({ tag, q }) => tag && q > 0).sort((a, b) => b.q - a.q);
  const path = string(input.path ?? "/", "path", 512);
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\r\n]/.test(path)) throw new RequestError("path must be a relative URL path");
  const current = supported.find(tag => tag.toLowerCase() === path.split(/[/?#]/)[1]?.toLowerCase());
  const match = preferences.flatMap(({ tag }) => tag === "*" ? [supported[0]] : [
    supported.find(candidate => candidate.toLowerCase() === tag),
    supported.find(candidate => candidate.toLowerCase().split("-")[0] === tag.split("-")[0]),
  ]).find(Boolean);
  const selected = current ?? match ?? supported[0];
  return { locale: selected, location: current ? path : `/${selected}${path}`, source: current ? "path" : match ? "header" : "default" };
}

function localize({ html, messages }) {
  string(html, "html", 24000);
  if (!messages || Array.isArray(messages) || typeof messages !== "object" || Object.keys(messages).length > 100) {
    throw new RequestError("messages must be an object with up to 100 keys");
  }
  for (const message of Object.values(messages)) string(message, "message", 1000, true);
  const rewriter = new HTMLRewriter().on("[data-i18n-key]", {
    element(element) {
      const key = element.getAttribute("data-i18n-key");
      if (Object.hasOwn(messages, key)) element.setInnerContent(messages[key]);
    },
  });
  return isolatedHtml(rewriter.transform(new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })).body);
}

function soundex(text) {
  const letters = text.toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return null;
  const codes = Object.fromEntries(["BFPV","CGJKQSXZ","DT","L","MN","R"]
    .flatMap((group, index) => [...group].map(letter => [letter, String(index + 1)])));
  let prior = codes[letters[0]];
  let encoded = letters[0];
  for (const letter of letters.slice(1)) {
    if (letter === "H" || letter === "W") continue;
    const next = codes[letter];
    if (next && next !== prior) encoded += next;
    if (encoded.length === 4) break;
    prior = next;
  }
  return encoded.padEnd(4, "0");
}

export function embeddings(value, direction = "auto") {
  if (!["ltr", "rtl", "auto"].includes(direction)) throw new RequestError("direction must be ltr, rtl, or auto");
  const result = bidi.getEmbeddingLevels(value, direction);
  const runs = [];
  for (const [index, level] of result.levels.entries()) {
    const previous = runs.at(-1);
    if (previous?.level === level) previous.end = index + 1;
    else runs.push({ start: index, end: index + 1, level, direction: level % 2 ? "rtl" : "ltr" });
  }
  return { paragraphs: result.paragraphs.map(part => ({
    start: part.start, end: part.end + 1, base_level: part.level, direction: part.level % 2 ? "rtl" : "ltr",
  })), runs, index_unit: "UTF-16", algorithm: "bidi-js 1.0.3 (Unicode 13)" };
}

function align({ source, target, sourceLanguage = "en", targetLanguage = "en" }) {
  function sentences(value, locale) {
    if (typeof locale !== "string") throw new RequestError("language must be a BCP 47 tag");
    try {
      return Array.from(new Intl.Segmenter(locale, { granularity: "sentence" }).segment(value),
        part => part.segment.trim()).filter(Boolean);
    } catch {
      throw new RequestError("language must be a valid BCP 47 tag");
    }
  }
  const left = sentences(string(source, "source"), sourceLanguage);
  const right = sentences(string(target, "target"), targetLanguage);
  return { method: "position", length_match: left.length === right.length,
    pairs: Array.from({ length: Math.max(left.length, right.length) }, (_, i) =>
      ({ source: left[i] ?? null, target: right[i] ?? null })) };
}

function dirRewriter({ html, direction = "auto" }) {
  if (!["ltr", "rtl", "auto"].includes(direction)) throw new RequestError("direction must be ltr, rtl, or auto");
  const output = new HTMLRewriter().on("html", {
    element(element) { element.setAttribute("dir", direction); },
  }).transform(new Response(string(html, "html", 24000), { headers: { "content-type": "text/html; charset=utf-8" } }));
  return isolatedHtml(output.body);
}

function normalizeHebrew({ text, remove = "all" }) {
  if (!["vowels", "cantillation", "all", "none"].includes(remove)) throw new RequestError("Invalid Hebrew mark mode");
  const original = string(text);
  let result = original;
  if (remove === "cantillation" || remove === "all") result = result.replace(/[\u0591-\u05AF]/gu, "");
  if (remove === "vowels" || remove === "all") result = result.replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/gu, "");
  return { original, text: result, removed: remove };
}

function romanize(input) {
  const text = string(input.text);
  return { original: text, text: transliterate(text, { unknown: "" }), method: "transliteration library defaults" };
}

export const languageHandlers = {
  2: localeRouter,
  3: localize,
  5: ({ code }) => {
    const key = string(code, "code", 3).toLowerCase();
    const match = isoIndex.get(key);
    if (!match) throw new RequestError("Language code not found", 404);
    return { code: key, ...match, source: "iso-639-2 and iso-639-3 datasets" };
  },
  8: ({ text }) => {
    const romanized = romanize({ text }).text;
    return { romanized, soundex: soundex(romanized), double_metaphone: doubleMetaphone(romanized) };
  },
  9: align,
  13: ({ text }) => scriptProfile(string(text, "text", 12000, true)),
  15: romanize,
  46: ({ text, direction }) => embeddings(string(text), direction),
  48: ({ text, firstReversed = false }) => {
    if (typeof firstReversed !== "boolean") throw new RequestError("firstReversed must be a boolean");
    const lines = string(text, "text", 12000, true).split(/(\r\n|\r|\n)/);
    return { text: lines.map((line, index) => index % 2 === 0 && Boolean(index % 4) !== firstReversed ? reverse(line) : line).join("") };
  },
  49: dirRewriter,
  50: ({ text }) => ({ html: `<bdi dir="ltr">${escapeHtml(string(text))}</bdi>` }),
  51: ({ text }) => ({ text: string(text).replace(/(?=\p{M})\p{Script_Extensions=Arabic}/gu, "") }),
  52: normalizeHebrew,
  53: ({ text, style }) => {
    if (!["estrangela", "serto", "madnhaya"].includes(style)) throw new RequestError("Invalid Syriac font style");
    return { text: string(text), direction: "rtl", font_family: `Noto Sans Syriac ${({ estrangela: "Estrangela", serto: "Western", madnhaya: "Eastern" })[style]}` };
  },
  54: ({ text }) => ({ html: `<span style="writing-mode:vertical-lr">${escapeHtml(string(text))}</span>` }),
  55: ({ base, reading }) => ({ html: `<ruby style="writing-mode:vertical-rl">${escapeHtml(string(base, "base"))}<rt>${escapeHtml(string(reading, "reading"))}</rt></ruby>` }),
};
