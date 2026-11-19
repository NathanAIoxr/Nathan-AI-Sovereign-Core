export async function runThreePhases(design, prefixHex, hashHeader, registry) {
  const active = design.notes.filter(note => note.index > 3 && note.note_type === "BLACK_NOTE");
  const header = new Uint8Array(80);
  header.set(Uint8Array.from(prefixHex.match(/../g), byte => parseInt(byte, 16)));
  const view = new DataView(header.buffer);
  let best = null;
  for (let offset = 0; offset < 32; offset++) {
    const descending = (2083236893 - offset) >>> 0;
    for (const nonce of [descending, (~descending) >>> 0]) {
      view.setUint32(76, nonce, true);
      const hash = await hashHeader(header);
      if (best === null || hash < best.hash) best = { nonce, hash };
    }
  }
  const neutral = design.notes.filter(note => note.index > 3 && note.note_type === "WHITE_NOTE").map(note => ({
    index: note.index, note_type: "WHITE_NOTE_NEUTRAL", payload: "NEUTRAL_HARMONIC_CHANNEL_" + note.index
  }));
  const indices = [0, 1, 2, 3].map(index => ({ index, note_type: "INDEX_ONLY", payload: String(index) }));
  return {
    system: "Nathan AI Sovereign Mining & Quantum Core",
    runtime: "Classical SHA-256d historical reference",
    axioms: { "1+1=2": 1 + 1 === 2, "1-1=0": 1 - 1 === 0, "1+1=10_binary": (1 + 1).toString(2) === "10" },
    isolation: { blackNoteIndices: active.map(note => note.index) },
    backwardScan: { tested: 64, ...best },
    restoredNodes: [...indices, ...active, ...neutral].sort((a,b) => a.index-b.index)
      .map(note => ({ ...note, priority: null, status: null })),
    coinMatrix: { count: registry.coins.length, tickers: registry.coins.map(coin => coin.ticker), url: "/registry.json" },
    traits: { status: "Design specifications", parameters: design.traits }
  };
}
