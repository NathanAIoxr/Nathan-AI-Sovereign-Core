# Tabor iPhone App Store submission draft

Each entry below is a distribution target. The names and bundle identifiers are proposals until the Apple Developer account confirms availability.

| Product | Xcode scheme | Bundle identifier | Store category draft |
| --- | --- | --- | --- |
| Tabor Scrambler | Scrambler | `com.nathantabor.scrambler` | Utilities |
| Tabor Yard Arcade | YardArcade | `com.nathantabor.yardarcade` | Games / Casual |
| Nathan AI Sudoku Master | Sudoku | `com.nathantabor.sudokumaster` | Games / Puzzle |
| Tabor Retro Lab | Retro | `com.nathantabor.retrolab` | Games / Puzzle |

Version 1.0.0. iPhone, portrait, iOS 17 or later. Xcode and iOS SDK 26 or later are required for current submission. Proposed first release is free, with no accounts, advertising, or in-app purchases.

## Store descriptions

**Tabor Scrambler**  
Build and play fictional routes from a simple timetable. Set a simulated speed, review each stage and its duration, and play or scrub the schedule. Save a route on your iPhone or export a labeled simulation JSON file. Scrambler runs locally and performs no geolocation.

**Tabor Yard Arcade**  
Play Hook & Ring, Yard Darts, Grapple It, Toss & Target, and Toss Lab. Explore 60 physics boards, including Cornhole, Horseshoes, Swordplay Practice and Spear Phalanx Target, and 13 Track Baller activities. Practice and local multiplayer are available in the supported games. Yard Darts and weapon-themed boards are virtual arcade activities.

**Nathan AI Sudoku Master**  
Play unique-solution Sudoku at three difficulty levels. Mark candidates, check your entries, ask for a hint, and continue an unfinished puzzle on your device.

**Tabor Retro Lab**  
Seed and evolve five cellular-automaton worlds in Zero & Void Lab. Then switch to Category Challenge, an original three-category quiz with newly written questions. Both activities run locally.

## App Review notes

- The first screen is a native searchable game shelf. Tap the named entry to open the bundled game. Choose **Library** to switch activities, and **Continue** to reopen the last activity. No sign-in is required.
- Scrambler comes with an example timetable. **Build draft** and **Apply to playback** show the full workflow. Local JSON export is a labeled simulation.
- For Yard Arcade, choose **Yard Darts**, **Hook & Ring**, **Swordplay Practice**, or **Spear Phalanx Target**. Select a local play mode. The iPhone package does not include online ranked play, cloud leaderboards, online brackets, advertising, or StoreKit offers.
- In Sudoku, choose **New puzzle** and tap a square and a number. In Retro Lab, open **Zero & Void Lab → One tick**, then **Category Challenge → Numbers**.
- For the questionnaire, disclose the fictional combat and weapons imagery present in Yard Arcade. The account holder must complete Apple's current questionnaires and confirm the resulting ratings. The app does not offer chat or a user-generated public feed.
- Privacy draft assumes the tested offline binaries and the supplied privacy manifest. Update App Store Connect if the shipping build adds network data collection or ads.

Privacy policy and support drafts are included as [PRIVACY.md](./PRIVACY.md) and [SUPPORT.md](./SUPPORT.md). Confirm their public URLs before entering them in App Store Connect.

## Before upload

1. Run the macOS simulator jobs and inspect the results and screenshots. Verify touch controls, save/restore, export, VoiceOver, cold launch in Airplane Mode, and iPhone layouts on real hardware.
2. Confirm the App Store names, support contact, rights, age rating responses, export compliance, and privacy answers. Publish approved privacy and support URLs and capture storefront screenshots from the reviewed build.
3. Select the authorized Apple Developer team in Xcode, register bundle IDs as needed, select a distribution provisioning method, and create signed Release archives. Verify the archive in Organizer, then upload to App Store Connect.
4. Check processed builds in TestFlight before attaching them to version 1.0.0 for App Review.

An unsigned validation IPA is build evidence. It cannot be uploaded as a distribution build.

See [Apple SDK requirements](https://developer.apple.com/news/upcoming-requirements/) and [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
