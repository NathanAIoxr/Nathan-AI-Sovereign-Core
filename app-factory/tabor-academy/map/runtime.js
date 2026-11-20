function createAcademyNavigation(app, { catalog, relations }) {
  const mapPath = "/map/";
  const prefix = "/tabor-academy";
  const entries = new Map(Object.values(catalog).flat().map(([path, title]) => [path, title]));
  entries.set("/", "Tabor Academy");
  entries.set(mapPath, "Academy Map");
  const html = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
  const numbered = "(?:[1-9]|[1-9][0-9]|10[01])";
  const technique = new RegExp("^/workbench/zones/(" + numbered + ")/$");
  const drill = new RegExp("^/survival/(" + numbered + ")/$");
  const mission = /^\/way\/[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?\/$/;
  const known = (path) => entries.has(path) || technique.test(path) || drill.test(path) || mission.test(path);
  const normalize = (path) => path.replace(/\/?$/, "/");
  const cleanQuery = (url) => {
    const result = new URLSearchParams();
    const view = url.searchParams.get("view");
    if (["reverse", "state", "home", "lessons"].includes(view)) result.set("view", view);
    for (const key of ["category", "guide"]) {
      const value = url.searchParams.get(key);
      if (/^[1-7]$/.test(value)) result.set(key, value);
    }
    return result.size ? "?" + result : "";
  };
  const base = "https://academy.invalid";
  const canonical = (value) => {
    if (typeof value !== "string" || value.length > 240 || !/^\/(?!\/)/.test(value)) return null;
    let link;
    try { link = new URL(value, base); } catch { return null; }
    if (link.origin !== base || link.searchParams.get("print") === "1") return null;
    const path = normalize(link.pathname);
    if (!known(path)) return null;
    const anchor = /^#[a-z][a-z0-9-]{0,40}$/.test(link.hash) ? link.hash : "";
    const query = path === mapPath && link.searchParams.has("q")
      ? "?" + new URLSearchParams({ q: link.searchParams.get("q").slice(0, 80) })
      : cleanQuery(link);
    return path + query + anchor;
  };
  const trailFor = (url) => url.searchParams.getAll("trail").slice(-8).map(canonical).filter(Boolean);
  const pathOf = (ref) => new URL(ref, base).pathname;
  const labelFor = (ref) => {
    const url = new URL(ref, base);
    const path = url.pathname;
    const topic = relations[path]?.find(([, id]) => "#" + id === url.hash)?.[2];
    if (topic) return topic;
    if (entries.has(path)) return entries.get(path);
    if (technique.test(path)) return "Workbench technique " + technique.exec(path)[1];
    if (drill.test(path)) return "Survival drill " + drill.exec(path)[1];
    const leaf = path.split("/").filter(Boolean).at(-1).replaceAll("-", " ");
    return leaf.charAt(0).toUpperCase() + leaf.slice(1);
  };
  const href = (ref, trail = []) => {
    const url = new URL(prefix + ref, base);
    for (const step of trail.slice(-8)) url.searchParams.append("trail", step);
    return url.pathname + url.search + url.hash;
  };
  const parentOf = (path) => {
    if (technique.test(path) || path === "/workbench/47/") return "/workbench/";
    if (drill.test(path)) return "/survival/";
    if (mission.test(path)) {
      const parts = path.split("/").filter(Boolean);
      return parts.length === 3 ? "/way/" + parts[1] + "/" : "/way/";
    }
    if (path.startsWith("/order/") && path !== "/order/") return "/order/";
    return null;
  };
  const nav = (trail, current) => {
    const previous = trail.at(-1);
    const back = previous ? '<a href="' + html(href(previous, trail.slice(0, -1))) + '">Back to ' + html(labelFor(previous)) + '</a> · ' : "";
    const earlier = trail.length > 1
      ? '<details><summary>Earlier stops</summary><ol>' + trail.map((ref, index) =>
        '<li><a href="' + html(href(ref, trail.slice(0, index))) + '">' + html(labelFor(ref)) + '</a></li>').join("") + '</ol></details>'
      : "";
    const currentPath = pathOf(current);
    const parent = parentOf(currentPath);
    const unit = parent && (!previous || pathOf(previous) !== parent)
      ? '<a href="' + html(href(parent, [...trail, current])) + '">Unit · ' + html(labelFor(parent)) + '</a>' : "";
    const directory = currentPath === mapPath ? "" :
      '<a href="' + html(href(mapPath, [...trail, current])) + '">Academy Map</a>';
    const links = [back.replace(/ · $/, ""), unit, directory].filter(Boolean);
    if (!links.length) return "";
    return '<nav class="screen-only" aria-label="Academy trail"><p>' + links.join(" · ") + '</p>' + earlier + '</nav>';
  };
  async function directory(request, env, url, trail) {
    const query = (url.searchParams.get("q") || "").trim().slice(0, 80);
    const groups = Object.entries(catalog).map(([name, records]) => [name, [...records]]);
    groups.push(["Sections within lessons", Object.entries(relations).flatMap(([path, sections]) =>
      sections.map(([, id, title]) => [path + "#" + id, title, entries.get(path)]))]);
    let partial = false;
    try {
      const [techniques, drills, paths, missions] = await env.LIBRARY.batch([
        env.LIBRARY.prepare("SELECT number,title,guide_title FROM academy_techniques ORDER BY number"),
        env.LIBRARY.prepare("SELECT number,modern,root FROM survival_mastery_cards ORDER BY number"),
        env.LIBRARY.prepare("SELECT slug,title,purpose FROM academy_way_paths ORDER BY position"),
        env.LIBRARY.prepare("SELECT path,slug,title,outcome FROM academy_way_missions ORDER BY path,position"),
      ]);
      groups.push(["Workbench techniques", techniques.results.map(({ number, title, guide_title }) =>
        ["/workbench/zones/" + number + "/", title, guide_title])]);
      groups.push(["Survival drills", drills.results.map(({ number, modern, root }) =>
        ["/survival/" + number + "/", modern, root])]);
      groups.push(["Nathan Tabor Way paths and missions", [
        ...paths.results.map(({ slug, title, purpose }) => ["/way/" + slug + "/", title, purpose]),
        ...missions.results.map(({ path, slug, title, outcome }) => ["/way/" + path + "/" + slug + "/", title, outcome]),
      ]]);
    } catch (error) {
      console.error("Academy Map index unavailable", error?.name);
      partial = true;
    }
    const words = query.toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
    let count = 0;
    const current = canonical(mapPath + (query ? "?" + new URLSearchParams({ q: query }) : ""));
    const listings = groups.map(([name, records], index) => {
      const matches = records.filter((entry) => words.every((word) => (entry.join(" ") + " " + name).toLocaleLowerCase("en-US").includes(word)));
      count += matches.length;
      return matches.length ? '<details' + (query || index < Object.keys(catalog).length ? ' open' : '') +
        '><summary>' + html(name) + ' (' + matches.length + ')</summary><ul>' +
        matches.map(([path, title, about]) => '<li><a href="' + html(href(path, [...trail, current])) + '">' +
          html(title) + '</a><br><small>' + html(about) + '</small></li>').join("") + '</ul></details>' : "";
    }).join("");
    const body = nav(trail, current) +
      '<form action="' + prefix + mapPath + '" role="search"><label for="academy-topic">Find a topic</label>' +
      '<input style="max-width:100%;width:min(22rem,80vw)" id="academy-topic" name="q" type="search" maxlength="80" value="' + html(query) + '">' +
      trail.map((step) => '<input type="hidden" name="trail" value="' + html(step) + '">').join("") +
      '<button type="submit">Search</button></form><p>' + count + ' ' + (count === 1 ? 'result' : 'results') + '</p>' +
      (partial ? '<p>The full index is temporarily unavailable.</p>' : "") +
      (listings || '<p>Try a different topic, name or skill.</p>');
    return new Response(request.method === "HEAD" ? null : workbenchPage("Academy Map", body), {
      headers: { ...workbenchHeaders, "content-type": "text/html; charset=utf-8" },
    });
  }
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = normalize(url.pathname);
      if (request.method !== "GET" && request.method !== "HEAD") {
        if (path === mapPath) return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
        return app.fetch(request, env, ctx);
      }
      const trail = trailFor(url);
      if (path === mapPath) return directory(request, env, url, trail);
      const response = await app.fetch(request, env, ctx);
      if (request.method === "HEAD" || !known(path) || !response.ok ||
          !response.headers.get("content-type")?.startsWith("text/html") ||
          url.searchParams.get("print") === "1") return response;
      const current = path + cleanQuery(url);
      const rewriter = new HTMLRewriter()
        .on("main h1", { element(el) { el.after(nav(trail, current), { html: true }); } })
        .on('main a[href^="/tabor-academy/"]', { element(el) {
          const original = el.getAttribute("href");
          const target = canonical(original.slice(prefix.length));
          if (!target) return;
          const targetUrl = new URL(original, base);
          if (targetUrl.searchParams.has("trail")) return;
          const samePage = pathOf(target) === path;
          const chain = samePage ? trail : [...trail, current];
          if (!chain.length) return;
          for (const step of chain.slice(-8)) targetUrl.searchParams.append("trail", step);
          el.setAttribute("href", targetUrl.pathname + targetUrl.search + targetUrl.hash);
        } });
      if (url.searchParams.get("view") !== "lessons") {
        for (const [selector, anchor, title, links] of relations[path] || []) {
          rewriter.on(selector, { element(el) {
            if (!el.getAttribute("id")) el.setAttribute("id", anchor);
            const origin = current + "#" + anchor;
            const block = '<nav class="screen-only" aria-label="Explore from ' + html(title) + '">' +
              links.map(([target, label]) => '<a href="' + html(href(target, [...trail, origin])) +
                '">' + html(label) + '</a>').join(' · ') + '</nav>';
            el.append(block, { html: true });
          } });
        }
      }
      return rewriter.transform(response);
    },
  };
}
