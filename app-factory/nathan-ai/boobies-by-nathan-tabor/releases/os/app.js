const tabs = Array.from(document.querySelectorAll('[data-panel]'));

function selectPanel(panel) {
  const selected = tabs.find(tab => tab.dataset.panel === panel) ?? tabs[0];
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute('aria-pressed', String(active));
    byId(tab.dataset.panel).hidden = !active;
  }
  saveStored('os.panel', selected.dataset.panel);
}

for (const tab of tabs) tab.addEventListener('click', () => selectPanel(tab.dataset.panel));
selectPanel(readStored('os.panel', 'calculator'));
byId('note').value = readStored('os.note', '');
byId('save-note').addEventListener('click', () => {
  const saved = saveStored('os.note', byId('note').value);
  byId('note-status').textContent = saved ? 'Saved on this device.' : 'This browser blocked local storage.';
});
byId('desk-flip').addEventListener('click', () => {
  const field = byId('desktop-digits');
  field.value = field.value.replace(/[^0-9]/g, '').slice(0, 8);
  byId('desk-word').value = readFlip(field.value) || 'Enter up to 8 digits.';
});
let samples = 0;
byId('loop-sim').addEventListener('click', () => {
  samples++;
  byId('loop-log').textContent = 'Sample ' + samples + '\n55378008 → BOOBLESS\nTwin ouroboroi: 00';
});
