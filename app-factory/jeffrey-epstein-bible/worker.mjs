const title = "Jeffrey Epstein Bible";
const description = "Where the Bible and the Epstein files are laid over each other.";
const publicMount = "/tabor-academy/jeffrey-epstein-bible";
const publicSite = "https://tabor-bridge.nathantaboract.workers.dev" + publicMount;
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

const verses = {
  "James 1:27": "Pure religion and undefiled before God and the Father is this, To visit the fatherless and widows in their affliction, and to keep himself unspotted from the world.",
  "Proverbs 31:8–9": "Open thy mouth for the dumb in the cause of all such as are appointed to destruction. Open thy mouth, judge righteously, and plead the cause of the poor and needy.",
  "Matthew 18:6": "But whoso shall offend one of these little ones which believe in me, it were better for him that a millstone were hanged about his neck, and that he were drowned in the depth of the sea.",
  "Ephesians 5:11": "And have no fellowship with the unfruitful works of darkness, but rather reprove them.",
  "John 3:21": "But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.",
  "James 2:10": "For whosoever shall keep the whole law, and yet offend in one point, he is guilty of all.",
  "Romans 13:4": "For he is the minister of God to thee for good. But if thou do that which is evil, be afraid; for he beareth not the sword in vain: for he is the minister of God, a revenger to execute wrath upon him that doeth evil.",
};

