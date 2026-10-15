# Stewart & Mr. Finn — The Mirror Bridge: PAWS ↔ SWAP
**Original educational puzzle branch of The Adventures of Stewart & Mr. Finn** · Nathan Tabor

## Play and placement
[Play the Mirror Bridge](./index.html) inside the existing [HO ↔ OH Polar Middle C](../index.html) family. The code lives in `app-factory/stewie-mr-finn/polar-middle-c/mirror-bridge/`; a byte-identical offline copy lives in `app-factory/stewie-mr-finn/Resources/PolarMiddleC/mirror-bridge/` for the existing SwiftUI WebKit iPhone view.

## Original characters and mechanics
Stewart (Stewie) and Mr. Finn, whose black-and-white patchwork markings complement each other, guide learners between the North Paw and South Paw houses. Santa Dog says HO, Ozzie says OH.

* **Above C:** Read a word and identify its ordinary/contextual meaning.
* **Below C:** Reverse the spelling exactly. PAWS ⇄ SWAP is a real two-way English word pair. Reverse twice to restore the starting word; characters and their counts are invariant.
* **Middle C:** Solve the opposing motor torque challenge and play with the zero-acceleration simulation. With torque on one fixed axis, the simplified model uses total torque τ₁ + τ₂ = Iα. Balancing to zero torque eliminates angular acceleration, **not necessarily existing angular velocity**.
* **Free explorer:** Reverse a player's own word and check mechanical balance using two torque sliders and a selectable initial angular velocity.

The fictional Middle C metaphor designates consciousnesses and ethical reflection in this game world. That symbolism is distinct from measured physical consciousness, real linguistics, actual forces, or historical facts.

The project has 12 curated word prompts, 3 stages per bridge, and a repeatable index up to 1 billion. That index is procedural reuse of content, not 1 billion historically unique puzzles.

## IP and release safety
This branch was **rewritten from scratch as original code, explanatory text, UI and vector graphics**. It contains:
- No names, plot, dialogue, insignia, appearances, images, frames, voices, or world-building copied from outside film/game franchises.
- No downloaded or hot-linked third-party images, audio, scripts, or fonts.
- No third-party source-code dependency beyond the locally owned Factory Middle C engine.
- No imported novel/trademarkable AI persona, no attempted imitation of protected characters.
- Literal, general mathematical and educational concepts instead of third-party fiction.
- No ads, purchases, child tracking, logins, profile inference, or outbound network operation in the branch.

**Not legal clearance:** This removes obvious third-party source content from this specific branch but doesn't prove a product title or franchise name is free of every third-party trademark. Before advertising or publishing commercially, search proposed product names, logos, app category and regions using USPTO and relevant registries, check common-law usage and get legal review where necessary. The user's existing pet character names, branding and artwork also require an owner-controlled provenance record. Other Factory modules are not changed by this module's compliance review.

Relevant background: U.S. Copyright Office guidance on games https://www.copyright.gov/register/tx-games.html and federal trademark searching https://www.uspto.gov/trademarks/search/federal-trademark-searching. Linked citations are references, not copied source assets.

## Technical and test commands
- Pure JavaScript: `engine.js`, using `app-factory/middle-c/game.js` for character reversal and seeded choices.
- Responsive local HTML: `index.html`, using only authored SVG geometry and characters.
- iOS wrapper: existing `Sources/PolarMiddleCView.swift` presents the polar branch (follow link inside the bundled page).
- Tests: `node --test app-factory/stewie-mr-finn/polar-middle-c/mirror-bridge/engine.test.cjs`.

Retains the existing 48-board native campaign and current save keys. The module is a playable local/browser prototype, **not a signed or App Store-shipped build**. Revalidate with a real iPhone prior to any release.
