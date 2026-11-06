# Material Worlds — shared art, interaction, and free-access standard

Version 1.0 · 20 October 2026. Applies across apps and games; each product retains its own identity.

## Naming

Use **layered puzzle-strategy system**, **match-3 RPG with settlement progression**, **event-driven puzzle engine**, or **deterministic state-transition engine** when the implementation warrants that description. “Compression engine” and “ecosystem harmonizer” are creative labels, not evidence of superior performance or mathematical correctness.

## Access

No paid tokens, premium currency, purchase gates, gacha, paid retries, session-energy limits, or waiting for refills. All play and tools remain available without spending. Optional game-local tactical charge may express turn strategy; it must never gate app access or have a purchase path. Board-game pieces are pieces, not currency. Do not erase authored references to historical coins or existing source research.

## Shared visual grammar, distinct worlds

Painterly 2D characters: strong silhouettes, dramatic light, visible brushwork, readable outlines, clear poses at thumbnail size. Retain established character identities, markings, ages, authorship, and original assets. Do not substitute stock people or reuse one character as another.

Muted wood, leather, stone, and dark metal support the interface. Use restrained filigree and inset/outset edges. Reserve bright saturation and glow for actions and elemental matches. Elements: Fire/red, Nature/green, Ice/blue, Holy/yellow, Dark/purple. Include a distinct icon and accessible label for every element; color alone must not encode meaning.

Themes: Christmas = cedar/evergreen/champagne; alchemy = obsidian/ember/brass; mystery = walnut/parchment/amber; social deduction = burgundy/copper; logic = indigo/silver; imperial examination = ink/jade/aged paper; fairy tales = moss/oak/rose; ocular tools = graphite/patinated silver; archives = sepia/brass; Redstone = navy/iron/bronze. Adapt material intensity to the task. Reading and precision tools stay legible and calm.

Facet puzzle pieces as crystals or shields. Distinguish ordinary, four-match line/dragon pieces, and five-match shard/prism pieces by shape or insignia as well as glow. Existing mechanics keep their authored names and behavior unless explicitly revised.

## Effects contract

Logic emits structured events; effects consume them and never change state. `mw:match` carries cells with index, kind, and optional DOM node plus board reference. Troops originate at the cleared cells and move upward in their lanes. New lane-combat modes must use lane-aligned targets and explicitly specify whether open lanes miss or redirect. Never imply a purely visual effect implements damage.

Four-piece match: short elemental flash. Five-piece match: brief restrained impact and inward shard motion. Full charge: readable hero cut-in, then an elemental overlay; portrait identity comes from actual equipped hero assets. No arbitrary full-screen flashes. Reduce-motion mode uses static cues. Local performance budgets: at most 48 transient effect nodes, no unbounded particle loops, no background animation while hidden, clean up temporary nodes.

Settlements: fixed 2.5D orthographic/isometric view; tier changes visibly alter architecture. Ambient walkers, forge smoke, and fields are optional, low-frequency, and pause when hidden. Never transform an existing utility app into a combat screen to satisfy a shared standard.

## Asset pipeline

Layered illustration source may be Photoshop, Clip Studio, Krita, or equivalent. UI vectors may be Figma, Illustrator, Inkscape, or native SVG. Rig with Spine, Live2D, or an appropriate runtime only when licensed and necessary; browser builds can use canvas/CSS/WAAPI. Unity builds may use Shuriken. These are interchangeable production choices, not new requirements to install paid tools.

Export per-world texture atlases, 2–4px extruded gutters, pivot/trim/original-size metadata, nonrotated fallback frames, explicit scale variants, and stable frame IDs. Keep source layers outside runtime downloads. Validate transparent edges and device texture limits. Start at 1024 or 2048 atlas dimensions and measure actual target devices rather than claiming universal older-phone performance. Load only the active world; release retired scenes.

## Engine integrity

Per-instance seeded RNG, bounds-checked adjacent swaps, canonical ordered match sets, bounded cascades with rollback, guaranteed playable clean starting boards, replayable input logs, versioned export/import, and deterministic enemy tie-breaking. A deterministic client is not server verification; independent server replay and authenticated persistence are separate features.

## Current implementation scope

The runtime provides material surfaces, per-world palettes, faceted existing DOM gems, reduced-motion preferences, bounded sparks and lane-shaped visual feedback where match adapters exist. It does not magically supply painted portraits, skeletal rigs, isometric settlement assets, new hero skills, backend verification, or device performance measurements. Those must be built and verified per app.
