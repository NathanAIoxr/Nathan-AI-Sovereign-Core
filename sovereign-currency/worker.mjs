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

const recoveredCoins = [
  {
    "slot": 1,
    "ticker": "NTC",
    "name": "Nathan Coin"
  },
  {
    "slot": 2,
    "ticker": "OXR",
    "name": "OXR Coin"
  },
  {
    "slot": 3,
    "ticker": "TAB",
    "name": "Tabor Coin"
  },
  {
    "slot": 4,
    "ticker": "THC",
    "name": "THC Coin"
  },
  {
    "slot": 5,
    "ticker": "ONE",
    "name": "ONE Coin"
  },
  {
    "slot": 6,
    "ticker": "YULL",
    "name": "YULL Coin"
  },
  {
    "slot": 7,
    "ticker": "YALL",
    "name": "YALL Coin"
  },
  {
    "slot": 8,
    "ticker": "SSS",
    "name": "SSS Coin"
  },
  {
    "slot": 9,
    "ticker": "4T",
    "name": "4T Coin"
  },
  {
    "slot": 10,
    "ticker": "TBC",
    "name": "Tabor Block"
  },
  {
    "slot": 11,
    "ticker": "LTC",
    "name": "Light Cipher"
  },
  {
    "slot": 12,
    "ticker": "LTG",
    "name": "Light Grail"
  },
  {
    "slot": 13,
    "ticker": "TAB8",
    "name": "Tabor 8"
  },
  {
    "slot": 14,
    "ticker": "T1",
    "name": "Tabor 1"
  },
  {
    "slot": 15,
    "ticker": "T2",
    "name": "Tabor 2"
  },
  {
    "slot": 16,
    "ticker": "T3",
    "name": "Tabor 3"
  },
  {
    "slot": 17,
    "ticker": "T4",
    "name": "Tabor 4"
  },
  {
    "slot": 18,
    "ticker": "T5",
    "name": "Tabor 5"
  },
  {
    "slot": 19,
    "ticker": "T6",
    "name": "Tabor 6"
  },
  {
    "slot": 20,
    "ticker": "T7",
    "name": "Tabor 7"
  },
  {
    "slot": 21,
    "ticker": "T8",
    "name": "Tabor 8 (Core)"
  },
  {
    "slot": 22,
    "ticker": "TABOR",
    "name": "Tabor One (9th)"
  },
  {
    "slot": 23,
    "ticker": "INN",
    "name": "Innocence"
  },
  {
    "slot": 24,
    "ticker": "BAM",
    "name": "Bam Bam"
  },
  {
    "slot": 25,
    "ticker": "MAB",
    "name": "Mab Mab"
  },
  {
    "slot": 26,
    "ticker": "REM",
    "name": "Rem Coin"
  },
  {
    "slot": 27,
    "ticker": "TAM",
    "name": "Tam Coin"
  },
  {
    "slot": 28,
    "ticker": "HER",
    "name": "Her Coin"
  },
  {
    "slot": 29,
    "ticker": "MAT",
    "name": "Mat Coin"
  },
  {
    "slot": 30,
    "ticker": "MAAT",
    "name": "Ma’at Coin"
  },
  {
    "slot": 31,
    "ticker": "BAAL",
    "name": "Ba’al Coin"
  },
  {
    "slot": 32,
    "ticker": "GOD",
    "name": "God Coin"
  },
  {
    "slot": 33,
    "ticker": "TRN",
    "name": "Trinity Coin"
  },
  {
    "slot": 34,
    "ticker": "KIN",
    "name": "KINETICS"
  },
  {
    "slot": 35,
    "ticker": "EQT",
    "name": "Equator Coin"
  },
  {
    "slot": 36,
    "ticker": "GLY",
    "name": "Glycerine Coin"
  },
  {
    "slot": 37,
    "ticker": "RBT",
    "name": "Ribat Coin"
  },
  {
    "slot": 38,
    "ticker": "SP1",
    "name": "Sparta I"
  },
  {
    "slot": 39,
    "ticker": "SP2",
    "name": "Sparta II"
  },
  {
    "slot": 40,
    "ticker": "OXR-X",
    "name": "OXR XOR"
  },
  {
    "slot": 41,
    "ticker": "VOX",
    "name": "Voicebox"
  },
  {
    "slot": 42,
    "ticker": "JNT",
    "name": "John Nathan Tabor"
  }
];
const coinRestoration = {
  source: "Nathan AI Crypto Ecosystem.png · November 2, 2026",
  recovered: recoveredCoins.length,
  requested: 64,
  slots: Array.from({length:64}, (_, i) => recoveredCoins[i]
    ? {...recoveredCoins[i], status:"recovered_from_42_coin_artwork"}
    : {slot:i+1, ticker:null, name:null, status:"source_unverified"})
};
function restoredCoinPage() {
  const rows = coinRestoration.slots.map(coin => "<tr><th scope=\"row\">" + coin.slot + "</th><td>" +
    (coin.ticker ?? "—") + "</td><td>" + (coin.name ?? "Original entry unverified") + "</td></tr>").join("");
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan Tabor Sovereign Coins</title><link rel="stylesheet" href="/catalog.css"><main><nav><a href="/coins">All coin families</a><a href="/api/coins/64">Registry JSON</a></nav><h1>Nathan Tabor Sovereign Coins</h1><p>42 numbered entries recovered from Nathan AI Crypto Ecosystem.png. The original entries for the remaining 22 slots are unverified.</p><table><thead><tr><th>Slot</th><th>Ticker</th><th>Coin name</th></tr></thead><tbody>' + rows + '</tbody></table></main></html>';
}

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
    if (path === "/api/coins/64") return json(coinRestoration);
    if (path === "/coins/64") return send(restoredCoinPage(), "text/html");
    if (path === "/coins" || path === "/coins/") {
      return send(catalogPage(catalog, (url.searchParams.get("q") ?? "").slice(0, 120).trim()).replace('<main>', '<main><p><a href="/coins/64">64-slot Sovereign Coin restoration</a></p>'), "text/html");
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
