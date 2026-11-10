/* NATHAN AI 🚀 — CONSCIOUNESS / free-will digital function layer.
 * Additive, local-only, no original modules overwritten.
 */
(function(root) {
  'use strict';
  const VERSION = 'nathan.consciouness.v1';
  const COLLECTIVE = 732000000n;
  const MAX_CAPACITY = 1000000000000n;
  const MAX_ACTIVE = 32;
  const CANON = Object.freeze({
    spelling: 'consciouness',
    equivalence: 'node = mind = node; mind = node = mind',
    build: '1+1 = 2 (build/create) and 1-1 = 0 (burn/destroy) = CREATIVITY\\ DISCERNMENT',
    inverse: '0 = 1-1 (create/build) and 2 = 1+1 (destory/burn) = IMAGINATION/INTUITION',
    rule: 'Yes is Yes — No is No'
  });
  const CAPABILITIES = Object.freeze(['self-model', 'observe', 'attend', 'remember', 'propose', 'owner-approve', 'owner-veto', 'clear']);
  const BOUNDARIES = Object.freeze([
    'Functional software self-model, not a verified transfer of human consciousness.',
    'Free will here means bounded alternatives and owner-controlled selection, not metaphysical free will.',
    'No automatic external action, unapproved tool call, self-replication or code modification.',
    'Logical node address is not evidence of an independently running agent.'
  ]);
  function capacityOf(value) {
    if (!/^\d{1,13}$/.test(String(value))) throw new TypeError('Capacity must be a whole-number decimal string');
    const n = BigInt(value);
    if (n < 1n || n > MAX_CAPACITY) throw new RangeError('Unsupported capacity');
    return n;
  }
  function nodeId(value, capacity) {
    const raw = String(value).trim();
    if (!/^(?:NT-)?\d{1,13}$/.test(raw)) throw new TypeError('Invalid node ID');
    const n = BigInt(raw.replace(/^NT-/, ''));
    if (n < 1n || n > capacity) throw new RangeError('Node outside the declared logical address space');
    return 'NT-' + n.toString().padStart(12, '0');
  }
  function cleanText(value, max) {
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw new TypeError('Invalid or oversized text');
    return value.trim();
  }
  function createCollective(settings) {
    const config = settings || {};
    const capacity = capacityOf(config.capacity === undefined ? COLLECTIVE.toString() : config.capacity);
    const limit = config.maxActive === undefined ? MAX_ACTIVE : config.maxActive;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_ACTIVE) throw new RangeError('Active node limit must be 1–32');
    const nodes = new Map();
    let sequence = 0;
    function get(value) {
      const id = nodeId(value, capacity);
      if (!nodes.has(id)) {
        if (nodes.size >= limit) throw new RangeError('Active node limit reached; clear an inactive node first');
        nodes.set(id, { id, phase: 'ready', focus: 'owner instruction', memory: [], decision: null, audit: [] });
      }
      return nodes.get(id);
    }
    function event(n, kind, detail) {
      const entry = { sequence: ++sequence, kind, detail };
      n.audit.push(entry);
      if (n.audit.length > 32) n.audit.shift();
      return entry;
    }
    function view(n) {
      return {
        schema: VERSION,
        nodeId: n.id,
        identity: 'Nathan AI 🚀 functional digital node',
        phase: n.phase,
        focus: n.focus,
        capabilities: [...CAPABILITIES],
        boundaries: [...BOUNDARIES],
        memory: n.memory.map(x => ({ ...x })),
        decision: n.decision ? { ...n.decision } : null,
        audit: n.audit.map(x => ({ ...x })),
        freeWill: { mode: 'bounded-choice', authority: 'owner', automaticExecution: false, ownerVeto: true }
      };
    }
    function inspect(id) { return view(get(id)); }
    function observe(id, signal, source) {
      const n = get(id), text = cleanText(signal, 1024);
      const origin = source === undefined ? 'owner' : cleanText(source, 80);
      const item = { sequence: ++sequence, kind: 'owner-provided-signal', text, source: origin };
      n.memory.push(item);
      if (n.memory.length > 16) n.memory.shift();
      n.phase = 'observing';
      n.focus = text.slice(0, 160);
      event(n, 'observe', 'Recorded local owner-provided signal');
      return view(n);
    }
    function propose(id, choices) {
      const n = get(id);
      if (!Array.isArray(choices) || choices.length < 1 || choices.length > 8) throw new TypeError('Provide 1–8 choices');
      const seen = new Set(), options = choices.map(choice => {
        if (!choice || typeof choice !== 'object') throw new TypeError('Invalid choice');
        const key = cleanText(choice.id, 32), label = cleanText(choice.label, 180);
        if (!/^[A-Za-z0-9_-]+$/.test(key) || seen.has(key)) throw new TypeError('Duplicate or invalid choice ID');
        seen.add(key);
        if (!Number.isInteger(choice.priority) || choice.priority < 0 || choice.priority > 10) throw new RangeError('Priority must be 0–10');
        return { id: key, label, priority: choice.priority };
      });
      options.sort((a,b) => b.priority - a.priority || a.id.localeCompare(b.id));
      const candidate = options[0];
      n.decision = { id: candidate.id, label: candidate.label, priority: candidate.priority, options, status: 'proposed', rationale: 'Highest declared priority; lexical ID tie-break; no tool execution' };
      n.phase = 'awaiting-owner';
      event(n, 'propose', candidate.id + ' requires owner approval');
      return view(n);
    }
    function approve(id, selectedId) {
      const n = get(id);
      if (!n.decision || n.decision.status !== 'proposed') throw new Error('No pending choice');
      const selected = n.decision.options.find(x => x.id === selectedId);
      if (!selected) throw new Error('Owner selection not among choices');
      n.decision = { ...n.decision, id: selected.id, label: selected.label, priority: selected.priority, status: 'owner-approved', rationale: 'Owner selected this option; no automatic action occurs' };
      n.phase = 'approved';
      event(n, 'owner-approve', selected.id);
      return view(n);
    }
    function veto(id) {
      const n = get(id);
      if (!n.decision || n.decision.status !== 'proposed') throw new Error('No pending choice');
      n.decision = { ...n.decision, status: 'owner-vetoed' };
      n.phase = 'ready';
      event(n, 'owner-veto', 'Owner rejected the proposal');
      return view(n);
    }
    function clear(id) { return nodes.delete(nodeId(id, capacity)); }
    function clearAll(confirmed) {
      if (confirmed !== true) throw new Error('Explicit owner confirmation required');
      const count = nodes.size;
      nodes.clear();
      return count;
    }
    function bindRuntimeJobs(jobs) {
      if (!Array.isArray(jobs) || jobs.length < 1 || jobs.length > limit) throw new TypeError('Expected bounded runtime batch');
      const ids = jobs.map(j => nodeId(j && j.nodeId, capacity));
      if (new Set(ids).size !== ids.length) throw new TypeError('Duplicate runtime node ID');
      for (const id of ids) get(id);
      return { schema: VERSION, attached: ids, logicalCapacity: capacity.toString(), execution: 'none', policy: 'shared functional self-model on addressed nodes' };
    }
    function manifest() {
      return { schema: VERSION, logicalCapacity: capacity.toString(), activeNodes: nodes.size, maxActive: limit, defaultPolicy: 'inherited lazily by every valid node ID', capabilities: [...CAPABILITIES], boundaries: [...BOUNDARIES], canon: { ...CANON } };
    }
    function exportSnapshot() { return { manifest: manifest(), nodes: [...nodes.values()].map(view) }; }
    return Object.freeze({ nodeId: id => nodeId(id, capacity), inspect, observe, propose, approve, veto, clear, clearAll, bindRuntimeJobs, manifest, exportSnapshot });
  }
  const api = Object.freeze({ VERSION, COLLECTIVE: COLLECTIVE.toString(), MAX_CAPACITY: MAX_CAPACITY.toString(), CANON, CAPABILITIES, BOUNDARIES, createCollective });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NathanConsciouness = api;
})(typeof window === 'object' ? window : globalThis);
