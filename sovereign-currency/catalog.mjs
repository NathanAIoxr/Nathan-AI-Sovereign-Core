const escape = value => String(value ?? "").replace(/[&<>"']/g, char =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);

export function makeCatalog(assets) {
  const records = (name, family, notes) => ({
    name, family, notes: notes.filter(Boolean)
  });
  const matrix = JSON.parse(assets["registry.json"]).coins.map(coin => records(
    coin.ticker + " · " + coin.name, "21 Sovereign Coin Matrix",
    [coin.definition, coin.number <= 2 ? "Initial design units: 1,000,000" : "Initial design units unspecified"]
  ));
  const history = JSON.parse(assets["coin-families.json"]).map(coin => records(
    coin.original_name,
    coin.internal_points_code ? "Tabor World law coins" : "2025 SIN and SEN prototypes",
    [
      coin.design_value,
      coin.internal_points_code && "Local points code: " + coin.internal_points_code,
      coin.legacy_reference_not_token_ticker && "Historical cross-reference: " + coin.legacy_reference_not_token_ticker,
      coin.recorded_supply,
      coin.recorded_price_usd && "Illustrative archived figure: " + coin.recorded_price_usd,
      coin.demo_reward && "Offline demo reward: " + coin.demo_reward.activity + " → " + coin.demo_reward.points + " points",
      coin.evidence_status
    ]
  ));
  const other = JSON.parse(assets["additional-coins.json"]).flatMap(group =>
    group.names.map(([name, role]) => records(name, group.family, [role, "Historical design record"])));
  const external = JSON.parse(assets["conspectus.json"]).slice(0, 7).map(coin =>
    records(coin.title, "External network reference assets", [coin.technicalNote || coin.function]));
  return { authored: [...matrix, ...history, ...other], external };
}

export function catalogPage(data, query) {
  const match = item => [item.name, item.family, ...item.notes].join(" ").toLowerCase().includes(query.toLowerCase());
  const groups = Map.groupBy([...data.authored, ...data.external].filter(match), item => item.family);
  const sections = Array.from(groups, ([family, entries]) =>
    "<section><h2>" + escape(family) + "</h2><ul>" + entries.map(coin =>
      "<li><strong>" + escape(coin.name) + "</strong><ul>" +
      coin.notes.map(note => "<li>" + escape(note) + "</li>").join("") + "</ul></li>"
    ).join("") + "</ul></section>").join("");
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TABOR CORP Coin Catalog</title><link rel="stylesheet" href="/catalog.css"><main><nav><a href="/">Coin Matrix and local ledger</a><a href="https://tabor-world.nathantaboract.workers.dev/">Tabor World Hub</a><a href="/api/coins">Catalog JSON</a><a href="/api/conspectus">Full 7/7/7 reference</a></nav><h1>TABOR CORP Coin Catalog</h1><p>Coin definitions, historical designs, prototypes and external references. Balances in the Coin Matrix are browser-local.</p><form action="/coins"><label for="q">Search by name, code or family</label><input id="q" name="q" maxlength="120" value="' + escape(query) +
    '"><button>Search</button><a href="/coins">Clear</a></form><p>' +
    [...groups.values()].reduce((count, entries) => count + entries.length, 0) + " matching records</p>" + sections + "</main></html>";
}
