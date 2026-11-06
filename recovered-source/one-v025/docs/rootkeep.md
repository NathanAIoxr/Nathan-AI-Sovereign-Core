# THE 33 · Rootkeep — private ONE v025

The main flow is **settlement → team → stage → battle → rewards**. Workshop, automation and reminders stay optional. Play immediately as a guest, complete or skip three guided moves, then choose any of the 33 expeditions.

Open `ROOTKEEP_PRIVATE_v025.html` from the exported package, or `app-factory/one/trial-matrix/realm/index.html` from the source app. The original cognitive trials and A–Z Studio remain separate playable modes linked from Rootkeep and ONE.

## The Tabor Decimal System — by Nathan Tabor

The four-tier framework is connected to binary presence gates, exact positional attack scaling, purpose lookup and capacity receipts. New parties gain 12% base attack per lane position. Existing active battles retain their original stats and replay, then adopt the framework after finishing. The optional credited panel shows live state and routes searches such as “food” or “healing” to the relevant asset.

Default indexed capacity preserves current Storehouse limits, and surplus remains in the 48-hour inbox. The local-cell model is a read-only preview. See [TABOR_DECIMAL_SYSTEM.md](tabor-decimal-system.md) for exact rules, code mapping and compatibility.

## Applied combat rules

The supplied Python reference defines **seven rows and five columns**. Rootkeep follows that explicit orientation. Five heroes are assigned to the five lanes; three enemies occupy lanes 1, 3 and 5. Off-lane shots ghost and reroute to the nearest living enemy, choosing the left enemy on distance ties. This rerouting follows the pasted implementation; it is an intentional game rule.

| Reference element | Original Rootkeep element | Strong against | Weak against |
|---|---|---|---|
| Fire | Ember ▲ | Grove | Tide |
| Nature | Grove ♧ | Tide | Ember |
| Ice | Tide ◆ | Ember | Grove |
| Holy | Aether ✦ | Umbra | — |
| Dark | Umbra ☾ | Aether | — |

Strong counters deal 2×, weak counters ½×; other pairings deal normal damage. Every tile uses its lane hero’s attack and its own element. A living lane hero gains mana only from its own element: one charge normally, two when ghosted. Thresholds are Very Fast 6.5, Fast 8, Average 10, Slow 12, Very Slow 13.5. Integer half-charge storage preserves these values exactly.

An accepted move resolves its cascades before the enemy turn. Damage gains 20% per cascade, capped at 2×; cascade resolution is bounded at 24 waves, then the board stabilizes without awarding unperformed clears. Dead boards recover freely. Invalid or out-of-bounds swaps restore the complete board and RNG state, spending no move. Win by clearing every wave within 60 accepted moves while a hero remains alive. Specials and one item can be used between accepted moves. Defeated waves cannot attack; a fresh wave does not get an immediate free strike.

Guards reduce damage by 40%; guard break increases it by 35% for three moves. Heal, shield, single-target, guard-break and group-strike heroes provide distinct party choices. The five alternate heroes join after first clearing stages 3, 9, 15, 21 and 27. Team training uses food and insight. Ascensions require Academy upgrades and earned relics. Talents can be changed freely.

## Convenience without extra gates

- Seven buildings upgrade immediately. Rootkeep caps building levels; the Storehouse caps food and iron. No energy, construction wait, paid summon or account gate is implemented.
- Production is computed on collection, retaining fractional amounts and limiting offline accumulation to 12 hours. A backwards clock cannot create production. One collection action or a horizontal village swipe collects both sources.
- Excess production and battle loot enter a 48-hour overflow inbox. Claim partially after spending; each remaining bag keeps its expiry. Expired bags are removed on the next action. At the exceptional 200-bag limit, the oldest bag merges into the newest and receives the later expiry, preserving its contents.
- A saved blueprint crafts its whole batch in one transaction; insufficient resources or item space leave everything unchanged. Up to two of each supply are packed per expedition. Unspent supplies return after victory, defeat or ending a run.
- One return ledger shows actual production, overflow and any saved expedition. It never invents alliance results or completed timed upgrades.
- Auto-play uses public opening information. It can conserve skills for the final wave, target low health, and restrict opening clears to lanes 2–4. Cascades may spread beyond those lanes. If the filter leaves no move, auto-play stops. It avoids healing unless a living ally is below 65% health, spends no items automatically, and pauses when the page is hidden. Conservative settings can require a stronger party or manual intervention; auto-play does not guarantee victory.
- Every node already has a distinct shape and accessible element label. High-contrast mode adds white structural outlines. On phones, skills and primary combat actions stay in the bottom thumb dock.
- Browser utility reminders require explicit opt-in and run while the app is open. Calendar export contains real storage/production and inbox deadlines with alarms. Background push and App Store distribution require a deployment platform; this package does not claim them.

## Engine boundaries and replay verification

| Responsibility | Implementation |
|---|---|
| Hero definitions and static stage atlas | `realm/catalog.js` |
| Tabor Decimal System core | `realm/tabor.js` |
| Isolated deterministic combat | `realm/combat.js` |
| Settlement, hero instances, rewards and economy transactions | `realm/world.js` |
| Screens and input | `realm/realm-ui.js` |

All state changes pass through a transactional dispatch before committing to the browser. Saves use `one.private.v025.realm.v1`, with the shared validated recovery store and preserved damaged bytes. Cognitive-campaign rewards are separate. Keep an exported JSON as an independent backup.

Export a battle replay, then verify it without a browser:

```sh
node app-factory/one/trial-matrix/realm/verify-replay.cjs < replay.json
```

The verifier reconstructs the seed, initial party, item inventory, swaps, targets, skills, items and flee actions, and rejects an inconsistent claimed result. It fixes the reference’s shared global RNG, unvalidated coordinates, roster argument typo and unbounded cascades. For a hosted authoritative server, initial party/configuration must come from that server’s trusted database; accepting a client-supplied config alone does not prevent cheating. No server, database, live PvP or alliance service is deployed here.

The original pasted references are preserved privately in `references/realm-inputs/`. Rootkeep uses original names, CSS/SVG artwork and source rather than commercial game assets.

## Validation

The realm rules suite covers all 33 victories and exact replays, the complete recruitment journey, transactional economy, overflow expiry, conditional auto-play, malformed imports, and CLI verification. Browser checks cover the guided tutorial, upgrades, training/crafting, map, keyboard and drag play, normal and boss victories, phone controls, save/replay transfer and storage-denied play. Evidence is under `validation/realm-*-results.txt`.
