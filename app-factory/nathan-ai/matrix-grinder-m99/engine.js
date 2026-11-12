/* M-99 deterministic, non-diagnostic conceptual review engine.
 * No automatic truth/guilt inference; review flags require human evidence. */
export const MATRICES = Object.freeze([
  { id:"M1", name:"LAW", question:"What standard or rule applies?" },
  { id:"M2", name:"HISTORY", question:"What primary evidence and chronology support this?" },
  { id:"M3", name:"POETRY & WISDOM", question:"Which interpretations and contradictions remain?" },
  { id:"M4", name:"PROPHECY", question:"What outcomes and risks are supported?" },
  { id:"M5", name:"NEW TESTAMENT", question:"What accountable, protective response is appropriate?" }
]);
export const CURRENT_FAMILIES = Object.freeze([
  "cosmic","atmospheric","ocean","river","terrestrial","biological","electrical","harmonic"
]);
const clean = value => String(value ?? "").trim();
export function createRecord(input = {}) {
  return {
    id: clean(input.id) || "M99-LOCAL",
    claim: clean(input.claim),
    source: clean(input.source),
    evidence: clean(input.evidence),
    uncertainty: clean(input.uncertainty),
    harmRisk: clean(input.harmRisk),
    createdAt: clean(input.createdAt) || "unspecified",
    revision: 0,
    passes: [],
    unresolved: [],
    status: "new"
  };
}
export function runCycle(record, checks = {}) {
  if (!record || !clean(record.claim)) throw new Error("A claim is required");
  const forward = MATRICES.map(matrix => ({
    matrix: matrix.id, direction:"down", name:matrix.name,
    question:matrix.question, finding:clean(checks[matrix.id]?.finding),
    evidence:clean(checks[matrix.id]?.evidence),
    status:checks[matrix.id]?.status === "reviewed" ? "reviewed" : "unresolved"
  }));
  const reverse = [...forward].reverse().map(step => ({
    ...step, direction:"up", question:"Recheck: " + step.question
  }));
  const unresolved = forward.filter(step => step.status !== "reviewed" || !step.evidence)
    .map(step => step.matrix + ": missing review or supporting evidence");
  if (!clean(record.source)) unresolved.unshift("SOURCE: provenance not supplied");
  if (!clean(record.evidence)) unresolved.unshift("EVIDENCE: primary support not supplied");
  const next = {
    ...record, revision:record.revision + 1,
    passes:[...record.passes,{cycle:record.revision + 1,forward,reverse,
      route:["summit","descend","M1","M2","M3","M4","M5",
        "left calf pump","right calf pump","return conveyor",
        "bottom entry","rise","overflow","recheck"]}],
    unresolved, status:unresolved.length ? "recirculate" : "review-complete"
  };
  // "review-complete" is NOT a claim of objective truth.
  return next;
}
export function exportRecord(record) {
  return JSON.stringify(record,null,2);
}
