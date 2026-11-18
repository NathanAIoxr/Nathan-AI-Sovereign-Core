import { assignment, bookAssignment, collections, lccClasses, references, storagePlan, summary, traditions,
  workerAssignment, workerCount, corpusSize } from "./library-plan.mjs";
import { escape, headers, json, page } from "./view.mjs";

const count = (n) => n.toLocaleString("en-US");
const decimal = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const rows = () => Array.from({ length: workerCount }, (_, index) => assignment(index));

function home() {
  const plan = summary();
  const storageRows = plan.storageExamples.map((item, index) => {
    const label = ["8 KB metadata", "1 MB reading files", "5 MB ebooks", "25 MB scans", "100 MB scans"][index];
    return `<tr><th scope="row">${label}</th><td>${decimal(item.singleCopyBytes / 1e12)} TB</td><td>${decimal(item.allCopyBytes / 1e12)} TB</td><td>${item.totalNodes}</td></tr>`;
  }).join("");
  const work = collections.map(({ title, dewey }) => `<li>${escape(title)} · ${dewey.map((code) => `<a href="/library/api/locate?dewey=${code}">${code}</a>`).join(", ")}</li>`).join("");
  const heritage = traditions.map(({ title, task, source }) => `<li>${escape(title)}. ${escape(task)}${source ? ` <a href="${escape(source)}">Source</a>` : ""}</li>`).join("");
  return page("Library of Tabor · 1,000 Worker assignments", `
<h1>Library of Tabor</h1>
<p><strong>${count(plan.totalWorkers)} Worker assignments</strong> · ${count(corpusSize)} planned books · 0 imported into this plan</p>
<p>Find a subject desk by Dewey address or a storage assignment by accession. Every Worker has both a cataloging duty and a reserved range of ${count(plan.balancedBookCapacityPerWorker)} accessions. A book’s subject desk and storage Worker can differ.</p>
<p><a href="/library/api/assignments">Browse assignments</a> · <a href="/library/assignments.csv">Download all assignments</a> · <a href="/library/api/summary">Classification and sizing API</a></p>
<form action="/library/api/locate"><label>Dewey address <input name="dewey" pattern="[0-9]{3}" placeholder="929" required></label> <button>Find subject desk</button></form>
<form action="/library/api/locate"><label>Accession <input name="accession" type="number" min="1" max="${corpusSize}" placeholder="13301" required></label> <button>Find storage Worker</button></form>
<h2>Storage capacity</h2><p>The examples assume three complete copies and 120 TB raw per storage server, with 80% usable. All units are decimal. Search indexes and ingest scratch are additional.</p>
<table><thead><tr><th>Per book</th><th>One copy</th><th>Three copies</th><th>Servers</th></tr></thead><tbody>${storageRows}</tbody></table>
<form action="/library/api/capacity"><label>Bytes per book <input name="bytes" type="number" min="1" max="500000000" value="25000000" required></label>
<label>Copies <input name="copies" type="number" min="1" max="6" value="3" required></label>
<label>Raw TB per server <input name="rawTb" type="number" min="1" max="10000" value="120" required></label> <button>Calculate capacity</button></form>
<h2>Classification</h2><p>The Dewey numerical positions cover 000 through 999. Library of Congress classes are local review referrals. Keep a book’s original Dewey and Library of Congress classifications in separate fields. Base 12 uses A for ten and B for eleven, leaving 728 of the three-digit addresses reserved.</p>
<p><a href="${references.loc}">Library of Congress outline</a> · <a href="${references.dewey}">OCLC Dewey index</a></p>
<h2>Historical catalog methods</h2><ul>${heritage}</ul>
<h2>Tabor collections</h2><ul>${work}</ul>`);
}

function csv() {
  const quote = (value) => '"' + String(value).replaceAll('"', '""') + '"';
  const header = ["slot", "worker", "dewey", "duodecimal", "category", "lcc_review", "task", "first_accession", "last_accession", "reserved_books", "imported_books"];
  const content = rows().map((r) => [r.slot, r.worker, r.dewey, r.duodecimal, r.category, r.lccReview.join(" "), r.task, r.bookRange.start, r.bookRange.end, r.bookRange.capacity, r.imported]);
  return new Response([header, ...content].map((row) => row.map(quote).join(",")).join("\r\n") + "\r\n", {
    headers: { ...headers, "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="tabor-library-assignments.csv"' }
  });
}

export function libraryRoute(url) {
  const path = url.pathname;
  const q = url.searchParams;
  if (path === "/library" || path === "/library/") return home();
  if (path === "/library/assignments.csv") return csv();
  if (path === "/library/api/summary") return json(summary());
  const worker = /^\/p\/([a-z0-9-]+)\/library\/?$/.exec(path)?.[1];
  if (worker) {
    const match = workerAssignment(worker);
    return match ? json(match) : json({ error: "Unknown Worker" }, 404);
  }
  if (path === "/library/api/locate") {
    const dewey = q.get("dewey");
    const accession = q.get("accession");
    const base12 = q.get("base12");
    if ([dewey, accession, base12].filter((value) => value !== null).length !== 1) return json({ error: "Provide one of dewey, accession, or base12" }, 400);
    const result = dewey !== null && /^\d{3}$/.test(dewey) ? assignment(Number(dewey))
      : accession !== null && /^\d+$/.test(accession) ? bookAssignment(Number(accession))
      : base12 !== null && /^[0-9AB]{3}$/i.test(base12) ? assignment(parseInt(base12, 12)) : null;
    return result ? json(result) : json({ error: "Address outside the assigned range" }, 404);
  }
  if (path === "/library/api/assignments") {
    const start = Number(q.get("start") ?? 1);
    const group = q.get("lcc");
    if (!Number.isInteger(start) || start < 1 || start > workerCount || group !== null && !Object.hasOwn(lccClasses, group)) {
      return json({ error: "Invalid start or Library of Congress class" }, 400);
    }
    const matches = group === null ? rows() : rows().filter((row) => row.lccReview.includes(group));
    const records = matches.slice(start - 1, start + 49);
    return json({ total: matches.length, records, nextStart: start + 50 <= matches.length ? start + 50 : null });
  }
  if (path === "/library/api/capacity") {
    const value = (name, fallback) => Number(q.get(name) ?? fallback);
    const bytes = value("bytes", 25e6);
    const copies = value("copies", 3);
    const rawTb = value("rawTb", 120);
    const usable = value("usable", .8);
    if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > 500e6 || !Number.isInteger(copies) || copies < 1 || copies > 6
        || !Number.isFinite(rawTb) || rawTb < 1 || rawTb > 10000 || !Number.isFinite(usable) || usable <= 0 || usable > 1
        || rawTb * usable < 0.01) {
      return json({ error: "Invalid capacity assumptions" }, 400);
    }
    return json({ plannedBooks: corpusSize, ...storagePlan(bytes, copies, rawTb, usable) });
  }
  return null;
}
