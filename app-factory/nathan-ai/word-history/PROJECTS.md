# Word Rotations hosted projects

Two independent app folders share this account's existing Word Rotations Worker.

- [The Two-Plate Reckoning](https://tabor-word-rotations.nathantaboract.workers.dev/word-history/two-plate-reckoning/) · [Source](../two-plate-reckoning/)
- [Sorting Hats & Hatettes](https://tabor-word-rotations.nathantaboract.workers.dev/word-history/sorting-hats-hatettes/) · [Source](../sorting-hats-hatettes/)

For an update, build each project to its named .mjs file and use this folder's `serve-projects.mjs` as the deployed `worker.mjs`. Keep the previous archive main module as `rotation-archive.mjs` with its original `word-history.mjs` dependency and retain the existing Worker settings and bindings. The launcher delegates every route outside the two exact app paths to the previous main module.
