import assets from "./assets.generated.mjs";
import { anchors, runTiming, steps } from "./model.mjs";
import { page } from "./page.mjs";
import { originalText, readRelation, relations, renderWillWheelWay, selectRelation, words } from "./will-wheel-way.mjs";

export const projects = {
  hub: ["Tabor World Hub", "https://tabor-world-hub.nathantaboract.workers.dev/"],
  rhythm: ["THE RHYTHM MATRIX", "https://tabor-rhythm-matrix.nathantaboract.workers.dev/"],
  atlas: ["Ancient to Modern Rhythms", "https://tabor-rhythm-matrix.nathantaboract.workers.dev/history"],
  computer: ["NATHAN AI 🚀 & NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER", "https://nathan-tabor-supercomputer-2x.nathantaboract.workers.dev/"],
  original: ["Nathan Tabor Super Computer", "https://nathan-tabor-supercomputer.nathantaboract.workers.dev/"],
  cloud: ["TRUE CLOUD COMPUTING BY NATHAN TABOR", "https://tabor-true-cloud-computing.nathantaboract.workers.dev/"],
  sovereign: ["Sovereign AI Unit health", "https://sovereign-ai-unit.nathantaboract.workers.dev/health"],
  reaper: ["Reaper 6969 Engine", "https://tabor-world-hub.nathantaboract.workers.dev/reaper-6969"]
};
const repository = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const chipSource = repository + "/tree/b5170c57bdb5ff67e9638c5d66b24251da8df37b/tabor-world/supercomputer/tabor-chips";
const reference = {
  manufacturer: "NVIDIA",
  model: "GB200 NVL72",
  context: "Vendor-published rack reference",
  graceCpus: 36, blackwellGpus: 72, hbm3eTb: 13.4, nvlinkBandwidthTbPerS: 130,
  source: "https://www.nvidia.com/en-us/data-center/gb200-nvl72/"
};

async function upstream(binding, base, path) {
  const response = await binding.fetch(new URL(path, base).href, { signal: AbortSignal.timeout(3500) });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    await response.body?.cancel();
    throw new Error("Upstream unavailable");
  }
  return response.json();
}

const security = {
  "Content-Security-Policy": "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store"
};

export default {
  async fetch(request, env = {}) {
    const { pathname, searchParams } = new URL(request.url);
    const send = (body, type, status = 200, headers = {}) => new Response(request.method === "HEAD" ? null : body, {
      status, headers: { ...security, ...headers, "Content-Type": type + "; charset=utf-8" }
    });
    const json = (x, status) => send(JSON.stringify(x), "application/json", status);
    if (!["GET", "HEAD"].includes(request.method)) return send("Method not allowed", "text/plain", 405, { Allow: "GET, HEAD" });
    const revision = /^[a-f0-9]{40}$/.test(env.TABOR_CHIPS_GITHUB_SHA ?? "") ? env.TABOR_CHIPS_GITHUB_SHA : null;
    const source = revision ? repository + "/tree/" + revision + "/app-factory/tabor-world-hub/tabor-chips" : repository + "/pull/316";
    if (pathname === "/") return send(page({ assets, anchors, steps, projects, source, chipSource, reference }), "text/html");
    if (pathname === "/source/will-wheel-way.txt") return send(originalText, "text/plain");
    if (pathname === "/will-wheel-way" || pathname === "/will-wheel-way/" || pathname === "/api/will-wheel-way") {
      const [from, to] = readRelation(searchParams);
      if (from < 0 || to < 0) return json({ error: "Choose will, wheel, or way for each word." }, 400);
      const selection = selectRelation(from, to);
      if (pathname === "/api/will-wheel-way") return json({ author: "Nathan Tabor", revision, words, originalText, relations, ...selection });
      return send(renderWillWheelWay(selection, projects, source), "text/html");
    }
    if (pathname === "/style.css") return send(assets.css, "text/css");
    if (pathname === "/client.mjs") return send(assets.client, "text/javascript");
    if (pathname === "/source/architecture.md") return send(assets.ownerSource, "text/plain");
    if (pathname === "/api/architecture") return json({
      owner: "Nathan Tabor", source, chipSource, anchors, steps, projects, reference, chip: assets.chip, continuation: assets.continuation
    });
    if (pathname === "/health" || pathname === "/api/receipt") return json({
      ok: true, project: assets.chip.title, author: "Nathan Tabor", revision, source,
      chipTracks: assets.chip.layers.length, continuationWorkstreams: assets.continuation.workstreams.length,
      execution: "Cloudflare Worker timing model", hardwareEvidence: "Architecture and verification roadmap", hplMeasurement: null
    });
    if (pathname === "/api/run") {
      const values = [searchParams.get("year") ?? "2024", searchParams.get("clockHz") ?? "110", searchParams.get("bpm") ?? "96"];
      if (values.some(value => !/^-?\d{1,10}$/.test(value))) return json({ error: "Use whole numbers for year, clock rate, and BPM." }, 400);
      const [year, clockHz, bpm] = values.map(Number);
      if (Math.abs(year) > 10000 || clockHz < 5 || clockHz > 1000000000 || bpm < 20 || bpm > 300) {
        return json({ error: "Use a year from −10000 to 10000, 20–300 BPM, and a clock rate from 5 Hz to 1 GHz." }, 400);
      }
      if (request.method === "HEAD") return json({ ok: true });
      try {
        const [rhythm, catalog, computer, cloud] = await Promise.all([
          upstream(env.RHYTHM, projects.rhythm[1], "/api/cycles?year=" + year),
          upstream(env.RHYTHM, projects.rhythm[1], "/api/receipt"),
          upstream(env.SUPERCOMPUTER_2X, projects.computer[1], "/api/verify"),
          upstream(env.TRUE_CLOUD, projects.cloud[1], "/health")
        ]);
        const result = runTiming({ year, clockHz, bpm }, rhythm, catalog, computer, cloud);
        return json({ ...result, revision }, result.ok ? 200 : 500);
      } catch {
        return json({ error: "The required Rhythm Matrix, 2X+, or True Cloud service response could not be verified." }, 502);
      }
    }
    return json({ error: "Page not found" }, 404);
  }
};
