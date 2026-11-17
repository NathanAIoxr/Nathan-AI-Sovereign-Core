'use strict';
const form = document.querySelector('#booking');
const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const more = document.querySelector('#more');
const records = document.querySelector('#records');
let pending = null;
let cursor = null;
let watermark = null;
let pageResource = null;
let busy = false;
let generation = 0;
async function request(path, body) {
  const response = await fetch(path, body === undefined ? {} : {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return result;
}
async function submitPending() {
  if (!pending || busy) return;
  busy = true;
  form.querySelector('button').disabled = true;
  retry.hidden = true;
  status.textContent = 'Pending reservation — waiting for verification.';
  try {
    const saved = await request('/bookings', pending);
    pending = null;
    status.textContent = `Reservation ${saved.id} verified and committed.`;
    await loadPage(true);
  } catch (error) {
    if (error.status >= 400 && error.status < 500) {
      pending = null;
      status.textContent = `${error.message}. Command rejected; correct the input and submit again.`;
    } else {
      status.textContent = `${error.message}. No confirmation received; retry preserves the same command key.`;
    }
    retry.hidden = pending === null;
  } finally {
    busy = false;
    form.querySelector('button').disabled = false;
  }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  if (pending) {
    status.textContent = 'Resolve the pending command using Retry before starting a new reservation.';
    return;
  }
  const data = new FormData(form);
  const resource = data.get('resource').trim();
  const start = data.get('start');
  const end = data.get('end');
  if (start >= end) { status.textContent = 'Checkout must follow check-in.'; return; }
  busy = true;
  try {
    const lease = await request('/fences', {resource});
    pending = {resource, key: crypto.randomUUID(), range: {start, end}, token: lease.token};
  } catch (error) { status.textContent = error.message; }
  finally { busy = false; }
  await submitPending();
});
retry.addEventListener('click', submitPending);
async function loadPage(reset) {
  const resource = reset ? new FormData(form).get('resource').trim() : pageResource;
  if (!resource) return;
  const currentGeneration = reset ? ++generation : generation;
  const query = new URLSearchParams({resource, size: '5'});
  if (!reset && cursor !== null) {
    query.set('after', String(cursor)); query.set('until', String(watermark));
  }
  more.disabled = true;
  try {
    const page = await request(`/bookings?${query}`);
    if (currentGeneration !== generation) return;
    if (reset) { records.replaceChildren(); pageResource = resource; }
    for (const item of page.items) {
      const row = document.createElement('li');
      row.textContent = `${item.resource}: ${item.start} → ${item.end} · reservation ${item.id}`;
      records.append(row);
    }
    cursor = page.next; watermark = page.until; more.hidden = cursor === null;
  } finally { more.disabled = false; }
}
document.querySelector('#refresh').addEventListener('click', () => loadPage(true).catch(error => {status.textContent = error.message;}));
more.addEventListener('click', () => loadPage(false).catch(error => {status.textContent = error.message;}));
request('/health').then(result => {
  document.querySelector('#health').textContent = result.healthy ? 'Healthy · booking and event counts agree' : 'Storage verification failed';
}).catch(() => {document.querySelector('#health').textContent = 'Local service unavailable';});
