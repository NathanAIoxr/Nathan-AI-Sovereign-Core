# Sovereignty

Nathan AI's standalone Sovereign Box for **0 and 1**. Open the box at [Sovereignty](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/sovereignty).

- **0** means the box contains no input. **1** means it contains text or a file, including a selected file of zero bytes.
- **Forwards** preserves reading order. **Backwards** reverses text by grapheme cluster and files by byte. **Upside down** rotates the display 180°.
- **This side** is the front view. **As the mirror** flips left to right. **Other side** is the reverse face, reached by turning the frame over its top edge. This flips top to bottom.
- The nine tiles apply those combinations to the current frame. Passes compose using three independent reversible switches, so unlimited paths lead to eight distinct frames. All eight can be viewed directly.
- **Here / There / Everywhere** and **Past / Present / Future** are labels you set for a receipt. Receipts record the path, current frame, and input/output SHA-256 hashes for present input.
- Text and file bytes stay in browser memory. The box accepts files up to 16 MiB and text up to 80,000 UTF-16 code units. The byte and text exports reflect the reading order. Screen-only flips are recorded in the receipt.

Build with `node build.mjs`. Test with `node --test engine.test.mjs`. The Worker runs in the existing `nathan-tabor-platforms` dispatch namespace and uses the public cockpit site registry for routing. It serves the application and never receives box contents.
