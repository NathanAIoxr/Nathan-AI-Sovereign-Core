export const patterns = [
  { id: "duple", label: "2/4 · Duple meter", steps: [2, 1], beats: 2 },
  { id: "triple", label: "3/4 · Triple meter", steps: [2, 1, 1], beats: 3 },
  { id: "four", label: "4/4 · Four-beat meter", steps: [2, 1, 1, 1], beats: 4 },
  { id: "compound", label: "6/8 · Two beats of three", steps: [2, 1, 1, 2, 1, 1], beats: 2 },
  { id: "aksak", label: "Seven pulses · 2 + 2 + 3", steps: [2, 1, 2, 1, 2, 1, 1], beats: 7 },
  { id: "rupak", label: "Seven mātrās · 3 + 2 + 2", steps: [1, 1, 1, 2, 1, 2, 1], beats: 7 },
  { id: "cross-rhythm", label: "3 against 2 · Six subdivisions", steps: [2, 0, 0, 2, 0, 0], overlay: [1, 0, 1, 0, 1, 0], beats: 2 }
];

const day = 86400;
const year = 365.2425 * day;
export const periods = [
  ["heartbeat","Human heartbeat · 72 BPM example",60 / 72],
  ["demo","Tabor score · 96 BPM demo",60 / 96],
  ["schumann","Schumann resonance · 7.83 Hz reference",1 / 7.83],
  ["tide","Semidiurnal tide · about 12 h 25 min",12 * 3600 + 25 * 60],
  ["circadian","Circadian cycle · 24 h reference",day],
  ["moon","Lunar phases · about 29.53 days",29.53 * day],
  ["sunspots","Sunspot cycle · about 11 years",11 * year],
  ["brood-19","Magi Cicada · 13 years",13 * year],
  ["brood-13","Magi Cicada · 17 years",17 * year],
  ["shared","Magi Cicada · 221-year alignment",221 * year],
  ["precession","Climatic precession · about 23,000 years",23000 * year]
];

export function periodRatio(first, second) {
  return second / first;
}
