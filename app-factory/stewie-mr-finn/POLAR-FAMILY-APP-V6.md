# Stewart & Mr. Finn — Polar Family Adventure (Version 6)
**Original by Nathan Tabor · Part of My Life with Mammals**

## What's playable
The existing iPhone game has a six-world, 48-board core campaign plus mini-games, the Mammal Playroom, and the Challenge Lab. Version 6 adds a **separate** two-world polar branch with **16 native chapters and 48 new, individually authored questions**, connected through the original characters Stewart and Mr. Finn.

| World | Chapters | Family guides |
| --- | --- | --- |
| North Paw, House HO HO HO | 1–8 | Santa Dog; Holly Howl; Peppermint Dot; Pip & Poppy; Jingle Jack; Blizzard Belle; Juniper Jingles |
| South Paw, House OH OH OH | 9–16 | Ozzie; Oona Aurora; Opal Flip; Otto Orbit; Olive Current; Ollie Echo; Odie & Oda |

### Game loop
1. Open **THE POLAR FAMILY · 16 CHAPTERS** from the existing app home. See a world map with all chapter names, progress and the complete original polar family roster.
2. Complete 3 short, age-appropriate interactive questions per chapter. Five kinds: word listening, exact spelling mirror, math and patterns, nature education and caring for animals.
3. After each answer, the game explains the verified rule or helpful choice. There's no timer, punishment or pressure, and mistakes don't block progress. Everyone earns at least one star for finishing a chapter; solving 2 or 3 earns correspondingly 2 or 3 stars.
4. New chapters unlock sequentially. Scores, completed chapters and stars are saved privately on device. Replaying a chapter can improve the rating, never decrease it.
5. Reaching chapter 16 completes **The Middle C Reunion** and awards one 30-star achievement to the existing mammal-game profile (once only). Original game saves and all 48 original boards remain untouched.
6. From the same Polar Family map, open the existing **Polar Word Detective** and **PAWS ⇄ SWAP Mirror Bridge** for additional word and mechanical-balance play.

### Middle C three-plane design
- Above C — head/ears: listen to the word and its context.
- Below C — paws/soles: inspect written symbols, reversal and number patterns.
- The Middle C — heart/gut: reconcile the two with historical or mathematical evidence and the animal's expressed boundaries.
- C = consciousnesses is the **game's creative symbol**, not an assertion that a human consciousness measure exists at Middle C pitch.

### Accuracy, scope and safety
The trip between geographical poles is a **fantasy portal**; wild emperor penguins live in Antarctica, not the North Pole. Orcas are marine mammals. Mirror operations are string transformations: reversing twice yields the original, without establishing etymology. Torque-sum puzzles describe a simplified fixed-axis model: balanced torques mean zero angular acceleration, not necessarily zero existing angular velocity.

The original two cat coat patterns remain complementary; Stewart's white splits his black. This is an animal-centered, no-ads, no-commerce, offline-first game. No child accounts, marketing analytics or network permissions were added. Animal-care puzzles stress distance, autonomy, and trusted-adult involvement.

### Originality and release boundaries
All **new** story text, questions, the native screens and color/emoji geometry were authored for this project. No film-derived AI names, external film images, quotations, soundtrack or logos are used. Existing project code, original assets and other repository materials retain their own recorded rights. Removing recognizable third-party expression from this branch does not establish that a commercial game title or logo is trademark-cleared; perform a separate trademark search and professional clearance before publication.

## Files
- `Sources/PolarFamilyQuestCore.swift`: Foundation-only chapter data, quiz structure, unlock and save rules.
- `Sources/PolarFamilyQuestView.swift`: native SwiftUI world map, family roster, chapter screens and answers.
- `Tests/main.swift`: offline native model tests.
- `Sources/Home.swift`: direct menu entry.
- `Sources/App.swift`: existing one-time achievement API, reused.
- `Sources/PolarMiddleCView.swift` and `Sources/PawMirrorBridgeView.swift`: existing offline web-games accessible from this expansion.
- `project.yml`: iOS 17+, XcodeGen, version 6.
- `.github/workflows/ios-stewie-finn.yml`: macOS CI test, Xcode build and unsigned IPA artifact.

## Developer steps
```bash
cd app-factory/stewie-mr-finn
swiftc -swift-version 5 -o /tmp/polar-quest-check Sources/PolarFamilyQuestCore.swift Tests/main.swift
/tmp/polar-quest-check
python3 -m venv .venv
.venv/bin/python -m pip install pillow
.venv/bin/python scripts/generate_art.py
brew install xcodegen
xcodegen generate
xcodebuild -project StewieAndMrFinn.xcodeproj -scheme StewieAndMrFinn -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build
```

**Release honesty:** Compiled source or an unsigned IPA does not install by itself on an ordinary iPhone. Build validation, an Apple Developer account, signing/provisioning, App Store policies, accessible-device testing and editorial/trademark review remain required before distributing a finished app.
