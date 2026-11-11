# The Adventures of Stewart & Mr. Finn 🐾

## Version 6 — Full Polar Family native adventure

The iPhone app now includes a **native, offline, sixteen-chapter Polar Family campaign** with **48 individually written challenges** (three per chapter), two original regions (North Paw and Mrs Clause Cat’s Workshop), the HO/OH cast, chapter locks/unlocks, star ratings and progress persistence, story screens, an animal-family encyclopedia, and direct links to the two previously implemented word/mirror games. Start from **THE POLAR FAMILY · 16 CHAPTERS** on the app home screen. The native SwiftUI implementation is in `Sources/PolarFamilyQuestView.swift` and its independently testable Foundation-only rules, story catalogue and save codec are in `Sources/PolarFamilyQuestCore.swift`. The original 48-board campaign, saved stars and all prior activities remain separate and unchanged; the reunion grants a one-time 30-star main-game achievement. This version contains 16 **new** playable polar chapters, not 16 additional boards in the original campaign.

**Testing:** `swiftc -swift-version 5 -o /tmp/polar-quest-check Sources/PolarFamilyQuestCore.swift Tests/main.swift && /tmp/polar-quest-check` validates the entire native catalogue, unlocking, achievements and saved data. The unsigned iPhone GitHub Actions workflow runs these native tests and the three existing offline web-game suites *before* it builds the Xcode project, generates original art and packages the unsigned IPA. An unsigned IPA still needs proper Apple signing for installation on an ordinary device. See [Version 6 product scope and game guide](./POLAR-FAMILY-APP-V6.md).

**Rights:** The new chapter text, SwiftUI art and puzzles are original to this project, using no licensed film/game characters, external images, or third-party film AI identities. A separate commercial name/mark clearance and Apple signing review are still required; building the source does not establish legal clearance.


## Version 5 — Challenge Lab

Added native SwiftUI **Mammal Challenge Lab** with three separately replayable five-round games: Stewie's contrasting patch puzzle, Champ's visual snack tracking, and Ace's safe body-language choices. Fresh patterns on replay, encouraging feedback, local one-time star rewards, no network or monetization changes. Keeps the existing 48 board campaign and all other game activities intact. Development build requires iPhone testing before release claims. No Shawna in this version.



## Version 4 — consumer-first Factory upgrade

Factory provenance: `app-factory/RELEASE_GATES.md`, `app-factory/build-order/README.md`, and `app-factory/game-reference-lab/README.md`. Product goals: joyful short sessions, offline play, no ads/purchases/tracking, original and age-appropriate material, consent-based animal interactions, a way to pause, no social pressure, and clear caregiver information. Market guidance: Apple Kids category guidelines; offline/creative games are reference patterns, not copied assets.

Version 4 adds a **Mammal Playroom** with six themed boards, sticker-placement creativity and locally saved work; **Storytime** with five family episodes and choice-based kindness lessons; **Grown-Up Corner** with family prompts and preference toggles; plus one-time campaign star awards and improved child-friendly wrong-answer feedback. No Shawna character appears. These are original SwiftUI experiences, not claimed live service integrations. Existing 48 boards and save keys remain. Sideloadly-oriented unsigned GitHub IPA flow continues. This is a **device-test release candidate**, not an independently validated App Store-quality product.



A playable, iPhone-only, offline-first children's SwiftUI adventure inspired by **My Life with Mammals**, by Nathan Tabor, a Human Mammal.

## NEW: Stewart & Mr. Finn — The Mirror Bridge: PAWS ⇄ SWAP

[Play Mirror Bridge](./polar-middle-c/mirror-bridge/index.html) · [Original mechanics and rights notes](./polar-middle-c/mirror-bridge/README.md). The new game opens directly from the iPhone home menu through `PawMirrorBridgeView.swift` or as an offline browser branch of the HO ↔ OH Polar Middle C. It uses **original cat/polar characters and PAWS ⇄ SWAP letter reflection**, with a working torque-balance model and saved local progress. No third-party fiction characters, logos, media or branded AI source material are used. The original 48-board adventure remains unchanged. Commercial name clearance and native signed-build validation are still separate release checks.

## NEW: HO ↔ OH · The Polar Middle C (North Paw + Mrs Clause Cat’s Workshop)

Playable **offline** branch in the native iPhone menu and as a [browser game](./polar-middle-c/index.html). Santa Dog and Ozzie guide three puzzle stages — Above C (what was heard), Below C (literal mirror), Middle C (source-backed ancient writing and number systems). Stewart and Mr. Finn unite the two halves. Source and tests: [Polar Middle C](./polar-middle-c/README.md). This is an add-on game branch, not an expansion of the original 48 campaign boards. The source-bundled WebKit game requires an Xcode native build to test on iPhone; it is not an App Store release.

## Inside the game

- **Puzzlewood:** find seven hidden treasures and earn stars.
- **Puzzle Pals:** a playable 12-card matching game, with shuffling and turns.
- **Biscuit Factory:** make a dozen biscuits with Stewie.
- **Speak Their Language:** a five-question educational challenge about animals' communication, safety, and trust.
- **Champ’s Snack Trail:** playable food-detective game featuring the long-legged tan hound.
- **Ace’s Freeze Dance:** interactive move, pause, and animal-language game featuring the long-haired Australian Shepherd.
- **Mammal Family:** six active cast members and real family stories.
- Cat selection, permanent progress using `UserDefaults`, accessibility labels, original self-contained illustrated art and icon, and **no logins, ads, analytics, in-app purchases, or network use**.

