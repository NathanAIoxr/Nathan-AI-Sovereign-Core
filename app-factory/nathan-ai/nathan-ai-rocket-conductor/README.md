# Nathan AI Rocket 🚀 mining conductor

[Live conductor](https://tabor-bridge.nathantaboract.workers.dev/rocket-conductor/) · [Status JSON](https://tabor-bridge.nathantaboract.workers.dev/rocket-conductor/api/status)

The Cloudflare Worker reads the public GitHub fleet policy, checks the deployed Cloudflare Master Conductor and Golden Goose, recomputes the proof of work for the public Bitcoin header supplied by the Mining Lab, and reports aggregate fleet records and heartbeat counts from the existing mining inventory in D1. The GitHub health workflow compares the status endpoint’s policy SHA-256 against the file in its checkout. The public status can cache a successful observation for one minute. An unavailable dependency is reported separately from an empty registry.

## Deploy

Upload `worker.mjs` as the ES module for `nathan-ai-rocket-conductor` in the existing `nathan-tabor-platforms` dispatch namespace. Bind `REGISTRY` to the same D1 inventory used by `tabor-compute-fleet`, `MINING_LAB` to the `nathan-ai-mining-lab` service, and `PLATFORM` to the `nathan-tabor-platforms` dispatch namespace. Set `RELEASE_SHA` to the deployed Git commit. The dedicated public mount is `/rocket-conductor/` in Tabor Bridge.

`node --test worker.test.mjs` checks the local release. `node check-live.mjs` checks the live integration against the checkout.

## Hardware activation

The control plane serves verification and status. Hardware or its hosting operator must start the actual miner against the owner-selected pool. Enroll an authorized SHA-256 ASIC through the operator’s management interface. Record its pool worker identity and obtain pool-reported accepted shares before recording a mining launch. Store pool credentials and management credentials in the operator’s private system. Payout evidence comes from the pool statement and transaction record. The 1,000 Super 2X and 1,000 Hyper entries are planned slots. The original Golden Goose Golden Eggs and tokenomics remain defined in the author’s source.
