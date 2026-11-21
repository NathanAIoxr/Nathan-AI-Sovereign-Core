# Nathan AI — Sudoku Master

By Nathan Tabor. [Current public browser edition](https://pub-a374b836528943e2917457f04363c2ff.r2.dev/apps/nathan-ai-sudoku-master/play.html).

- **Play** keeps the original 9×9 game, 40/30/25-clue difficulty choices, keyboard and touch entry, pencil notes, Check, Solve, and locally saved games. Difficulty describes clue count.
- **Sudoku 1012 · The Past Master’s Path** adds repeatable lessons for naked and hidden pairs, naked and hidden triples, and Skyscraper. Hint marks the pattern and its elimination targets. Use Check after crossing out candidates or Apply this step to see the move. Completion is saved in the browser.
- **Intersection Radar** highlights the selected cell’s row, column, and box. A 12-step sweep runs on selection. The still-highlights toggle and the system reduced-motion setting both suppress motion.
- **OX NOT XO** shows candidates and lets the player cross them out. Pencil notes and candidate eliminations are saved separately. Gameplay hints explain a supported move when one is found. Manual eliminations never become solver assumptions.
- **Sudoku Breaker** validates a pasted puzzle for input form, duplicate givens, solvability, and uniqueness before offering to play it. Supported transcription substitutions are O/o for zero and I/l for one.

Nathan’s original React and Python materials are preserved in root files `SudokuSRC`, `SudokuReadMe`, and `Sudokusolver`. This app extends the existing dependency-free web station. It keeps the four-file web asset list used by the iPhone bundle in PR #439 and retains the v1 browser save key.

From the repository root, run:

```sh
node --test standalone-apps/game-app-stations/apps/nathan-ai-sudoku-master/engine.test.mjs
node standalone-apps/game-app-stations/build.mjs
node standalone-apps/game-app-stations/verify.mjs
```

Host the generated station over HTTP or HTTPS. The app makes no external requests and requires no account or backend. The browser edition and the signed Apple build have separate release paths.
