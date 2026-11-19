// Deploy as worker.mjs beside the previous main module, rotation-archive.mjs.
import archive from "./rotation-archive.mjs";
import buffet from "./two-plate-reckoning.mjs";
import hats from "./sorting-hats-hatettes.mjs";

const host = "tabor-word-rotations.nathantaboract.workers.dev";
const apps = new Map([
  ["/word-history/two-plate-reckoning",buffet],
  ["/word-history/sorting-hats-hatettes",hats]
]);

export default {
  fetch(request,env,ctx) {
    const url = new URL(request.url);
    if (url.hostname === host) {
      for (const [prefix,app] of apps) {
        if (url.pathname === prefix || url.pathname.startsWith(prefix+"/")) {
          return app.fetch(request);
        }
      }
    }
    return archive.fetch(request,env,ctx);
  }
};
