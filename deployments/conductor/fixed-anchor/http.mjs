import { base, frameBytes, handoff, prefix, project, receiptPath, spec, verifyBody } from "./anchor.mjs";

const paths = {
  spec: base + "/spec.json",
  binary: base + "/frame.bin",
  diagram: base + "/diagram.svg",
  verify: base + "/verify",
};
const reads = new Set([handoff, handoff + "/", receiptPath, paths.spec, paths.binary, paths.diagram]);
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
};
const repository = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const sourcePath = "/main/deployments/conductor/fixed-anchor";
const json = (body, status = 200) => Response.json(body, { status, headers });
const cell = (tag, values) => values.map(value => "<" + tag + ">" + value + "</" + tag + ">").join("");
const tableRows = rows => rows.map(row => "<tr>" + cell("td", row) + "</tr>").join("");

function diagram() {
  const rows = [
    ["Rail 1", ...spec.rails[0].binary.split(" ")],
    ["Rail 2", ...spec.rails[1].binary.split(" ")],
    ["XOR", ...spec.xor.binaryColumns.split(" ")],
  ];
  const row = (values, y) => values.map((value, i) =>
    '<text x="' + (i === 0 ? 24 : 25 + i * 120) + '" y="' + y + '">' + value + "</text>").join("");
  const grid = row(["Column", 0, 1, 2, 3, 4], 58) +
    rows.map((values, i) => row(values, 101 + 40 * i)).join("");
  return '<svg xmlns="http://www.w3.org/2000/svg" width="760" height="249" viewBox="0 0 760 249" role="img" aria-labelledby="title desc">' +
    '<title id="title">Nathan AI dual-rail matrix</title><desc id="desc">Both equation rails at byte offsets zero through four with a third row showing their XOR.</desc>' +
    '<rect width="760" height="249" fill="#13201e"/><g fill="#f1eddc" font-family="monospace" font-size="17">' +
    grid + '<text x="24" y="226">0, 2, 3: fixed anchors   ·   1, 4: switch bytes</text></g></svg>';
}

