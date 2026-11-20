const title = "Jeffrey Epstein Bible";
const description = "Where the Bible and the Epstein files are laid over each other.";
const archive = "https://www.justice.gov/epstein";
const disclosures = archive + "/doj-disclosures";
const repo = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const recovery = repo + "/tree/main/data/tabor/modern_day_bible";
const dossier = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/foundation/vatican-history/";

const collections = [
  ["DOJ Epstein Library · Full search", archive],
  ["DOJ disclosures · Data sets, court records, and FOIA", disclosures],
  ["House Oversight disclosures", "https://oversight.house.gov/release/oversight-committee-releases-epstein-records-provided-by-the-department-of-justice/"],
];

const datasets = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  return ["DOJ Data Set " + number, disclosures + "/data-set-" + number + "-files"];
});

const chapters = [
  {
    id: "the-2007-agreement", title: "The 2007 non-prosecution agreement", date: "2007–2008",
    status: "DOJ professional-responsibility review", kjv: "James 1:27",
    record: "The Southern District of Florida resolved its federal investigation through a non-prosecution agreement. DOJ’s Office of Professional Responsibility concluded that U.S. Attorney Alexander Acosta exercised poor judgment in resolving the investigation this way and in failing to make sure victims would be notified about the state plea hearing.",
    question: "Who had the power to notify survivors, what did they know, and when were survivors told?",
    sources: [["DOJ review statement", "https://www.justice.gov/archives/opa/pr/statement-doj-office-professional-responsibility-report-jeffrey-epstein-2006-2008"], ["Nathan Tabor archive · agreement source review", recovery.replace("/tree/", "/blob/") + "/epstein_agreement_source_review.md"]],
  },
  {
    id: "victims-rights", title: "Victims’ rights and the agreement", date: "2021",
    status: "Federal appellate decision", kjv: "Proverbs 31:8–9",
    record: "The en banc Eleventh Circuit held that the Crime Victims’ Rights Act did not authorize the stand-alone lawsuit brought by Courtney Wild in the absence of a federal criminal proceeding. The opinion also discusses the government’s treatment of the victims.",
    question: "What did the court decide about the way a right could be enforced, and what did it say about how the victims were treated?",
    sources: [["In re Wild · en banc opinion", "https://media.ca11.uscourts.gov/opinions/pub/files/201913843.enb.pdf"]],
  },
  {
    id: "epstein-indictment", title: "The 2019 federal indictment", date: "2019-07-08",
    status: "Criminal allegations in an indictment", kjv: "Matthew 18:6",
    record: "Federal prosecutors in New York unsealed charges of sex trafficking of minors and conspiracy against Jeffrey Epstein. The indictment alleged exploitation in New York and Florida between at least 2002 and 2005. These federal charges did not go to trial.",
    question: "Which parts of a charging document are allegations, and which pieces identify the dates, location, and officials responsible for investigating?",
    sources: [["SDNY charging announcement", "https://www.justice.gov/usao-sdny/pr/jeffrey-epstein-charged-manhattan-federal-court-sex-trafficking-minors"]],
  },
  {
    id: "maxwell-proceedings", title: "The Maxwell proceedings", date: "2021–2022",
    status: "Federal criminal proceedings", kjv: "Ephesians 5:11",
    record: "Ghislaine Maxwell was convicted in federal court and sentenced in 2022. The U.S. Attorney’s Office maintains a case page with the charges, trial information, and related notices.",
    question: "Trace the prosecutor’s allegations, the jury’s verdict, and the court’s sentence as separate records.",
    sources: [["SDNY case index · United States v. Ghislaine Maxwell", "https://www.justice.gov/usao-sdny/united-states-v-ghislaine-maxwell"]],
  },
  {
    id: "accesspoint", title: "AccessPoint · The public record", date: "2002; 2025",
    status: "Contemporary reporting and enacted law", kjv: "John 3:21",
    record: "Donald Trump publicly discussed knowing Epstein in a 2002 New York magazine profile. Trump later signed the Epstein Files Transparency Act on November 19, 2025. Nathan Tabor uses the term AccessPoint for the line of inquiry that begins there. The magazine profile documents what Trump said about the relationship, and the statute documents the disclosure requirement.",
    question: "What does each dated record establish about the speaker’s role, and what would a separate claim of criminal involvement require?",
    sources: [["New York magazine profile", "https://nymag.com/nymetro/news/people/n_7912/"], ["Public Law 119-38", "https://www.govinfo.gov/app/details/PLAW-119publ38"]],
  },
  {
    id: "disclosure-votes", title: "Who voted for disclosure", date: "2025-11-18",
    status: "Recorded congressional vote", kjv: "James 2:10",
    record: "On November 18, 2025, the House passed the Epstein Files Transparency Act 427–1. Virginia Foxx is recorded as voting yea on final passage. The Tabor archive separately tracks earlier procedural votes by committee, question, and date.",
    question: "Put the exact motion beside each vote. What did the member vote on at each stage?",
    sources: [["Clerk of the House · Roll Call 289", "https://clerk.house.gov/evs/2025/roll289"], ["Tabor archive · legislative vote record", repo + "/blob/main/app-factory/nathan-ai/children-innocence/records/VIRGINIA_FOXX_EPSTEIN_DISCLOSURE_VOTE_RECORD_2025_2026.md"]],
  },
  {
    id: "public-release", title: "What was released and where to find it", date: "2026-01-30",
    status: "DOJ release notice and official archive", kjv: "Ephesians 5:11",
    record: "DOJ announced that its January 2026 publication brought the total to about 3.5 million responsive pages. The official library supplies the dataset, court, and FOIA collections, and links to House releases. The library warns that search can miss handwritten material and that sensitive information can remain in the releases.",
    question: "Record the release, document locator, page, and document type. What did the source establish independently, and what did it only record another person as saying?",
    sources: [["DOJ release notice", "https://www.justice.gov/opa/pr/department-justice-publishes-35-million-responsive-pages-compliance-epstein-files"], ...collections],
  },
  {
    id: "institutional-accountability", title: "Church accountability and the Vatican question", date: "2020; 2026",
    status: "Independent inquiry and open research lead", kjv: "James 1:27",
    record: "The Independent Inquiry into Child Sexual Abuse published findings about the Roman Catholic Church in England and Wales. Nathan Tabor’s separate question asks who in the Vatican addressed the Epstein disclosures and what records connect an official or institution to the case. The sources in this chapter establish the scope of the church inquiry. A direct Vatican–Epstein operational link remains unverified in this edition.",
    question: "For each proposed connection, identify the institution, officer, action, date, and dated primary record. Record missing evidence without filling the gap with a name match.",
    sources: [["Independent Inquiry · Roman Catholic Church report", "https://www.iicsa.org.uk/reports-recommendations/publications/investigation/roman-catholic-church.html"], ["Tabor Academy · Vatican history dossier", dossier]],
  },
  {
    id: "investigation-review", title: "The congressional investigation review", date: "2026-11-10",
    status: "House Oversight majority staff report", kjv: "Romans 13:4",
    record: "House Oversight majority staff published its review of how federal officials handled the Epstein and Maxwell investigations, including the 2007 agreement, failure to inform survivors, and institutional breakdowns. Their report identifies findings and makes recommendations for further action.",
    question: "For each finding, trace the underlying record and name the office responsible for following up.",
    sources: [["House Oversight release and report", "https://oversight.house.gov/release/house-oversight-committee-releases-report-on-the-federal-governments-mishandling-of-the-epstein-and-maxwell-criminal-investigations/"]],
  },
];

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));
const links = items => '<ul>' + items.map(([label, url]) => '<li><a href="' + escape(url) + '">' + escape(label) + '</a></li>').join("") + '</ul>';
const scripture = reference => "https://www.biblegateway.com/passage/?version=KJV&search=" + encodeURIComponent(reference.replace("–", "-"));
const css = `
:root{color-scheme:dark;background:#111714;color:#f5eee2;font:17px/1.55 system-ui,sans-serif}
body{margin:0}main{max-width:74rem;margin:auto;padding:clamp(1rem,4vw,3.5rem)}
h1,h2,h3{font-family:Georgia,serif;line-height:1.12;margin:0 0 .65em}
h1{font-size:clamp(2.3rem,7vw,5.75rem);letter-spacing:-.04em}h2{font-size:clamp(1.5rem,3.1vw,2.3rem)}
a{color:#e5ca83}nav,form{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center}
nav{margin-bottom:clamp(1.8rem,5vw,4rem)}section{margin-top:2rem}ul{padding-inline-start:1.3rem}
.records{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr));gap:1rem}
.records li,aside{background:#1a241e;border:1px solid #425347;padding:1.15rem;border-radius:.35rem}
.meta,small{color:#c9c5b7}input,button{font:inherit;border-radius:.25rem;border:1px solid #6d806f;padding:.55em .75em}
input{background:#19231d;color:inherit;max-width:100%;box-sizing:border-box}button{background:#e5ca83;color:#182219;cursor:pointer}
a:focus-visible,input:focus-visible,button:focus-visible{outline:2px solid #fef3d3;outline-offset:4px}
`;

