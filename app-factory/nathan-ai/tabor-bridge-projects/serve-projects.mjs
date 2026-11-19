// Deploy as tabor-bridge.js beside the previous main module, bridge-original.mjs.
import bridge from "./bridge-original.mjs";
import buffet from "./two-plate-reckoning.mjs";
import hats from "./sorting-hats-hatettes.mjs";

const host = "tabor-bridge.nathantaboract.workers.dev";
const apps = new Map([
  ["/two-plate-reckoning",buffet],
  ["/sorting-hats-hatettes",hats]
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
    return bridge.fetch(request,env,ctx);
  }
};
