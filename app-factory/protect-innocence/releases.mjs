const world = "https://tabor-world.nathantaboract.workers.dev";
const source = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/one/tabor-recovered/Tabor_Accords_Recovery_Registry_2026-11-01.json";

const bible = [
  ["main", "prepend", `<section class="card" id="protect-innocence" aria-labelledby="protect-innocence-title">
  <h2 id="protect-innocence-title">Protect Innocence</h2>
  <p><strong>Innocence is never a commodity.</strong></p>
  <p>Nathan Tabor’s world-design direction: “no missing children.”</p>
  <p>Study James 1:27, Esther, Abigail in 1 Samuel 25, Romans 13:7, and Proverbs in the King James Bible.</p>
  <p><a href="#world-search">Search the King James Bible</a> · <a href="#accord-form">Record a voluntary village agreement</a> · <a href="${world}/#protect-innocence">Read the Tabor Accords principles</a></p>
</section>`],
  ["#accord-form", "before", `<p><strong>Protect innocence through consent and autonomy.</strong> Record only what you freely choose for this workspace. The agreement does not give consent on behalf of anyone else. <a href="${source}">Tabor Accords source record</a>.</p>`],
];

const library = [
  ["#connections-status", "before", `<div id="protect-innocence"><h3>Protect Innocence</h3>
  <p><strong>Innocence is never a commodity.</strong> The Tabor Accords connect protection with consent and autonomy, no coercion, and evidence preservation.</p>
  <p><a href="${world}/#protect-innocence">Open the Accords principles</a> · <a href="https://bibletopia.nathantaboract.workers.dev/#accord-form">Record a voluntary agreement in Bible Topia</a></p></div>`],
];

const pages = Object.freeze({
  bibletopia: { paths: new Set(["/"]), additions: bible },
  "library-of-tabor": { paths: new Set([
    "/library/", "/library/index.html",
    "/app-factory/tabor-universal-library-engine/public/library/",
    "/app-factory/tabor-universal-library-engine/public/library/index.html",
  ]), additions: library },
});

export function withProtection(runtime, surface, Rewriter = globalThis.HTMLRewriter) {
  const release = pages[surface];
  if (!release) throw new Error("Unknown Protect Innocence surface");
  return {
    ...runtime,
    async fetch(request, env, ctx) {
      const response = await runtime.fetch(request, env, ctx);
      if (request.method !== "GET" || response.status !== 200 ||
          !release.paths.has(new URL(request.url).pathname) ||
          !response.headers.get("content-type")?.toLowerCase().includes("text/html")) return response;

      const rewriter = new Rewriter();
      for (const [selector, method, html] of release.additions) {
        rewriter.on(selector, { element(node) { node[method](html, { html: true }); } });
      }
      const updated = rewriter.transform(response);
      const headers = new Headers(updated.headers);
      headers.delete("content-length");
      headers.delete("etag");
      headers.set("x-tabor-protection-release", "1");
      return new Response(updated.body, { status: updated.status, headers });
    },
  };
}
