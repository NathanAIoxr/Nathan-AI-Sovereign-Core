import unicode from "./unicode-data.json" with { type: "json" };
import { escapeHtml, integer, RequestError, string, svg } from "./shared.mjs";

const signs = unicode.gardiner;
const egyptianGlyph = /^\p{Script=Egyptian_Hieroglyphs}$/u;
const mdc = { nfr: "F35", ankh: "S34", "ꜥnḫ": "S34", n: "N35", m: "G17", t: "X1", r: "D21", pr: "O1", w: "G43", ra: "N5" };

function signKey(value) {
  return value.toUpperCase().replace(/^([A-Z]+)0+(?=\d)/, "$1");
}

function signFor(value) {
  const glyph = signs[signKey(value)];
  if (!glyph) throw new RequestError(`Unknown Gardiner code: ${value}`, 404);
  return glyph;
}

function tableLookup({ text }, table) {
  return { unicode_version: unicode.unicode_version, signs: Array.from(string(text), glyph => ({
    glyph, reading: Object.hasOwn(table, glyph) ? table[glyph] : null,
  })) };
}

const signMap = (letters, chars) => Object.fromEntries(Array.from(letters, (letter, i) => [letter, Array.from(chars)[i]]));
const ogham = signMap("blvsnhdtcqmgzf raouei".replace(" ", ""), "ᚁᚂᚃᚄᚅᚆᚇᚈᚉᚊᚋᚌᚍᚎᚏᚐᚑᚒᚓᚔ");
const futhark = signMap("fuþarkgwhnijïpzstemlŋdo", "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛖᛗᛚᛜᛞᛟ");
const ugaritic = "ʾa b g ḫ d h w z ḥ ṭ y k š l m ḏ n ẓ s ʿ p ṣ q r ṯ ġ t ʾi ʾu s²".split(" ");
const phoenician = Array.from("אבגדהוזחטיכלמנסעפצקרשת");

const mod = (n, divisor) => ((n % divisor) + divisor) % divisor;
const tzolkin = "Imix Ik’ Ak’b’al K’an Chikchan Kimi Manik’ Lamat Muluk Ok Chuwen Eb’ B’en Ix Men Kib’ Kab’an Etz’nab’ Kawak Ajaw".split(" ");
const haab = "Pop Wo Sip Sotz’ Sek Xul Yaxk’in Mol Ch’en Yax Sak Keh Mak K’ank’in Muwan Pax K’ayab Kumk’u Wayeb’".split(" ");

export function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) {
    throw new RequestError("date must be a valid YYYY-MM-DD string from year 0001");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) throw new RequestError("Invalid Gregorian date");
  return date;
}

export function mayan(date) {
  const julian_day_number = Math.floor(+date / 86400000) + 2440588;
  const days = julian_day_number - 584283;
  const long_count = [Math.floor(days / 144000), Math.floor(mod(days, 144000) / 7200),
    Math.floor(mod(days, 7200) / 360), Math.floor(mod(days, 360) / 20), mod(days, 20)];
  const solar = mod(days + 348, 365);
  return { julian_day_number, correlation: 584283, long_count: long_count.join("."),
    tzolkin: [mod(days + 3, 13) + 1, tzolkin[mod(days + 19, 20)]].join(" "),
    haab: [solar % 20, haab[Math.floor(solar / 20)]].join(" ") };
}

function quadrat(input) {
  const { rows } = input;
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 8 ||
    rows.some(row => !Array.isArray(row) || row.length < 1 || row.length > 8)) throw new RequestError("rows must contain 1 to 8 rows of 1 to 8 glyphs");
  const horizontal = String.fromCodePoint(0x13431);
  const vertical = String.fromCodePoint(0x13430);
  const begin = String.fromCodePoint(0x13437);
  const end = String.fromCodePoint(0x13438);
  const out = rows.map(row => {
    const glyphs = row.map(value => egyptianGlyph.test(string(value, "glyph", 12)) ? value : signFor(value));
    return glyphs.length === 1 ? glyphs[0] : begin + glyphs.join(horizontal) + end;
  });
  return { text: out.join(vertical) };
}

