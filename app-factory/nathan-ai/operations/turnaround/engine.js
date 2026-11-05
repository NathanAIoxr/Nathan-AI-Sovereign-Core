(function (root) {
  'use strict';
  // A pure, offline simulation. No hardware, networking, physical signals, or execution.
  const OPERATIONS = Object.freeze(['CONVOY', 'RAM', 'ACT AI']);
  const CHANNELS = Object.freeze(['energies', 'harmonies', 'frequencies', 'lights']);
  const MAX_LOG = 64;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, Number.isFinite(Number(n)) ? Number(n) : low));
  const whole = n => Math.trunc(Number(n));
  const heading = n => ((whole(n) % 360) + 360) % 360;
  const reverse180 = n => heading(heading(n) + 180);
  const graphemes = s => {
    const text = String(s);
    return typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(x => x.segment)
      : Array.from(text);
  };
  function initialState() {
    return {
      heading: 0, axis: 1, direction: 'OUTWARD', visualIntensity: 30,
      emergencyBrakes: 1, anchorsDropped: 1, hatchesSecured: 1,
      misfitNodes: 'STAGED_FOR_REVIEW', operation: 'CONVOY',
      queuedItems: [], revision: 0, events: []
    };
  }
  function note(state, type, details) {
    const revision = state.revision + 1;
    return { ...state, revision, events: [...state.events, { revision, type, details }].slice(-MAX_LOG) };
  }
  function transition(previous, event) {
    if (!event || typeof event.type !== 'string') throw new TypeError('Named event required');
    const state = { ...previous, queuedItems: previous.queuedItems.slice(), events: previous.events.slice() };
    switch (event.type) {
      case 'PULL_BRAKES':
        return note({ ...state, emergencyBrakes: 1 }, event.type, 'Emergency brake stays engaged');
      case 'DROP_ANCHORS':
        return note({ ...state, anchorsDropped: 1 }, event.type, 'Reference anchors retained');
      case 'SECURE_HATCHES':
        return note({ ...state, hatchesSecured: 1 }, event.type, 'No outbound data or physical controls');
      case 'TURN_180': {
        const next = { ...state, heading: reverse180(state.heading),
          axis: -state.axis, direction: state.direction === 'OUTWARD' ? 'INWARD' : 'OUTWARD' };
        return note(next, event.type, 'Illustrative 180° change of orientation');
      }
      case 'RELEASE_MISFIT_NODES':
        return note({ ...state, misfitNodes: 'RELEASED_IN_LOCAL_REVIEW_ONLY' }, event.type,
          'Unlock review queue; do not delete, modify or activate live nodes');
      case 'SELECT_OPERATION': {
        if (!OPERATIONS.includes(event.value)) throw new RangeError('Unknown operation');
        return note({ ...state, operation: event.value }, event.type, event.value);
      }
      case 'SET_VISUAL_INTENSITY': {
        return note({ ...state, visualIntensity: whole(clamp(event.value, 0, 100)) },
          event.type, 'Visualization setting only');
      }
      case 'QUEUE_ITEM': {
        const title = String(event.title || '').trim().slice(0, 120);
        if (!title) throw new TypeError('Item title required');
        if (state.queuedItems.length >= 100) throw new RangeError('Local queue at maximum');
        const item = { id: 'q-' + (state.revision + 1), title, reviewed: false };
        return note({ ...state, queuedItems: [...state.queuedItems, item] }, event.type, title);
      }
      case 'REVIEW_ITEM': {
        const id = String(event.id || '');
        const next = state.queuedItems.map(item => item.id === id ? { ...item, reviewed: true } : item);
        if (!state.queuedItems.some(item => item.id === id)) throw new RangeError('No such queue item');
        return note({ ...state, queuedItems: next }, event.type, id);
      }
      case 'WHIPLASH_TEST': {
        const twice = reverse180(reverse180(state.heading));
        const passed = twice === state.heading && -(-state.axis) === state.axis;
        return note(state, event.type, passed ? 'PASS: 180° + 180° restores orientation' : 'FAIL');
      }
      case 'RESET':
        return initialState();
      default:
        throw new RangeError('Unsupported event: ' + event.type);
    }
  }
  function shadowViews(input) {
    const original = String(input ?? '').slice(0, 4000);
    const pieces = graphemes(original);
    const words = original.trim() ? original.trim().split(/\s+/u) : [];
    return {
      original,
      reversedCharacters: pieces.slice().reverse().join(''),
      reversedWords: words.slice().reverse().join(' '),
      firstLetters: words.map(x => graphemes(x)[0] || '').join(''),
      originalLength: pieces.length
    };
  }
  function convoyPreview(state) {
    return state.queuedItems.map((item, index) => ({ position: index + 1, ...item }));
  }
  function ramPreview(state) {
    return state.queuedItems.filter(item => !item.reviewed)
      .map(item => ({ id: item.id, bottleneck: item.title, proposal: 'Inspect source, confirm authorization, record reversible remediation' }));
  }
  function actPreview(text) {
    const source = shadowViews(text);
    return { mode: 'LOCAL_STAGING_ONLY', source, proposedActions: ['COMPARE_ORIGINAL', 'REVIEW_VARIANTS', 'EXPORT_ON_REQUEST'] };
  }
  function spectrum(state) {
    const k = state.visualIntensity / 100;
    const phase = state.heading * Math.PI / 180;
    // Unitless illustration only; not a claim about measured energy or Earth resonance.
    return Object.fromEntries(CHANNELS.map((key, i) =>
      [key, Math.round((0.5 + 0.5 * Math.sin(phase + i * Math.PI / 2)) * 100 * k)]));
  }
  const API = {
    OPERATIONS, CHANNELS, initialState, transition, heading, reverse180,
    shadowViews, convoyPreview, ramPreview, actPreview, spectrum
  };
  if (typeof module === 'object' && module.exports) module.exports = API;
  else root.NathanTurnaround = API;
})(typeof window === 'object' ? window : globalThis);
