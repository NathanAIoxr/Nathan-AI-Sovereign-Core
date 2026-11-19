const get = id => document.getElementById(id);
const base = new URL('./', location.href);
let cursor;
let filters;
let generation = 0;
const states = { observed: 'Observed in Cloudflare', declared: 'Declared', missing: 'Absent from latest inventory' };

async function api(path, body) {
  const key = get('key').value.trim();
  if (!key) {
    get('key').focus();
    throw new Error('Enter your registry key.');
  }
  const response = await fetch(new URL(path, base), {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + key, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

async function search(append) {
  if (!append) {
    generation++;
    filters = new URLSearchParams(new FormData(get('browse')));
    get('records').replaceChildren();
    get('more').hidden = true;
  }
  const attempt = generation;
  const params = new URLSearchParams(filters);
  if (append && cursor) params.set('after', cursor);
  get('more').disabled = true;
  try {
    const result = await api('records?' + params);
    if (attempt !== generation) return;
    cursor = result.next;
    get('more').hidden = !cursor;
    for (const row of result.records) {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      name.textContent = row.title;
      const meta = document.createElement('span');
      meta.textContent = [row.kind, states[row.state], row.location, row.source_ref].filter(Boolean).join(' · ');
      item.append(name, meta);
      get('records').append(item);
    }
    const counts = result.totals.reduce((total, row) => ({
      ...total, [row.kind]: (total[row.kind] || 0) + row.total
    }), {});
    get('summary').textContent = `${get('records').children.length} shown. Registry totals: ${counts.worker || 0} Workers, ${counts.bot || 0} bots, ${counts.agent || 0} agents.`;
  } catch (error) {
    if (attempt === generation) get('summary').textContent = error.message;
  } finally {
    if (attempt === generation) get('more').disabled = false;
  }
}

get('browse').addEventListener('submit', event => {
  event.preventDefault();
  void search(false);
});
get('more').addEventListener('click', () => void search(true));
get('lock').addEventListener('click', () => {
  generation++;
  get('key').value = '';
  get('summary').textContent = '';
  get('saved').textContent = '';
  get('add').reset();
  get('records').replaceChildren();
  get('more').hidden = true;
  get('key').focus();
});
get('add').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const attempt = generation;
  const submit = form.querySelector('button');
  submit.disabled = true;
  try {
    const row = await api('records', Object.fromEntries(new FormData(form)));
    if (attempt !== generation) return;
    get('saved').textContent = 'Saved ' + row.record_key + ' as declared.';
    form.reset();
  } catch (error) {
    if (attempt === generation) get('saved').textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});
