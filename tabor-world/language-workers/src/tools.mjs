import { graphemes, integer, RequestError, reverse, sha256, string, svg } from "./shared.mjs";

const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const greek = "ΑΒΓΔΕϚΖΗΘΙΚΛΜΝΞΟΠϞΡΣΤΥΦΧΨΩϠ";
const hebrew = "אבגדהוזחטיכלמנסעפצקרשת";
const hebrewFinals = "ךםןףץ";
const hebrewNormal = "כמנפצ";
const standard = index => (
  Math.floor(index / 9) < 2 ? (index % 9 + 1) * (index >= 9 ? 10 : 1) : (index - 17) * 100
);
const weight = (alphabet, char) => {
  const index = alphabet.indexOf(char);
  return index < 0 ? 0 : standard(index);
};

function gematria(value) {
  const results = { english_ordinal: 0, english_reduction: 0, hebrew_standard: 0, hebrew_mispar_gadol: 0, greek_isopsephy: 0 };
  for (const char of value.normalize("NFD").toUpperCase()) {
    const english = latin.indexOf(char) + 1;
    if (english) {
      results.english_ordinal += english;
      results.english_reduction += (english - 1) % 9 + 1;
    }
    const final = hebrewFinals.indexOf(char);
    const normalWeight = weight(hebrew, final < 0 ? char : hebrewNormal[final]);
    results.hebrew_standard += normalWeight;
    results.hebrew_mispar_gadol += final < 0 ? normalWeight : 500 + final * 100;
    results.greek_isopsephy += weight(greek, ({ "ϛ": "Ϛ", "ϟ": "Ϟ", "ϡ": "Ϡ" })[char] ?? char);
  }
  return results;
}

const mod26 = n => ((n % 26) + 26) % 26;
function cipher({ text, cipher, shift = 3, key, mode = "encode" }) {
  const value = string(text, "text", 3000);
  if (!["encode", "decode", "candidates"].includes(mode)) throw new RequestError("Unknown cipher mode");
  if (!["caesar", "atbash", "vigenere"].includes(cipher)) throw new RequestError("Supported ciphers are caesar, atbash, and vigenere");
  if (cipher === "caesar") integer(shift, -25, 25, "shift");
  if (cipher === "vigenere" && !/^[A-Za-z]{1,80}$/.test(string(key, "key", 80))) throw new RequestError("Vigenère key must contain Latin letters only");
  const transform = (offset, sign) => {
    let i = 0;
    return value.replace(/[a-z]/gi, letter => {
      const base = letter <= "Z" ? 65 : 97;
      const code = letter.charCodeAt(0) - base;
      const step = cipher === "vigenere" ? key.toLowerCase().charCodeAt(i++ % key.length) - 97 : offset;
      return String.fromCharCode(base + (cipher === "atbash" ? 25 - code : mod26(code + step * sign)));
    });
  };
  if (mode !== "candidates") return { cipher, mode, text: transform(shift, mode === "decode" ? -1 : 1) };
  if (cipher !== "caesar") throw new RequestError("Candidate listing is available for Caesar only");
  return { cipher, candidates: Array.from({ length: 26 }, (_, offset) => ({ shift: offset, text: transform(offset, -1) })) };
}

function invisible({ text }) {
  const value = string(text);
  const format = new Set([0x200B,0x200C,0x200D,0x200E,0x200F,0x2060,0xFEFF,
    0x202A,0x202B,0x202C,0x202D,0x202E,0x2066,0x2067,0x2068,0x2069]);
  const matches = Array.from(value, (char, index) => {
    const cp = char.codePointAt(0);
    return format.has(cp) ? { index, code: `U+${cp.toString(16).toUpperCase()}` } : null;
  }).filter(Boolean);
  return { matches, index_unit: "Unicode code points" };
}

function geometry({ shape = "flower", radius = 40 }) {
  integer(radius, 10, 80, "radius");
  if (!["flower", "metatron", "golden_spiral"].includes(shape)) throw new RequestError("Unknown geometry");
  if (shape === "golden_spiral") {
    const phi = (1 + Math.sqrt(5)) / 2;
    const points = Array.from({length:181}, (_, i) => {
      const theta = i * Math.PI / 45;
      const r = radius * phi ** (2 * theta / Math.PI - 8);
      return `${(r * Math.cos(theta)).toFixed(3)},${(r * Math.sin(theta)).toFixed(3)}`;
    });
    return svg(`<polyline points="${points.join(" ")}" stroke="#815426" fill="none"/>`, `${-radius} ${-radius} ${2*radius} ${2*radius}`);
  }
  const points = [[0,0]];
  for (const ring of shape === "flower" ? [1] : [1, 2]) {
    for (let i = 0; i < 6; i++) points.push([radius * ring * Math.cos(i * Math.PI/3), radius * ring * Math.sin(i * Math.PI/3)]);
  }
  const circles = points.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="none"/>`);
  const lines = shape === "metatron" ? points.flatMap(([x,y], i) => points.slice(i+1).map(([x2,y2]) =>
    `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}"/>`)) : [];
  const width = radius * 3.1;
  return svg(`<g stroke="#815426">${[...circles, ...lines].join("")}</g>`, `${-width} ${-width} ${2*width} ${2*width}`);
}

