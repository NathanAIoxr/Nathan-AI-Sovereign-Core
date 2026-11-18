export class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function string(value, label = "text", max = 12000, allowEmpty = false) {
  if (typeof value !== "string" || value.length > max || (!allowEmpty && !value.trim())) {
    throw new RequestError(`${label} must be a string with ${allowEmpty ? "0" : "1"} to ${max} characters`);
  }
  return value;
}

export function integer(value, low, high, label) {
  if (!Number.isSafeInteger(value) || value < low || value > high) {
    throw new RequestError(`${label} must be an integer from ${low} to ${high}`);
  }
  return value;
}

export async function readBytes(body, limit) {
  const reader = body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RequestError(`Payload exceeds ${limit} bytes`, 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

const segmenter = new Intl.Segmenter();
export const graphemes = text => Array.from(segmenter.segment(text), part => part.segment);
export const reverse = text => graphemes(text).reverse().join("");

export const webHeaders = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

export function isolatedHtml(body) {
  return new Response(body, { headers: {
    ...webHeaders,
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": "sandbox; default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  } });
}

export function svg(body, viewBox) {
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`, { headers: {
    ...webHeaders,
    "content-type": "image/svg+xml; charset=utf-8",
    "content-security-policy": "sandbox; default-src 'none'",
  } });
}

export async function sha256(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    value => value.toString(16).padStart(2, "0")).join("");
}
