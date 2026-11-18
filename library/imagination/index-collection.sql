INSERT INTO archive_works (
  id, title, author, language, class, vault, kind, state,
  description, source_url, source_reference, rights_note
) VALUES (
  'tabor-imagination-101',
  'Library of Tabor · Imagination Engines',
  'Library of Tabor',
  'en',
  'T',
  'imagination',
  'collection',
  'collection-guide',
  'A catalog of 101 creative engines across eight collections, including dragons, unicorns, Yin-Yang harmony, the A–Z Creature Kingdom, and the Land of Illa.',
  'https://library-of-tabor-imagination.nathantaboract.workers.dev/',
  'Tabor Imagination Engines · IMAG-001 through IMAG-101',
  'Catalog supplied for the Library of Tabor.'
) ON CONFLICT (id) DO NOTHING;
