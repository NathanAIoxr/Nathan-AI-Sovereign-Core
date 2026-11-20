import { sha256 } from "./refinery.mjs";

export const cleanupTypes = {
  Cleanup: [
    { name: "jobKey", type: "bytes32" },
    { name: "receiptHash", type: "bytes32" },
    { name: "recipient", type: "address" },
    { name: "coins", type: "uint256" },
    { name: "expiresAt", type: "uint256" }
  ]
};

export function cleanupDomain(chainId, verifyingContract) {
  return { name: "The Cryptocurrency Pooper", version: "1", chainId, verifyingContract };
}

// Call from a verifier-controlled process only after independent review.
export async function signVerifiedCleanup(signer, domain, result, expiresAt) {
  const { receipt, receiptHash } = result;
  if (receiptHash !== await sha256(receipt)) throw new Error("Receipt hash does not match");
  if (!Number.isSafeInteger(receipt.candidateCoins) || receipt.candidateCoins <= 0) throw new Error("No eligible coins");
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) throw new Error("Invalid expiry");

  const claim = {
    jobKey: receipt.jobKey,
    receiptHash,
    recipient: receipt.wallet,
    coins: receipt.candidateCoins,
    expiresAt
  };
  return { claim, signature: await signer.signTypedData(domain, cleanupTypes, claim) };
}

export function submitCleanup(contract, { claim, signature }) {
  return contract.settle(claim.jobKey, claim.receiptHash, claim.recipient, claim.coins, claim.expiresAt, signature);
}
