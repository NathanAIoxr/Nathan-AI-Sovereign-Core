const examples = {
  app: 'flip calculator number 180 boobs boobies boobless display digit digits numeral',
  game: 'game play round score snot trap traps arcade puzzle challenge',
  os: 'os desktop window panels notes save local workspace console',
  sos: 'sos status releases live check health endpoint endpoints verify service uptime',
  agi: 'agi plan goal planner checklist steps scope constraint deliverables milestones',
  ai: 'ai classify classifier route router recommend suggestion training matching',
  si: 'si pattern translate conversion encode decode rotated workbench dictionary symbols',
  ei: 'ei tone message review soften wording direct conversation sentence phrase polite',
  ae: 'ae sequence transform runner trim uppercase lowercase chain batch repeat replace action',
};

function tokens(text) {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

const training = Object.entries(examples).map(([id, text]) => [id, tokens(text)]);

byId('route-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = tokens(byId('request').value);
  const scores = training.map(([id, words]) => {
    const hits = [...input].filter(word => words.has(word));
    return { id, hits };
  }).filter(score => score.hits.length).sort((a, b) => b.hits.length - a.hits.length);
  const top = scores[0];
  const link = byId('destination');
  link.hidden = true;
  byId('evidence').textContent = '';
  if (!top) {
    byId('decision').textContent = 'No matching release found.';
    return;
  }
  const tied = scores.filter(score => score.hits.length === top.hits.length);
  if (tied.length > 1) {
    byId('decision').textContent = 'Matched multiple releases: ' + tied.map(score => score.id.toUpperCase()).join(', ') + '.';
    byId('evidence').textContent = 'Add a few words about the main thing you want to do.';
    return;
  }
  const entry = releases.find(item => item.id === top.id);
  byId('decision').textContent = entry.name + ' · ' + entry.title;
  byId('evidence').textContent = 'Matched words: ' + top.hits.join(', ') + '.';
  link.href = '../' + entry.id + '/index.html';
  link.textContent = 'Open ' + entry.name + ' ↗';
  link.hidden = false;
});