function palindrome({ text, compare }) {
  const normalize = value => value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, "");
  const normalized = normalize(string(text));
  const reversed = reverse(text);
  const palindrome = normalized === reverse(normalized);
  if (compare === undefined) return { normalized, reversed, palindrome };
  const sorted = value => graphemes(value).sort().join("");
  return { normalized, reversed, palindrome, anagram: sorted(normalized) === sorted(normalize(string(compare, "compare"))) };
}

function tone({ frequency = 432, milliseconds = 700 }) {
  if (typeof frequency !== "number" || !Number.isFinite(frequency) || frequency < 1 || frequency > 2000) {
    throw new RequestError("frequency must be from 1 to 2000 Hz");
  }
  integer(milliseconds, 100, 3000, "milliseconds");
  const rate = 16000;
  const samples = rate * milliseconds / 1000;
  const wav = new DataView(new ArrayBuffer(44 + samples * 2));
  for (const [offset, text] of [[0,"RIFF"],[8,"WAVE"],[12,"fmt "],[36,"data"]]) {
    Array.from(text, (char, i) => wav.setUint8(offset + i, char.charCodeAt(0)));
  }
  wav.setUint32(4, 36 + samples*2, true);
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true);
  wav.setUint16(22, 1, true);
  wav.setUint32(24, rate, true);
  wav.setUint32(28, rate * 2, true);
  wav.setUint16(32, 2, true);
  wav.setUint16(34, 16, true);
  wav.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const envelope = Math.min(1, i/160, (samples - i - 1)/160);
    wav.setInt16(44 + i * 2, 8192 * envelope * Math.sin(2 * Math.PI * frequency * i / rate), true);
  }
  return new Response(wav.buffer, { headers: { "content-type": "audio/wav", "cache-control": "no-store" } });
}

const strokeOrder = {
  "二": ["M20 35H80", "M12 69H88"],
  "三": ["M23 24H77", "M27 48H73", "M12 75H88"],
  "十": ["M12 43H88", "M50 15V85"],
  "人": ["M54 18Q50 65 16 84", "M51 42Q64 72 87 84"],
};

function strokes({ glyph }) {
  if (!Object.hasOwn(strokeOrder, glyph)) throw new RequestError("Available stroke diagrams: 二 三 十 人", 404);
  return svg(strokeOrder[glyph].map((path, index) =>
    `<path d="${path}" pathLength="1" stroke-dasharray="1" fill="none" stroke="#442913" stroke-width="6" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="1" to="0" dur=".65s" begin="${index * .8}s" fill="freeze"/></path>`).join(""), "0 0 100 100");
}

const paleography = {
  aleph: [
    { script: "Phoenician", glyph: "𐤀", code: "U+10900" }, { script: "Greek", glyph: "Α", code: "U+0391" },
    { script: "Hebrew", glyph: "א", code: "U+05D0" }, { script: "Latin", glyph: "A", code: "U+0041" },
  ],
  beth: [
    { script: "Phoenician", glyph: "𐤁", code: "U+10901" }, { script: "Greek", glyph: "Β", code: "U+0392" },
    { script: "Hebrew", glyph: "ב", code: "U+05D1" }, { script: "Latin", glyph: "B", code: "U+0042" },
  ],
};

export const toolHandlers = {
  56: ({ text }) => palindrome({ text }),
  73: ({ number }) => {
    const n = integer(number, 1, 64, "number");
    return { number: n, glyph: String.fromCodePoint(0x4dc0 + n - 1), ordering: "King Wen" };
  },
  74: ({ text }) => gematria(string(text)),
  75: cipher,
  76: invisible,
  80: geometry,
  83: palindrome,
  87: tone,
  95: async (input, { bytes }) => {
    const contents = bytes ?? new TextEncoder().encode(string(input.text, "text", 12000, true));
    return { bytes: contents.length, sha256: await sha256(contents), scope: "Digest of supplied bytes" };
  },
  98: strokes,
  99: ({ letter = "aleph" }) => {
    if (!Object.hasOwn(paleography, letter)) throw new RequestError("Available letter families: aleph, beth", 404);
    return { letter, forms: paleography[letter], source: "https://www.unicode.org/charts/PDF/U10900.pdf" };
  },
};
