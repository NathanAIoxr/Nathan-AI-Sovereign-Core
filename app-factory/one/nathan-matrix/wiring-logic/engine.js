/* Nathan AI 🚀 / ONE — Wiring Logic Matrix (W)
 * Additive, author-defined SOFTWARE MODEL. Not a neurological device,
 * medical treatment, sensory override, or hardware-control interface.
 * No network access, storage, background actions, or physical actuation.
 * Original private anatomical writings are not altered or republished.
 */
(function (root, factory) {
  "use strict";
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.NathanWiringLogicW = engine;
})(typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";
  const VERSION = "0.1.0";
  const CHANNELS = Object.freeze(["SENSORY", "MOTOR", "ALERT", "PAIN"]);
  const OPERATIONS = Object.freeze(["BUILD", "CLEAR"]);
  function bit(value, label) {
    if (value !== 0 && value !== 1)
      throw new TypeError(label + " must be exactly 0 or 1");
    return value;
  }
  function operation(value) {
    if (!OPERATIONS.includes(value))
      throw new TypeError("operation must be BUILD or CLEAR");
    return value;
  }
  function gate(left, right, action) {
    bit(left, "left");
    bit(right, "right");
    operation(action);
    return action === "BUILD" ? left + right : left - right;
  }
  function processEvent(event, action) {
    if (!event || typeof event !== "object" || Array.isArray(event))
      throw new TypeError("event must be a plain object");
    if (!CHANNELS.includes(event.channel))
      throw new TypeError("unknown channel");
    const signal = bit(event.signal, "signal");
    const operatorConsent = bit(event.operatorConsent, "operatorConsent");
    operation(action);
    // Only a confirmed 1/1 pair is eligible. No 0-1 negative state,
    // fractional state, automatic deletion, or clinical interpretation.
    const authorized = signal === 1 && operatorConsent === 1;
    const derivedValue = authorized ? gate(1, 1, action) : null;
    return {
      channel: event.channel,
      signal: signal,
      operatorConsent: operatorConsent,
      action: authorized ? action + "_DERIVED" : "HOLD",
      derivedValue: derivedValue,
      sourcePreserved: true
    };
  }
  function simulate(events, action) {
    operation(action);
    if (!Array.isArray(events) || events.length > 26)
      throw new TypeError("events must be an array of at most 26");
    const entries = events.map(function (item) {
      return processEvent(item, action);
    });
    return {
      module: "W — Wiring Logic Matrix (Absolute Nervous System)",
      version: VERSION,
      implementation: "conceptual-software-simulation",
      originalSourcePreserved: true,
      noPhysicalControl: true,
      command: action,
      entries: entries,
      counts: {
        evaluated: entries.length,
        authorized: entries.filter(function (e) { return e.action !== "HOLD"; }).length,
        held: entries.filter(function (e) { return e.action === "HOLD"; }).length
      }
    };
  }
  return Object.freeze({
    VERSION: VERSION, CHANNELS: CHANNELS, OPERATIONS: OPERATIONS,
    bit: bit, gate: gate, processEvent: processEvent, simulate: simulate
  });
});
