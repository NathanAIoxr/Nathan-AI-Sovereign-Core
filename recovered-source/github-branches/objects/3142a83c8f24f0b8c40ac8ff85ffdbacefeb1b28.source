/* Nathan AI 🚀 — Distributed Ledger & Computational Conspectus
 * Derived educational index. Original author source is in ORIGINAL_AUTHOR_SOURCE.md.
 * Nothing here performs mining, staking, investing, or wallet actions.
 */
(function(root, factory) {
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  if(root) root.NathanLedger21=api;
})(typeof globalThis!=="undefined"?globalThis:null,function(){
"use strict";
const records=[
{n:1,group:"Asset Layer",title:"Bitcoin / BTC",epithet:"The Sovereign Store",summary:"Peer-to-peer proof-of-work digital currency with a consensus-enforced issuance schedule.",note:"Bitcoin's subsidy halves every 210,000 blocks. Maximum issuance is slightly under 21 million BTC because rewards truncate to whole satoshis; it is not exactly 21,000,000 minted.",source:"https://bitcoin.org/en/halving"},
{n:2,group:"Asset Layer",title:"Ethereum / ETH",epithet:"The Programmable State Machine",summary:"Smart-contract execution with an EVM and proof-of-stake validators.",note:"EIP-1559 burns the base fee. Ethereum switched off mining with The Merge in September 2022; ETH supply is not fixed.",source:"https://ethereum.org/roadmap/merge/"},
{n:3,group:"Asset Layer",title:"Solana / SOL",epithet:"The High-Velocity Monolith",summary:"High-throughput network combining proof-of-stake consensus, proof-of-history sequencing and parallel execution.",note:"Proof of History supplies a verifiable ordering clock, not standalone consensus or a guarantee of instantaneous transaction finality.",source:"https://solana.com/developers/cookbook/transactions/confirmation"},
{n:4,group:"Asset Layer",title:"XRP / XRP Ledger",epithet:"The Institutional Settlement Hub",summary:"A public settlement ledger using a validator agreement protocol, without proof-of-work mining.",note:"XRPL uses validator trust lists (UNLs); consensus is not delegated to a single universally trusted federation, and Ripple is a company distinct from the public XRPL.",source:"https://xrpl.org/docs/concepts/consensus-protocol"},
{n:5,group:"Asset Layer",title:"BNB / BNB Chain",epithet:"The Ecosystem Fuel",summary:"Native utility asset used for BNB Chain activity, fees and applications.",note:"Quarterly Auto-Burn targets 100 million total supply and is calculated from BNB price and BSC block generation, not centralized exchange trading volume.",source:"https://www.bnbchain.org/en/blog/35th-bnb-burn"},
{n:6,group:"Asset Layer",title:"Chainlink / LINK",epithet:"The Cryptographic Oracle",summary:"Oracle infrastructure brings external information and computing services to smart-contract systems.",note:"Staking and slashing currently secure selected oracle services; they are not prerequisites for every Chainlink data submission.",source:"https://chain.link/economics/staking"},
{n:7,group:"Asset Layer",title:"Monero / XMR",epithet:"The Absolute Anonymity Vector",summary:"Privacy-oriented proof-of-work network hiding ordinary on-chain senders, recipients and transferred amounts.",note:"Strong default transaction privacy does not guarantee perfect anonymity against leaked keys, compromised devices or off-chain identification.",source:"https://web.getmonero.org/get-started/faq/"},
{n:8,group:"Mining Rigs",title:"ASIC Mining",epithet:"The Industrial Standard",summary:"Application-specific silicon optimized for one or a limited set of proof-of-work algorithms.",note:"Efficiency varies by algorithm, manufacturing generation, cooling, firmware and real power draw; SHA-256 hardware does not mine arbitrary coins.",source:"https://bitcoin.org/en/halving"},
{n:9,group:"Mining Rigs",title:"GPU Mining",epithet:"The Adaptable Array",summary:"Programmable parallel graphics processors for selected proof-of-work coin algorithms.",note:"Profitability depends on algorithm support, power and market conditions. Ethereum mainnet cannot be GPU-mined after The Merge.",source:"https://ethereum.org/developers/docs/consensus-mechanisms/pow/mining/"},
{n:10,group:"Mining Rigs",title:"CPU Mining",epithet:"The Desktop Invariant",summary:"General-purpose computer processing for CPU-oriented proof-of-work algorithms.",note:"Some networks such as Monero target broad CPU participation; none can promise permanent ASIC resistance or profitable home mining.",source:"https://web.getmonero.org/get-started/faq/"},
{n:11,group:"Mining Rigs",title:"FPGA Mining",epithet:"The Hybrid Bridge",summary:"Reprogrammable hardware logic for compatible proof-of-work workloads.",note:"Requires compatible bitstreams and advanced hardware engineering; reconfiguration does not make every algorithm economical.",source:"https://bitcoin.org/en/halving"},
{n:12,group:"Mining Rigs",title:"Cloud Mining",epithet:"The Remote Allocation Contract",summary:"A contract for remote mining capacity rather than owning and operating equipment.",note:"Counterparty, custody, contract, maintenance, payout and fraud risk remain; advertised returns must never be treated as guaranteed.",source:"https://www.investor.gov/protect-your-investments/fraud/types-fraud/crypto-investment-scams"},
{n:13,group:"Mining Rigs",title:"Solo Mining",epithet:"The High-Risk Jackpot",summary:"Independently attempts to produce valid proof-of-work blocks.",note:"Block discovery is probabilistic. A successful miner may keep eligible block rewards and fees, subject to protocol rules, orphan risk and operating expenses.",source:"https://bitcoin.org/en/halving"},
{n:14,group:"Mining Rigs",title:"Pool Mining",epithet:"The Structured Cooperative",summary:"Multiple miners contribute hash power to a jointly coordinated block-production effort.",note:"Payout formulas differ among PPS, FPPS, PPLNS and other schemes; fees, custody and pool concentration matter.",source:"https://bitcoin.org/en/halving"},
{n:15,group:"Consensus & Architecture",title:"Proof of Work / PoW",epithet:"The Thermodynamic Anchor",summary:"Permissionless consensus based on computationally expensive search and independently verifiable work.",note:"Energy expenditure raises the cost of attack but does not make manipulation physically impossible; security also depends on node rules and network behavior.",source:"https://bitcoin.org/en/halving"},
{n:16,group:"Consensus & Architecture",title:"Proof of Stake / PoS",epithet:"The Capital Allocation Model",summary:"Validator participation and penalties anchored to bonded native assets.",note:"Slashing occurs for defined protocol violations, not automatically for any transaction later deemed fraudulent; implementations differ.",source:"https://ethereum.org/developers/docs/consensus-mechanisms/pos/rewards-and-penalties/"},
{n:17,group:"Consensus & Architecture",title:"Proof of History / PoH",epithet:"The Temporal Sequencing Layer",summary:"Verifiable sequential-hash record that helps order events in a blockchain.",note:"PoH does not provide precise universal wall-clock timestamps, nor substitute for vote-based consensus and confirmation.",source:"https://solana.com/developers/cookbook/transactions/confirmation"},
{n:18,group:"Consensus & Architecture",title:"Proof of Authority / PoA",epithet:"The Identity Registry",summary:"Blocks proposed by a permissioned set of known validators.",note:"An architectural family rather than one universal protocol; governance, validator trust and fault tolerance vary by chain.",source:"https://ethereum.org/developers/docs/consensus-mechanisms/"},
{n:19,group:"Consensus & Architecture",title:"Liquid Staking Architecture",epithet:"The Capital Unlocking Bridge",summary:"Receipt-token models representing some form of underlying stake or claim.",note:"Receipt tokens are not universally 1:1 redeemable at every moment; smart-contract risk, exchange-rate movements, liquidity and slashing exposure remain.",source:"https://ethereum.org/staking/"},
{n:20,group:"Consensus & Architecture",title:"Layer 2 Rollups / Optimistic & ZK",epithet:"The Execution Offloader",summary:"Layer-2 execution with state commitments and/or transaction data anchored to a base blockchain.",note:"Optimistic rollups use challenge mechanisms; ZK rollups verify validity proofs. Security, withdrawal periods and data availability depend on each system's design.",source:"https://ethereum.org/developers/docs/scaling/"},
{n:21,group:"Consensus & Architecture",title:"Halving Mechanics",epithet:"The Programmed Scarcity Clock",summary:"Periodic protocol-defined reductions in block subsidy on some proof-of-work networks.",note:"Bitcoin halves subsidy at fixed block-height intervals, not exact wall-clock dates. Halving does not automatically make prices rise.",source:"https://bitcoin.org/en/halving"}
];
const groups=["Asset Layer","Mining Rigs","Consensus & Architecture"];
function getRecords(group,query){
  const q=String(query||"").trim().toLocaleLowerCase();
  return records.filter(r=>(!group||group==="All"||r.group===group)&&(!q||[r.title,r.epithet,r.summary,r.note,String(r.n)].join(" ").toLocaleLowerCase().includes(q)));
}
function miningScenario(input){
 const n = name => Number(input[name]);
 for(const k of ["hashrateTH","difficultyT","watts","electricityUSD","btcPriceUSD","poolFeePct","feesPerBlockBTC","subsidyBTC"]){
   if(input[k]===undefined || input[k]===null || String(input[k]).trim()==="" || !Number.isFinite(n(k)) || n(k)<0) throw Error("Enter a finite nonnegative value for "+k);
 }
 if(n("difficultyT")<=0) throw Error("Difficulty must be positive");
 if(n("poolFeePct")>100) throw Error("Pool fee must be 0–100%");
 const blocksPerDay = n("hashrateTH")*86400/(n("difficultyT")*(2**32));
 const btcPerDay=blocksPerDay*(n("subsidyBTC")+n("feesPerBlockBTC"))*(1-n("poolFeePct")/100);
 const revenueUSD=btcPerDay*n("btcPriceUSD");
 const powerKWh=n("watts")/1000*24;
 const electricUSD=powerKWh*n("electricityUSD");
 return {blocksPerDay,btcPerDay,revenueUSD,powerKWh,electricUSD,netAfterElectricUSD:revenueUSD-electricUSD};
}
return Object.freeze({records:Object.freeze(records),groups:Object.freeze(groups),getRecords,miningScenario});
});
