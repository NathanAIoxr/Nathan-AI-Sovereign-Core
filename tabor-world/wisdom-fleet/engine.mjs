const archive = 'https://library-of-tabor-wisdom.nathantaboract.workers.dev'
export const modes = ['worker', 'bot', 'agent']
export const serial = id => String(id).padStart(3, '0')
const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
const words = value => normalize(value).match(/[\p{L}\p{N}]+/gu) ?? []
const human = value => typeof value === 'string' && value.length > 0
const numeric = (value, min, max) => Number.isFinite(value) && value >= min && value <= max
const integer = (value, min, max) => Number.isInteger(value) && numeric(value, min, max)
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const need = (condition, message) => { if (!condition) throw new RangeError(message) }
const coverage = hits => hits.length > 0 ? 'matching-evidence' : 'insufficient-evidence'

export function describe([id, title, operation, task, axes]) {
  return { id, title, operation, task, topics: Object.keys(axes), modes,
    endpoint: `https://tabor-wisdom-${serial(id)}.nathantaboract.workers.dev`,
    archive: `${archive}/entries/${serial(id)}` }
}

const uses = (needle, haystack) => {
  const tokens = words(needle)
  return tokens.length && haystack.includes(' ' + tokens.join(' ') + ' ')
}

function index(module, evidence) {
  const [, , , , axes] = module
  return Object.entries(axes).map(([topic, keywords]) => ({
    topic,
    evidence: evidence.flatMap((item, i) => {
      const haystack = ' ' + words(item.text).join(' ') + ' '
      const terms = [topic, ...keywords].filter((term, pos, all) => all.indexOf(term) === pos)
        .filter(term => uses(term, haystack))
      return terms.length ? [{ id: `E${i + 1}`, terms }] : []
    }),
  })).filter(hit => hit.evidence.length)
}

function related(hits) {
  return hits.flatMap(({ topic, evidence }) =>
    evidence.map(({ id }) => ({ from: id, to: topic, relation: 'contains-topic-cue' })))
}

const shortcuts = {
  'dialogue': ['speaker', 'claim', 'reply'],
  'argument-map': ['claim', 'premise', 'inference'],
  'proof-map': ['proposition', 'premise', 'dependency'],
  'chapter-map': ['chapter', 'witness', 'variant'],
  'timeline': ['year', 'event', 'source'],
  'historical-index': ['passage', 'context', 'edition'],
  'evidence-map': ['claim', 'evidence', 'warrant'],
  'graph': ['entity', 'relation', 'entity'],
}

function categorical(data) {
  const valid = s => Array.isArray(s) && s.length === 3 && ['A', 'E', 'I', 'O'].includes(s[0])
    && [s[1], s[2]].every(x => integer(x, 0, 2))
  const { premises, conclusion } = data
  need(Array.isArray(premises) && premises.length === 2 && premises.every(valid) && valid(conclusion),
    'Provide premises and conclusion as [A|E|I|O, subject index, predicate index] where terms are numbered 0–2.')
  const models = Array.from({ length: 8 }, (_, i) => i)
  function holds([kind, s, p], members) {
    const subjects = members.filter(x => x & (1 << s))
    const overlap = subjects.filter(x => x & (1 << p)).length
    return { A: overlap === subjects.length, E: overlap === 0, I: overlap > 0, O: overlap < subjects.length }[kind]
  }
  for (let mask = 1; mask < 256; mask++) {
    const members = models.filter(x => mask & (1 << x))
    if (premises.every(p => holds(p, members)) && !holds(conclusion, members)) {
      return { valid: false, model: 'Boolean categorical logic', countermodel: members.map(x => models.slice(0, 3).filter(i => x & (1 << i))) }
    }
  }
  return { valid: true, model: 'Boolean categorical logic' }
}

