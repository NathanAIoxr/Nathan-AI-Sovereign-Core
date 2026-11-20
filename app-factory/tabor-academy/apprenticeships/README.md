# Tabor Academy Apprenticeships

The Academy route is `/tabor-academy/institution/apprenticeships/`. The catalog connects a community college and employer training model with the Department of Labor’s approved occupation workbook and mentor-guided Academy pathways. Archaeological exercises, documented historical apprenticeships, living traditions, documented withdrawals, current school examples, and proposals carry separate labels. A Federal occupation is a recognized occupation entry. A job opening requires a sponsor or employer.

The published workbook is dated by retrieval and identified by SHA-256. The snapshot retains all nonblank rows, leading zeroes in identifiers, training approaches, versions and term fields. Groups are keyed by the source’s RAPIDS code and title. One row has a blank code. An official occupation page includes all versions and approaches supplied for its entry.

## Verify and build

Run in this directory.

```sh
node --test test.mjs
node release.mjs > /tmp/tabor-academy-apprenticeships-modules.json
```

To update the federal snapshot, download the [official XLSX](https://www.apprenticeship.gov/sites/default/files/wps/approved-occupations.xlsx). Install `openpyxl` for the importer and pass the actual retrieval date. Review the row and entry counts and update the snapshot assertions.

```sh
python import-dol.py /path/to/approved-occupations.xlsx YYYY-MM-DD > registered.snapshot.mjs
```

`buildModules()` prepares the four flat modules for the Academy dispatch Worker. `installEntry(source)` composes the module around the existing `academy-entry.mjs` default. Publish the full module set with the existing primary module, retaining the other modules and bindings. Verify the home, federal search, a pre-cave route, the documented withdrawals, and the existing Academy routes.

The Academy handoff is served at `/tabor-academy/institution/apprenticeships/conductor.json`.
