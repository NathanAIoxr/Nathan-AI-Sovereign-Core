# ⚔️ REMOVE JC™ — THE WAR OF TWO WORLDS

**Owner:** Nathan Tabor · **Parent:** TABOR WORLD / TABOR 1-2-3 FACTORY™ · **Status:** functioning local fantasy-game alpha, not live online multiplayer or a published commercial title.

## Private, full playable Work source package

The current conversation includes a verified downloadable archive named **`REMOVE_JC_WAR_OF_TWO_WORLDS_WORK_BUILD.zip`** (~4.6 MB), with:

- Original wide panoramic fantasy key art, public-safe scalable vector artwork, masked guardian and supernatural opponent Canvas graphics, UI design system.
- A complete static browser action-strategy **turn-based** campaign: **6 acts · 18 playable encounters · 18 original fictional foes · 6 evidence puzzles · 6 seals · final REMOVE JESUS FROM THE CROSS event**.
- **90 source-topic records** imported from the two original uploaded dossiers: **23 physical and temporal-power concepts, 22 occult and legend topics, 22 religious/spiritual topics, 23 shadow-network claims**.
- Full research provenance: original text and claims privately preserved in `source_archive`, and a **public-safe** `web/atlas.json` without the unreconciled source allegations.
- Server-side **Node 22+ + SQLite** local session authority using the same deterministic game rules as browser mode, with optimistic version checks, command ID replay protection, and loopback-only binding.
- Browser-local progress, save/export/import (offline demo mode), optional sound, responsive layout, reusable game engine, and a **12-second silent cinematic teaser MP4**.
- **27/27 automated Node tests passed**. Static JavaScript syntax checked, ZIP integrity checked. Automated headless-browser QA could not finish because this environment blocked browser navigation; that test remains **not verified**.
- Complete design, 18-mission matrix, evidence classifications, copyright notes, local startup and phased Work handoff.

## Research vs fiction

The original source materials contain real historical events and institutions, real religious practices, allegations, conspiracy theories, and unverified supernatural stories. The game **does not** portray these as equivalent factual claims.

**Every playable opponent is a fictional character** (e.g. Decree Sentinel, Obsidian Archivist, Hollow Seraph, Willbinder, Keeper of the Cross). Catholic believers, clergy, members of real named societies, other religions, and real people are **not** enemy targets. The **Vatican Citadel** act is a fictional fantasy setting. Historical organizations named in the Conspiracy Atlas are research topics, not designated villains.

Example checked correction: Pope Innocent III annulled Magna Carta in **1215**, not the source dossier's 1515; original source text is preserved, alongside the correction and [British Library primary catalogue](https://searcharchives.bl.uk/catalog/041-001103819).

## Gameplay rules

`Investigate` exposes facts, breaks wards, and builds knowledge/focus. `Strike` fights fictional enemy manifestations. `Defend` shields the player. `Restore` heals health and resolve. `Transform` converts weakened fictional adversaries and their dark abilities into compassionate protective powers. Defeating each act's final boss yields one seal; six seals and sufficient moral resolve unlock the cross finale. **The fictional shadow system ends permanently at victory**—the game does not force endless regeneration of evil.

## Exact developer handoff

**Do not claim this static GitHub README is the deployed game. The full runnable source is in the conversation ZIP.** Connect the ZIP in ChatGPT Work and read its `WORK_START_HERE.md`, `README.md`, `GAME_DESIGN_AND_MISSIONS.md`, and `RESEARCH_AND_RIGHTS.md`. Baseline tests:

```bash
node --test tests/*.test.cjs
node server/server.cjs
```

The server listens on http://127.0.0.1:8765 by default and **must remain localhost only**. No registered accounts, real-money purchases, identity system or encrypted cloud-saves have been built. Static hosting of reviewed `web/` can be done through GitHub Pages, but the browser will then use its localStorage demo saves only. Production online gameplay requires real auth, PostgreSQL, cloud migration, private data policies and anti-cheat hardening.

### Work milestones
1. Securely import the ZIP, run all tests and browser/device QA; never publish `source_archive/` verbatim by default.
2. Deploy only reviewed public `web/` assets and test GitHub Pages routing.
3. Upgrade to a typed authoritative server, login/tenant permissions, managed persistent database, migrations, monitoring, backups.
4. Build real action game environments and boss mechanics in Unity/Godot/Unreal while preserving current deterministic rules.
5. Expand each Atlas topic with independently verifiable references, scholarly review and explicit source type; do not assert a conspiracy was proven merely by listing it.
6. Finalize original 3D character rigs, audio, cinematic scenes, UI/accessibility, legal/rights and release approvals.
7. Integrate as a **distinct TABOR WORLD title**, without overwriting `TW-001`–`TW-101` original catalog IDs, and connect to TABOR ROOT only through authorized services.

**Creator canon:** *TWO WORLDS. THREE THEATERS. SIX ACTS. ONE CROSS. ONE FINAL MISSION. EVERY DARK POWER CAN BECOME A SOURCE OF GOOD.*
