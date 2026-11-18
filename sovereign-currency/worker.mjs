import { assets } from "./assets.mjs";
import { makeCatalog, catalogPage } from "./catalog.mjs";

import { runThreePhases } from "./quantum.mjs";

import { switchboardPage, switchboardReceipt } from "./switchboard.mjs";
import { genesisPrefix, hashHeader, genesisReceipt, verifyHeader } from "./proof.mjs";
import { listProofs, recordGenesis, proofInput, verifierPage } from "./proof-ledger.mjs";

export { genesisReceipt };

const quantumDesign = JSON.parse(assets["quantum-design.json"]);
const catalog = makeCatalog(assets);

const contentTypes = {
  "index.html": "text/html", "style.css": "text/css", "app.mjs": "text/javascript",
  "engine.mjs": "text/javascript", "registry.json": "application/json"
};
const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};

const execute = () => runThreePhases(quantumDesign, genesisPrefix, hashHeader, JSON.parse(assets["registry.json"]));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const head = request.method === "HEAD";
    const receiptPath = path === "/api/quantum/receipt";
    const ledgerPath = path === "/api/pow/ledger";
    const verifyPath = path === "/api/pow/verify";
    const allowed = verifyPath ? ["POST"] : receiptPath || ledgerPath ? ["GET", "HEAD", "POST"] : ["GET", "HEAD"];
    if (!allowed.includes(request.method)) return new Response(null, { status: 405, headers: { Allow: allowed.join(", ") } });
    const send = (value, type, status = 200) => new Response(head ? null : value, {
      status, headers: { ...security, "Content-Type": type + "; charset=utf-8", "Cache-Control": "no-cache" }
    });
    const json = (value, status) => send(JSON.stringify(value), "application/json", status);
    if (path === "/verifier") return send(verifierPage(), "text/html");
    if (verifyPath) {
      const input = await proofInput(request);
      if (input.error) return json({ ok: false, error: input.error }, input.status);
      const proof = await verifyHeader(input.value.headerHex, input.value.claimedHash);
      return json(proof, proof.ok ? 200 : proof.hash ? 422 : 400);
    }
    if (ledgerPath) {
      if (!env?.SWITCHBOARD_DB) return json({ error: "Proof ledger unavailable" }, 503);
      const after = url.searchParams.get("after") ?? "0";
      if (!/^\d{1,16}$/.test(after) || !Number.isSafeInteger(Number(after))) {
        return json({ error: "Invalid receipt cursor" }, 400);
      }
      try {
        if (request.method === "POST") {
          if (request.body) {
            const reader = request.body.getReader();
            const { done, value } = await reader.read();
            if (!done) await reader.cancel();
            if (value?.byteLength) return json({ error: "The genesis fixture uses an empty request body" }, 400);
          }
          return json(await recordGenesis(env.SWITCHBOARD_DB));
        }
        return json(await listProofs(env.SWITCHBOARD_DB, Number(after)));
      } catch (error) {
        console.error("Proof ledger audit or storage failure", error);
        return json({ error: "Proof ledger unavailable" }, 503);
      }
    }
    if (path === "/api/agent-downloads") return json(assets.agentDownload);
    if (path === assets.agentDownload.path) {
      const archive = head ? null : Uint8Array.from(atob(assets.agentArchive), char => char.charCodeAt(0));
      return new Response(archive, { headers: {
        ...security, "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="' + assets.agentDownload.filename + '"',
        "Content-Length": String(assets.agentDownload.bytes),
        "Cache-Control": "no-cache", ETag: '"' + assets.agentDownload.sha256 + '"'
      } });
    }
    if (receiptPath) {
      if (!env?.SWITCHBOARD_DB) return send(JSON.stringify({ error: "Receipt store unavailable" }), "application/json", 503);
      try {
        const receipt = await switchboardReceipt(request, env.SWITCHBOARD_DB, execute);
        return send(JSON.stringify(receipt ?? { error: "Run the fixture to create a receipt" }), "application/json", receipt ? 200 : 404);
      } catch {
        return send(JSON.stringify({ error: "Receipt store unavailable" }), "application/json", 503);
      }
    }
    if (path === "/switchboard") return send(switchboardPage(), "text/html");
    if (path === "/coins" || path === "/coins/") {
      return send(catalogPage(catalog, (url.searchParams.get("q") ?? "").slice(0, 120).trim()), "text/html");
    }
    if (path === "/api/coins") return send(JSON.stringify(catalog), "application/json");
    if (path === "/api/conspectus") return send(assets["conspectus.json"], "application/json");
    if (path === "/catalog.css") return send(assets["catalog.css"], "text/css");
    if (path === "/api/quantum/traits") return send(JSON.stringify(quantumDesign.traits), "application/json");
    if (path === "/api/quantum/execute") {
      const result = await execute();
      return send(JSON.stringify(result), "application/json");
    }
    if (path === "/api/genesis") {
      const receipt = await genesisReceipt();
      return send(JSON.stringify(receipt), "application/json", receipt.ok ? 200 : 500);
    }
    if (path === "/healthz") return send(JSON.stringify({ ok: true, rings: JSON.parse(assets["registry.json"]).coins.length }), "application/json");
    const file = path === "/" ? "index.html" : path.slice(1);
    if (!Object.hasOwn(contentTypes, file)) return send("Not found", "text/plain", 404);
    return send(assets[file], contentTypes[file]);
  }
};
