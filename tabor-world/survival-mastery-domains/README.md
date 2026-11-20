# Six Universal Human Survival & Mastery Domains

[Tabor World explorer](https://tabor-world.nathantaboract.workers.dev/survival-mastery-domains/) · [Independent Tabor Academy course](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/way/survival-mastery-domains/)

The World explorer presents 27 decision stations. Each station has a scenario question, a worked response, and a link to its separate Academy exercise. Both explorers share their rendering and route handling while retaining separate paths and content. The older Human Learning Arc and original 101 remain available at their existing addresses.

Run `node --test tabor-world/human-learning-arc/test.mjs tabor-world/survival-mastery-domains/test.mjs` from the repository root. Package the three Domain modules as flat Worker modules. Upload `entry.mjs` as `survival-mastery-domains-entry.mjs` and `runtime.mjs` as `survival-mastery-domains-runtime.mjs`, replacing the runtime's relative import prefix `../human-learning-arc/` with `./` for the flat bundle. Include the updated Human Learning Arc runtime and the prior Gateway modules. Check both catalog routes, the destination feed, the two home links and the original learning methods after deployment.

## Six Domains Fieldbook

[Open the Fieldbook](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/way/survival-mastery-domains/fieldbook/) · [Printable workbook](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/way/survival-mastery-domains/fieldbook/print/)

The Fieldbook extends the existing six domains with one applied scenario per domain, a change in conditions, a worked response, and references. Its lab pages link to all 27 existing Academy modules. The capstone uses the Academy 90% mastery gate as a ten-criterion self-check.

Run `node --test tabor-world/survival-mastery-domains/fieldbook/fieldbook.test.mjs` for route and rubric tests. `node tabor-world/survival-mastery-domains/fieldbook/build.mjs` produces the self-contained `survival-fieldbook.mjs` module. Use `wireEntry` from that build file to compose it with the existing `academy-entry.mjs` in the `tabor-academy` dispatch namespace. Publish the updated entry with every existing Academy module using the content-only API. The World explorer links to the live Fieldbook from `runtime.mjs`. Run the Fieldbook's `verify-live.mjs` after deploying both Workers.
