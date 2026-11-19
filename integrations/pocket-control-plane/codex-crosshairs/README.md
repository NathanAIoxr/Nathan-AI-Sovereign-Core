# Codex Crosshairs

One view for each pairing of Forward, Backward, and Upside down with This side of the mirror, As the mirror, and Other side of the mirror. A shared project selector updates all nine at once. Browse the numbered originals, all projects, or any of the six Pocket Codex collections. Search brings a project into focus while preserving the order of the collection. The URL keeps the selected collection and project. The two symbolic anchors stay fixed across every view.

Forward follows Codex 0 through 9. Backward reverses sequence without rotating the source. Upside down rotates 180° around the crosshairs. Other side reflects across the vertical axis. As the mirror displays the selected position and its reflection across that axis. These operations leave the source text and stable Codex IDs intact.

Build input comes from the Pocket Codex release manifest and public project summaries. The reader opens numbered original emails from the recovery ZIP or an individual numbered .eml using the browser's file APIs. It displays plain text without executing the message or opening attachments. The Worker accepts GET and HEAD and serves public catalog metadata.

## Build and verify

```sh
node --test integrations/pocket-control-plane/codex-crosshairs/checks.test.mjs
node integrations/pocket-control-plane/codex-crosshairs/build.mjs dist-codex-crosshairs
```

Deploy the three output ES modules together as `tabor-codex-crosshairs` in the existing Pocket Codex dispatch namespace with main module `worker.mjs`. Open the reader at `/work/codex-crosshairs/` on Pocket Codex. The collection index is `GET /work/codex-crosshairs/api/collections`. The view matrix is `GET /work/codex-crosshairs/api/views` for Codex 0–9 or `?collection=all` and the other collection IDs for the expanded matrix. Recovery evidence entries link verified public source files or identify a private source without publishing its contents.

The Codex 1 IT edition and Nathan AI Voice Box remain reachable through their own project links in the reader.
