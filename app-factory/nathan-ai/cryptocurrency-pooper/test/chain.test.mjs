import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createRequire } from "node:module";
import { BrowserProvider, ContractFactory, Wallet } from "ethers";
import ganache from "ganache";
import solc from "solc";
import { demoFeedstock, demoJob, refineBatch, sha256 } from "../refinery.mjs";
import { cleanupDomain, signVerifiedCleanup, submitCleanup } from "../settlement.mjs";

const require = createRequire(import.meta.url);
const filename = "CryptocurrencyPooper.sol";

function compile() {
  const input = {
    language: "Solidity",
    sources: { [filename]: { content: readFileSync(new URL("../contracts/" + filename, import.meta.url), "utf8") } },
    settings: { evmVersion: "shanghai", outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), {
    import(path) {
      return { contents: readFileSync(require.resolve(path), "utf8") };
    }
  }));
  assert.deepEqual(output.errors?.filter(error => error.severity === "error") ?? [], []);
  return output.contracts[filename].CryptocurrencyPooper;
}

test("a verifier-authorized batch mints once to its wallet on a local EVM", { timeout: 30000 }, async t => {
  const vm = ganache.provider({ chain: { chainId: 31337, hardfork: "shanghai" }, logging: { quiet: true } });
  const provider = new BrowserProvider(vm);
  t.after(async () => {
    await provider.destroy();
    await vm.disconnect();
  });
  const relayer = await provider.getSigner();
  const verifier = Wallet.createRandom();
  const otherSigner = Wallet.createRandom();
  const specimen = await refineBatch(demoJob, demoFeedstock);
  const cap = specimen.receipt.candidateCoins;
  const { abi, evm } = compile();
  const factory = new ContractFactory(abi, evm.bytecode.object, relayer);
  const coin = await factory.deploy(verifier.address, cap);
  await coin.waitForDeployment();
  const domain = cleanupDomain(31337, await coin.getAddress());
  const now = (await provider.getBlock("latest")).timestamp;
  const voucher = await signVerifiedCleanup(verifier, domain, specimen, now + 3600);
  const expired = await signVerifiedCleanup(verifier, domain, specimen, now - 60);
  const forged = await signVerifiedCleanup(otherSigner, domain, specimen, now + 3600);
  const wrongChain = await signVerifiedCleanup(verifier, { ...domain, chainId: 31338 }, specimen, now + 3600);
  const badAmount = { ...voucher, claim: { ...voucher.claim, coins: cap - 1 } };
  const confirm = async voucher => (await submitCleanup(coin, voucher)).wait();
  for (const invalid of [expired, forged, wrongChain, badAmount]) {
    await assert.rejects(confirm(invalid));
  }
  const confirmation = await confirm(voucher);
  assert.equal(confirmation.status, 1);
  assert.equal(await coin.balanceOf(demoJob.wallet), BigInt(cap));
  assert.equal(await coin.totalSupply(), BigInt(cap));
  assert.equal(await coin.settledJob(specimen.receipt.jobKey), true);
  assert.equal(await coin.settledReceipt(specimen.receiptHash), true);
  await assert.rejects(confirm(voucher));
  const revisedReceipt = { ...specimen.receipt, job: "rerun-of-the-same-window" };
  const revised = { receipt: revisedReceipt, receiptHash: await sha256(revisedReceipt) };
  await assert.rejects(confirm(await signVerifiedCleanup(verifier, domain, revised, now + 3600)));
  const laterWindow = { ...demoJob, window: "sample-002" };
  const fresh = await refineBatch(laterWindow, { ...demoFeedstock, window: laterWindow.window });
  await assert.rejects(confirm(await signVerifiedCleanup(verifier, domain, fresh, now + 3600)));
  assert.equal(await coin.settledJob(fresh.receipt.jobKey), false);
  assert.equal(await coin.totalSupply(), BigInt(cap));
  console.log("Local settlement minted " + cap + " POOPER to " + demoJob.wallet);
});
