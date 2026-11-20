const sources = {
  "six-dogs-ci": "ci-failure",
  "zeros-and-ones": "ci-failure",
  "hop-in-chatbox": "build-proposal",
  "nathan-ai-voice-box": "build-proposal"
};

const token = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;
const revision = /^[a-f0-9]{40}$/i;
const insert = `INSERT INTO conductor_intake_receipts
  (receipt_id, source, kind, reference, revision)
  VALUES (?, ?, ?, ?, ?) ON CONFLICT(receipt_id) DO NOTHING`;

export async function makeReceipt(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Expected an event object");
  }
  const { source, kind, reference, commit } = input;
  if (Object.keys(input).some(key => !["source", "kind", "reference", "commit"].includes(key))
      || typeof source !== "string" || !Object.hasOwn(sources, source)
      || kind !== sources[source] || typeof reference !== "string" || !token.test(reference)
      || (kind === "ci-failure" && (typeof commit !== "string" || !revision.test(commit)))
      || (kind === "build-proposal" && commit !== undefined)) {
    throw new TypeError("Unsupported event or invalid reference");
  }
  const fields = [source, kind, reference, commit?.toLowerCase() ?? null];
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(fields)));
  const id = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return { id, source, kind, reference, commit: fields[3] };
}

export async function enqueueIntake(queue, input) {
  const receipt = await makeReceipt(input);
  await queue.send(receipt);
  return receipt.id;
}

export async function projectIntake(batch, db) {
  const statements = await Promise.all(batch.messages.map(async ({ body }) => {
    const receipt = await makeReceipt({
      source: body.source,
      kind: body.kind,
      reference: body.reference,
      ...(body.commit === null ? {} : { commit: body.commit })
    });
    if (body.id !== receipt.id) throw new TypeError("Invalid receipt ID");
    return db.prepare(insert).bind(receipt.id, receipt.source, receipt.kind, receipt.reference, receipt.commit);
  }));
  if (statements.length === 0) return;
  const results = await db.batch(statements);
  if (results.length !== statements.length || results.some(result => !result.success)) {
    throw new Error("D1 receipt projection failed");
  }
  batch.ackAll();
}