function cartouche({ codes, direction = "ltr" }) {
  if (!Array.isArray(codes) || !codes.length || codes.length > 20) throw new RequestError("codes must contain 1 to 20 Gardiner sign codes");
  if (!["ltr", "rtl"].includes(direction)) throw new RequestError("direction must be ltr or rtl");
  const glyphs = codes.map(value => signFor(string(value, "code", 10)));
  if (direction === "rtl") glyphs.reverse();
  const width = 60 + glyphs.length * 46;
  return svg(`<rect x="4" y="8" width="${width - 18}" height="60" rx="30" fill="#f5e6bc" stroke="#3b2d19" stroke-width="3"/><path d="M${width-12} 16v44" stroke="#3b2d19" stroke-width="3"/>` +
    glyphs.map((glyph, index) => `<text x="${31 + index * 46}" y="51" font-size="36">${glyph}</text>`).join(""), `0 0 ${width} 76`);
}

function entropy(text) {
  const chars = Array.from(text.normalize("NFC"));
  const counts = new Map();
  const transitions = new Map();
  for (const [i, char] of chars.entries()) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
    if (i > 0) {
      const from = chars[i - 1];
      if (!transitions.has(from)) transitions.set(from, new Map());
      const next = transitions.get(from);
      next.set(char, (next.get(char) ?? 0) + 1);
    }
  }
  const frequency = [...counts].sort((a, b) => b[1] - a[1]);
  const information = (entries, total) => entries.reduce((sum, n) => sum - n / total * Math.log2(n / total), 0);
  const conditional = [...transitions.values()].reduce((sum, next) => {
    const values = [...next.values()];
    const total = values.reduce((a,b) => a + b, 0);
    return sum + total / (chars.length - 1) * information(values, total);
  }, 0);
  return { length: chars.length, entropy_bits: information([...counts.values()], chars.length),
    conditional_entropy_bits: conditional, zipf: frequency.slice(0, 250).map(([glyph, count], i) => ({ rank: i + 1, glyph, count })),
    distinct: counts.size };
}

function calendarNumbers({ text, number, digits = "arabic" }) {
  if (number !== undefined) {
    let n = integer(number, 1, 999, "number");
    let rendered = "";
    for (const [amount, glyph] of [[400,"ת"],[300,"ש"],[200,"ר"],[100,"ק"],[90,"צ"],[80,"פ"],
      [70,"ע"],[60,"ס"],[50,"נ"],[40,"מ"],[30,"ל"],[20,"כ"],[10,"י"],
      [9,"ט"],[8,"ח"],[7,"ז"],[6,"ו"],[5,"ה"],[4,"ד"],[3,"ג"],[2,"ב"],[1,"א"]]) {
      if (amount === 10 && (n === 15 || n === 16)) {
        rendered += n === 15 ? "טו" : "טז";
        break;
      }
      while (n >= amount) {
        rendered += glyph;
        n -= amount;
      }
    }
    return { text: rendered.length === 1 ? rendered + "׳" : `${rendered.slice(0,-1)}״${rendered.at(-1)}` };
  }
  if (!["arabic", "extended-arabic"].includes(digits)) throw new RequestError("Unknown digit system");
  const zero = digits === "arabic" ? 0x660 : 0x6f0;
  return { text: string(text).replace(/[0-9]/g, value => String.fromCodePoint(zero + Number(value))) };
}

const eras = { stone: ["#d5bc91", "#382910"], clay: ["#b87f52", "#352219"], papyrus: ["#f3e2a7", "#493117"] };

