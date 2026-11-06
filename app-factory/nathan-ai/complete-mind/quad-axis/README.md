# Nathan Tabor Quad-Axis Cipher

Additive four-master cipher reconstruction. Leonardo / Mirror / Navel; Raphael / Harmonic Shift / Sphere (keys 3, 7, 12); Donatello / Ground / Base (moduli 4, 9, 16); Michelangelo / Tension / odd-index ROT13.

Run `node --test engine.test.cjs`. Use `index.html` as a self-contained browser UI (with adjacent `engine.js`). Encode each master separately or apply full stack; reverse master order to decode stack.

Historical attribution: Leonardo's mirror writing is documented. The other masters' assignments are modern Nathan Tabor interpretations, not authenticated Renaissance ciphers. The original pasted vertical glyph map is not fully reversible; its implementation uses row-order and character-order reversal, representing a lossless 180-degree text-grid transform without glyph rotation. Double reverse is identity, a seal check. Non-ASCII characters are preserved in shift modes. These ciphers are for study and creative transformation, not protection of secrets.

1+1=2 BUILD. 1−1=0 CLEAR. Original records remain preserved.
