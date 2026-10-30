# ONE Connected System — private source-first import workflow (v2)

**Public integration instructions only. No private data, manuscript, catalog, identifier dump, or credential is committed here.**

ONE already has two complementary browser tools:
- [ONE Master Library](../library/index.html): locally imports the owner's JSON packs into IndexedDB.
- [ONE Connected System](./index.html): discovers that local library and the Creator Vault and imports source-relationship manifests.

## Import sequence

1. Back up original files independently. Only use packs created or approved by the owner.
2. In ONE Master Library, import the **original private v051** pack (if not previously imported).
3. Import the **D17 / 33 Million Book Library bridge v1** JSON.
4. Import the **Connect-All addon v2** JSON containing indexed Totality, project, Factory and recent-file reference entries.
5. In ONE Connected System, refresh the local index; import the **Connected Relationships v2** JSON under its relationship import control.
6. Verify the displayed counts, search for expected original IDs, and export a relationship backup.

Each pack is **private and stored on the device**. This repo stores **no** private pack, full manuscript, family testimony, images, ChatGPT Library export, or import manifest containing personal file identifiers.

## Supported schemas

The existing Master Library importer accepts `one.library.private-pack.v1` with a `records` array and preserves each source's original SHA-based source identity. The Connected System accepts `one.connected.owner-links.v1` with `links` entries containing `from`, `to` and one supported `type` such as `references` or `belongs-to`.

References must be built against the exact SHA of each **actual imported file**. Renaming a JSON file does not change SHA identity, but editing/reformatting its bytes does. If a pack is modified, rebuild and validate the relationship file. Never treat a title-only similarity as an established identity.

## Operational boundaries

- Public ONE pages cannot read ChatGPT Library files or Drive documents unless the owner explicitly imports their contents or connects and authorizes a supported provider.
- Offline local indexes are **not** continuously synchronized with ChatGPT, Google Drive, GitHub, Nathan AI engines, or other devices.
- The 33-million-book number is reserved publishing capacity, not a verified completed manuscript total.
- Code-based language entries and constructed-language research leads are not all extant, spoken or linguistically verified.
- Existing source files and manuscripts must not be overwritten by catalog integration. Any publication needs explicit owner approval.

**NATHAN AI → TABOR ROOT → TABOR 1-2-3 FACTORY → ONE**

BUILD: 1+1=2 · CLEAR: 1−1=0 · YES IS YES — NO IS NO
