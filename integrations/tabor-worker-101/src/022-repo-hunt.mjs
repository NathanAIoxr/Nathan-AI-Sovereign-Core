import { endpoint, json, RequestError } from "./shared.mjs";

export default endpoint(22, async (request, url) => {
  if (request.method !== "GET" || url.pathname !== "/repositories") return;
  const language = url.searchParams.get("language") ?? "";
  if (!/^[a-z0-9+#-]{0,30}$/i.test(language)) throw new RequestError("invalid_language");
  const upstream = new URL("https://api.github.com/search/repositories");
  const since = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
  upstream.search = new URLSearchParams({
    q: ["is:public", "archived:false", `created:>=${since}`, language && `language:${language}`].filter(Boolean).join(" "),
    sort: "stars", order: "desc", per_page: "10",
  });
  const response = await fetch(upstream, {
    headers: { accept: "application/vnd.github+json", "user-agent": "Tabor-Repo-Hunt" },
    signal: AbortSignal.timeout(6000), redirect: "manual",
    cf: { cacheEverything: true, cacheTtlByStatus: { "200": 600, "400-599": 0 } },
  });
  if (!response.ok) throw new RequestError("github_unavailable", response.status === 403 || response.status === 429 ? 503 : 502);
  const { items } = await response.json();
  return json({ since, repositories: items.map(({ full_name, html_url, description, stargazers_count }) => ({
    name: full_name, url: html_url, description, stars: stargazers_count,
  })) });
});
