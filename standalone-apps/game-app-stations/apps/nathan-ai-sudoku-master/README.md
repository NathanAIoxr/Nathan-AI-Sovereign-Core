# Nathan AI — Sudoku Master

[Play the standalone browser edition](https://pub-a374b836528943e2917457f04363c2ff.r2.dev/apps/nathan-ai-sudoku-master/play.html).

Nathan Tabor's original React source is in the repository root as `SudokuSRC`. The browser edition in this directory uses a dependency-free implementation of its 9×9 board, three clue counts, notes, check, solve and hints. Puzzles vary through rule-preserving transformations of a verified unique base and added clues. The original difficulty names correspond to clue counts. Progress stays in the browser.

Run `node --test standalone-apps/game-app-stations/apps/nathan-ai-sudoku-master/engine.test.mjs` from the repository root.
