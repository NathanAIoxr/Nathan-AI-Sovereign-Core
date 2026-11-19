const operations = new Map([
  ['trim', text => text.trim()],
  ['uppercase', text => text.toUpperCase()],
  ['lowercase', text => text.toLowerCase()],
  ['reverse', text => Array.from(text).reverse().join('')],
  ['flip word', readFlip],
  ['flip digits', makeFlip],
]);

byId('sequence-form').addEventListener('submit', event => {
  event.preventDefault();
  const commands = byId('actions').value.split(/\r?\n/).map(line => line.trim().toLowerCase()).filter(Boolean);
  const invalid = commands.find(command => !operations.has(command));
  const log = byId('sequence-log');
  log.textContent = '';
  if (invalid || !commands.length || commands.length > 18) {
    byId('sequence-status').textContent = invalid ? 'Unknown operation: ' + invalid : 'Enter between 1 and 18 operations.';
    return;
  }
  let value = byId('seed').value;
  const lines = ['Start · ' + JSON.stringify(value)];
  for (const command of commands) {
    value = operations.get(command)(value);
    lines.push(command + ' · ' + JSON.stringify(value));
  }
  log.textContent = lines.join('\n');
  byId('sequence-status').textContent = 'Completed ' + commands.length + ' operations.';
});
