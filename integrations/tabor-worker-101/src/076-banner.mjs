import { endpoint, readJson, RequestError } from "./shared.mjs";

const themes = { navy: ["#14283f", "#e7eff7"], charcoal: ["#252729", "#ffffff"], burgundy: ["#581e32", "#fff4ed"] };
const escape = value => value.replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);
export default endpoint(76, async (request, url) => {
  if (request.method !== "POST" || url.pathname !== "/banner") return;
  const { title, subtitle = "", theme = "navy" } = await readJson(request);
  if (typeof title !== "string" || !title.trim() || [...title].length > 42 ||
      typeof subtitle !== "string" || [...subtitle].length > 80 || !Object.hasOwn(themes, theme)) {
    throw new RequestError("invalid_banner");
  }
  const [background, foreground] = themes[theme];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img"><title>${escape(title)}</title><rect width="1200" height="630" fill="${background}"/><path d="M85 225h100v8H85z" fill="${foreground}"/><g font-family="sans-serif" fill="${foreground}"><text x="85" y="320" font-size="46" font-weight="700">${escape(title)}</text><text x="85" y="382" font-size="27">${escape(subtitle)}</text></g></svg>`;
  return new Response(svg, { headers: {
    "content-type": "image/svg+xml", "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox", "cache-control": "no-store",
  } });
});
