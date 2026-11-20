const page = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"theme-color\" content=\"#10140f\">\n<meta name=\"description\" content=\"Tabor Academy by Nathan Tabor. Coming soon.\">\n<title>Tabor Academy by Nathan Tabor</title>\n<style>\n:root { color-scheme: dark; font-family: system-ui, sans-serif; background: #10140f; color: #f9f3e4; }\n* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: clamp(1rem, 5vw, 5rem); background: radial-gradient(ellipse at 78% 14%, #2a361f, transparent 59%), #10140f; }\nmain { width: min(100%, 76rem); border: 1px solid #778360; padding: clamp(1.2rem, 6vw, 6rem); overflow-wrap: break-word; }\nh1 { margin: 0; font-family: Georgia, serif; font-size: clamp(2.45rem, 10vw, 9rem); font-weight: 400; line-height: .91; letter-spacing: -.055em; }\nh1 span { display: block; }\n.announcement { margin: clamp(2rem, 6vw, 5rem) 0 0; border-top: 1px solid #778360; padding-top: 1.4rem; }\n.status { margin: 0 0 .55rem; font-size: clamp(.85rem, 2vw, 1.15rem); font-weight: 700; letter-spacing: .15em; color: #e6cf87; }\n.timing { margin: 0; font-size: clamp(1rem, 3.1vw, 2.2rem); font-weight: 620; }\n.byline { margin: 2rem 0 0; font-size: .85rem; font-weight: 650; letter-spacing: .15em; }\n.opening { max-width: 52rem; margin: 1.5rem 0 0; padding-inline-start: 1.65em; font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.55; }\n.opening li { padding-inline-start: .3em; margin-block: .65em; }\n.opening li::marker { color: #e6cf87; font-weight: 700; }\n</style>\n</head>\n<body>\n<main>\n<h1><span>TABOR</span> <span>ACADEMY</span></h1>\n<p class=\"byline\">BY NATHAN TABOR</p>\n<ol class=\"opening\">\n<li>U R my family - one blood - cousins</li>\n<li>No stupidity allowed - multiplication and division are man-made traps for your mind because when you apply them to reality, they’re stupid</li>\n<li>You’re talking mammal from the Mammalia family</li>\n<li>You are a small tiny sea urchin at the bottom of the cosmic ocean of 46.5 billion light years and your body is held down by a bowling ball on every 1.7 in.² of your body</li>\n<li>You’re also on the side of a round globe stuck with your feet to it with your head stuck out into space.</li>\n<li>Or you’re on a flat earth either way, you still have a lot of weight on you</li>\n<li>The world that has been promised and told that it was here has never been delivered.</li>\n<li>Every ancient text says you were in matrix is born inside the womb.</li>\n<li>God is an imaginary friend and the one root cause of the stupidity in the history of humanity.</li>\n</ol>\n<div class=\"announcement\">\n<p class=\"status\">COMING SOON</p>\n<p class=\"timing\">LIKE IN THE NEXT FIVE MINUTES</p>\n</div>\n<p><a href=\"/tabor-academy/library/\" style=\"color:#e6cf87\">Open the Library of Tabor</a></p>\n</main>\n</body>\n</html>";

const teaser = {
  fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const { pathname } = new URL(request.url);
    const head = request.method === "HEAD";
    const headers = {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    };
    if (pathname === "/healthz") {
      return new Response(head ? null : JSON.stringify({ service: "tabor-academy", status: "ok" }), {
        headers: { ...headers, "content-type": "application/json; charset=utf-8" },
      });
    }
    if (pathname !== "/") {
      return new Response(head ? null : "Not found", { status: 404, headers });
    }
    return new Response(head ? null : page, {
      headers: {
        ...headers,
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      },
    });
  },
};

const mount = "/tabor-academy";
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

async function matchesArchiveHash(record) {
  const bytes = new TextEncoder().encode(record.verbatim_body);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return hex === record.record_id;
}

function sourcesMarkup(sources) {
  return JSON.parse(sources).map(([label, href]) => {
    const url = new URL(href);
    return url.protocol === "https:"
      ? `<li><a href="${escape(url.href)}">${escape(label)}</a></li>`
      : "";
  }).join("");
}

