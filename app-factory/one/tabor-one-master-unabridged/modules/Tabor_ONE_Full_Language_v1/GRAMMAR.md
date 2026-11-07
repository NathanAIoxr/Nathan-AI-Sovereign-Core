# TABOR ONE — Complete proposed grammar, version 1.0

This is a newly defined constructed-language grammar. It is NOT a decipherment of Ice Age symbols or evidence of the original language of humanity. The 12 supplied starter roots are canon and are never overwritten. The added 88 definitions, grammatical operators, and syntax below are a proposed extension.

## 1. Canon and namespaces

- Source primitives: `•` = short/point, `—` = long/stroke. They are visual primitives; they do not necessarily correspond to historical binary 0 and 1.
- Canonical initial root ID is the original four-bit code, including `BIRTH=1110` and `END=1111`. The code `1110` has a user-defined meaning, not the ASCII value for Y.
- Newly added 88 dictionary entries have *nine-bit IDs* beginning `1`; they are NOT alternate spellings of original roots. Their proposed glyphs and spoken forms are derived mechanically using `0 => • / Ti` and `1 => — / Da`.
- Letters in the 20-character Tabor alphabet have independent five-bit IDs. These are not Ogham historical numeric values.
- Segmentation matters: `WORD:`, `LETTER:`, `NUMBER:`, `UTF8:`, and `OP:` are separate typed domains; they prevent code collisions.

## 2. Phonology

- Primitive short unit `Ti` is two phonetic segments /t/ + /i/ (illustrative).
- Primitive long unit `Da` is /d/ + /a/ (illustrative).
- The 20-character alphabet has 5 proposed vowel categories and 15 proposed consonant categories; see `alphabet.json`.
- Original lexical exceptions are deliberate (`Y => Ya`, `╳ => Ka`, `ONE => Ti`, `TWO => Titi`), maintained verbatim.
- Phonetic extensions are generated from binary ID; e.g., `100001110` maps to `Da-Ti-Ti-Ti-Ti-Da-Da-Da-Ti`. These are identifier pronunciations, not independently evolved natural word forms.
- Words are separated by short pauses and text spaces. Syllables within extended roots are separated with hyphens for legibility.
- African click consonants /ǀ ǃ ǁ ǂ ʘ/ may be recorded in a comparative IPA field, but are NOT presumed to be ancestral to Tabor or to a given historical language.

## 3. Nouns and nominal modifiers

- A noun is an uninflected lexical root: `ANIMAL`, `WATER`, `PERSON`, `SHELTER`.
- Quantifier preceding or following nominal within an explicit phrase is represented with the `COUNT` particle in the gloss: `ANIMAL TWO` means two animals. Bare `ANIMAL` has unspecified quantity.
- The original `TWO` can mean two/pair; the token is not claimed to automatically mean two herds rather than two individual animals.
- `MANY`, `FEW`, `ALL`, `NONE` are distinct lexical roots; there is no automatic plural inflection.
- `OF` (10-bit grammar operator `OP:0000000001`) marks possession/association: `CHILD OF PARENT`.

## 4. Clause order

Main clause: `SUBJECT [QUANTITY] [TIME] [POLARITY] ACTION [OBJECT] [PLACE]`.

- SUBJECT is a noun or pronoun root.
- QUANTITY is a number or quantifier root.
- TIME is optionally `BEFORE`, `NOW`, `AFTER` (lexical time) or temporal operators `PAST` and `FUTURE`.
- POLARITY is `NEG` or omitted.
- ACTION is a predicate root such as `GO`, `SEE`, `HELP`, `BIRTH`.
- OBJECT and PLACE are optional; `AT` before a location disambiguates the latter.
- Unlike the previous informal draft, a transitive action can be distinct from its place phrase; the symbol `Y` keeps its author's multivalent `Birth / Begin / Create` meaning.

Example 1: `ANIMAL TWO BIRTH AT WATER` = "Two animals give birth at the water." (choice of birth sense is explicit in gloss).

Example 2: `PERSON NOW HELP CHILD` = "A person helps a child now."

Example 3: `FAMILY FUTURE BUILD SHELTER` = "The family will build a shelter."

Example 4: `PERSON NEG TAKE WATER` = "A person does not take water."