function page(heading, content) {
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    escape(heading) + '</title><style>' + css + '</style><main><nav aria-label="Main navigation"><a href="/">Chapters</a><a href="/archives/">Official archives</a><a href="/conductor.json">Conductor handoff</a></nav>' + content + '</main></html>';
}

function home(query) {
  const search = query.trim().toLowerCase();
  const result = chapters.filter(item => [item.title, item.date, item.status, item.kjv, item.record].some(field => field.toLowerCase().includes(search)));
  return page(title, '<header><p class="meta">Nathan Tabor · The Modern Day Bible</p><h1>' + title + '</h1><p>' + description +
    '</p></header><section aria-labelledby="chapters"><h2 id="chapters">Read the chapters</h2><form action="/"><label for="q">Search this edition</label><input name="q" id="q" maxlength="120" value="' + escape(query) +
    '"><button>Search</button>' + (search ? '<a href="/">Clear</a>' : '') + '</form><p class="meta">' + result.length + ' of ' + chapters.length + ' chapters</p><ul class="records">' +
    result.map(chapter => '<li><p class="meta">' + escape(chapter.date) + ' · ' + escape(chapter.status) + '</p><h3><a href="/chapter/' + chapter.id + '/">' + escape(chapter.title) +
    '</a></h3><p>KJV · ' + escape(chapter.kjv) + '</p></li>').join("") +
    '</ul></section><section><h2>Related Tabor work</h2>' + links([["The Modern Day Bible and recovered JEB research", recovery], ["Tabor Academy · Vatican history", dossier], ["Protection of Innocence", repo + "/tree/main/app-factory/nathan-ai/children-innocence"]]) + '</section>');
}

