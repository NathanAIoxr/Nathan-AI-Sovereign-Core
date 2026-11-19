export async function readJsonObject(request, byteLimit) {
  const reader = request.body?.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    if (!reader) throw new Error("Missing body");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > byteLimit) throw new Error("Body exceeds byte limit");
      text += decoder.decode(value, { stream: true });
    }
    const value = JSON.parse(text + decoder.decode());
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
    return value;
  } catch {
    await reader?.cancel().catch(() => {});
    throw new RangeError(`Send a UTF-8 JSON object up to ${byteLimit / 1024} KiB.`);
  } finally {
    reader?.releaseLock();
  }
}
