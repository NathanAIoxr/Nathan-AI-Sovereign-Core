# Tabor Academy Blueprint Restoration

This project restores the 30-card spreadsheet-structured Blueprint Explorer while retaining the original eight-layer Personal Intelligence records.

## Architecture
- `blueprint_lessons`: exact 15 fixed columns, one complete comparison per row, 30 lesson rows.
- `blueprint_lifecycle`: normalized sidecar keyed by lesson ID, preserving the eighth lifecycle/state-change layer omitted from the 15-column specification.
- `blueprint_provenance`: separate source status and accuracy notes, not merged into lesson text.
- Default Instant Blueprint mode shows all answer columns. Investigative Mode returns only seven public fields from the API.
- Keep independent Academy 22-game and PI Spider projects connected by IDs, not copied blobs.

## Source package
The full restored source tree was generated as a conversation artifact. The GitHub branch currently contains this restoration manifest; the application files and migrations must be imported and reviewed before deployment.

## Handoffs
#516 Spider Web, #517 22 Games, #518 30 Blueprints, #519 Personal Intelligence, #520 flat schema/deploy.

## Status
Do not claim deployed. Verify Cloudflare account bindings, run tests, apply migrations, then deploy and record real URLs.
