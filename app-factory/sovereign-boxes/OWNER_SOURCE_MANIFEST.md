# Owner source catalog integrity manifest

**Creator:** Nathan Tabor. **Public status:** fingerprints and counts only, source content remains owner-controlled.

| Original owner-controlled file | Records | Exact size | SHA-256 |
|---|---:|---:|---|
| `ORIGINAL_101_GAMES_PRESERVED.csv` | 101 original numbered game families | 24,847 bytes | `08f4481c37577c6483577fda9b84e17ac8c32c9ab254b89a154ef10bd7089bb4` |
| `NEW_101_TO_901_IDEAS_PRIVATE.csv` | 496 proposed independent concepts | 181,038 bytes | `fe53bc480076ba85206d9d21a0e8a15eded882e7e80b6c64e7c577f35c527e81` |
| `PRIOR_150_CATALOG_PRESERVED_PRIVATE.json` | 150 earlier factory/catalog source records | 101,530 bytes | `9db4ff608a653799e7b9047e8dadc07557bb4d8bb48eb7fdd1d00ca517f7ce58` |
| `ROOT_RELATIONSHIPS_PRIVATE.json` | Relationship graph for catalog expansion | 103,870 bytes | `20f722178178ed2b0dd81e9f8a3f84c85ee1be25e0e658dd218b061ac7359515` |

All these files are included with the original image in `TABOR_SOVEREIGN_BOXES_BETTER_TOGETHER_GITHUB_HANDOFF.zip` in the conversation.

## Root mapping

- **Existing original 101 game titles**: publicly indexed as `TW-001…TW-101`, and not necessarily implemented games.
- **496 proposed historical/creative ideas**: `R101…R956` in nine separately defined ranges with category counts 55 × 8 + 56; public site exposes **IDs only** while the private CSV contains the actual titles and descriptions. Opening the CSV through the local importer reveals full private titles *in this browser only*.
- **Earlier 150 original catalog rows**: locally import using original `catalog_id` preserved, mapped to `SRC:<catalog_id>` solely for the unified **view**. This does not create 150 new public products nor discard the original `catalog_id`.
- **Factory modules**: current `APP:<id>` entries mirror the actual public Factory `products.json` file.
- **Total publicly indexed**: 618 boxes (101 + 496 + 21). **After importing the private 150**: 768 catalog units, with overlaps maintained as explicit relationships rather than pretending each is a different live application.

Do not confuse original `TW-001` with `TW001` concepts, and do not mix ONE's technical 101–901 module numbers with the Factory creative 101–901 categories.

## Source release restriction

This repository is PUBLIC. Private source content, private original imagery, user personal records, confidential research, keys, and licensed media should not be committed without informed release approval and appropriate redaction/rights review. A SHA-256 digest proves content consistency, not ownership, authenticity or authorship.
