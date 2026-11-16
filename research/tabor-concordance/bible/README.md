# Tabor Concordance · Bible root-word edition

Nathan Tabor’s concordance uses James Strong’s original numbering for 14,197 assigned entries. The H series contains 8,674 Hebrew and Aramaic entries. The G series contains 5,523 Greek entries, with G2717 and G3203–G3302 unassigned.

- [Main Bible app · Tabor Concordance](https://modern-day-bible-nathan-tabor.nathantabor.chatgpt.site/#tabor-concordance)
- [Complete editable CSV](Tabor_Concordance.csv)
- [Hebrew and Aramaic data](hebrew-aramaic.json) and [Greek data](greek.json)
- [Edition counts and upstream file hashes](edition.json)
- [Cover artwork](cover.webp)

The reader can look up a Strong’s number, original word, or transliteration. Its “Show all matching entries” control displays every matching row together. The CSV contains only the original identifier, the original-language word, and the root-word meaning. The searchable dataset also supplies language, transliteration, and linked root components for lookup. A tentative label retains Strong’s uncertainty. An unavailable entry means the digital inputs did not yield a usable root gloss for this edition. The project is a digital extraction with selected entries spot-checked against the dictionaries and an entry-by-entry print audit still pending.

## Rebuild

Use James Strong’s public-domain dictionary text from the [Open Scriptures Hebrew and Aramaic XML](https://github.com/openscriptures/strongs/blob/master/hebrew/StrongHebrewG.xml), edited by David Troidl and David Instone-Brewer, and [Ulrik Sandborg-Petersen’s Greek XML, v1.9](https://github.com/morphgnt/strongs-dictionary-xml/tree/dd6758b82f46b620804a8ea677d715844679eea1), released under CC0. The builder uses lexical and derivational content. It preserves the numbered series and excludes verse examples, translation lists, and usage tables from the concordance.

```sh
python build.py /path/to/StrongHebrewG.xml /path/to/strongsgreek.xml .
python -m http.server 8000
```

Open the local server to use the reader. File checksums in `edition.json` identify the source transcriptions. G4567 cross-references the immediately preceding Greek form G4566; the Greek XML marks that cross-reference as Hebrew.
