byId('pattern-form').addEventListener('submit', event => {
  event.preventDefault();
  const value = byId('pattern').value.trim();
  const converted = byId('mode').value === 'decode' ? readFlip(value) : makeFlip(value);
  byId('converted').value = converted || 'Enter a pattern.';
});
