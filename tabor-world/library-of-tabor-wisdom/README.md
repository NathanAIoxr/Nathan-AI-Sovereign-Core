# Library of Tabor Wisdom Catalog

The catalog preserves the submitted titles, descriptions, entry numbers 1–101,
and eight collection headings. The existing Library of Tabor archive holds one
collection guide plus 101 searchable research records. The Wisdom Worker reads
the same records from D1 and serves a browser catalog and JSON API.

- [Wisdom Catalog](https://library-of-tabor-wisdom.nathantaboract.workers.dev/)
- [Full catalog JSON](https://library-of-tabor-wisdom.nathantaboract.workers.dev/api/catalog)
- [Archive collection guide](https://library-of-tabor-archive.nathantaboract.workers.dev/works/tabor-wisdom)

The descriptions are preserved as proposals. Record status is
`cataloged-proposal`. Source editions, scholarly verification, and the proposed
engine implementations are tracked independently.

## Deployment

Run from this directory using the existing archive database and its
`archive_works` schema. The import adds only the reserved `tabor-wisdom` IDs.
Reapplying this release leaves an existing row for an ID intact.

```sh
npx wrangler d1 execute library-of-tabor-archive --remote --file=import.sql
npx wrangler deploy
```

Run a count over the numbered records to verify that there are 101. Visit
`/api/entries/001` and `/api/entries/101` to verify the first and last records.
Pass `q` or `group` (1–8) to the browser or JSON catalog to filter entries.
