import { endpoint, json, RequestError } from "./shared.mjs";

const assets = new Set(["BTC", "ETH", "SOL", "LTC"]);
const providers = {
  Coinbase: {
    url: asset => `https://api.coinbase.com/v2/prices/${asset}-USD/spot`,
    price: body => body.data?.amount,
  },
  Kraken: {
    url: asset => `https://api.kraken.com/0/public/Ticker?pair=${asset === "BTC" ? "XBT" : asset}USD`,
    price: body => Object.values(body.result ?? {})[0]?.c?.[0],
  },
};
export default endpoint(74, async (request, url) => {
  if (request.method !== "GET" || url.pathname !== "/prices") return;
  const asset = (url.searchParams.get("asset") ?? "BTC").toUpperCase();
  if (!assets.has(asset)) throw new RequestError("unsupported_asset");
  const prices = await Promise.all(Object.entries(providers).map(async ([provider, config]) => {
    try {
      const response = await fetch(config.url(asset), {
        signal: AbortSignal.timeout(5000), redirect: "manual",
        cf: { cacheEverything: true, cacheTtlByStatus: { "200": 30, "400-599": 0 } },
      });
      const price = response.ok ? config.price(await response.json()) : null;
      return { provider, usd: Number(price) > 0 ? String(price) : null };
    } catch {
      return { provider, usd: null };
    }
  }));
  return json({ asset, prices }, prices.some(price => price.usd) ? 200 : 502);
});
