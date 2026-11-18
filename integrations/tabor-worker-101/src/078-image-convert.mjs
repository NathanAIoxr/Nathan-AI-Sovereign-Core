import { endpoint, json, readBytes, RequestError } from "./shared.mjs";

export default endpoint(78, async (request, url, env) => {
  if (request.method !== "POST" || url.pathname !== "/convert") return;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
  const type = request.headers.get("content-type")?.split(";", 1)[0];
  if (!allowed.includes(type)) throw new RequestError("unsupported_image", 415);
  const formats = request.headers.get("accept")?.split(",").map(raw => {
    const [format, ...parameters] = raw.trim().split(";");
    const quality = parameters.find(parameter => parameter.trim().startsWith("q="));
    return { format, quality: quality ? Number(quality.trim().slice(2)) : 1 };
  }) ?? [];
  const match = formats.filter(item => item.quality > 0 && ["image/avif", "image/webp"].includes(item.format))
    .sort((left, right) => right.quality - left.quality)[0];
  if (!match) return json({ error: "accept_webp_or_avif" }, 406);
  const buffer = await readBytes(request, 4 * 1024 * 1024);
  if (!buffer.length) throw new RequestError("empty_image");
  const input = new Blob([buffer], { type });
  const result = await env.IMAGES.input(input.stream()).output({ format: match.format, quality: 82 });
  return result.response({ headers: {
    "cache-control": "no-store", vary: "Accept", "x-content-type-options": "nosniff",
  } });
});