export const ancientHandlers = {
  19: input => tableLookup(input, unicode.linearB),
  20: ({ text }) => ({ glyphs: Array.from(string(text), glyph => ({
    glyph, hebrew_correspondence: phoenician[glyph.codePointAt(0) - 0x10900] ?? null,
  })) }),
  25: ({ text }) => ({ text: Array.from(string(text).toLowerCase().replace(/th/g, "þ").replace(/ng/g, "ŋ"),
    letter => futhark[letter] ?? letter).join(""), system: "modern Elder Futhark character approximation" }),
  26: ({ text }) => ({ text: Array.from(string(text).toLowerCase(), letter =>
    ogham[letter] ?? (letter === " " ? " " : letter)).join(""), system: "Unicode Ogham letter substitution" }),
  29: ({ text }) => ({ glyphs: Array.from(string(text), glyph => {
    const cp = glyph.codePointAt(0);
    const offset = cp - 0x1200;
    const order = offset % 8 + 1;
    const isBasic = cp >= 0x1200 && cp <= 0x1357 && /^\p{L}$/u.test(glyph) && order <= 7;
    return { glyph, basic_series: isBasic ? String.fromCodePoint(cp - offset % 8) : null, order: isBasic ? order : null };
  }) }),
  30: input => tableLookup(input, unicode.oldItalic),
  31: ({ text }) => ({ glyphs: Array.from(string(text), glyph => ({ glyph,
    transliteration: ugaritic[glyph.codePointAt(0) - 0x10380] ?? null })) }),
  32: ({ text }) => entropy(string(text)),
  35: ({ code }) => {
    const normalized = signKey(string(code, "code", 12));
    return { code: normalized, glyph: signFor(normalized), representation: "Unicode character name crosswalk" };
  },
  36: ({ text }) => ({
    text: string(text).trim().split(/[\s-]+/).map(value => signFor(Object.hasOwn(mdc, value) ? mdc[value] : value)).join(""),
    subset: "Space- and hyphen-delimited Gardiner codes and selected MdC aliases",
  }),
  37: quadrat,
  38: cartouche,
  39: ({ date }) => mayan(parseDate(date)),
  41: input => tableLookup(input, unicode.luwian),
  57: calendarNumbers,
  79: ({ text }) => ({ symbols: Array.from(string(text)).filter(glyph => {
    const cp = glyph.codePointAt(0);
    return (cp >= 0x1F700 && cp <= 0x1F77F) || "☉☽☿♀♂♃♄♅♆".includes(glyph);
  }).map(glyph => ({ glyph, code: `U+${glyph.codePointAt(0).toString(16).toUpperCase()}` })) }),
  85: ({ date }) => {
    const parsed = parseDate(date);
    const calendars = Object.fromEntries(["gregory", "hebrew", "islamic-civil", "persian", "coptic", "chinese"].map(name => [
      name, new Intl.DateTimeFormat("en", {calendar:name, dateStyle:"long", timeZone:"UTC"}).format(parsed),
    ]));
    const jd = mayan(parsed);
    const c = jd.julian_day_number + 32082;
    const d = Math.floor((4*c+3)/1461);
    const e = c - Math.floor(1461*d/4);
    const m = Math.floor((5*e+2)/153);
    calendars.julian = [d-4800+Math.floor(m/10), m+3-12*Math.floor(m/10), e-Math.floor((153*m+2)/5)+1];
    return { date, calendars, mayan: jd, julian_order: ["year","month","day"] };
  },
  97: ({ text, material = "stone" }) => {
    if (!Object.hasOwn(eras, material)) throw new RequestError("material must be stone, clay, or papyrus");
    const safe = escapeHtml(string(text, "text", 160));
    const [base, ink] = eras[material];
    return svg(`<defs><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="3" seed="19"/></filter></defs><rect width="720" height="185" rx="16" fill="${base}"/><rect width="720" height="185" rx="16" opacity=".2" filter="url(#grain)"/><text x="30" y="105" fill="${ink}" font-size="30">${safe}</text>`, "0 0 720 185");
  },
};
