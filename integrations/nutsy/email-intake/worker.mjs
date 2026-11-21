const MAX_BYTES = 128 * 1024;

export default {
  async email(message, env) {
    const url = new URL(env.NUTSY_EAR1_URL);
    if (url.protocol !== "https:" || url.pathname !== "/ear1/hear" ||
        url.username || url.password || url.search || url.hash ||
        !env.NUTSY_EMAIL_TOKEN || !env.NUTSY_TRIGGER_ADDRESS || !env.NUTSY_EMAIL_SENDER) {
      throw new Error("Invalid NUTSY intake configuration");
    }

    const auth = (message.headers.get("Authentication-Results") ?? "").split(",")[0];
    if (!/^mx\.cloudflare\.net\s*;/i.test(auth) ||
        !/;\s*dmarc=pass(?:[\s;]|$)/i.test(auth) ||
        message.to.toLowerCase() !== env.NUTSY_TRIGGER_ADDRESS.toLowerCase() ||
        message.from.toLowerCase() !== env.NUTSY_EMAIL_SENDER.toLowerCase()) {
      message.setReject("This address only accepts authenticated NUTSY submissions");
      return;
    }

    if (message.rawSize < 1 || message.rawSize > MAX_BYTES) {
      message.setReject("NUTSY email exceeds the intake size limit");
      return;
    }
    const raw = new Uint8Array(await new Response(message.raw).arrayBuffer());
    if (raw.length !== message.rawSize) {
      throw new Error("NUTSY email size did not match the input stream");
    }
    const response = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Authorization": `Bearer ${env.NUTSY_EMAIL_TOKEN}`,
        "Content-Type": "message/rfc822",
      },
      body: raw,
    });
    if (response.status === 422) {
      message.setReject("NUTSY needs an authorized From address and a plain-text message");
      return;
    }
    if (![200, 201].includes(response.status)) {
      throw new Error(`NUTSY did not acknowledge intake (HTTP ${response.status})`);
    }
  },
};