## Canon and safety

Stewart (Stewie) and Mr. Finn have near-complementary black-and-white Paint-horse-style coats. **Stewart's white splits his black**: this distinctive marking helps tell them apart. Both are intact males. Champ is a tan, neutered, long-legged hound of roughly 40–50 lb with a round body and snack-sleuth personality. Ace is a long-haired, red-brown Australian Shepherd with a white chest, white feet, and long feathering at the paws. Collyn and Nathan live with the four animals, and the featured human mammals are **Nathan and Collyn**. Shawna does not appear in this release.

Animal communication in the game is age-appropriate and does **not** equate compliance with trust: frightened or excited pets may ignore familiar cues. Children are instructed to involve a trusted adult with unfamiliar animals.

## iOS build (a Mac with Xcode)

Requires Xcode supporting iOS 17+ and [XcodeGen](https://github.com/yonaskolb/XcodeGen). The GitHub Actions build installs XcodeGen and uses a macOS runner.

```bash
cd app-factory/stewie-mr-finn  # or the root of the downloaded project
python3 -m venv .venv
.venv/bin/pip install pillow
.venv/bin/python scripts/generate_art.py
brew install xcodegen
xcodegen generate
open StewieAndMrFinn.xcodeproj
```

Bundle identifier: `com.nathantabor.stewieandfinn` (must be registered under the Apple Developer team for signed distribution). This is an independent iPhone app, not the `Tabor 1-2-3 Factory` identifier.

### Unsigned build / IPA (for build testing, NOT direct installation)

```bash
xcodebuild -project StewieAndMrFinn.xcodeproj \
  -scheme StewieAndMrFinn -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
mkdir -p Payload dist
cp -R build/Build/Products/Release-iphoneos/StewieAndMrFinn.app Payload/
zip -qry dist/StewieAndMrFinn-UNSIGNED.ipa Payload
```

**Important:** An unsigned IPA is a build artifact, **not** an install-ready IPA for a regular iPhone. A device-installable `.ipa` requires Apple signing with the correct certificate, registered bundle ID, provisioning profile and, depending on distribution method, registered devices or App Store/TestFlight release. Apple signing credentials must be added securely using GitHub secrets or Xcode. Never commit a `.p12`, `.mobileprovision` file, private key, or Apple credentials into source control.

### Signed release through a cloud Mac

Once an Apple Developer team, distribution certificate, and matching provisioning profile are available, run Xcode's **Archive** / **Distribute App** or automate `xcodebuild archive` followed by `xcodebuild -exportArchive -exportOptionsPlist ExportOptions.plist` on a Mac runner. `ExportOptions.plist` depends on App Store Connect, ad hoc, or development distribution; it is intentionally **not** guessed in this repository. See [Apple's IPA export instructions](https://help.apple.com/xcode/mac/current/en.lproj/dev23ea8b877.html).

## GitHub Actions

`.github/workflows/ios-stewie-finn.yml` (placed at the *repository root*) builds a **fresh unsigned IPA** on a cloud macOS runner and publishes a downloadable workflow artifact. The source project belongs at `app-factory/stewie-mr-finn/` in the existing repo. The workflow triggers on the project's push/PR changes or manual dispatch (after the workflow is present on the default branch).

## Editorial / assets

The game has original artwork generated **offline from Python + Pillow** by `scripts/generate_art.py`. Run the script whenever asset images are missing; GitHub CI regenerates them before XcodeGen. The promotional concept illustrations are visual references only, not evidence of existing game screens or an app already built.

This is a **playable version 2 prototype**, not a complete expansive 3D game or a production App Store release. Test it on an actual iPhone before distribution.

© 2026 Nathan Tabor. All rights reserved. This project-specific attribution does not change the license of other parts of the hosting repository.

### Ready-made signed IPA workflow

The repository also contains `.github/workflows/ios-stewie-finn-signed.yml` and `scripts/build_signed.sh`. Once you have issued a matching **Apple Distribution** certificate and provisioning profile in your own Apple Developer account, save the following as **GitHub Actions repository secrets** (never paste their contents into an issue, commit, or public chat):

- `APPLE_CERTIFICATE_P12_BASE64` — base64 encoding of the exported Apple Distribution `.p12` certificate and its private key.
- `APPLE_CERTIFICATE_PASSWORD` — password protecting that `.p12`.
- `APPLE_PROVISIONING_PROFILE_BASE64` — base64 encoding of the `.mobileprovision` matching the bundle ID and selected distribution method.
- `APPLE_TEAM_ID` — the Apple Developer team identifier.

From the GitHub Actions page choose **iPhone Game - Signed IPA**, select **ad-hoc** (for registered iPhones) or **app-store-connect** (for TestFlight/App Store upload), and select **Run workflow**. The workflow builds, signs, exports and publishes `StewieAndMrFinn-SIGNED.ipa` if signing is configured correctly. These secrets and profiles are **not** present in the project; this workflow has therefore not been run or verified. An ad-hoc `.ipa` installs only on devices included in the provisioning profile. App Store Connect IPA files must be uploaded through Apple to reach TestFlight or the App Store.