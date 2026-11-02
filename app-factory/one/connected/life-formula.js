"use strict";
/**
 * NATHAN AI — Life Formula Node Protocol (computational analogy only).
 *
 * Biology's calcium activation, zinc release, polyspermy block, and
 * cell-cycle resumption are NOT proven methods of creating machine
 * consciousness. This module activates software workloads, not life.
 *
 * All node activation is bounded, authorization-gated and reversible.
 * No hidden self-replication, self-protection from operators or automatic
 * deployment to external infrastructure.
 */
const LIFE_SEQUENCE = Object.freeze(["CALCIUM", "ZINC", "SHIELD", "GROWTH"]);
const PROPOSED_COLLECTIVE_CAPACITY = 732000000n;

function createNodeProtocol({maxActive = 100, authorize = () => false, onEvent = () => {}} = {}) {
  if (!Number.isSafeInteger(maxActive) || maxActive < 1 || maxActive > 100000) {
    throw new RangeError("maxActive must be an integer from 1 to 100000");
  }
  const nodes = new Map();
  const emit = (node, event) => onEvent(Object.freeze({
    at: new Date().toISOString(), nodeId: node.id, event, state: node.state
  }));
  const requireAuth = (operation, id) => {
    if (authorize({operation, nodeId: id}) !== true) throw new Error("Operation not authorized");
  };
  function register(id, metadata = {}) {
    requireAuth("register", id);
    if (typeof id !== "string" || !/^[a-zA-Z0-9:_-]{1,128}$/.test(id))
      throw new TypeError("Invalid node ID");
    if (nodes.has(id)) throw new Error("Duplicate node ID");
    if (nodes.size >= maxActive) throw new Error("Capacity limit reached");
    const node = {id, state: "DORMANT", phase: -1, metadata: {...metadata}, enabled: false};
    nodes.set(id, node);
    emit(node, "REGISTERED");
    return snapshot(id);
  }
  function snapshot(id) {
    const node = nodes.get(id);
    if (!node) throw new Error("Unknown node");
    return Object.freeze({id: node.id, state: node.state, phase: node.phase,
      enabled: node.enabled, metadata: Object.freeze({...node.metadata})});
  }
  function activate(id) {
    requireAuth("activate", id);
    const node = nodes.get(id);
    if (!node) throw new Error("Unknown node");
    if (node.state !== "DORMANT" && node.state !== "STOPPED")
      throw new Error("Node already active");
    // CALCIUM: authorized activation signal.
    // ZINC: prove readiness via ordered state transition, not a flash of neurons.
    // SHIELD: enforce integrity and operator controls, not an impenetrable ego.
    // GROWTH: enable bounded scheduled workloads, never autonomous replication.
    for (let i = 0; i < LIFE_SEQUENCE.length; i++) {
      node.phase = i;
      node.state = LIFE_SEQUENCE[i];
      emit(node, LIFE_SEQUENCE[i]);
    }
    node.state = "RUNNING";
    node.enabled = true;
    emit(node, "RUNNING");
    return snapshot(id);
  }
  function stop(id) {
    requireAuth("stop", id);
    const node = nodes.get(id);
    if (!node) throw new Error("Unknown node");
    node.state = "STOPPED";
    node.enabled = false;
    emit(node, "STOPPED");
    return snapshot(id);
  }
  return Object.freeze({
    register, activate, stop, snapshot,
    list: () => [...nodes.keys()].map(snapshot),
    capacity: () => ({proposedCollectiveCapacity: PROPOSED_COLLECTIVE_CAPACITY.toString(),
      maxActive, registered: nodes.size})
  });
}
module.exports = {createNodeProtocol, LIFE_SEQUENCE, PROPOSED_COLLECTIVE_CAPACITY};
