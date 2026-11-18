import { RequestError, sha256, string, webHeaders } from "./shared.mjs";

export const gated = new Set([1, 4, 12, 100]);

export async function authorize(request, env) {
  if (!env.AI || !env.POLYGLOT_AI_KEY) throw new RequestError("Owner AI access is disabled", 503);
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ") || authorization.length > 512) throw new RequestError("Owner bearer token required", 401);
  const encoder = new TextEncoder();
  const [given, expected] = await Promise.all(
    [authorization.slice(7), env.POLYGLOT_AI_KEY].map(value => sha256(encoder.encode(value))));
  let mismatch = 0;
  for (let i = 0; i < 64; i++) mismatch |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  if (mismatch) throw new RequestError("Invalid owner bearer token", 401);
}

const translationModel = "@cf/meta/m2m100-1.2b";
const language = (value, field) => {
  const lang = string(value, field, 12).toLowerCase();
  if (!/^[a-z]{2,3}(?:-[a-z]{2,8})?$/.test(lang)) throw new RequestError(`${field} must be a language code`);
  return lang;
};

async function aiCall(env, model, input) {
  try {
    return await env.AI.run(model, input);
  } catch {
    throw new RequestError(`Model provider unavailable: ${model}`, 502);
  }
}

async function translated(env, text, source_lang, target_lang) {
  if (source_lang === target_lang) return text;
  const response = await aiCall(env, translationModel, {text, source_lang, target_lang});
  const result = response.translated_text;
  if (typeof result !== "string") throw new RequestError("Unexpected translation response", 502);
  return result;
}

async function subtitles({ text, sourceLanguage = "en", targetLanguage }, { env }) {
  const value = string(text, "text", 16000);
  const lang1 = language(sourceLanguage, "sourceLanguage");
  const lang2 = language(targetLanguage, "targetLanguage");
  const parts = value.split(/((?:\r\n|\r(?!\n)|(?<!\r)\n){2,})/);
  const lineSeparator = /(\r\n|\r|\n)/;
  const isTiming = /^\s*(?:\d{2,}:)?\d{2}:\d{2}[.,]\d{3}\s+-->\s+(?:\d{2,}:)?\d{2}:\d{2}[.,]\d{3}(?:\s.*)?$/;
  const cues = parts.map((part, i) => {
    if (i % 2) return null;
    const lines = part.split(lineSeparator);
    const start = lines.findIndex(line => isTiming.test(line));
    return start < 0 ? null : { i, lines, start };
  }).filter(Boolean);
  if (!cues.length || cues.length > 10) throw new RequestError("Supply 1 to 10 SRT/VTT cues");
  for (const { i, lines, start } of cues) {
    const full = lines.slice(start + 2).join("").trim();
    if (!full || full.includes("<")) continue;
    const tail = lines.at(-1) === "" && lines.length > start + 3 ? lines.at(-2) : "";
    const translatedLine = (await translated(env, full, lang1, lang2)).replace(/[\r\n]+/g, " ");
    parts[i] = lines.slice(0, start + 2).join("") + translatedLine + tail;
  }
  return { text: parts.join(""), cues: cues.length, model: translationModel, tagged_cues: "Retained verbatim" };
}

export const modelHandlers = {
  1: async (input, { env }) => ({
    model: translationModel,
    text: await translated(env, string(input.text, "text", 2500),
      language(input.sourceLanguage ?? "en", "sourceLanguage"), language(input.targetLanguage, "targetLanguage")),
  }),
  4: async (input, { env, bytes }) => {
    if (!bytes?.length) throw new RequestError("Send raw audio bytes with Content-Type audio/*");
    let audio = "";
    for (let i = 0; i < bytes.length; i += 8192) audio += String.fromCharCode(...bytes.subarray(i, i+8192));
    return aiCall(env, "@cf/openai/whisper", { audio: btoa(audio) });
  },
  12: subtitles,
  100: async ({ text, language = "en" }, { env }) => {
    if (!["en","es"].includes(language)) throw new RequestError("TTS supports en and es");
    const model = `@cf/deepgram/aura-2-${language}`;
    const audio = await aiCall(env, model, { text: string(text, "text", 500), encoding: "mp3" });
    if (!(audio instanceof ReadableStream)) throw new RequestError("Unexpected TTS audio response", 502);
    return new Response(audio, { headers: { ...webHeaders, "content-type": "audio/mpeg" } });
  },
};
