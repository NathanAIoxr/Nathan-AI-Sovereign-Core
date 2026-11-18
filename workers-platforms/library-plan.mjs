import { languageTarget, platforms } from "./platforms.mjs";
import { shardCount, shardId } from "./shard-routes.mjs";

export const corpusSize = 133_333_333;
export const workerCount = platforms.length + shardCount;
const names = [
  "Computing, information and general works", "Philosophy and psychology", "Religion",
  "Social sciences", "Languages", "Natural sciences and mathematics", "Applied sciences and technology",
  "Arts, music and recreation", "Literature", "History and geography"
];

export const lccClasses = Object.freeze({
  A: "General works", B: "Philosophy, psychology and religion", C: "Historical methods and sources",
  D: "World and regional history", E: "History of the Americas", F: "History of the Americas",
  G: "Geography, anthropology and recreation", H: "Social sciences", J: "Political science",
  K: "Law", L: "Education", M: "Music", N: "Fine arts", P: "Language and literature",
  Q: "Science", R: "Medicine", S: "Agriculture", T: "Technology", U: "Military science",
  V: "Naval science", Z: "Bibliography and library science"
});

// Local referral rules. Source call numbers and their classification scheme are preserved independently.
const referrals = [
  "AZQT Z A Z A Z A Z A A",   // 000
  "B B B B B B B B B B",       // 100
  "B B B B B B B B B B",       // 200
  "H H J H K JUV H H L HG",    // 300
  "P P P P P P P P P P",       // 400
  "Q Q Q Q Q Q Q Q Q Q",       // 500
  "T R T S T T T T T N",       // 600
  "N N N N N N N T M G",       // 700
  "P P P P P P P P P P",       // 800
  "C G C D D D D EF F DG"      // 900
].map((row) => row.split(" "));

const taskByDigit = [
  "Validate title, author, edition and source fields",
  "Resolve author and contributor authority records",
  "Link alternate editions and translations",
  "Review language, script and name variants",
  "Check subject assignments and classification provenance",
  "Flag duplicate metadata and compare checksums",
  "Review rights and content access status",
  "Check OCR and digitization quality",
  "Check archive integrity and restoration metadata",
  "Record unresolved entries and route to review"
];

export const traditions = [
  { id: "nineveh", title: "Nineveh and Ashurbanipal", task: "Track object IDs, findspots, joined fragments and transcriptions.", source: "https://oracc.museum.upenn.edu/asbp/whatisthelibrary/index.html" },
  { id: "alexandria", title: "Alexandria and the Pinakes", task: "Keep author, work, genre and attestations linked across variants.", source: "https://www.britannica.com/biography/Callimachus" },
  { id: "manuscript", title: "Manuscript and early print catalogs", task: "Preserve shelfmark, witness, incipit, edition and holding institution." },
  { id: "modern", title: "Modern union catalogs", task: "Cross-reference persistent identifiers, rights, and cataloging provenance for each edition." }
];

export const collections = [
  { title: "ACT Pi/Phi naming, mathematical references and phonetic nodes", dewey: ["410", "510"], lcc: ["P", "Q"], route: "/library/act" },
  { title: "Tabor Concordance and Modern Day Bible", dewey: ["220", "221", "225"], lcc: ["B", "P"] },
  { title: "Find the Tabor, lineage, coat of arms and Tree of Life", dewey: ["929", "910"], lcc: ["C", "D", "E", "F", "G"] },
  { title: "Tower of Babel, languages, phonetics, root words, glyphs and wordplay", dewey: ["400", "410", "411"], lcc: ["P"] },
  { title: "Cadence, secret chords and sound", dewey: ["780", "781"], lcc: ["M"] },
  { title: "Library of Tabor, book editions and 101 Library Engine modules", dewey: ["010", "020", "025"], lcc: ["A", "Z"] },
  { title: "Universal Digit Physics, Track Baller, Grapple It and Bibletopia", dewey: ["530", "794"], lcc: ["G", "Q", "T"] },
  { title: "Nathan AI, software archives and Digital HPC", dewey: ["004", "005", "006"], lcc: ["Q", "T"] },
  { title: "MAS SPIRIT, folklore and mythology", dewey: ["290", "398"], lcc: ["B", "G", "P"] },
  { title: "Tabor Accords and civic records", dewey: ["320", "340"], lcc: ["J", "K"] },
  { title: "Tabor Light, iconography and the visual archives", dewey: ["200", "700", "704"], lcc: ["B", "N"] }
];

