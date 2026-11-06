# Nathan Tabor websites · Public navigation and visual system

Author: **Nathan Tabor**. Public source and brand update: 2026-11-06.

## Visitor-facing homepages

- [Nathan Tabor Home](../app-factory/sites/nathan-tabor/) — plain-language personal gateway.
- [The Church of Innocence](../app-factory/sites/church-of-innocence/) — mission, KJV framework, five pillars and 101/133/46 searchable source titles.
- [All Websites](../app-factory/sites/) — existing independent sites and additional public modules.
- [Nathan AI Main Hub](../app-factory/nathan-ai/) — original apps, games, creative tools and source navigation.
- [ONE](../app-factory/one/) — original ONE system, kept separate.

## Design system

- `nathan-tabor-banner.svg` is an original, editable, text-first SVG hero banner with a gold compass/star/rose-like motif. It has no human faces or portraits.
- `nathan-tabor.css` supplies accessible dark/gold responsive styling, reusable site cards and a layered SVG backdrop.
- `nathan-tabor.js` inserts only a top visitor navigation strip. Existing app source, menus, controls and titles remain accessible.
- The root GitHub README embeds the SVG, because GitHub's native interface itself cannot be reskinned by repository CSS.

## Clear public labels

| Visitor label | Meaning |
| --- | --- |
| **Home** | Nathan Tabor's overview |
| **All Websites** | Network of separately named sites |
| **Apps & Games** | Browser application/game pages |
| **Books & Library** | Public original writings and indexed releases |
| **Church of Innocence** | Original author-defined spiritual/ethics framework and source index |
| **GitHub Source** | Repository files, code and project history |

Old 'front door' language on main visitor-facing pages has been replaced with ordinary navigation words. This updates public presentation, not the independent original source identities.

## Public/private and evidence boundaries

The Church site publishes 101 author-authored **titles**, 133 spiritual-work catalog **titles**, and 46 recovery-register **project-family names** with category and development-stage labels. The full source manuscript, unedited private crosswalk, private Library IDs, email conversations, personal history and sensitive case documents remain outside public GitHub. A catalog title is not proof a business, church, donation system, real-time safety service or technical program is active.

**Innocence protection in the real world uses appropriate services, lawful reporting and consent; fictional warriors and symbolic 'wrath' are not authorization for private violence.** No payment collection, child intake, user accounts or donor database was added.

## Maintenance and release

The release packager includes the `branding/` directory so the visual assets work after the static site is zipped. Run:

```sh
node --test app-factory/sites/innocence-brand.test.cjs
node --test app-factory/sites/sites.test.cjs
node --test app-factory/nathan-ai/websites/dedupe.test.cjs
python3 -B tools/release/check.py --out ../repository-checks
python3 -B tools/release/build.py --out ../repository-release
```

The original nine independent **local planning studios** remain nine; the Church site and Nathan Tabor Home are two separate public information gateways. Neither app nor original text was overwritten or removed.
