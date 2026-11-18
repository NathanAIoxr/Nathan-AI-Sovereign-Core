import { loadProfiles, rosterSearch, runRelay, runProfile, runtimeGroups } from "./runtime-engine.mjs";

const json = (data, status = 200) => Response.json(data, {
  status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});

async function inputJSON(request) {
  if ((request.headers.get("content-type") || "").split(";")[0] !== "application/json") {
    throw new RangeError("Send an application/json request");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RangeError("A request body is required");
  const chunks = [];
  let bytes = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 32768) {
      await reader.cancel();
      throw new RangeError("Request body exceeds 32 KB");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(bytes);
  let start = 0;
  for (const chunk of chunks) { body.set(chunk, start); start += chunk.byteLength; }
  const value = JSON.parse(new TextDecoder().decode(body));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RangeError("Expected an object");
  return value;
}

export async function handleRuntime(request, load, revision) {
  const url = new URL(request.url);
  const route = url.pathname.slice("/api/runtime/".length);
  const allowed = ["run", "relay"].includes(route) ? "POST" : "GET";
  if (request.method !== allowed) return new Response("Method not allowed", { status: 405, headers: { Allow: allowed } });
  try {
    if (route === "groups") return json({ groups: runtimeGroups.map(({ id, name }) => ({ id, name })) });
    if (route === "roster") {
      const page = Number(url.searchParams.get("page") ?? 0);
      const query = (url.searchParams.get("q") ?? "").slice(0, 100);
      if (!Number.isInteger(page) || page < 0 || page > 100) throw new RangeError("Invalid page");
      return json(rosterSearch(await loadProfiles(url.searchParams.get("group") ?? "g0", load, revision), query, page));
    }
    if (!["profile", "run", "relay"].includes(route)) return json({ error: "Unknown runtime route" }, 404);
    const body = allowed === "POST" ? await inputJSON(request) : {};
    const sources = new Map();
    async function getProfile(id) {
      const parts = typeof id === "string" && /^(g\d{1,2}|tabor):\d{1,4}$/.test(id) ? id.split(":") : null;
      if (!parts) throw new RangeError("Invalid profile ID");
      if (!sources.has(parts[0])) sources.set(parts[0], loadProfiles(parts[0], load, revision));
      const candidate = (await sources.get(parts[0]))[Number(parts[1])];
      if (!candidate || candidate.id !== id) throw new RangeError("Profile not found");
      return candidate.run();
    }
    if (route === "relay") {
      if (!Array.isArray(body.steps) || body.steps.length < 2 || body.steps.length > 5) {
        throw new RangeError("A sequence requires two to five steps");
      }
      const plan = await Promise.all(body.steps.map(async step => ({
        profile: await getProfile(step?.id), action: step?.action,
      })));
      return json(await runRelay(plan, body));
    }
    const profile = await getProfile(body.id ?? url.searchParams.get("id"));
    if (route === "profile") return json(profile);
    return json(await runProfile(profile, body));
  } catch (error) {
    if (error instanceof RangeError || error instanceof SyntaxError) return json({ error: error.message }, 400);
    return json({ error: "Pinned source is temporarily unavailable" }, 502);
  }
}
