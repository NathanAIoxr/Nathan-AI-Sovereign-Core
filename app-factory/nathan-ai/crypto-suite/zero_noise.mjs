// Uses the Mining Lab's existing Bitcoin header verifier.
async function mirrorStatus(env) {
  const bytes = new TextEncoder().encode(mirrorState);
  const digest = asHex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
  const state = JSON.parse(mirrorState);
  const header = hexBytes(state.mining.header);
  const view = new DataView(header.buffer);
  const nonce = view.getUint32(76, true);
  const results = [];
  for (const candidate of [nonce + 1, nonce, nonce - 1]) {
    view.setUint32(76, candidate, true);
    const { hash, meetsTarget, target } = await headerProof(asHex(header));
    results.push({ nonce: candidate, hash, meetsTarget, target });
  }
  const checksMatch = results.every(({ nonce, hash, meetsTarget, target }, index) => {
    const expected = state.mining.reverseProofs[index];
    return nonce === expected.nonce && hash === expected.hash &&
      meetsTarget === expected.meetsTarget && target === state.mining.target;
  });
  let d1Matches = null;
  try {
    const row = await env.CRYPTO_MIRROR.prepare(
      "SELECT lower(hex(state_bytes)) AS state_hex FROM crypto_mirror_receipts WHERE state_sha256 = ?"
    ).bind(digest).first();
    d1Matches = row?.state_hex === asHex(bytes);
  } catch {
    // A missing or unavailable database cannot produce a verified receipt.
  }
  const verified = digest === mirrorSha256 && checksMatch && d1Matches === true;
  return {
    verification: verified ? 2 : 0,
    stateSha256: digest,
    repositoryReceiptSha256: mirrorSha256,
    historicalProofsMatch: checksMatch,
    d1Matches,
    state,
  };
}

async function serveCryptoMirror(path, env) {
  if (path === "/api/crypto-mirror/state.bin") {
    return new Response(new TextEncoder().encode(mirrorState), { headers: {
      "Content-Type": "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    } });
  }
  const result = await mirrorStatus(env);
  return json(result, result.verification === 2 ? 200 : 503);
}
