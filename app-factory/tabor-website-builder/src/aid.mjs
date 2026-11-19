import { aidIds, examples, legacy, sites } from './sites.mjs';
import { escapeHtml, page, hero, section, cards, html, json } from './ui.mjs';

const catalogSelect = `SELECT item_id,category,title,description,unit_cost_cents,units_fulfilled,
  MAX(0,units_available-COALESCE((SELECT SUM(quantity) FROM fulfillment_pledges
    WHERE item_id=gift_catalog.item_id AND status='PLEDGED'),0)) AS units_available
  FROM gift_catalog WHERE program_slug=? AND active=1 ORDER BY category,title`;
const dollar = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function catalog(site, env) {
  const { results } = await env.DB.prepare(catalogSelect).bind(site.id).all();
  return results.map(row => ({ ...row, planning_example: false })).concat(
    results.length ? [] : examples[site.id].map(([item_id, category, title, description, unit_cost_cents]) => ({
      item_id, category, title, description, unit_cost_cents, planning_example: true,
    })),
  );
}

export function directoryLinks(ids) {
  return ids.map(id => ({ title: sites[id].title, description: sites[id].description, href: sites[id].url }));
}

export async function handling(site, env, path) {
  const { results } = await env.DB.prepare('SELECT id, provenance_url FROM program_directory ORDER BY display_order,id').all();
  const rows = results.filter(row => aidIds.includes(row.id));
  if (path === '/api/programs') {
    return json({ programs: rows.map(row => ({ ...sites[row.id], provenance_url: row.provenance_url })) });
  }
  const foundations = '<div class="article"><p>Handling Life brings together three independent aid programs. Choose the program that matches what you want to give.</p><p><a href="' + legacy[site.id] + '">Original Handling Life workspace</a></p></div>';
  return html(page(site, hero(site, '<a class="button" href="#programs">Explore the programs</a>') +
    section('The programs', cards(directoryLinks(rows.map(row => row.id))), 'programs') +
    section('Good Samaritan', foundations), { nav: [['Programs', '#programs']] }));
}

export function gifts(site, items) {
  const hasLiveCatalog = items.some(item => !item.planning_example);
  const groups = Array.from(new Set(items.map(item => item.category)));
  const tile = item => `<article class="card" data-item="${escapeHtml(item.item_id)}" data-group="${escapeHtml(item.category)}">
    <p class="eyebrow">${escapeHtml(item.category)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
    <p><span class="pill">${dollar.format(item.unit_cost_cents / 100)}</span> ${item.planning_example ? 'example cost' : 'per unit'}</p>
    ${item.planning_example ? '' : `<p>${item.units_available} units available</p>`}
    <button type="button" class="secondary" data-save hidden aria-pressed="false">Add to list</button></article>`;
  const aidCatalog = `<p>${hasLiveCatalog ? 'Browse listed items and build your own giving plan.' : 'These are example items and estimated costs. The catalog is open for planning.'}</p>
  <div class="controls"><label>Search items<input type="search" data-filter></label>
  <label>Category<select data-category><option value="">All categories</option>${groups.map(category => `<option>${escapeHtml(category)}</option>`).join('')}</select></label>
  <span data-count role="status">${items.length} matching entries</span></div>
  <div class="cards">${items.map(tile).join('')}</div>
  <aside class="planner" data-plan="${site.id}" hidden><h3>Your giving list</h3><p>Saved in this browser. Use it to plan your gifts.</p>
  <ul></ul><div class="controls"><button type="button" data-download>Download list</button><button type="button" class="secondary" data-print>Print</button></div>
  <p class="status" data-status role="status"></p></aside>`;
  const siblingIds = aidIds.filter(id => id !== site.id);
  const original = legacy[site.id] ? `<p><a href="${legacy[site.id]}">Original Christmas Toy Drive project</a></p>` : '';
  return html(page(site, hero(site, '<a class="button" href="#catalog">Browse the catalog</a>') +
    section('Gift catalog', aidCatalog, 'catalog') + section('Handling Life programs', original + cards(directoryLinks(siblingIds))),
  { nav: [['Gift catalog', '#catalog'], ['Handling Life', sites['handling-life'].url]] }));
}