function chapterPage(chapter) {
  return page(chapter.title + " · " + title, '<article><p class="meta">' + escape(chapter.date) + ' · ' + escape(chapter.status) +
    '</p><h1>' + escape(chapter.title) + '</h1><section><h2>Documentary record</h2><p>' + escape(chapter.record) +
    '</p>' + links(chapter.sources) + '</section><section><h2>KJV reading</h2><p><a href="' + escape(scripture(chapter.kjv)) +
    '">' + escape(chapter.kjv) + '</a></p><h3>Read beside the record</h3><p>' + escape(chapter.question) + '</p></section></article>');
}

function archives() {
  return page("Official archives · " + title, '<h1>Official archives</h1><p>Search or open records at their publisher. The DOJ archive applies its own age check and warns about sensitive material and possible incomplete redactions.</p>' +
    links(collections) + '<section><h2>Numbered DOJ datasets</h2>' + links(datasets) + '</section><aside><strong>Coverage</strong><p>This edition indexes nine reviewed chapters. The official collection includes twelve numbered DOJ datasets plus court records and FOIA collections.</p><a href="/api/index.json">Get the searchable chapter index as JSON</a></aside>');
}

export const handoff = {
  project: "jeffrey-epstein-bible",
  title, author: "Nathan Tabor",
  url: "https://jeffrey-epstein-bible.nathantaboract.workers.dev/",
  index: "/api/index.json", archive: "/archives/", workflow: "review-before-publication",
  source: repo + "/tree/main/app-factory/jeffrey-epstein-bible",
  required: ["publisher", "document identifier or docket", "source URL", "date", "page locator where available", "evidence status", "KJV reference"],
  next: ["Expand by dated record. Compare source, action, actor, and jurisdiction before connecting events.",
    "Add sourced chapter summaries through a reviewed pull request. Preserve author wording separately from documentary summaries.",
    "Keep victim and private details out of the public index. Link bulk collections at their official publisher. An archive mention alone does not establish wrongdoing.",
    "Run the Worker tests, verify pages on Cloudflare, and update the chapter coverage count."],
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    let content;
    let contentType = "text/html; charset=utf-8";
    let status = 200;
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    if (path === "/") content = home((url.searchParams.get("q") || "").slice(0, 120));
    else if (path === "/archives") content = archives();
    else if (["/api/index.json", "/conductor.json", "/healthz"].includes(path)) {
      contentType = "application/json; charset=utf-8";
      content = JSON.stringify(path === "/conductor.json" ? handoff :
        path === "/healthz" ? { ok: true, chapters: chapters.length } : { title, author: handoff.author, archives: collections, datasets, chapters });
    } else {
      const chapter = chapters.find(item => path === "/chapter/" + item.id);
      if (chapter) content = chapterPage(chapter);
      else {
        status = 404;
        content = page("Chapter not found", '<h1>Chapter not found</h1><p><a href="/">Browse all chapters</a></p>');
      }
    }
    return new Response(request.method === "HEAD" ? null : content, {
      status, headers: { "content-type": contentType, "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        "referrer-policy": "no-referrer", "cache-control": "no-store" },
    });
  },
};
