export const ROOMS = Object.freeze({
  arc: {label: "Trajectory", hint: "Aim and place", icon: "↗"},
  spin: {label: "Spin & Stick", hint: "Rotate and align", icon: "◉"},
  rope: {label: "Pendulum", hint: "Swing and release", icon: "⌇"},
  rhythm: {label: "Rhythm", hint: "Tap on cue", icon: "≋"},
  craft: {label: "Trace & Craft", hint: "Follow a path", icon: "◇"},
});

export function filtersFrom(params) {
  return {
    q: (params.get("q") ?? "").slice(0, 120),
    shelf: params.get("shelf") ?? "",
    kind: params.get("kind") ?? "",
    room: params.get("room") ?? "",
  };
}

export function browse(catalog, {q = "", shelf = "", kind = "", room = ""} = {}) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return catalog.entries.filter(entry => {
    if ((shelf && shelf !== entry.lcc) || (kind && kind !== entry.kind) || (room && room !== entry.chassis)) return false;
    const label = [entry.id, entry.title, catalog.shelves[entry.lcc], catalog.kinds[entry.kind],
      ROOMS[entry.chassis].label, entry.attributes, entry.characteristics, entry.traits, entry.application, entry.target]
      .join(" ").toLowerCase();
    return words.every(word => label.includes(word));
  });
}

export function catalogResponse(catalog, endpoint, url, head) {
  const reply = (value, status = 200) => new Response(head ? null : JSON.stringify(value), {status, headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
    "X-Content-Type-Options": "nosniff",
  }});
  if (endpoint === "catalog.json") return reply(catalog);
  if (endpoint === "api/health") return reply({
    ok: true, release: catalog.release, entries: catalog.entries.length, shelves: Object.keys(catalog.shelves).length,
  });
  if (endpoint === "api/catalog") {
    const filters = filtersFrom(url.searchParams);
    const offset = nonnegativeInt(url.searchParams.get("offset"), 0);
    const limit = Math.max(1, Math.min(101, nonnegativeInt(url.searchParams.get("limit"), 24)));
    const matches = browse(catalog, filters);
    return reply({release: catalog.release, total: matches.length, offset, limit, entries: matches.slice(offset, offset + limit)});
  }
  const match = /^api\/entries\/(\d{3})$/.exec(endpoint);
  const entry = match && catalog.entries.find(entry => entry.id === match[1]);
  return entry ? reply(entry) : reply({error: "Entry or endpoint not found"}, 404);
}

function nonnegativeInt(value, fallback) {
  if (value === null || !/^\d+$/.test(value)) return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : fallback;
}
