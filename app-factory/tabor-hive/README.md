# Tabor Hive v.9 — Universal Tech Dominion

By Nathan Tabor. The Nathan AI Hive holds the Life Mandate and Law of Order, approves overrides and device grants, and issues the cast output. The Database Bee 🐝 Worker Swarm reports upward. The Ant 🐜 Farm sits beneath their routing.

## Interaction surfaces

- The interactive catalog restores all 101 ordered entries, 21 subject classes, eight interaction profiles, original titles, adapted titles, sample facts, KJV excerpts and cross-class links from [the Track Baller branch](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/a18e863cfd36c0eb2ae4b6d8add09fcc04b7203c/app-factory/tabor-tracker-ball). Labels such as LC-Q-063 are Tabor cartridge IDs. Library Bee uses the [official LC outline](https://www.loc.gov/aba/cataloging/classification/lcco/) for class references. Item-level call numbers require sourced records.
- The 45/10/45 arcade keeps its gameplay and bridge rules. Puzzle clears send normalized attempts, shield, damage and charge. The embedded Tracker Ball retains its quaternion, unistroke, pinch, trajectory, fishing and sword-game mechanics. The catalog retains local touch and gyro controls. Raw sensor and stroke data stay on those surfaces.
- Nathan AI 🚀, PK, and the Grape-Apple Curator speak through the Hive's rule-based cast. Curriculum Bee tracks progress and adjusts the coaching level. Economy Bee awards session rewards for first completion and bridge clears. Z-101 encrypts browser notes with AES-GCM and a passphrase-derived key after explicit authorization for each save or removal.
- Circuit Lab runs a series/parallel switch simulation. Hook & Ring, Grapple It and Bible Topia open at their existing addresses and retain their own session state.

## Ant Farm 🐜

Forward and reverse Ant lanes traverse the eligible Bee set from opposite directions. The linear axis interleaves lanes and the vertical axis runs their queues in stacked passes. Routes reinforce transient trails while cursor rotation distributes first dispatch. Left and right angle accumulators advance simultaneously in counter-rotating mode. The display is hidden by default. Enable **Show both streams** to inspect both layers. NASA published the related [ANTS swarm architecture](https://science.gsfc.nasa.gov/attic/ants/faqs.html) and [ant-inspired Swarmie research](https://ntrs.nasa.gov/citations/20160011344). Tabor's forward/reverse, vertical and simultaneous counter-rotation controls are implemented here.

## Hive Bus and Bee registration

Events carry a protocol version, unique ID, timestamp, authenticated source, type, derived priority and a type-specific payload. Priorities run critical, high, normal and background. The Hive validates module launches and completions, normalized interactions and bridge clears, device status, boundary reports, heartbeats and specialist requests. The browser surface uses a local stream and the Hive validates messages from the two embedded, same-origin applications. The Cloudflare owner API and Bee Bus operate on a distinct durable Hive instance.

- Run `node build.mjs` and `node --test hive.test.mjs ../tabor-tracker-ball/loc101.test.mjs` from this directory. Deploy with `npx wrangler deploy`.
- Set `HIVE_OWNER_TOKEN` and `HIVE_BUS_KEY` as two independently generated Base64-encoded 32-byte secrets with `wrangler secret put`. `GET /api/status` reports whether the owner Bus is enabled. Z-101 notes stay in the browser.
- Send owner actions to `POST /api/owner` with the owner bearer token. Supported actions include `policy`, `cast`, `ant`, `spawn`, `approve`, `merge`, `dissolve`, `register-device`, `authorize-device` and `revoke-device`. `GET /api/owner` reads private policy, leases, devices and pending requests. The owner supplies the exact Life Mandate and Law of Order text.
- `spawn` takes a registered domain, a lowercase task slug and `ttl` in milliseconds (1 second through 15 minutes). The receipt includes a lease ID and its own derived key. Give that key to that Bee over a private channel. The Bee uses `makeEvent` and `sealPacket` from `bus.mjs` with direction `up`, its ID as message source and the `x-tabor-bee` header on `POST /api/bus`. Use `openPacket` with direction `down` for the receipt. A heartbeat carries `{"worker":"<lease-id>"}`. Liveness is measured over 30 seconds. An expired or dissolved lease loses access. Pending specialist requests require Hive approval.
- Eleven technology domains cover hardware, firmware, OS, networks, security, sensing, actuation, storage, compute, interfaces and external integrations. The registry records observation, simulation and projection grants for registered devices. Live external equipment and systems require a domain adapter and an owner grant.
