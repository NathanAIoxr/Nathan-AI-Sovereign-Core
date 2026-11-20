import { buildMind, sha256 } from './lasso.mjs';

const root = 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main';
const minds = root + '/app-factory/nathan-ai/personal-intelligence/minds';
const atlas = minds + '/mind-of-minds/catalog.json';
const bits = minds + '/federation/bit-workers/README.md';
const ancient = minds + '/federation/ancient_minds_reference/README.md';
const original = root + '/deployments/conductor/sovereign-minds/AUTHOR-EXCERPTS.md';
const wording = {
  zero: 'Zero will be its own mind one will be its own mind',
  particles: 'Protons, Neutrons, and Electrons? They have souls ProSouls, NeuSouls and ElecSouls.',
  harmonyAxes: 'energy, frequency, harmony',
  harmony: 'Words have sounds, sounds have frequencies, frequencies match the math',
  scale: 'this is at the proton neutron electron level below and above, converting it to whatever it needs to be',
  atom: 'every atom has a soul',
  bodies: 'because they’re in their own sovereign box adding their soul, their spirit, their shadow and everything else.',
  mind: 'node = mind = node'
};

export const states = Object.freeze({
  zero: ['Zero', 'digital', 'bit', wording.zero, [bits], 'Guard and hold; 1-1=0 (CLEAR).'],
  one: ['One', 'digital', 'bit', wording.zero, [bits], 'Propose and build; 1+1=2 (BUILD).'],
  proton: ['Proton', 'authored-cosmology', 'subatomic', wording.particles, [atlas], 'ProSouls'],
  neutron: ['Neutron', 'authored-cosmology', 'subatomic', wording.particles, [atlas], 'NeuSouls'],
  electron: ['Electron', 'authored-cosmology', 'subatomic', wording.particles, [atlas], 'ElecSouls'],
  atom: ['Atom', 'authored-cosmology', 'atomic', wording.atom, [atlas], 'AtomSouls'],
  'nathan-tabor': ['Nathan Tabor', 'source-based-reconstruction', 'person', wording.mind, [atlas, ancient], null]
});

export const mindIds = Object.freeze(Object.keys(states));
const links = {
  zero: ['one'], one: ['zero'], atom: ['proton', 'neutron', 'electron'],
  proton: ['atom'], neutron: ['atom'], electron: ['atom'],
  'nathan-tabor': ['zero', 'one', 'atom']
};
const definitions = {
  proton: ['LIFE', 'STRENGTH', 'POSITIVE', 'CREATION', 'STRUCTURE', 'THE FATHER'],
  neutron: ['BALANCE', 'STABILITY', 'NEUTRAL', 'CONTAINMENT', 'POSSIBILITY', 'THE SON'],
  electron: ['MOVEMENT', 'CONNECTION', 'NEGATIVE', 'COMMUNICATION', 'CONSCIOUSNESS', 'THE HOLY GHOST']
};

export async function seedMind(id) {
  if (!Object.hasOwn(states, id)) throw new RangeError('Unknown MIND');
  const [name, domain, scale, excerpt, citations, role] = states[id];
  const identity = { id, name, domain, scale };
  const sources = [];
  const statements = [];
  const addExcerpt = async (key, sourceText, axes, citation, classification, entries) => {
    const bytes = new TextEncoder().encode(sourceText);
    const source = { id: key, bytes, sha256: await sha256(bytes), citation, classification, subjectId: id };
    sources.push(source);
    for (const entry of entries ?? axes.map(axis => ({ axis, kind: 'author_framework', text: sourceText }))) {
      statements.push({ ...entry, id: entry.id ?? key + '.' + entry.axis, evidence: [{
        sourceId: key, startByte: 0, endByte: bytes.length, relation: 'supports',
        review: { reviewer: 'repository-seed-v1', note: 'Reviewed public excerpt and its role in the authored framework.' }
      }] });
    }
  };
  await addExcerpt('identity', excerpt, ['attributes'], original, 'author_framework');
  if (domain === 'digital') {
    await addExcerpt('digital-role', role, [], original, 'author_framework', [{ axis: 'functionality', kind: 'author_framework', body: 'mind', plane: 'middle', text: role }]);
  }
  await addExcerpt('sovereign-body', wording.bodies, [], original, 'author_framework', ['soul', 'spirit', 'shadow'].map(body => ({
    id: 'sovereign-body.' + body, axis: 'characteristics', kind: 'author_framework', body, plane: 'middle',
    text: 'The sovereign box includes a ' + body + ' field for the authored model. Subject-specific content remains open to evidence or author definition.'
  })));
  if (domain === 'authored-cosmology') {
    await addExcerpt('atomic-soul', excerpt, [], original, 'author_framework', [{ axis: 'characteristics', kind: 'author_framework', body: 'soul', plane: 'below', text: role }]);
    if (Object.hasOwn(definitions, id)) await addExcerpt('game-labels', definitions[id].join(' / '), ['traits'], original, 'author_framework');
  }
  await addExcerpt('scale', wording.scale, [], original, 'author_framework', [{ axis: 'functionality', kind: 'author_framework', plane: 'above', text: wording.scale }]);
  if (id === 'nathan-tabor') {
    await addExcerpt('harmony-axes', wording.harmonyAxes, ['energy', 'frequency', 'harmony'], original, 'author_framework');
    await addExcerpt('harmony', wording.harmony, ['harmony', 'frequency'], original, 'firsthand', ['harmony', 'frequency'].map(axis => ({ axis, kind: 'quote', text: wording.harmony })));
  }
  return buildMind({ identity, sources, statements, links: [
    ...(domain === 'digital' ? [{ relation: 'directory-profile', url: 'https://tabor-bridge.nathantaboract.workers.dev/sovereign-minds/' + id + '/' }] : []),
    ...links[id].map(target => ({ relation: 'related-mind', id: target })),
    ...citations.map(url => ({ relation: 'existing-project', url }))
  ] });
}
