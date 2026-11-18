import { endpoint, readJson, RequestError } from "./shared.mjs";

export default endpoint(11, async (request, url, env) => {
  if (request.method !== "POST" || url.pathname !== "/chat") return;
  const { messages } = await readJson(request, 24 * 1024);
  if (!Array.isArray(messages) || !messages.length || messages.length > 16 ||
      messages.some(message => !message || !["assistant", "user"].includes(message.role) ||
        typeof message.content !== "string" || !message.content.trim() || message.content.length > 4000) ||
      messages.at(-1).role !== "user") throw new RequestError("invalid_messages");
  const result = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
    messages: messages.map(({ role, content }) => ({ role, content })),
    max_tokens: 384, stream: true,
  });
  return new Response(result instanceof Response ? result.body : result, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
});