const operations = new Map([
  [20, ({ first, ratio, count }) => {
    need(numeric(first, -1e9, 1e9) && numeric(ratio, -0.999, 0.999) && integer(count, 1, 100), 'Set first, ratio in ±0.999, and count from 1 to 100.')
    const terms = Array.from({ length: count }, (_, i) => first * ratio ** i)
    return { terms, sum: terms.reduce((sum, n) => sum + n, 0), limit: first / (1 - ratio) }
  }],
  [21, ({ numerator, denominator }) => {
    need(numeric(numerator, 0.001, 1e6) && numeric(denominator, 0.001, 1e6), 'Set positive numerator and denominator.')
    return { ratio: numerator / denominator, cents: 1200 * Math.log2(numerator / denominator) }
  }],
  [28, categorical],
  [31, ({ p, q, form }) => {
    need(typeof p === 'boolean' && typeof q === 'boolean', 'Set Boolean p and q.')
    const forms = { ponens: [(!p || q) && p, q], tollens: [(!p || q) && !q, !p], 'disjunctive-syllogism': [(p || q) && !p, q] }
    need(Object.hasOwn(forms, form), 'Choose ponens, tollens, or disjunctive-syllogism.')
    const [premisesHold, conclusionHolds] = forms[form]
    return { form, premisesHold, conclusionHolds, counterexample: premisesHold && !conclusionHolds }
  }],
  [46, ({ affirmative, negative }) => {
    need(typeof affirmative === 'boolean' && typeof negative === 'boolean', 'Set Boolean affirmative and negative support separately.')
    return { quadrant: affirmative ? negative ? 'both' : 'affirmation' : negative ? 'negation' : 'neither', model: 'Independent evidence flags' }
  }],
  [66, ({ a, b, c }) => {
    need([a, b, c].every(n => numeric(n, -1e9, 1e9)), 'Set numeric a, b, c for a·x + b = c.')
    if (!a) return { solution: b === c ? 'all real numbers' : 'no solution' }
    return { isolated: c - b, divideBy: a, x: (c - b) / a }
  }],
  [72, ({ load, loadArm, effortArm }) => {
    need(numeric(load, 0, 1e8) && numeric(loadArm, 0, 1e8) && numeric(effortArm, 0.001, 1e8), 'Set load in newtons and loadArm and positive effortArm in metres.')
    return { loadMomentNm: load * loadArm, requiredEffortN: load * loadArm / effortArm, model: 'ideal static lever' }
  }],
  [74, ({ limit, distance, angle }) => {
    if (limit !== undefined) {
      need(integer(limit, 2, 10000), 'Set integer limit from 2 to 10000.')
      const composite = new Uint8Array(limit + 1)
      for (let i = 2; i * i <= limit; i++) if (!composite[i]) {
        for (let j = i * i; j <= limit; j += i) composite[j] = 1
      }
      return { limit, primes: Array.from({ length: limit - 1 }, (_, i) => i + 2).filter(i => !composite[i]) }
    }
    need(numeric(distance, 0.001, 1e6) && numeric(angle, 0.001, 180), 'Set positive distance and central angle in degrees.')
    return { circumference: distance * 360 / angle, distanceUnit: 'same as input' }
  }],
  [77, ({ width, height }) => {
    need(numeric(width, 0.001, 1e6) && numeric(height, 0.001, 1e6), 'Set positive width and height in the same unit.')
    return { widthToHeight: width / height, areaInSquareInputUnits: width * height }
  }],
  [81, ({ degrees }) => {
    need(Array.isArray(degrees) && degrees.length > 0 && degrees.length <= 36 && degrees.every(n => numeric(n, -360, 360)), 'Provide 1–36 angle values in degrees from −360 to 360.')
    return { sineTable: degrees.map(deg => ({ degrees: deg, sine: Math.sin(deg * Math.PI / 180) })) }
  }],
  [83, ({ numerator, denominator }) => {
    need(integer(numerator, 1, 1000) && integer(denominator, 2, 1000) && numerator < denominator,
      'Provide a positive proper fraction with integer numerator and denominator up to 1000.')
    let n = BigInt(numerator)
    let d = BigInt(denominator)
    const unitFractions = []
    while (n) {
      const v = (d + n - 1n) / n
      unitFractions.push(`1/${v}`)
      n = n * v - d
      d *= v
      let a = n
      let b = d
      while (b) [a, b] = [b, a % b]
      n /= a
      d /= a
      if (unitFractions.length === 12 && n) {
        return { unitFractions, exact: false, remainder: `${n}/${d}`, method: 'bounded greedy expansion' }
      }
    }
    return { unitFractions, exact: true, method: 'greedy expansion' }
  }],
  [90, ({ bits }) => {
    need(typeof bits === 'string' && /^[01]{8}$/.test(bits), 'Set bits to a string of eight 0s and 1s.')
    return { bits, index: Number.parseInt(bits, 2), indexing: 'zero-based binary convention' }
  }],
  [94, ({ stress }) => {
    need(typeof stress === 'string' && /^[01]{1,32}$/.test(stress), 'Set stress to a sequence where 1 is stressed and 0 is unstressed.')
    return { syllables: stress.length, trochaicTetrameterTemplate: '10101010', matchesTemplate: stress === '10101010' }
  }],
  [100, ({ events }) => {
    need(Array.isArray(events) && events.length <= 40 && events.every(e => plainObject(e) && integer(e.year, -3000, 1700) && e.year !== 0 &&
      human(e.label) && e.label.length <= 120 && (!e.source || typeof e.source === 'string' && e.source.length <= 180)),
      'Provide events with a year (negative for BCE, positive for CE), label, and optional source.')
    return { order: [...events].sort((a, b) => a.year - b.year).map(({ year, label, source }) => ({ year, label, source: source ?? null })) }
  }],
])

