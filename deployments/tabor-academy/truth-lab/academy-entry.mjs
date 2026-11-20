import academy from "./worker.mjs";
import { serveTruthLab } from "./truth-lab.mjs";
import release from "./truth-lab-release.mjs";

export default {
  ...academy,
  fetch(request, env, ctx) {
    const {pathname} = new URL(request.url);
    if (pathname === "/truth-lab" || pathname.startsWith("/truth-lab/")) {
      return serveTruthLab(request, release);
    }
    return academy.fetch(request, env, ctx);
  }
};
