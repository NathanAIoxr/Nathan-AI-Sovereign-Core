# The Lost Brims

The Grand Atlas now opens 34 playable pocket worlds. Choose a named pair or one of its search-indexed variants, enter the brim, and tune three successive Pi/Phi and A-to-Z/Z-to-A passages. Finish to restore both pieces to the same player journey. Each world has its own entry, motifs, inscription, place note and landscape scene. Variants reuse the realm landscape and change its names and gate sequence.

- **Underwater** includes Doggerland, Pavlopetri, Thonis-Heracleion, Canopus, Alexandria’s Eastern Harbor, Baiae, Atlit-Yam, Port Royal, Sundaland and Zealandia.
- **Caves and cliffs** includes Cappadocia, Mesa Verde, Matera, Zhoukoudian, Shanidar, Ajanta, Petra and Vézère.
- **Trees and raised dwellings** includes five fictional canopy settlements, an architectural study of Korowai raised homes, Alpine pile dwellings and a fictional walkway at Nan Madol. The three documented places have different building traditions.
- **Myth and folklore** includes Atlantis, Lemuria, Yggdrasil, the Cap of Hades, Avalon, Xibalba, the Monkey King’s Cloud Path and the original Aurora Court.

The Wardrobe has three searchable collections: familiar headwear vocabulary, museum catalog records, and playable pairs. Museum object links use The Met’s permanent object IDs. The overview links to the V&A and Bard’s hat collections. Site notes link directly to the relevant archaeology, geology, ethnography or text. The game pairs are original designs, with the Cap of Hades and the Aurora pair retaining their story names. Holy and ceremonial headwear in the Wardrobe appears as reference material.

## Museum snapshot

[The Metropolitan Museum of Art Open Access](https://www.metmuseum.org/hubs/open-access) makes the basic catalog metadata available under CC0. The narrowed public snapshot in `met-headwear.mjs` contains only IDs and catalog fields. It includes cataloged garments, armor, and identifiable fragments and parts. It includes no images. The selector omits obvious false matches such as coins, paintings, hatboxes, and footwear toe caps. The snapshot reflects one collection, and the styles vocabulary includes familiar terms from outside that collection.

Rebuild with `python import-met-headwear.py MetObjects.csv` using the [official Met CSV](https://github.com/metmuseum/openaccess/blob/master/MetObjects.csv). Verify its SHA-256 against the header in `met-headwear.mjs`. Review changes in imported types and counts before publishing. The site renders each object’s museum record on demand when the player opens the Museum objects tab.

## D1 and Worker

`catalog.sql` defines four public-content tables. `node seed-catalog.mjs` prints an ordered schema and parameterized upserts for D1. Deploy every batch, then verify table counts, pair foreign keys, and museum IDs. Replaying the same seed leaves the same row counts. The in-browser Wardrobe reads release-versioned static assets. The Workers for Platforms app exposes `/api/expeditions` and `/api/catalog?kind=pairs|museum|styles` through its dispatch binding. These tables contain no player saves.

The existing Cloudflare Build Loop’s `pocket-worlds` draft provided the seeded-variant brief. This implementation keeps the stable realm and numeric variant in the ID to make duplicates impossible within a realm. The four other generated lanes remain in the original build plan for review against the established canon and game state.
