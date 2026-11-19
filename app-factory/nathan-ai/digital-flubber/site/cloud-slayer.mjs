const byId = id => document.getElementById(id);
const form = byId('slayer-search');
const status = byId('slayer-status');
const list = byId('slayer-results');
const more = byId('slayer-more');
const receipt = byId('slayer-receipt');
const view = location.pathname.split('/').at(-1);
if (['supercomputer', 'hypercomputer'].includes(view)) form.elements.view.value = view;
if (location.search === '?view=sos') form.elements.view.value = 'sos';

async function data(path) {
  const response = await fetch('/api/cloud-slayer/' + path);
  if (!response.ok) throw new Error('Registry request failed');
  return response.json();
}
const integer = new Intl.NumberFormat();
data('summary').then(summary => {
  for (const [id, key] of [['inventory', 'cloudflare_workers'], ['shared', 'shared_modules'], ['total', 'total_records']]) {
    byId('slayer-' + id).textContent = integer.format(summary[key]);
  }
  if (summary.inventory_as_of) byId('slayer-snapshot').textContent = 'Account inventory captured ' + new Date(summary.inventory_as_of).toLocaleString();
}).catch(() => {
  byId('slayer-snapshot').textContent = 'Inventory is temporarily unavailable.';
});

let next = null;
let lastQuery = '';
let searchSequence = 0;
let runSequence = 0;
async function search(append = false) {
  const current = ++searchSequence;
  const query = append ? new URLSearchParams(lastQuery) : new URLSearchParams(new FormData(form));
  if (append && next) query.set('after', next);
  if (!append) {
    lastQuery = query.toString();
    list.replaceChildren();
    receipt.hidden = true;
    runSequence++;
  }
  more.hidden = true;
  status.textContent = 'Searching…';
  try {
    const found = await data('modules?' + query);
    if (current !== searchSequence) return;
    for (const module of found.modules) {
      const row = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = module.label;
      const summary = document.createElement('p');
      summary.textContent = module.description;
      row.append(title, summary);
      if (module.runnable) {
        const run = document.createElement('button');
        run.type = 'button';
        run.textContent = 'Run';
        run.setAttribute('aria-label', 'Run ' + module.label);
        run.addEventListener('click', async () => {
          const invocation = ++runSequence;
          receipt.hidden = false;
          receipt.textContent = 'Running ' + module.label + '…';
          run.disabled = true;
          try {
            const result = await data('worker?key=' + encodeURIComponent(module.module_id));
            if (invocation === runSequence) receipt.textContent = JSON.stringify(result, null, 2);
          } catch {
            if (invocation === runSequence) receipt.textContent = 'This module is temporarily unavailable.';
          } finally {
            run.disabled = false;
          }
        });
        row.append(run);
      }
      list.append(row);
    }
    status.textContent = list.children.length ? integer.format(list.children.length) + (list.children.length === 1 ? ' module shown' : ' modules shown') : 'No shared modules match.';
    next = found.next;
    more.hidden = !next;
  } catch {
    if (current === searchSequence) status.textContent = 'Worker search is temporarily unavailable.';
  }
}
form.addEventListener('submit', event => { event.preventDefault(); search(); });
more.addEventListener('click', () => search(true));
search();