const digitSet = "0123456789AB";
export function base12(index) {
  if (!Number.isInteger(index) || index < 0 || index >= 1728) throw new RangeError("Invalid duodecimal address");
  return [Math.floor(index / 144), Math.floor(index / 12) % 12, index % 12].map((digit) => digitSet[digit]).join("");
}

export function assignment(index) {
  if (!Number.isInteger(index) || index < 0 || index >= workerCount) return null;
  const core = platforms[index];
  const worker = core?.id ?? shardId(index - platforms.length + 1);
  const dewey = String(index).padStart(3, "0");
  const division = Math.floor(index / 10) * 10;
  const main = Math.floor(index / 100);
  const start = Math.floor(index * corpusSize / workerCount) + 1;
  const end = Math.floor((index + 1) * corpusSize / workerCount);
  return {
    slot: index + 1, worker, parentRoute: "/p/" + worker + "/", taskRoute: "/p/" + worker + "/library",
    existingDuty: core?.title ?? "Glottolog language catalog shard",
    dewey, deweyRange: [String(division).padStart(3, "0"), String(division + 9).padStart(3, "0")],
    category: names[main], lccReview: Array.from(referrals[main][Math.floor(index / 10) % 10]),
    duodecimal: base12(index), task: taskByDigit[index % 10],
    bookRange: { start, end, capacity: end - start + 1 }, imported: 0
  };
}

export function workerAssignment(id) {
  const core = platforms.findIndex((platform) => platform.id === id);
  if (core >= 0) return assignment(core);
  if (!/^language-shard-\d{4}$/.test(id)) return null;
  const shard = Number(id.slice(-4));
  return shard >= 1 && shard <= shardCount ? assignment(platforms.length + shard - 1) : null;
}

export function bookAssignment(accession) {
  if (!Number.isSafeInteger(accession) || accession < 1 || accession > corpusSize) return null;
  return assignment(Math.ceil(accession * workerCount / corpusSize) - 1);
}

export function storagePlan(bytesPerBook, copies, rawTbPerNode, usableFraction = .8) {
  const singleCopyBytes = BigInt(corpusSize) * BigInt(bytesPerBook);
  const allCopyBytes = singleCopyBytes * BigInt(copies);
  const usableBytesPerNode = BigInt(Math.floor(rawTbPerNode * 1e12 * usableFraction));
  const nodesPerCopy = Number((singleCopyBytes + usableBytesPerNode - 1n) / usableBytesPerNode);
  return { bytesPerBook, copies, rawTbPerNode, usableFraction, singleCopyBytes: Number(singleCopyBytes),
    allCopyBytes: Number(allCopyBytes), singleCopyBytesExact: String(singleCopyBytes), allCopyBytesExact: String(allCopyBytes),
    nodesPerCopy, totalNodes: nodesPerCopy * copies };
}

export const references = {
  loc: "https://www.loc.gov/aba/cataloging/classification/lcco/",
  dewey: "https://entities.oclc.org/worldcat/ddc/",
  lccMarc: "https://www.loc.gov/marc/bibliographic/bd050.html",
  deweyMarc: "https://www.loc.gov/marc/bibliographic/bd082.html"
};

export function summary() {
  return {
    totalWorkers: workerCount, totalPlannedBooks: corpusSize, targetLanguages: languageTarget, importedBooks: 0,
    balancedBookCapacityPerWorker: corpusSize / workerCount,
    bookCapacityDistribution: {
      [Math.floor(corpusSize / workerCount)]: workerCount - corpusSize % workerCount,
      [Math.ceil(corpusSize / workerCount)]: corpusSize % workerCount
    },
    decimalAddresses: workerCount, duodecimalAddresses: 1728, spareAddresses: 1728 - workerCount,
    history: traditions, collections, lccClasses, references,
    storageExamples: [8_000, 1e6, 5e6, 25e6, 100e6].map((bytes) => storagePlan(bytes, 3, 120))
  };
}
