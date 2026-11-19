# Tabor iPhone game builds

The native project contains four iPhone targets. Each target packages only its own offline resources. Scrambler and Sudoku keep their existing engines and user workflows. Yard Arcade provides 78 launch destinations: five featured experiences, 60 physics boards and 13 Track Baller activities. The original Yard Darts and Lawn Jarts are distinct. The shelf includes both Swordplay Practice and Track Baller's Swordplay implementation, plus Spear Phalanx Target. The earlier standalone Swords source is still a source-recovery item.

Retro Lab contains the existing Zero & Void Lab, based on 1970 cellular-automaton rules, and an original category quiz using a 1980s-era category format. Historical reference records remain identifiable in the sources below. This build includes no legacy ROMs, graphics, questions, or branded copies.

| Period | Source records | iPhone status |
| --- | --- | --- |
| 1970s | Conway’s Game of Life (1970) | Zero & Void Lab is bundled |
| 1970s | Mastermind (1970), UNO (1971), Dune reference (1979) | Reference records only |
| 1980s | Trivial Pursuit (1981) | The category format informed the new, original Category Challenge. No licensed trivia or board assets are included. |
| 1980s | Phase 10 (1982), Core War (1984) | Reference records only |

This table covers the explicitly dated records from [the reference lab registry](../../app-factory/game-reference-lab/registry.json) and [the additional reference catalog](../../app-factory/game-reference-lab/morning-additions-238.json). Owner-held archives and remaining game concepts require a source and rights check before inclusion.

## Verify the packages

From the repository root with Node.js 22 or newer:

```sh
node standalone-apps/ios-game-release/scripts/stage.mjs
node standalone-apps/ios-game-release/scripts/verify.mjs
node --test standalone-apps/scrambler/*.test.mjs standalone-apps/game-app-stations/apps/nathan-ai-sudoku-master/*.test.mjs
npm test --prefix standalone-apps/hook-and-ring
```

On a Mac with Xcode 26+, the iOS SDK 26+, Node.js, Python 3 and XcodeGen, run the following for each scheme:

```sh
RUN_SIMULATOR_TESTS=1 bash standalone-apps/ios-game-release/scripts/build-ios.sh YardArcade
```

The script stages original game assets, validates the local resource map, generates opaque icons, builds the Xcode project, exercises the simulator when requested, and produces a separately labeled unsigned IPA. Use [the store submission draft](./STORE-SUBMISSION.md) for listing copy and signing steps. App Store Connect has the final app record, signed build and completed questionnaire.
