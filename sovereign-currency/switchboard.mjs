const fixtureKey = "bitcoin-genesis-switchboard-v1";

export function gateCases() {
  const routing = [
    ["Light Slayer", "linear", 0, "SIN"],
    ["Light Sleyer", "linear", 1, "SEN"],
    ["Dark Slayer", "circular", 0, "SIN"],
    ["Dark Sleyer", "circular", 1, "SEN"]
  ];
  const input = [1, 0, 1];
  return routing.map(([name, topology, gate, coinReference]) => {
    const position = 2;
    const next = topology === "circular" ? (position + 1) % input.length : position + 1;
    const output = input.slice();
    if (gate === 0) output[position] = 0;
    else if (next < output.length) output[next] = input[position];
    return {
      name, topology, gate, coinReference, input, output,
      sourceIndex: position, destinationIndex: gate === 1 && next < input.length ? next : null,
      operation: gate === 0 ? "Clear the selected demo cell" : "Weave its bit into the next demo cell"
    };
  });
}

export async function switchboardReceipt(request, db, execute) {
  const statement = db.prepare("SELECT created_at, result FROM sovereign_switchboard_receipts WHERE fixture = ?").bind(fixtureKey);
  let row = await statement.first();
  if (request.method === "POST" && !row) {
    const result = { ...await execute(), gates: gateCases() };
    await db.prepare("INSERT INTO sovereign_switchboard_receipts (fixture, created_at, result) VALUES (?, ?, ?) ON CONFLICT(fixture) DO NOTHING")
      .bind(fixtureKey, new Date().toISOString(), JSON.stringify(result)).run();
    row = await statement.first();
  }
  return row ? { fixture: fixtureKey, createdAt: row.created_at, result: JSON.parse(row.result) } : null;
}

export function switchboardPage() {
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sovereign Edge Switchboard</title><link rel="stylesheet" href="/catalog.css"><main><nav><a href="/">Sovereign Currency</a><a href="/coins">Coin catalog</a><a href="/api/quantum/receipt">Saved receipt</a></nav><h1>Sovereign Edge Switchboard</h1><p>Run the historical SHA-256d fixture and save its three-phase receipt. The gate examples use a three-cell binary register.</p><ul>' +
    gateCases().map(c => '<li><strong>' + c.name + '</strong> · ' + c.topology + ' · gate ' + c.gate + ' · ' +
      c.input.join('') + ' → ' + c.output.join('') + ' · ' + c.coinReference + '</li>').join('') +
    '</ul><form method="post" action="/api/quantum/receipt"><button>Run and save reference receipt</button></form></main></html>';
}