const readings = {
  "the-2007-agreement": "James measures religion by what people do for those in affliction. Here the record names a choice by prosecutors and a failure to make sure victims would be notified. Applied to this case, James puts the people owed care and notice at the center of the account.",
  "victims-rights": "Proverbs calls on those with power to speak up for people whose voices are excluded. The appeal shows how the way a case is brought can decide whether a court hears a demand for enforcement. The procedural holding leaves the treatment of the victims visible in the record.",
  "epstein-indictment": "Matthew places the harm done to the little ones at the center. The indictment records what prosecutors alleged and which places and years they investigated. Epstein died before those New York charges could be tried.",
  "maxwell-proceedings": "Ephesians calls for exposing wrongdoing. The Maxwell case shows the stages by which an accusation becomes a public legal record: charges, evidence and trial, verdict, and sentence. Each stage tells the reader what was established at that point.",
  "accesspoint": "John’s test is whether deeds can be brought into the light. AccessPoint starts with two dated records: Trump’s public description of knowing Epstein, and Trump’s signature on the disclosure law. Each record establishes a different action. A criminal allegation requires evidence of the specific act alleged.",
  "disclosure-votes": "James asks the reader to attend to conduct at each point. A procedural vote and a final-passage vote answer different questions. Keep the full sequence visible so the later vote cannot erase what happened earlier and the earlier vote cannot be used to misstate the final vote.",
  "public-release": "Ephesians connects exposure with accountability. Publishing the record lets people examine official decisions. The collection brings together several kinds of material, so a released tip, an agency finding, and a court decision each carry the weight their evidence supports.",
  "institutional-accountability": "Under the James 1:27 test, the measure is what was done for people in affliction. The England and Wales inquiry records where church institutions failed to protect children. The separate Vatican–Epstein question remains open in this edition and calls for a dated record identifying the responsible actor and action.",
  "investigation-review": "Romans measures public authority by what it does for good and how it responds to wrongdoing. The committee report identifies offices and decisions readers can check. Its findings and recommendations create a record against which follow-up can be measured.",
};

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
.comparison{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,23rem),1fr));gap:1.5rem}.comparison blockquote{margin:0;border-inline-start:3px solid #e5ca83;padding-inline-start:1rem}
nav{margin-bottom:clamp(1.8rem,5vw,4rem)}section{margin-top:2rem}ul{padding-inline-start:1.3rem}
.records{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr));gap:1rem}
.records li,aside{background:#1a241e;border:1px solid #425347;padding:1.15rem;border-radius:.35rem}
.meta,small{color:#c9c5b7}input,button{font:inherit;border-radius:.25rem;border:1px solid #6d806f;padding:.55em .75em}
input{background:#19231d;color:inherit;max-width:100%;box-sizing:border-box}button{background:#e5ca83;color:#182219;cursor:pointer}
a:focus-visible,input:focus-visible,button:focus-visible{outline:2px solid #fef3d3;outline-offset:4px}
`;

const readingPath = path => path === "/" ? "/" : path + "/";
const modePath = (path, investigative) => path + (investigative ? "?mode=investigate" : "");

function page(heading, content, { path = "/", investigative = false, query = "" } = {}) {
  const params = new URLSearchParams();
  if (!investigative) params.set("mode", "investigate");
  if (query) params.set("q", query);
  const toggle = readingPath(path) + (params.size ? "?" + params : "");
  const chaptersLink = modePath("/", investigative);
  const archiveLink = modePath("/archives/", investigative);
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    escape(heading) + '</title><style>' + css + '</style><main><nav aria-label="Main navigation"><a href="' + chaptersLink + '">Chapters</a><a href="' + archiveLink + '">Official archives</a><a href="/conductor.json">Conductor handoff</a><a href="' + escape(toggle) + '">' + (investigative ? "Back to Reading Mode" : "Switch to Investigation Mode") + '</a></nav>' + content + '</main></html>';
}

function home(query, investigative) {
  const search = query.trim().toLowerCase();
  const result = chapters.filter(item => [item.title, item.date, item.status, item.kjv, item.record].some(field => field.toLowerCase().includes(search)));
  return page(title, '<header><p class="meta">Nathan Tabor · The Modern Day Bible</p><h1>' + title + '</h1><p>' + description + '</p><p class="meta">' + (investigative ? "Investigation Mode" : "Reading Mode") +
    '</p></header><section aria-labelledby="chapters"><h2 id="chapters">Read the chapters</h2><form action="/"><label for="q">Search this edition</label><input name="q" id="q" maxlength="120" value="' + escape(query) +
    '">' + (investigative ? '<input type="hidden" name="mode" value="investigate">' : '') + '<button>Search</button>' + (search ? '<a href="' + modePath("/", investigative) + '">Clear</a>' : '') + '</form><p class="meta">' + result.length + ' of ' + chapters.length + ' chapters</p><ul class="records">' +
    result.map(chapter => '<li><p class="meta">' + escape(chapter.date) + ' · ' + escape(chapter.status) + '</p><h3><a href="' + modePath("/chapter/" + chapter.id + "/", investigative) + '">' + escape(chapter.title) +
    '</a></h3><p>KJV · ' + escape(chapter.kjv) + '</p></li>').join("") +
    '</ul></section><section><h2>Related Tabor work</h2>' + links([["The Modern Day Bible and recovered JEB research", recovery], ["Tabor Academy · Vatican history", dossier], ["Protection of Innocence", repo + "/tree/main/app-factory/nathan-ai/children-innocence"]]) + '</section>', { investigative, query });
}

function chapterPage(chapter, investigative, path) {
  const documentary = '<section><h2>Documentary record</h2><p>' + escape(chapter.record) + '</p></section>';
  const reading = '<section><h2>KJV reading</h2><blockquote><p>' + escape(verses[chapter.kjv]) + '</p><cite><a href="' +
    escape(scripture(chapter.kjv)) + '">' + escape(chapter.kjv) + ' · KJV</a></cite></blockquote></section>';
  const study = investigative
    ? '<section><h2>Investigate the record</h2><p>' + escape(chapter.question) +
      '</p><ol><li>Open the original source and identify its date, publisher, and document type.</li><li>Record the page, docket, or exact passage that supports the claim.</li><li>Record what the evidence establishes and what remains open.</li></ol>' +
      links(chapter.sources) + '<p><a href="/archives/?mode=investigate">Search the official archives</a></p></section>'
    : '<section><h2>Laid over each other</h2><p>' + escape(readings[chapter.id]) + '</p></section><details><summary>Sources</summary>' + links(chapter.sources) + '</details>';
  return page(chapter.title + " · " + title, '<article><p class="meta">' + escape(chapter.date) + ' · ' + escape(chapter.status) +
    '</p><h1>' + escape(chapter.title) + '</h1><p class="meta">' + (investigative ? "Investigation Mode" : "Reading Mode") +
    '</p><div class="comparison">' + documentary + reading + '</div>' + study + '</article>', { path, investigative });
}

function archives(investigative) {
  return page("Official archives · " + title, '<h1>Official archives</h1><p>Search or open records at their publisher. The DOJ archive applies its own age check and warns about sensitive material and possible incomplete redactions.</p>' +
    links(collections) + '<section><h2>Numbered DOJ datasets</h2>' + links(datasets) + '</section><aside><strong>Coverage</strong><p>This edition indexes nine reviewed chapters. The official collection includes twelve numbered DOJ datasets plus court records and FOIA collections.</p><a href="/api/index.json">Get the searchable chapter index as JSON</a></aside>', { path: "/archives", investigative });
}

export const handoff = {
  project: "jeffrey-epstein-bible",
  title, author: "Nathan Tabor",
  url: publicSite + "/",
  index: publicSite + "/api/index.json", archive: publicSite + "/archives/", workflow: "review-before-publication",
  source: repo + "/tree/main/app-factory/jeffrey-epstein-bible",
  required: ["publisher", "document identifier or docket", "source URL", "date", "page locator where available", "evidence status", "KJV reference"],
  modes: { default: "reading", investigation: "?mode=investigate" },
  next: ["Put the KJV passage, documentary record, and completed reading in Reading Mode. Keep questions and evidence-tracing directions in Investigation Mode.", "Expand by dated record. Compare source, action, actor, and jurisdiction before connecting events.",
    "Add sourced chapter summaries through a reviewed pull request. Preserve author wording separately from documentary summaries.",
    "Keep victim and private details out of the public index. Link bulk collections at their official publisher. An archive mention alone does not establish wrongdoing.",
    "Run the Worker tests, verify pages on Cloudflare, and update the chapter coverage count."],
};

async function serve(request, mount, requestedPath) {
  const url = new URL(request.url);
  const path = requestedPath.replace(/\/$/, "") || "/";
  const investigative = url.searchParams.get("mode") === "investigate";
  let content;
  let contentType = "text/html; charset=utf-8";
  let status = 200;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  if (path === "/") content = home((url.searchParams.get("q") || "").slice(0, 120), investigative);
  else if (path === "/archives") content = archives(investigative);
  else if (["/api/index.json", "/conductor.json", "/healthz"].includes(path)) {
    contentType = "application/json; charset=utf-8";
    content = JSON.stringify(path === "/conductor.json" ? handoff :
      path === "/healthz" ? { ok: true, chapters: chapters.length } : { title, author: handoff.author, archives: collections, datasets, chapters: chapters.map(chapter => ({ ...chapter, verse: verses[chapter.kjv], reading: readings[chapter.id] })) });
  } else {
    const chapter = chapters.find(item => path === "/chapter/" + item.id);
    if (chapter) content = chapterPage(chapter, investigative, path);
    else {
      status = 404;
      content = page("Chapter not found", '<h1>Chapter not found</h1><p><a href="/">Browse all chapters</a></p>');
    }
  }
  if (mount && contentType.startsWith("text/html")) {
    content = content.replace(/\b(href|action)="\/(?!\/)/g, (_, name) => name + '="' + mount + "/");
  }
  return new Response(request.method === "HEAD" ? null : content, {
    status, headers: { "content-type": contentType, "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer", "cache-control": "no-store" },
  });
}

export default {
  fetch(request) { return serve(request, "", new URL(request.url).pathname); },
};

export function withJeffreyEpsteinBible(academy) {
  return {
    ...academy,
    fetch(request, env, ctx) {
      const path = new URL(request.url).pathname;
      const prefix = [publicMount, "/jeffrey-epstein-bible"].find(candidate => path === candidate || path.startsWith(candidate + "/"));
      if (prefix) return serve(request, publicMount, path.slice(prefix.length));
      return academy.fetch(request, env, ctx);
    },
  };
}
