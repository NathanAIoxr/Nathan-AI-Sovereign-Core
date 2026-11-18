export const classNames = {
  A: "General Works", B: "Philosophy, Psychology and Religion", C: "Auxiliary Sciences of History",
  D: "World History", E: "History of the Americas (E)", F: "History of the Americas (F)",
  G: "Geography, Anthropology and Recreation", H: "Social Sciences", J: "Political Science",
  K: "Law", L: "Education", M: "Music", N: "Fine Arts", P: "Language and Literature",
  Q: "Science", R: "Medicine", S: "Agriculture", T: "Technology", U: "Military Science",
  V: "Naval Science", Z: "Bibliography and Library Science"
};

export const groups = [
  ["A", "OG-001", "OG-033", "pie-pi-phi"], ["B", "OG-034", "OG-067", "pi"],
  ["CDEF", "OG-068", "OG-101", "phi+pie"], ["GH", "001", "060", "pi/phi"],
  ["JK", "061", "120", "pi"], ["LMN", "121", "180", "phi+pie"],
  ["P", "181", "240", "pie-pi-phi"], ["QR", "241", "300", "pi"],
  ["STUV", "301", "360", "phi+pie"], ["Z", "361", "404", "pie-pi-phi"]
];

export const vaults = {
  scriptural: "Primeval & Scriptural Vault",
  ancient: "Ancient World Libraries",
  silk: "Classical, Eastern & Silk Road Halls",
  medieval: "Medieval, Abbey & Desert Archives",
  loc: "Library of Congress & Modern Collections",
  omega: "Ω · Lost Works & Surviving Evidence"
};

export const states = {
  "source-edition": "Source edition",
  "surviving-witness": "Surviving witness",
  "collection-guide": "Collection guide",
  "lost-work-dossier": "Lost-work dossier"
};

export const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const shaPattern = /^[a-f0-9]{64}$/;
export const maxEditionBytes = 12 * 1024 * 1024;
export const bodyKey = sha => `archive/sha256-${sha}`;

export const mapClass = code => {
  const group = groups.find(([codes]) => codes.includes(code));
  return group && { lo: group[1], hi: group[2], anchor: group[3] };
};

export const scaleMicro = value => BigInt(value) * 314159265n * 1000000n / 161803399n;
export const cadence = [13, 17, 34].map(value => ({ value, micro: String(scaleMicro(value)) }));

export function evidenceConsensus(lanes) {
  if (!Array.isArray(lanes) || lanes.length !== 3) return { status: "insufficient-evidence" };
  if (lanes.some(x => !x || typeof x.family !== "string" || !x.family.trim() ||
      typeof x.locator !== "string" || !x.locator.trim() || !shaPattern.test(x.sha256 ?? ""))) {
    return { status: "insufficient-evidence" };
  }
  if (new Set(lanes.map(x => x.family.trim().toLowerCase())).size !== 3) {
    return { status: "dependent-evidence" };
  }
  const agree = lanes.find((lane, i) => lanes.some((other, j) => j !== i && other.sha256 === lane.sha256));
  return agree ? { status: "candidate-agreement", sha256: agree.sha256 } : { status: "disagreement" };
}