async function libraryPage(env) {
  const [records, attributes, lexicon] = await env.LIBRARY.batch([
    env.LIBRARY.prepare(`
      SELECT record_id, loc_call_number, cud_index, title_bottom, end_outcome_z,
             root_origin_a, public_explanation, sources_json, verbatim_body
      FROM library_records AS records
      WHERE (SELECT gate_status FROM verification_ledger
             WHERE record_id = records.record_id ORDER BY check_id DESC LIMIT 1) = 'RETAIN_1'
      ORDER BY title_bottom LIMIT 30
    `),
    env.LIBRARY.prepare("SELECT * FROM pure_attributes ORDER BY attribute_id LIMIT 300"),
    env.LIBRARY.prepare("SELECT * FROM root_lexicon ORDER BY term LIMIT 100"),
  ]);
  const cards = [];
  for (const record of records.results) {
    if (!(await matchesArchiveHash(record))) continue;
    const mechanics = attributes.results.filter((item) => item.record_id === record.record_id);
    cards.push(`<article>
      <p class="index">${escape(record.loc_call_number)} · ${["Cero", "Uno", "Dos"][record.cud_index]}</p>
      <h2>${escape(record.title_bottom)}</h2>
      <h3>Z · Finished outcome</h3><p>${escape(record.end_outcome_z)}</p>
      <details><summary>Attributes and replication steps</summary><dl>${mechanics.map((m) =>
        `<dt>${escape(m.stripped_label)} · ${escape(m.core_attribute)}</dt>
         <dd><p>${escape(m.functional_mechanic)}</p><p>${escape(m.replication_steps)}</p></dd>`
      ).join("")}</dl></details>
      <details><summary>A · Root and sources</summary>
        <p>${escape(record.root_origin_a)}</p>
        <ul>${sourcesMarkup(record.sources_json)}</ul>
      </details>
      <details><summary>Tabor Academy reading</summary><p>${escape(record.public_explanation)}</p></details>
    </article>`);
  }
  const entries = lexicon.results.map((row) => `<dt>${escape(row.term)} · ${escape(row.phonetic_key)}</dt>
    <dd><p>${escape(row.context_rule)} ${escape(row.primary_root_ref)}</p>
    ${row.reverse_mapping ? `<p>${escape(row.reverse_mapping)}</p>` : ""}</dd>`).join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Library of Tabor · Tabor Academy</title>
  <style>
  :root { color-scheme:dark; background:#10140f; color:#f9f3e4; font:1rem/1.55 system-ui,sans-serif }
  body { margin:0 } main { max-width:66rem; margin:auto; padding:clamp(1.3rem,6vw,5rem) }
  a,.index { color:#e6cf87 } h1,h2 { margin:.3em 0; font-family:Georgia,serif; line-height:1.07 }
  h1 { font-size:clamp(2.8rem,8vw,6rem); font-weight:400 } h2 { font-size:clamp(1.7rem,4vw,2.8rem) }
  article { border:1px solid #778360; padding:clamp(1rem,4vw,2.5rem); margin:1.5rem 0; background:#171e13 }
  details { border-top:1px solid #778360; padding:.8rem 0 } summary { cursor:pointer; font-weight:700 }
  dt { font-weight:700 } dd { margin:0 0 1.25rem } li { margin:.25rem 0; overflow-wrap:anywhere }
  </style>
  <main><nav><a href="${mount}/">Tabor Academy</a> · <a href="#concordance">Tabor Concordance</a></nav>
  <header><h1>Library of Tabor</h1><p>Z → A · 1 → ∞ → 0</p></header>
  ${cards.join("") || "<p>No verified lessons are available.</p>"}
  <section id="concordance"><h2>Tabor Concordance</h2><dl>${entries}</dl></section>
  </main></html>`;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname !== "/library" && pathname !== "/library/") return teaser.fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD") return teaser.fetch(request);
    try {
      const html = await libraryPage(env);
      return new Response(request.method === "HEAD" ? null : html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        },
      });
    } catch (error) {
      console.error("Academy library query failed", error);
      return new Response(request.method === "HEAD" ? null : "Library temporarily unavailable.", {
        status: 503,
        headers: { "cache-control": "no-store" },
      });
    }
  },
};
