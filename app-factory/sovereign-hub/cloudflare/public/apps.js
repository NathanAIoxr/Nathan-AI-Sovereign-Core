'use strict';
const search = document.getElementById('search');
const count = document.getElementById('count');
const results = document.getElementById('apps');

async function loadCatalog() {
  const response = await fetch('./apps.json');
  if (!response.ok) throw new Error('Catalog request failed');
  const catalog = await response.json();

  function render() {
    const query = search.value.trim().toLowerCase();
    const matches = catalog.apps.filter(app =>
      [app.title, app.group, app.entry].some(value => value.toLowerCase().includes(query))
    );
    const cards = matches.map(app => {
      const card = document.createElement('article');
      card.className = 'panel';
      const title = document.createElement('h2');
      title.textContent = app.title;
      const status = document.createElement('p');
      status.textContent = app.adoption;
      const link = document.createElement('a');
      link.href = app.url;
      link.textContent = 'Open existing app';
      link.setAttribute('aria-label', `Open ${app.title}`);
      card.append(title, status, link);
      return card;
    });
    results.replaceChildren(...cards);
    count.textContent = `${matches.length} of ${catalog.count} app entry points`;
  }

  search.addEventListener('input', render);
  render();
}

loadCatalog().catch(() => { count.textContent = 'Catalog temporarily unavailable'; });