export async function manageAid(site, env, path, input) {
  if (path === '/api/catalog') {
    const { item_id, category, title, description, unit_cost_cents, units_available, active } = input;
    if (![item_id, category, title, description].every(value => typeof value === 'string' && value.trim() && value.length <= 300) ||
        !slugPattern.test(item_id) || item_id.length > 70 ||
        !Number.isInteger(unit_cost_cents) || unit_cost_cents < 0 || unit_cost_cents > 10000000 ||
        !Number.isInteger(units_available) || units_available < 0 || units_available > 100000 ||
        typeof active !== 'boolean') return json({ error: 'Invalid catalog record' }, 400);
    await env.DB.prepare(`INSERT INTO gift_catalog(item_id, program_slug, category, title, description, unit_cost_cents, units_available, active)
      VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(item_id) DO UPDATE SET category=excluded.category, title=excluded.title,
      description=excluded.description, unit_cost_cents=excluded.unit_cost_cents, units_available=excluded.units_available, active=excluded.active
      WHERE gift_catalog.program_slug=excluded.program_slug`)
      .bind(item_id, site.id, category.trim(), title.trim(), description.trim(), unit_cost_cents, units_available, Number(active)).run();
    return json({ item_id, active });
  }
  const { pledge_id, item_id, quantity } = input;
  if (typeof pledge_id !== 'string' || !/^[a-f\d-]{36}$/i.test(pledge_id) ||
      typeof item_id !== 'string' || !slugPattern.test(item_id) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return json({ error: 'Invalid pledge' }, 400);
  const [, read] = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO fulfillment_pledges(pledge_id,item_id,quantity,created_at)
      SELECT ?,item_id,?,? FROM gift_catalog WHERE item_id=? AND program_slug=? AND active=1
      AND units_available-COALESCE((SELECT SUM(quantity) FROM fulfillment_pledges WHERE item_id=? AND status='PLEDGED'),0)>=?`)
      .bind(pledge_id, quantity, Date.now(), item_id, site.id, item_id, quantity),
    env.DB.prepare('SELECT pledge_id,item_id,quantity,status FROM fulfillment_pledges WHERE pledge_id=?').bind(pledge_id),
  ]);
  const pledge = read.results[0];
  return pledge?.item_id === item_id && pledge.quantity === quantity
    ? json(pledge)
    : json({ error: 'Unavailable quantity or pledge ID already in use' }, 409);
}

export async function pledgeStatus(site, env, input) {
  const { pledge_id, status } = input;
  if (typeof pledge_id !== 'string' || !/^[a-f\d-]{36}$/i.test(pledge_id) ||
      !['FULFILLED', 'CANCELLED'].includes(status)) return json({ error: 'Invalid pledge status' }, 400);
  const [, , read] = await env.DB.batch([
    env.DB.prepare(`UPDATE gift_catalog SET units_available=units_available-(SELECT quantity FROM fulfillment_pledges WHERE pledge_id=?),
      units_fulfilled=units_fulfilled+(SELECT quantity FROM fulfillment_pledges WHERE pledge_id=?)
      WHERE program_slug=? AND ?='FULFILLED' AND item_id=(SELECT item_id FROM fulfillment_pledges
      WHERE pledge_id=? AND status='PLEDGED' AND quantity<=gift_catalog.units_available)`)
      .bind(pledge_id, pledge_id, site.id, status, pledge_id),
    env.DB.prepare(`UPDATE fulfillment_pledges SET status=? WHERE pledge_id=? AND status='PLEDGED'
      AND item_id IN (SELECT item_id FROM gift_catalog WHERE program_slug=?) AND (?='CANCELLED' OR changes()=1)`)
      .bind(status, pledge_id, site.id, status),
    env.DB.prepare('SELECT pledge_id,item_id,quantity,status FROM fulfillment_pledges WHERE pledge_id=?').bind(pledge_id),
  ]);
  return read.results[0]?.status === status
    ? json(read.results[0])
    : json({ error: 'Pledge unavailable for this status' }, 409);
}
