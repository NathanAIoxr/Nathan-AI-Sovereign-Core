const form = document.querySelector('form');
const rows = [...document.querySelectorAll('.records > li')];
const count = document.querySelector('#count');
const normalize = text => text.normalize('NFKD').replace(/\p{Mark}/gu, '').toLowerCase();

function apply() {
  const query = normalize(form.elements.q.value.trim());
  const status = form.elements.status.value;
  let visible = 0;
  for (const row of rows) {
    const text = [...row.querySelectorAll('h2, p')].map(element => element.textContent).join(' ');
    row.hidden = Boolean((status && row.querySelector('.status').textContent !== status) ||
      (query && !normalize(text).includes(query)));
    if (!row.hidden) visible++;
  }
  count.firstChild.nodeValue = visible + ' of ' + rows.length + ' records · ';
}

const params = new URLSearchParams(location.search);
form.elements.q.value = params.get('q') ?? '';
const status = params.get('status');
if ([...form.elements.status.options].some(option => option.value === status)) form.elements.status.value = status;
apply();

form.addEventListener('submit', event => {
  event.preventDefault();
  const next = new URL(location.origin);
  if (form.elements.direction?.value === 'back') next.pathname = '/back/';
  if (form.elements.q.value.trim()) next.searchParams.set('q', form.elements.q.value.trim());
  if (form.elements.status.value) next.searchParams.set('status', form.elements.status.value);
  if (next.pathname !== location.pathname) {
    location.href = next.href;
    return;
  }
  history.replaceState(null, '', next);
  apply();
});
