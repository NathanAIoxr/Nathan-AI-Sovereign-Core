# Tabor ONE — Unified Symbol and Sound Engine (v0.1)

Open `index.html` in a modern browser. Works offline, no installation required.

## Includes
- Comparative cave mark **constructed codes**, Ogham Unicode transcription, international Morse, UTF-8 bit strings.
- Per-word mirror mode (UNO -> ONU).
- Searchable **100-entry** constructed lexicon in `lexicon.json`.
- The user's 12 original definitions (marks, codes, and spoken names) preserved as given.
- 88 **proposed new** terms in an isolated 9-bit namespace (`1` + 8-bit numeric ID), without altering legacy 4-bit symbols.

## Scope and historical precision
The cave-mark and dot/dash speech mappings are modern creative constructions, not deciphered Paleolithic writing. Ogham symbols encode letters, not numeral 1-4. Some Latin letters have no simple equivalent among the 20 primary Ogham characters. Morse and binary are mechanical encodings of text, **not** language translation. Bit pattern `1110` represents the decimal number 14 in 4-bit encoding; its meaning "Birth" is user-defined. The original user's reference to `1110` and Y is preserved in the constructed lexicon, without asserting that it corresponds to ASCII Y or a historically attested Ogham character.

## Limitations
- For Spanish accented letters, Ogham and Morse use a basic accent-folded transcription, whereas binary preserves the raw UTF-8 input.
- Most English/Spanish vocabulary is not in the 100-word conlang; unknown words are explicitly marked unmapped rather than guessed.
- This is a comparative encoding tool with an early grammatical sketch, not a general English-to-conlang semantic translator.
- Original 12 words have exact author-supplied spellings, sound cues, and bit patterns; newly proposed words are clearly marked.