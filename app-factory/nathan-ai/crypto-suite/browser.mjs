const id = name => document.getElementById(name);
const value = name => id(name).value;
const text = (name, value) => { id(name).textContent = value; };
const create = (tag, content) => {
  const el = document.createElement(tag);
  if (content !== undefined) el.textContent = content;
  return el;
};
function form(name, result, fn) {
  id(name).addEventListener("submit", async event => {
    event.preventDefault();
    try { text(result, await fn(event.target)); }
    catch (error) { text(result, error.message); }
  });
}
function numeric(name) {
  const n = Number(value(name));
  if (!Number.isFinite(n) || n < 0) throw new Error("Enter a nonnegative number.");
  return n;
}
function exportFile(name, data, mime = "application/json") {
  const url = URL.createObjectURL(new Blob([data], {type: mime}));
  const anchor = document.createElement("a");
  anchor.download = name;
  anchor.href = url;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function journal(key, listId, exportId, clearId, summarize) {
  let records;
  try { records = JSON.parse(localStorage.getItem(key) ?? "[]"); }
  catch { records = []; }
  if (!Array.isArray(records)) records = [];
  const draw = () => id(listId).replaceChildren(...records.map(record => create("li", summarize(record))));
  const write = next => {
    localStorage.setItem(key, JSON.stringify(next));
    records = next;
    draw();
  };
  id(exportId).onclick = () => exportFile(key+".json", JSON.stringify(records, null, 2));
  id(clearId).onclick = () => { if (confirm("Clear all records in this browser?")) write([]); };
  draw();
  return record => {
    if (records.length >= 250) throw new Error("Export and clear some records before adding more.");
    write([...records, record]);
  };
}
async function catalog() {
  const response = await fetch("/api/coins/64");
  if (!response.ok) throw new Error("Original registry temporarily unavailable.");
  const data = await response.json();
  function draw() {
    const term = value("search").toLowerCase().trim();
    const rows = data.slots.filter(row => [row.slot, row.ticker, row.name].join(" ").toLowerCase().includes(term));
    text("coin-status", data.recovered+" recovered · "+(data.requested-data.recovered)+" unresolved · "+rows.length+" displayed");
    const table = create("table");
    const header = create("tr");
    header.append(...["Slot","Ticker","Original name","Status"].map(label => create("th",label)));
    const head = create("thead"); head.append(header);
    const body = create("tbody");
    for (const item of rows) {
      const row = create("tr");
      const recovered = item.status === "recovered_from_42_coin_artwork";
      row.append(...[item.slot, recovered?item.ticker:"—", recovered?item.name:"—",recovered?"Recovered from artwork":"Unresolved"].map(v => create("td",v)));
      body.append(row);
    }
    table.append(head,body);
    const wrap = create("div"); wrap.className = "table-wrap"; wrap.append(table);
    id("coins").replaceChildren(wrap);
  }
  draw();
  id("search").oninput = draw;
}
function mining() {
  id("genesis").onclick = () => { id("header").value = GENESIS; };
  form("proof","proof-result",async () => {
    const result = await headerProof(value("header").trim());
    return "Hash: "+result.hash+"\nTarget: "+result.target+"\nProof meets target: "+(result.meetsTarget?"yes":"no")+(result.isBitcoinGenesis?"\nBitcoin genesis block header":"");
  });
  form("energy","energy-result",() => {
    const kwh = numeric("watts") * numeric("hours") / 1000;
    return kwh.toLocaleString(undefined,{maximumFractionDigits:6})+" kWh\nEstimated electricity cost: "+(kwh*numeric("rate")).toLocaleString(undefined,{maximumFractionDigits:6})+" in your entered currency";
  });
}
function cryptology() {
  const encode = message => new TextEncoder().encode(message);
  const digest = async message => asHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encode(message))));
  form("hash","digest",() => digest(value("message")));
  const params = {name:"ECDSA", hash:"SHA-256"};
  async function verify(key, signature, message) {
    if (signature.length !== 64) throw new Error("Raw P-256 signatures must be 64 bytes.");
    return await crypto.subtle.verify(params,key,signature,encode(message));
  }
  form("verify","verify-result",async () => {
    const key = await crypto.subtle.importKey("spki",hexBytes(value("public-key").trim()),{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);
    const valid = await verify(key,hexBytes(value("signature").trim()),value("signed-message"));
    return valid ? "Valid signature for this message and key." : "Signature mismatch.";
  });
  id("sample").onclick = async () => {
    try {
      const pair = await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},false,["sign","verify"]);
      const message = "Nathan AI local signature demonstration";
      const signature = await crypto.subtle.sign(params,pair.privateKey,encode(message));
      const valid = await verify(pair.publicKey,new Uint8Array(signature),message);
      text("verify-result",valid?"Local example signature verified.":"Example signature mismatch.");
    } catch (error) { text("verify-result",error.message); }
  };
}
function operations() {
  id("observe").onclick = async () => {
    text("oracle-result","Checking…");
    try {
      const response = await fetch("/api/oracle/health");
      if (!response.ok) throw new Error("Observations unavailable.");
      const data = await response.json();
      text("oracle-result",data.observedAt+"\n"+data.sources.map(source=>source.source+": "+(source.ok?"verified response":"unavailable")).join("\n"));
    } catch (error) { text("oracle-result", error.message); }
  };
  const add = journal("nathan-paper-trades","trade-rows","export-trade","clear-trade",r=>r.asset+" · "+r.side+" · Paper result "+r.result.toFixed(2));
  form("trade","trade-result",() => {
    const asset = value("asset").trim();
    if (!asset) throw new Error("Enter an asset name.");
    const side = value("side");
    const quantity = numeric("quantity"), entry = numeric("entry"), exit = numeric("exit"), fees = numeric("fees");
    const result = (side==="Short"?entry-exit:exit-entry)*quantity-fees;
    add({asset,side,quantity,entry,exit,fees,result,date:new Date().toISOString()});
    return "Paper result after entered fees: "+result.toFixed(2);
  });
}
function dmsp() {
  form("runbook","runbook-result",form => {
    const completed = Array.from(form.querySelectorAll("input[type=checkbox]:checked"),node=>node.value);
    const service = value("service").trim().replace(/[\r\n]/g," ");
    if (!service) throw new Error("Enter a service name.");
    const list = value("area");
    const steps = {
      "Mining telemetry":["Record authorized equipment, pool, power draw, and temperature.","Compare observed hashrate and rejected shares with the baseline.","Record escalation and equipment shutdown authority."],
      "Signing infrastructure":["List signing keys by identifier and permitted use.","Rehearse rotation and revocation with a test key.","Verify an artifact and record its digest."],
      "Crypt oracle incident":["Record observed timestamp, upstream response, and affected consumer.","Compare with an independent source when available.","Document stale-data handling and recovery criteria."],
      "Backup and recovery":["List assets in scope and backup retention.","Test a restore with a clean environment and record integrity checks.","Record owner sign-off and evidence location."],
    };
    exportFile("nathan-ai-crypto-runbook.md","# "+service+"\n\n## "+list+"\n\n"+steps[list].map(x=>"- [ ] "+x).join("\n")+"\n\n## Evidence checkpoints\n\n"+(completed.map(x=>"- "+x).join("\n")||"Pending")+"\n","text/markdown");
    return "Runbook downloaded.";
  });
}
function fieldbook() {
  const add = journal("nathan-cryptozoology-fieldbook","field-rows","export-field","clear-field",r=>r.subject+" · "+r.evidence+" · "+r.observation);
  form("fieldbook","field-result",() => {
    const subject = value("subject").trim(), observation = value("observation").trim();
    if (!subject || !observation) throw new Error("Enter the subject and observations.");
    add({subject,evidence:value("evidence"),observation,recordedAt:new Date().toISOString()});
    return "Observation saved in this browser.";
  });
}
const app = document.body.dataset.app;
try {
  await ({"crypto-64":catalog,"mining-lab":mining,"cryptology":cryptology,"crypt-operations":operations,"crypto-dmsp-dit":dmsp,"cryptozoology":fieldbook})[app]();
} catch (error) {
  if (app === "crypto-64") text("coin-status",error.message);
  else throw error;
}
