const toneRules = {
  direct: [
    [/\b(maybe|just wondering|sort of|kind of)\b/gi, 'Consider naming the action you want.'],
    [/\b(as soon as possible|whenever you can)\b/gi, 'Give a specific deadline if there is one.'],
  ],
  calm: [
    [/\b(always|never|obviously|ridiculous)\b/gi, 'Consider replacing a general judgment with a specific event.'],
    [/!{2,}/g, 'Consider a single punctuation mark.'],
  ],
  collaborative: [
    [/\b(you need to|your fault|you failed to)\b/gi, 'Consider describing the next step and who owns it.'],
    [/\b(do it now|figure it out|fix it)\b/gi, 'Specify what needs to happen and the deadline.'],
  ],
};

byId('review-form').addEventListener('submit', event => {
  event.preventDefault();
  const message = byId('message').value;
  const rules = toneRules[byId('tone').value];
  const matches = rules.flatMap(([pattern, suggestion]) => [...message.matchAll(pattern)].map(match => {
    return { original: match[0], position: match.index, suggestion };
  })).sort((a, b) => a.position - b.position);
  const entries = matches.map(({ original, suggestion }) => {
    const item = document.createElement('li');
    const quote = document.createElement('strong');
    quote.textContent = '“' + original + '”';
    item.append(quote, ' · ' + suggestion);
    return item;
  });
  byId('findings').replaceChildren(...entries);
  byId('review-count').textContent = matches.length ? matches.length + ' phrase matches.' : 'No phrases matched the selected rules.';
});