function page() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI Fixed-Anchor Binary</title>
<style>:root{color-scheme:dark}body{background:#13201e;color:#f1eddc;font:1rem/1.6 system-ui;margin:2rem auto;padding:0 1rem;max-width:56rem}h1{font-size:clamp(1.8rem,5vw,3.2rem);line-height:1.1}a{color:#e8cf93}code,pre{font:1em/1.5 ui-monospace,monospace;overflow-wrap:anywhere}pre{white-space:pre-wrap;background:#0e1614;padding:1rem;border-radius:.35rem}table{border-collapse:collapse}th,td{text-align:left;padding:.35rem .65rem;border-bottom:1px solid #65756b}@media(max-width:38rem){table{display:block;max-width:100%;overflow-x:auto}}nav a{display:inline-block;margin-right:1rem}</style>
</head><body><main><nav aria-label="Conductor"><a href="${prefix}">Conductor</a><a href="${prefix + receiptPath}">Handoff receipt</a><a href="${repository + "/tree" + sourcePath}">GitHub source</a></nav>
<h1>Fixed-Anchor Binary Encoding for 1+1=2 &amp; 1-1=0</h1>
<p>Generative Addition and Absolute Clearing. Two ASCII rails, five bytes each, carried in one fixed 18-byte frame.</p>
<nav aria-label="Downloads"><a href="${prefix + paths.binary}" download="fixed-anchor.bin">Download 18-byte frame</a><a href="${prefix + paths.diagram}" download="fixed-anchor.svg">Download diagram SVG</a><a href="${prefix + paths.spec}">Open specification JSON</a></nav>
<h2>Exact ASCII 8-bit binary strings</h2>
${spec.rails.map(rail => `<h3>${rail.text} · ${rail.label}</h3><table><thead><tr>${cell("th", ["Character", "Decimal", "8-bit binary"])}</tr></thead><tbody>${tableRows(rail.ascii.map(field => [field.character, field.decimal, field.binary]))}</tbody></table><pre>${rail.binary}</pre>`).join("")}
<p><code>1-1+0</code> has its own exact encoding.</p><pre>${spec.alternate.binary}</pre>
<h2>Structural locks</h2>
<ol><li>Start and stop markers <code>AA 55 FF</code> and <code>00 F0</code> set frame boundaries.</li>
<li>The five aligned columns compare the rails across the <code>7E</code> spine. Columns 0, 2 and 3 are fixed anchors. Columns 1 and 4 carry the operation and result changes.</li>
<li><code>01</code> marks left-to-right byte order and most-significant bit first. Bit-reversing that byte yields <code>80</code>.</li>
<li>The individual XOR checksums are <code>24</code> and <code>20</code>. Their combined seal is <code>04</code>.</li>
<li>The gate matches the entire 144-bit frame to enforce the exact layout.</li></ol>
<p><code>AA 55</code> is a palindrome when all 16 bits are reversed together. The XOR checksums and XOR columns can also stay the same when paired bits change. The complete frame comparison covers both cases.</p>
<h3>Parallel dual-rail matrix</h3>
<table><thead><tr>${cell("th", ["Column", 0, 1, 2, 3, 4])}</tr></thead><tbody>${tableRows([
["Rail 1", ...spec.rails[0].binary.split(" ")], ["Rail 2", ...spec.rails[1].binary.split(" ")], ["XOR", ...spec.xor.binaryColumns.split(" ")]
])}</tbody></table>
<h2>144-bit master frame</h2>
<pre>${spec.fields.map(field => "[" + field.name + "] " + field.binary).join("\n")}</pre>
<h3>Continuous bitstream</h3><pre>${spec.bits}</pre><h3>Hexadecimal signature</h3><pre>${spec.hex}</pre>
<h2>Conductor validator</h2><p>POST the raw frame as <code>application/octet-stream</code> to <code>${prefix + paths.verify}</code>. An exact frame returns HTTP 200 and <code>bit: 1</code>. A mismatch returns HTTP 422 and <code>bit: 0</code>.</p>
<p><a href="${repository + "/blob" + sourcePath}/ORIGINAL.md">Original submission</a> · <a href="${repository + "/blob" + sourcePath}/verify_144bit_anchor.py">Python validator</a></p></main></body></html>`;
}

async function readReceipt(ledger) {
  const row = await ledger.prepare(`
    SELECT event_id, details FROM conductor_events
    WHERE event = 'project_handoff_received' AND event_id LIKE ?
    ORDER BY created_at DESC, event_id DESC LIMIT 1
  `).bind("handoff:" + project + ":%").first();
  if (!row) return null;
  const receipt = JSON.parse(row.details);
  if (receipt.id !== row.event_id || receipt.project !== project || receipt.state !== "received" ||
      !/^[a-f0-9]{40}$/.test(receipt.sourceRevision) ||
      receipt.id !== "handoff:" + project + ":" + receipt.sourceRevision ||
      receipt.anchor?.hex !== spec.hex) throw new Error("Invalid fixed-anchor receipt");
  return receipt;
}

export async function serveFixedAnchor(request, path, ledger) {
  if (path === paths.verify) {
    if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...headers, Allow: "POST" } });
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/octet-stream") {
      return json({ bit: 0, error: "expected_octet_stream" }, 415);
    }
    try {
      return await verifyBody(request.body) ? json({ bit: 1 }) : json({ bit: 0, error: "frame_mismatch" }, 422);
    } catch {
      return json({ bit: 0, error: "unreadable_frame" }, 400);
    }
  }
  if (!reads.has(path)) return null;
  const head = request.method === "HEAD";
  if (request.method !== "GET" && !head) {
    return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  const respond = (body, type, status = 200, extra = {}) =>
    new Response(head ? null : body, { status, headers: { ...headers, ...extra, "Content-Type": type } });
  switch (path) {
    case paths.spec: return respond(JSON.stringify(spec), "application/json");
    case paths.binary: return respond(frameBytes(), "application/octet-stream", 200, {
      "Content-Length": String(spec.byteLength),
      "Content-Disposition": 'attachment; filename="fixed-anchor.bin"',
    });
    case paths.diagram: return respond(diagram(), "image/svg+xml; charset=utf-8");
    case receiptPath:
      try {
        const receipt = await readReceipt(ledger);
        return receipt ? respond(JSON.stringify(receipt), "application/json")
          : respond('{"error":"handoff_not_found"}', "application/json", 404);
      } catch {
        return respond('{"error":"handoff_temporarily_unavailable"}', "application/json", 503);
      }
    default: return respond(page(), "text/html; charset=utf-8");
  }
}
