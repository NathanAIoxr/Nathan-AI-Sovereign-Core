# Six Universal Human Survival & Mastery Domains

[Tabor World explorer](https://tabor-world.nathantaboract.workers.dev/survival-mastery-domains/) · [Independent Tabor Academy course](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/way/survival-mastery-domains/)

The World explorer presents 27 decision stations. Each station has a scenario question, a worked response, and a link to its separate Academy exercise. Both explorers share their rendering and route handling while retaining separate paths and content. The older Human Learning Arc and original 101 remain available at their existing addresses.

Run `node --test tabor-world/human-learning-arc/test.mjs tabor-world/survival-mastery-domains/test.mjs` from the repository root. Package the three Domain modules as flat Worker modules. Upload `entry.mjs` as `survival-mastery-domains-entry.mjs` and `runtime.mjs` as `survival-mastery-domains-runtime.mjs`, replacing the runtime's relative import prefix `../human-learning-arc/` with `./` for the flat bundle. Include the updated Human Learning Arc runtime and the prior Gateway modules. Check both catalog routes, the destination feed, the two home links and the original learning methods after deployment.
