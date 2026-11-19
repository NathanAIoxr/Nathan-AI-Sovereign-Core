import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const base = new URL('./', import.meta.url);
const dossier = JSON.parse(readFileSync(new URL('research/nature-human-body-evaporation.json', base), 'utf8'));
const original = readFileSync(new URL('original.txt', base), 'utf8').trimEnd();
test('author text is verbatim and not rewritten', () => assert.equal(dossier.author_source.exact_text, original));
test('paired example is numerically consistent and qualified', () => {
  const e = dossier.example;
  assert.equal(e.pair.length, 2);
  assert.ok(Math.abs(e.illustrative_quantity.water_mass_kg * e.illustrative_quantity.latent_heat_MJ_per_kg * 1000 - e.illustrative_quantity.energy_kJ) < 1e-12);
  assert.match(e.illustrative_quantity.qualification, /not a measured/);
  assert.match(e.source.url, /^https:\/\/www\.fao\.org\//);
});
test('research stays separate from publication, artifact custody and dark-matter assertions', () => {
  assert.equal(dossier.status, 'research_only_not_published');
  assert.ok(dossier.boundaries.some(x => /dark-matter statement/.test(x)));
  assert.ok(dossier.boundaries.some(x => /custody chain/.test(x)));
});
