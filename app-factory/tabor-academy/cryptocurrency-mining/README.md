# Tabor Academy · Cryptocurrency Mining

[Open the course](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/mining/) · [Module directory](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/mining/modules.json)

Every category has one source file at `zones/<id>/module.json` and one Cloudflare Workers for Platforms development namespace, `tabor-academy-mining-<id>`. Each namespace hosts a Worker named `module` with its own lesson, `/module.json` and `/healthz`. The lesson order and public course assembly are in `build.mjs`.

The public Academy course uses the released copy of the same module files. A development-zone update can be tested without changing the public course. Each lesson starts with its interactive challenge. Learners place cards, test targets, run the energy meter, check nine mirror views, allocate classroom units, or verify a historical Bitcoin header. The Academy’s Z → A field notes and sources are available below the challenge and in print.

**Hold on** opens an explanation while keeping the current exercise state. **Continue** returns to the same step. In supported browsers, **Use voice** listens for one pause or continue command after a tap. The Academy code keeps the challenge state in the current page and does not store voice transcripts. The browser’s speech service can process audio online.

## Develop one category

1. Edit its `zones/<id>/module.json`, including the `challenge` that opens the lesson.
2. Run `node --test test.mjs` from this course directory.
3. Run `node build.mjs zone <id> > /tmp/tabor-mining-module.mjs`. Upload the module as the `module` Worker in its existing development namespace. Preview the lesson and confirm its `/healthz` and `/module.json` before publishing.
4. To publish, get the active `tabor-academy` Worker source from the `tabor-academy` namespace. Run `node build.mjs academy /path/to/worker.mjs > /tmp/tabor-academy-with-mining.mjs`. Use the content-only upload for that same Academy Worker so its Library binding remains in place. Check the Academy home, Workbench, and course module directory after deployment.

The course links to live public block verification and an optional local Bitcoin Core practice network. The Academy lesson Workers serve educational content and never receive wallet keys, enroll hardware, submit pool work, or initiate payouts.
