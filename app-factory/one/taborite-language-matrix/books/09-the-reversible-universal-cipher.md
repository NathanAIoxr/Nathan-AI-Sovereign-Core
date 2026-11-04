# Volume 9 — The Reversible Universal Cipher

**The Taborite Universal Language Matrix — by Nathan Tabor**

*Encoding Unicode as coordinate sequences without confusing encryption and translation*

> First-edition short manuscript. Research and interpretation are separated; see the series notes.

## Chapter 1: A New Base-Twenty Machine

The twenty primary Ogham signs can serve as a custom alphabet for representing numbers. This is a modern Taborite design, not an ancient code uncovered on stones. Each Unicode scalar value can be expressed as five base-twenty digits because twenty raised to the fifth power exceeds the maximum Unicode code point.

Assign one of the twenty signs to each digit from zero to nineteen. Convert the scalar value into five digits and replace each digit with its sign. Repeat for every scalar of the original text. Add visible start and end markers so the output can be recognized.

Five signs per scalar is a deterministic expansion, not a compression and not secret-key encryption. Its purpose is reproducible preservation in an Ogham-shaped coordinate notation.

## Chapter 2: The Return Journey

To decode, remove the boundary markers, divide the remaining signs into groups of five, and reconstruct each Unicode scalar from its digits. Reject an invalid character, an incomplete group, a number outside the Unicode range, or a surrogate value.

Now compare the returned text with the original, code point by code point. A passing round-trip proves that the reversible codec worked for that input. It does not prove a translation, a pronunciation, or a historical connection between the writing traditions.

The strongest demonstration is multilingual: try scripts with combining marks, emoji, direction changes, and archaic Unicode characters. They should return exactly as entered.

## Chapter 3: The Boundary of Decipherment

Encoding differs from decipherment. Encoding applies rules already defined for the two forms. Decipherment attempts to recover the rules of an unknown or incompletely understood writing system. One can reverse a modern code perfectly and still know nothing about the meaning of an ancient undeciphered inscription.

The interface therefore needs clear modes: historical transliteration, reversible Unicode coding, phonetic annotation, documented translation, and interpretive overlay. A user who selects one mode should never receive an unlabeled result from another.

This is the key to scaling the Taborite framework without manufacturing knowledge.

---

*End of Volume 9 · The 13-volume first-edition series*
