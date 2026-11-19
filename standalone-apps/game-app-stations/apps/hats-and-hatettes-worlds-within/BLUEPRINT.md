# HATS & HATETTES · WORLDS WITHIN

> DUDES AND DUDETTES — HEAR YE, HEAR YE! BOYS AND BOYETTES, GIRLS AND GIRLETTES, KINGS AND KINGETTES, PALS AND PALETTES — ALL TRAVELERS FROM HERE, THERE, OVER THERE, ABOVE, BELOW, THE MIDDLE, AND NOWHERE — STEP INSIDE THE ONE UNIFIED UNIVERSE!

> BE THE HAT AND HATETTE — BE YOU — STOP THE HATERS — DONE!

## One journey

The player starts at the **Non-Reversed True Mirror**, tunes a game coordinate, and enters the brim. **Sovereign Buddy (iCU)** reads the journey for the HATETTE companion. The Sage, Granddad, The Systems Architect, and The Cosmic Presence offer four rotating mentor lenses. **1 + 1 = 2** stacks pocket worlds. **1 − 1 = 0** clears a cage. Read the world from **A to Z** and **Z to A**. Turn **Pi to Phi** and **Phi to Pi**.

The browser prototype uses a random seed or an optional pointer trace for the in-game frequency. The camera preview is unflipped and local. The app does not record camera frames, derive biometric identities, or infer a literal human frequency, personality, or purpose. The Accelerated Sovereign Walk currently counts steps entered by the player. The Living Purpose Map follows game choices with three prompts: **Who am I? Why me? What is my true purpose?** The player can export or import the same journey and decide when to share a forged portal.

## Grand Atlas

| Coordinate | Playable location | Expansion |
| --- | --- | --- |
| Above | The Aurora Yule-Ette | Polar sky-citadel, walkable auroras, gift-forges and Astrolabe Spires with orbital time and gravity |
| The Middle | Babel-Free Bazaar | Hat and Hatette trade, living signs, spoken phonetic keys and lantern worlds |
| Here | Crown Forge | Brim-Builder Workshop with terrain, language rules, rhythm and publishable worlds |
| There | Rhythm Arena | Box Police, Label-Drones, the Innocence Shield and cooperative rescues |
| Over There | Shifting Bridges | Sideways pathways and Santa’s Crimson Cap |
| Below | Doggerland | Submerged riverbeds, ancient forests, bone-and-amber vaults, the Continental Shelf Vaults and Leviathan guardians |
| Nowhere | Z-to-A Mirror Void | Backwards Citadel, mirrored causality, reverse gravity and Phi spiraling to Pi |

Santa’s Crimson Cap pairs with the Aurora Yule-Ette, his feminine equal. Doggerland Tide-Helm pairs with Silt-Weave Hatette, and the Alpha-Omega Brim pairs with the Omega-Alpha Crown. The northern lights of Aurora over Doggerland connect two pocket worlds. Up to three equipped brims sound three voices. Unlock the wearer, world and word forms after finding the brims, freeing a traveler and forging a doorway.

Historical atlas text must distinguish documented submerged landscapes from game canon. [Walker et al., Doggerland, Oxford Handbook of Mesolithic Europe](https://doi.org/10.1093/oxfordhb/9780198853657.013.9) provides the historical basis for Doggerland. The bone-and-amber temples, primordial alphabet, underwater cities and Leviathan guardians are fiction. Atlantis and Lemuria belong in the myth and fiction layer. Sundaland and Zealandia belong in the geography layer, with fictional vaults labeled separately.

The Hatette Spin transforms **H-A-T-E-T-T-E-S** into **H-A-T-E-R-S** as game wordplay and shatters cages in the fictional arena. The rhythm is **STOMP, STOMP, CLAP, REST**. Multiplayer production work covers cooperative rescue, team arenas and Crown Forge challenges. Exploration, reverse thinking, building and shielding provide the four in-game play styles. Their brims are respectively Doggerland Tide-Helm, Omega-Alpha Crown, Sovereign Forge-Brim and Hater-Breaker Halo.

## The Chronicles of Hat & Hatette

The thirteen titles and their playable frequency keys live in the Chronicles. Doggerland runs through Books 4 and 5, the Aurora Yule-Ette through Book 9 and the Z-to-A Void through Book 12. The opening chapters ask who gets to name the traveler. The middle chapters connect the traveler’s coordinate to what they do in the world. The last chapters turn the personal journey into a door another traveler can open. The release contains thirteen short chapter previews. Thirteen fully written and illustrated volumes remain manuscript work.

**Opening cinematic treatment**

1. A label lands on a hat at the Bazaar gates. The label stays on the hook. The traveler steps through the True Mirror.
2. **STOMP. STOMP. CLAP. REST.** The dial turns. One half of the screen shows the northern lights over the Yule-Ette. The other half dives with the Tide-Helm below the North Sea.
3. **1 + 1 = 2.** Above and Below overlap. A bridge of light crosses the drowned river.
4. The Box Police close a cage. The traveler catches the label, hits the cadence, and spins the letters back. **1 − 1 = 0.**
5. The traveler leaves the Forge door open. **BE THE HAT AND HATETTE — BE YOU — STOP THE HATERS — DONE!**

## Ecosystem and delivery

| Workstream | In this release | Next build |
| --- | --- | --- |
| Worlds Within | Playable responsive Atlas, seven portals, nine brims, two dials, stacks, puzzle gates, rescue and Forge links | 3D movement and geometry, generated catalog of thousands, physics and time per world, deeper ciphers, real multiplayer |
| HATETTE and Sovereign Buddy (iCU) | Local shared journey, manual step log, non-reversed camera preview, Suffix Spinner, reflections | Native iOS and Android, opt-in device activity, on-device AR try-on, voluntary voice controls, daily quests, Hater Shield and interoperable local save |
| StopTheHaters.world | Hall of Unboxed Legends and shareable Forge links in the prototype | Verified domain connection, public gallery, moderation, Word Wall, 3D atlas, creator downloads, Physical Forge and fulfillment |
| Chronicles | 13 titles, keys and unlockable previews, opening cinematic treatment | Thirteen manuscripts, illustrated editions and live chapter links into game episodes |
| HAT OS | Browser Crown Sanctuary with Work, Creator, Gaming and Ghost Hat choices | HAT-Core design, real permission boundaries, local phonetics, native Forge Studio, Zero-Gate Firewall and authenticated Mesh-Brim protocol |
| Hardware | Keyboard, pointer, touch and browser camera inputs | Hatter Rig, Pocket Slate with physical kill switches, Smart Crown and Brim Band, and Spinner Deck jog wheel with BLE/HID adapters |

Mesh-Brim, private sync, native HAT OS and device hardware are design work. Verify encryption, recovery and local permissions before claiming any privacy property for a real network. Keep optional camera, voice and movement data local unless the user explicitly chooses to share.

## Build roles

Cloudflare serves the public game through the existing App Stations bucket. The Worker targets the owner’s Workers for Platforms namespace, with the web assets in the same bucket. The existing Tabor Build Loop runs scoped follow-on drafts. Its lane definitions are in [build-agents.json](build-agents.json). The app station queue retains the deployment receipt. Each subsequent release needs a corresponding source change, tests, and live check.

Run `node --test worlds.test.mjs` here. From the station root, run `node build.mjs && node verify.mjs` to build the catalog and verify its checksums.