Example 5: `QUESTION PERSON SEE STAR` = "Does a person see a star?" (yes/no question marker).

Example 6: `PERSON SEE ANIMAL AT WATER` = "A person sees an animal at the river/water."

The nouns `PERSON`, `FAMILY`, and `CHILD` are from the proposed extension, not from the user's original twelve.

## 5. Operators and grammar markers

These operate in an **independent 10-bit operator namespace**, so there are no collisions with 4-bit original roots, 5-bit letters, or 9-bit new words.

| Name | Typed code | Meaning | Position |
|---|---|---|---|
| AT | OP:0000000000 | Introduces location | Before place noun |
| OF | OP:0000000001 | Possession/relationship | Between nouns |
| PAST | OP:0000000010 | Completed event | Before action |
| FUTURE | OP:0000000011 | Future event | Before action |
| NEG | OP:0000000100 | Negation | Before action |
| QUESTION | OP:0000000101 | Yes/no inquiry | Clause start |
| AND | OP:0000000110 | Connect two phrases | Between phrases |
| OR | OP:0000000111 | Alternatives | Between phrases |
| IF | OP:0000001000 | Conditional clause | Before subordinate clause |
| BECAUSE | OP:0000001001 | Explanation | Before reason clause |
| TOPIC | OP:0000001010 | Introduce topicalized noun | Clause start |
| EMPHASIS | OP:0000001011 | Emphatic modifier | Before modified phrase |

**Operational statement versus conditional statement:** `IF` is a linguistic word for discussing hypothetical situations; it is not a "gray area" in a binary approval decision. Final approval remains YES/NO.

## 6. Questions and negation

- A yes/no question begins with `QUESTION`. A response can be the lexicon roots `YES` or `NO`.
- Negation uses a distinct `NEG` operator; mirror reversal is NOT treated as meaning reversal because reversing spelling can create a different word or no meaningful word.
- Semantic antonyms are registered explicitly: YES/NO, LIGHT/DARK, BEFORE/AFTER, UP/DOWN, LEFT/RIGHT, TRUTH/FALSEHOOD. These do not follow automatically from bit reversal.

## 7. Numbers, calendar and time

- Decimal 0–13 are catalogued with tally displays; 13 is a valid number, not a single 4-bit digit beyond decimal 15.
- A base-13 positional number uses symbols `0..9 A B C`, with A=10, B=11, C=12. Examples: decimal 12=`C`, 13=`10`, 26=`20`, 169=`100`.
- Binary integer representation uses standard positional powers of two.
- "12–13 moons per solar year" is an astronomical approximation, not evidence of an actual Ice Age base-13 language.
- The symbolic count of 13 cycles is author-defined and is not imposed on historical calendars.

## 8. Writing conventions

- 20 historic Ogham base letters provide a reference transliteration. The 20-letter Tabor alphabet uses its supplied 5-bit IDs, with original 20 sketches preserved as submitted.
- User's row `Z: |////` is retained in `alphabet.json`; historical Ogham `ᚎ` is conventionally *straif*, often written `ST`. The two readings must not be silently merged.
- `C/K` is one alphabet position, not two. `NG` is one letter position, not two individual letter positions.
- Unsupported letters in Unicode Ogham transcription appear in brackets. In particular, primary traditional Ogham does not have a direct one-character representation for every modern English letter.

## 9. Parsing and disambiguation

- A **lexical** translator performs exact dictionary lookup, not automatic translation from arbitrary English or Spanish.
- To interpret a clause, identify recognized roots, then grammatical operators, then structural roles. Unknown roots remain `UNMAPPED` rather than guessed.
- Multi-valued roots (`BIRTH` = birth/begin/create) require a gloss or explicit context to select an English translation.
- The system's integrity check tests reversibility of *bytes* and *typed IDs*, not equivalence of meanings.

## 10. The original example, preserved

Written: `^ · • • · Y · ~`

Binary: `0111 0010 1110 0110`

Spoken: `Ti-da-da titi ya ti-da-ti`

Original supplied translation: `The herd (2) arrives/gives birth at the river.`

This original example is retained exactly, including its ambiguity. A more specific grammatical gloss is proposed in section 4; it does not replace the original.