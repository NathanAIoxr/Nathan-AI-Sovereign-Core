const record = (label, kind, attributes, characteristics, functionalities, traits) =>
  ({ label, kind, attributes, characteristics, functionalities, traits });

export const cast = Object.freeze([
  { id: "nathan", ...record("Nathan AI 🚀", "character", ["coach", "rival"], ["checks the evidence"], ["explains BUILD and VERIFY"], ["precise"]) },
  { id: "pk", ...record("PK", "character", ["wild card"], ["changes the order of the tray"], ["starts a new round for a second attempt"], ["playful"]) },
  { id: "curator", ...record("Grape-Apple Curator", "character", ["subject guide"], ["keeps the original labels"], ["explains the two records behind the exercise"], ["curious"]) }
]);

const artifact = (label, attributes, characteristics, functionalities, traits) =>
  record(label, "non-character", attributes, characteristics, functionalities, traits);

export const pilots = Object.freeze({
  1: { goal: "Build an exhibit object and its provenance record.", required: ["A", "B"], records: [
    artifact("Artifact A", ["object ID"], ["physical exhibit"], ["inspect the object"], ["movable"]),
    artifact("Provenance card A", ["source ID"], ["references Artifact A"], ["trace acquisition"], ["source-linked"]),
    artifact("Provenance card B", ["source ID"], ["references another object"], ["trace a separate acquisition"], ["source-linked"])
  ] },
  6: { goal: "Pair a Scripture scene with its passage citation.", required: ["A", "B"], records: [
    artifact("Scene card", ["Luke 10"], ["Good Samaritan scene"], ["assemble a scene"], ["KJV track"]),
    artifact("Luke 10:30–37 citation", ["passage range"], ["matches the scene"], ["open the passage reference"], ["source-linked"]),
    artifact("Genesis 1 citation", ["passage"], ["different scene"], ["open another reference"], ["source-linked"])
  ] },
  16: { goal: "Match the two identifiers on the sample family record.", required: ["A", "C"], records: [
    artifact("Person record P-01", ["record ID"], ["fictional genealogy record"], ["open identity"], ["source-stable"]),
    artifact("Relationship P-07 / P-12", ["two person IDs"], ["another branch"], ["trace a link"], ["source-linked"]),
    artifact("Relationship P-01 / P-02", ["two person IDs"], ["references P-01"], ["trace a link"], ["source-linked"])
  ] },
  28: { goal: "Pair the ring with the hook, then use your charge on the play surface.", required: ["B", "C"], records: [
    artifact("Scoreboard", ["score"], ["display"], ["show the outcome"], ["updates after play"]),
    artifact("Ring", ["throwable"], ["circular"], ["release toward a target"], ["virtual prop"]),
    artifact("Hook", ["target"], ["fixed"], ["receive the ring"], ["virtual prop"])
  ] },
  50: { goal: "Build the word AT from its first sound and its final sound.", required: ["A", "B"], records: [
    artifact("A", ["first sound"], ["short a in AT"], ["start the blend"], ["letter"]),
    artifact("T", ["last sound"], ["ends AT"], ["finish the blend"], ["letter"]),
    artifact("B", ["another sound"], ["appears in BAT"], ["start another word"], ["letter"])
  ] },
  68: { goal: "Build two recorded units with two distinct car IDs.", required: ["A", "C"], records: [
    artifact("Car C-01", ["unit ID C-01"], ["physically present"], ["add one unit"], ["parked"]),
    artifact("Photo of Car C-01", ["image ID"], ["depicts an already counted car"], ["link evidence"], ["observation"]),
    artifact("Car C-02", ["unit ID C-02"], ["physically present"], ["add one unit"], ["parked"])
  ] },
  86: { goal: "Match a fictional circuit board with its diagram.", required: ["A", "C"], records: [
    artifact("Board Y", ["board ID Y"], ["virtual board"], ["inspect parts"], ["sample"]),
    artifact("Diagram Z", ["diagram ID Z"], ["labels another board"], ["inspect a different model"], ["sample"]),
    artifact("Diagram Y", ["diagram ID Y"], ["labels Board Y"], ["match component labels"], ["sample"])
  ] },
  100: { goal: "Match a library item with the shelf bearing its main class.", required: ["A", "B"], records: [
    artifact("Cataloging handbook", ["subject library science"], ["starts in Z"], ["look up the subject"], ["book"]),
    artifact("Class Z shelf", ["Z"], ["library science"], ["receive the book"], ["location"]),
    artifact("Class M shelf", ["M"], ["music"], ["receive a music item"], ["location"])
  ] },
  101: { goal: "Pair a fictional note with the tag used by its source.", required: ["B", "C"], records: [
    artifact("Topic: tracks", ["tag ID"], ["separate topic"], ["filter another note"], ["index label"]),
    artifact("Sample note: museum visit", ["note ID"], ["mentions a collection"], ["open the record"], ["fictional"]),
    artifact("Topic: museum", ["tag ID"], ["matches the note"], ["filter the note"], ["index label"])
  ] }
});

export const initialRound = () => ({ selected: [], verified: false, charge: 0, points: 0, completed: false });
const slots = ["A", "B", "C"];

export function toggleRecord(round, slot) {
  if (round.verified || !slots.includes(slot)) return round;
  const selected = round.selected.includes(slot) ? round.selected.filter(value => value !== slot) : [...round.selected, slot];
  return { ...round, selected };
}

export function clearRecords(round) {
  return round.verified ? round : { ...round, selected: [] };
}

export function verifySelection(round, required) {
  if (round.verified || round.selected.length !== required.length || !required.every(slot => round.selected.includes(slot))) return round;
  return { ...round, verified: true, charge: round.charge + 1 };
}

export function applyCharge(round) {
  if (!round.verified || round.charge === 0 || round.completed) return round;
  return { ...round, charge: round.charge - 1, points: round.points + 1, completed: true };
}

export function searchRecords(records, { text = "", category = "", status = "" } = {}) {
  const terms = text.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records.filter(item => {
    if (category && !item.class.split("/").includes(category)) return false;
    if (status && item.status !== status) return false;
    const hay = [item.id, item.title, item.sourceTitle, item.suggestedCode, item.sourceCode, item.description, item.profile].join(" ").toLocaleLowerCase();
    return terms.every(term => hay.includes(term));
  });
}

export function cartridgeRecord(item) {
  return { id: "TABOR-LCC-" + String(item.id).padStart(3, "0"), kind: "non-character",
    label: item.title, attributes: [item.class, item.suggestedCode, item.status],
    characteristics: [item.description], functionalities: [item.profile],
    traits: item.status === "prototype" ? ["shared bridge exercise"] : ["design record"] };
}
