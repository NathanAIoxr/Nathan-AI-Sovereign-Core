const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nathan AI Project Index</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { max-width: 48rem; margin: 3rem auto; padding: 0 1.25rem; line-height: 1.6; }
    h1, h2 { line-height: 1.2; }
    li { margin-block: 0.7rem; }
  </style>
</head>
<body>
  <main>
    <h1>Nathan AI Project Index</h1>
    <section>
      <h2>Wordplay and cadence</h2>
      <p>The Nathan Tabor Wordplay Matrix includes four linguistic axes, twelve nodes, and a music, rhythm, and cadence inventory.</p>
      <ul>
        <li><a href="https://epenthesis-word-matrix.nathantaboract.workers.dev/explore">Open the live Wordplay Matrix</a></li>
        <li><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/328">Review the Wordplay Matrix source and deployment draft</a></li>
      </ul>
    </section>
    <section>
      <h2>Defensive projects</h2>
      <ul>
        <li><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/320">Sovereign Defender / Outside Box draft</a> covers incident intake and evidence preservation.</li>
        <li><strong>Semantics Antivirus / TABOR 1-2-3</strong> is recorded as a local language and text review prototype.</li>
      </ul>
    </section>
    <section>
      <h2>Simulation records</h2>
      <ul>
        <li><strong>Nathan AI Guardian V2.0</strong> names <code>DIRTY_OLE_BASTARD_Protocol (Financial Reclamation)</code> in simulation records dated October 5 and 8, 2025.</li>
        <li><strong>November 5, 2026 collection.</strong> Prior notes describe a collection of security simulations. Individual entries are unverified.</li>
      </ul>
    </section>
  </main>
</body>
</html>`;

const headers = {
  "content-type": "text/html; charset=utf-8",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

export default {
  fetch(request) {
    if (new URL(request.url).pathname !== "/") {
      return new Response(null, { status: 404 });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
    }

    return new Response(request.method === "HEAD" ? null : page, { headers });
  },
};
