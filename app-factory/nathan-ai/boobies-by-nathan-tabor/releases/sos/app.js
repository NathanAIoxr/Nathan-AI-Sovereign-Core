const releaseChecks = releases.map(entry => {
  const tile = document.createElement('article');
  tile.className = 'card';
  const name = document.createElement('p');
  name.className = 'eyebrow';
  name.textContent = entry.name;
  const title = document.createElement('h2');
  title.textContent = entry.title;
  const status = document.createElement('p');
  status.textContent = 'Unchecked';
  const link = document.createElement('a');
  link.textContent = 'Open ' + entry.name + ' ↗';
  link.href = '../' + entry.id + '/index.html';
  tile.append(name, title, status, link);
  byId('releases').append(tile);
  return { entry, status, link };
});

async function checkRelease({ entry, status, link }) {
  status.textContent = 'Checking…';
  try {
    const response = await fetch(link.href, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      status.textContent = 'HTTP ' + response.status;
      return false;
    }
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const verified = doc.title === 'BOOBIES by Nathan Tabor · ' + entry.name;
    status.textContent = verified ? 'Verified · HTTP ' + response.status : 'Unexpected page title';
    return verified;
  } catch {
    status.textContent = 'Connection failed';
    return false;
  }
}

byId('check').addEventListener('click', async () => {
  byId('check').disabled = true;
  byId('summary').textContent = 'Checking ' + releaseChecks.length + ' release URLs…';
  let total = 0;
  for (let index = 0; index < releaseChecks.length; index += 3) {
    const batch = await Promise.all(releaseChecks.slice(index, index + 3).map(checkRelease));
    total += batch.filter(Boolean).length;
  }
  byId('summary').textContent = total + ' of ' + releaseChecks.length + ' release URLs verified.';
  byId('check').disabled = false;
});