function analyze(module, input, byID) {
  const [id, , operation, task, axes] = module
  const evidence = input.evidence.length ? input.evidence : input.text ? [{ text: input.text }] : []
  const hits = index(module, evidence)
  const base = { operation, task, hits, coverage: coverage(hits), evidenceCount: evidence.length }
  if (input.data && operations.has(id)) {
    base.computation = operations.get(id)(input.data)
    base.coverage = 'computed'
  }
  if (['comparison','ethics-triangulation'].includes(operation)) {
    base.comparison = Object.keys(axes).map(topic => ({ topic, supporting: hits.find(x => x.topic === topic)?.evidence.map(x => x.id) ?? [] }))
  }
  if (operation.endsWith('-map') || operation.endsWith('graph') || ['graph','hierarchy','cross-reference'].includes(operation)) {
    base.relations = related(hits)
  }
  if (operation === 'elenchus') {
    base.questions = ['Which term in the claim needs a precise definition?', 'What observation would support the central premise?', 'What counterexample would change your conclusion?']
  }
  if (operation === 'control') {
    base.review = Object.keys(axes).map(topic => ({ topic, flagged: hits.some(hit => hit.topic === topic) }))
  }
  if (operation === 'bibliography' && input.text) {
    base.references = [{ name: 'Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu/' },
      { name: 'PhilPapers', url: 'https://philpapers.org/s/' + encodeURIComponent(input.text.slice(0, 100)) }]
  }
  if (operation === 'fallacy-check') {
    base.signals = hits.map(hit => ({ ...hit, status: 'surface-cue', check: 'Inspect the actual premise and conclusion before naming the inference.' }))
  }
  if (operation === 'proverb-match' && input.text) {
    const query = new Set(words(input.text))
    base.ranked = input.evidence.map(({ text }, i) => {
      const candidate = new Set(words(text))
      const overlap = [...query].filter(w => candidate.has(w)).length
      return { id: `E${i + 1}`, overlap }
    }).filter(item => item.overlap > 0).sort((a,b) => b.overlap - a.overlap)
  }
  if (operation === 'roundtable' || operation === 'wisdom-router') {
    const selected = operation === 'roundtable' ? [1, 32, 65, 69] : [4, 33, 26, 69]
    base.passes = selected.map(number => {
      const submodule = byID.get(number)
      const sub = analyze(submodule, input, byID)
      return { id: number, title: submodule[1], hits: sub.hits, coverage: sub.coverage, questions: sub.questions }
    })
  }
  if (shortcuts[operation]) base.fields = shortcuts[operation]
  return base
}

export function parseInput(input) {
  need(plainObject(input), 'Provide a JSON object.')
  const { text = '', evidence = [], data } = input
  need(typeof text === 'string' && text.length <= 3000, 'text must be a string up to 3000 characters.')
  need(Array.isArray(evidence) && evidence.length <= 12 && evidence.every(e => plainObject(e) && human(e.text) &&
    e.text.length <= 1500 && (e.locator === undefined || typeof e.locator === 'string' && e.locator.length <= 240)),
    'Provide no more than 12 evidence items with text (up to 1500 characters) and optional locator.')
  need(data === undefined || plainObject(data), 'data must be an object.')
  return { text, evidence, data }
}

export function run(module, mode, input, byID) {
  const descriptor = describe(module)
  const result = analyze(module, input, byID)
  const evidence = (input.evidence.length ? input.evidence : input.text ? [{ text: input.text }] : [])
    .map(({ locator }, i) => ({ id: `E${i + 1}`, locator: locator ?? null, origin: input.evidence.length ? 'caller-evidence' : 'caller-text' }))
  if (mode === 'bot') {
    return { descriptor, mode, evidence, card: {
      activity: descriptor.task,
      topics: result.hits.map(hit => hit.topic),
      evidence: result.hits,
      questions: result.questions ?? [`Which supplied passage best supports an interpretation of ${descriptor.topics[0]}?`, 'What part of that interpretation remains uncertain?'],
      computation: result.computation,
      passes: result.passes,
    } }
  }
  if (mode === 'agent') {
    return { descriptor, mode, evidence, workflow: [
      { step: 'select-module', id: descriptor.id, operation: descriptor.operation },
      { step: result.computation === undefined ? 'index-evidence' : 'calculate', evidenceCount: result.evidenceCount, coverage: result.coverage },
      { step: 'review', matchedTopics: result.hits.length, locatorsProvided: evidence.filter(item => item.locator).length, branches: result.passes?.map(p => p.id) ?? [] },
    ], result }
  }
  return { descriptor, mode, evidence, result }
}
