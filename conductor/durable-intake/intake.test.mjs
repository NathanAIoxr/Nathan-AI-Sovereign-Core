import { enqueueIntake, makeReceipt, projectIntake } from "./intake.mjs";

const revision = "a".repeat(40);
const event = { source: "six-dogs-ci", kind: "ci-failure", reference: "123/2", commit: revision };
const assert = (test, description) => { if (!test) throw new Error(description); };
async function rejects(fn) {
  try { await fn(); } catch { return; }
  throw new Error("Expected rejection");
}
const receipt = await makeReceipt(event);
assert(receipt.id === (await makeReceipt({...event, commit: revision.toUpperCase()})).id, "Canonical receipt");
assert(receipt.id !== (await makeReceipt({...event, reference: "123/3"})).id, "Different attempt");
await rejects(() => makeReceipt({...event, kind: "build-proposal"}));
await rejects(() => makeReceipt({...event, transcript: "private"}));
await rejects(() => makeReceipt({...event, commit: "bad"}));
const proposal = {source: "hop-in-chatbox", kind: "build-proposal", reference: "proposal-123"};
assert((await makeReceipt(proposal)).commit === null, "Proposal intake");
let sent;
assert(await enqueueIntake({send: async payload => { sent = payload; }}, event) === receipt.id, "Queue acceptance");
await rejects(() => enqueueIntake({send: async () => { throw new Error("unavailable"); }}, event));
let acknowledgements = 0;
const batch = {messages: [{body: sent}, {body: sent}], ackAll: () => { acknowledgements++; }};
const db = {
  prepare: sql => ({bind: (...values) => ({sql, values})}),
  batch: async statements => {
    assert(statements.length === 2 && statements.every(s => s.values[0] === sent.id), "Duplicate key");
    assert(statements.every(s => s.sql.includes("ON CONFLICT(receipt_id) DO NOTHING")), "SQL idempotency guard");
    return statements.map(() => ({success: true}));
  }
};
await rejects(() => projectIntake(batch, {...db, batch: async () => { throw new Error("quota"); }}));
assert(acknowledgements === 0, "No acknowledgement after quota error");
await rejects(() => projectIntake(batch, {...db, batch: async () => [{success: true}, {success: false}]}));
assert(acknowledgements === 0, "No acknowledgement after failed result");
await projectIntake(batch, db);
assert(acknowledgements === 1, "Acknowledged after projection");
await rejects(() => projectIntake({...batch, messages: [{body: {...sent, id: "wrong"}}]}, db));
assert(acknowledgements === 1, "Tampered receipt remains unacknowledged");
console.log("Conductor intake tests passed");
