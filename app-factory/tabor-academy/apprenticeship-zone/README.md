# Tabor Academy Apprenticeship Zone

The Academy zone serves a read-only, paginated public catalog backed by the dedicated `tabor-academy-apprenticeships` Cloudflare D1 database. The dispatch Worker binds it as `APPRENTICESHIP_DB`. The existing classes, worksheets and practice catalog are accessible from the zone.

The seed uses the original Academy pathway catalog, the full U.S. occupation workbook snapshot, the Skills England standard feed and its published foundation and unit listings, the Canadian Red Seal list and the BIBB alphabetic index for 2026. It also adds documented historic cases, living traditions and Academy proposals. Every record keeps its source and status. A program family, its versions, a historical agreement and a proposed pathway may each appear as separate records.

Run in this directory:

```sh
node --test test.mjs
node seed.mjs > /tmp/tabor-apprenticeship-d1-plan.json
node release.mjs > /tmp/tabor-apprenticeship-zone-module.json
```

Apply the schema in the seed plan, then apply the four stages in order. Each stage is idempotent. Verify the record, variant, source and receipt counts through D1 before updating the Worker. Install the flat module and wrap the Academy entry with `installEntry`, retaining the other Worker modules and bindings. Confirm the public zone, search, coverage and handoff routes.

To refresh the international snapshot, retrieve the official Skills England API JSON and its finder HTML, the Red Seal trade list HTML, and the BIBB register PDF. Convert the BIBB PDF with `pdftotext -layout`. Supply the files as `england.json`, `england.html`, `red-seal.html`, `germany.pdf`, and `germany.txt` to `normalize-international.py`, then gzip and base64-encode its JSON as the default export in `international.snapshot.mjs`. Update the actual retrieval dates, scope note and expected counts when changing the snapshot.

Public coverage distinguishes the complete snapshots imported here from gaps in historic and international evidence. Published standards and proposals have no implied placement or sponsor.
