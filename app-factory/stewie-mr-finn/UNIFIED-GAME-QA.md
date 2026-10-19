# Stewart & Mr. Finn — One Adventure / Pacing QA

Status: **feature branch; not an App Store release**. This map is an integrated navigation layer over the original offline games; it is not a replacement of their saves or a new single unlock ledger.

## Play route

1. Home → **Enter my one big adventure**. Choose Stewart or Mr. Finn; preserve their original artwork.
2. On **One Adventure**, check persistent stars, original 48-board count and Polar 16-chapter count.
3. Open **The Six Worlds** and complete/replay a board; return. Count must update without granting duplicate star rewards.
4. Open **Polar Family**, complete a three-clue chapter; leave and relaunch mid-chapter to verify restoration. All 48 Polar challenges remain in their 16 chapters.
5. Expand each world, launch every linked activity, return to this map:
   - Puzzlewood: Puzzle Pals, seven treasures, Challenge Lab
   - Biscuit Hollow: Biscuit Factory, sticker playroom
   - Mirror Maze: Mirror Bridge, Middle C
   - Champ's Trail: snack game, character family
   - Ace's Meadow: freeze dance, trust quiz
   - Mammal Bond: story time, Polar Family
6. Verify the previous native campaign ratings, Polar checkpoints, local star awards, findings, and sticker saves persist. No data migration or clearing is part of this change.

## Pace experiments

| Mode | Wrong-pair reveal | Decorative animation | Answer flow |
|---|---:|---:|---|
| Calm | 1.70 s | 0.45 s | Waits for next tap |
| Steady (default) | 1.00 s | 0.25 s | Waits for next tap |
| Quick | 0.55 s | 0.12 s | Waits for next tap |

Change pace on the adventure map or under **Grown-Up Corner**. Verify both the original campaign memory boards and **Puzzle Pals** use the new reveal duration. Set iOS **Reduce Motion** and verify feedback scrolling and decorative animation do not animate unnecessarily. None of the modes enforces a timer to answer questions.

## Performance and acceptance checks

- Check compact and large iPhones at regular and accessibility text sizes. Expanded world artwork must stay within the card; collapsed worlds should not render all artwork eagerly.
- Confirm all 6 world sections and the primary two campaign buttons are visible and tappable. VoiceOver should announce the world name and expand/collapse state.
- Verify web games launch with bundled offline files, especially Middle C and Mirror Bridge. Their JavaScript game-specific state remains local; it is **not yet combined into the native star ledger**.
- Verify rapid tapping during the wrong-pair pause does not reveal a third card. Changing pace between rounds must not lose state.
- Check first launch, pause/resume after app termination, replay, no network/airplane mode, Grown-Up Corner toggles, and existing screenshot QA.
- Review visual screenshots with an owner, not just the presence of PNG artifacts.

## Limits

CI native Swift progression tests and web engine unit tests exercise game logic; simulator launches/screenshots do **not** substitute for a human completing every interaction. Physical-device testing, TestFlight, signing, support/privacy publication and App Store submission remain separate release gates.

Code changes belong on `feature/stewart-finn-unified-adventure`, not directly on the 6.2 App Store release branch.
