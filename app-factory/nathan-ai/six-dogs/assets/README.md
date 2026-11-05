# Nathan AI — Sovereign Prism Visual System

**Release target:** Nathan AI / ONE / Six Dogs, additive visual layer.

This folder contains **12 original, self-contained SVG artwork files** and `visual-registry.json`:
- Brand mark, panoramic network hero, user-sovereignty shield
- Six individually named and styled canine character emblems: KNICK, KNACK, PADDY, WHACK, DOG, BONE
- Six-stage pipeline graphic, eight-node topology graphic, and low-voltage controller concept illustration

No human figures, faces, or invented portraits. No fonts, remotely hosted images, raster photo libraries or tracking resources are bundled. All SVGs are vector, local, resize without quality loss and include accessible SVG titles. Where a graphic repeats adjacent visible text, the UI gives it an empty decorative image alt; otherwise images have descriptive alt.

## App visual integration

- `../index.html`: new Sovereign Prism hero, illustrated six-dog identity gallery, physical/controller/topology/pipeline illustrations, privacy shield.
- `../skin.css`: responsive, reduced-motion-aware branded layout and visual system that preserves the existing accessible Nathan AI appearance selector.
- `../app.js`: loads a matching local emblem into each interactive Six Dogs stage button; the underlying state machine and source order are not altered.
- `../../appearance/engine.js`: adds **Sovereign Prism** as a thirteenth selectable application-wide theme, while retaining the original 12.
- `../../index.html` and `../../../one/index.html`: visual entry points to the Six Dogs module, preserving the existing main applications.

## Color roles

| Role | Token |
|---|---|
| Midnight background | `#081320` |
| Panel | `#132b40` |
| Foreground | `#f3f8fd` |
| Sea-glass accent | `#a5eee7` |
| Ceremonial gold | `#e9d69d` |
| Supporting text | `#bfd4e2` |

Identity accent colors are included in `visual-registry.json` and stage SVGs. All text and button surface pairs used in the shared appearance engine must pass the repository's WCAG contrast tests.

## Evidence labels and scope

The artwork and UI are original visual interpretations of an author-defined six-step system. Illustrated technical topology, P2P routes, hardware diagrams and cybersecurity imagery are **not statements of real deployment, proof of consciousness, validated emotion detection, or tested clinical effectiveness**.

Six Dogs state processing, export/import, local permission controls and the independently tested Python micro/macro files remain unchanged and usable if illustrations fail to load.

The hardware image is a concept drawing, not an electrical schematic; use `../hardware/README.md` for the authoritative wiring instructions. Only actual hardware testing can establish physical controller behavior.

## Validation

Run `node --test app-factory/nathan-ai/six-dogs/visual-assets.test.cjs` and the existing Six Dogs/appearance regression suites. Browser review should cover 320 px mobile, 768 px tablet, 1440 px desktop, keyboard-only navigation, reduced motion, dark and light accessible appearance presets, local/offline loading and alt text.

**Visual asset registry:** `visual-registry.json`.
