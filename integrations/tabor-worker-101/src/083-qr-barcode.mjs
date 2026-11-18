import QRCode from "qrcode/lib/core/qrcode.js";
import Code128Module from "jsbarcode/bin/barcodes/CODE128/CODE128B.js";
import { endpoint, RequestError } from "./shared.mjs";

function qrSvg(text) {
  const modules = QRCode.create(text, { errorCorrectionLevel: "M" }).modules;
  let path = "";
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (modules.get(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
    }
  }
  const size = modules.size + 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" shape-rendering="crispEdges"><title>QR code</title><rect width="100%" height="100%" fill="white"/><path d="${path}"/></svg>`;
}

function barcodeSvg(text) {
  const encoder = new Code128Module.default(text, {});
  const { data } = encoder.encode();
  const path = Array.from(data, (bit, i) => bit === "1" ? `M${i + 10} 0h1v50h-1z` : "").join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${data.length + 20} 50" role="img" shape-rendering="crispEdges"><title>Code 128 barcode</title><rect width="100%" height="100%" fill="white"/><path d="${path}"/></svg>`;
}

export default endpoint(83, async (request, url) => {
  if (request.method !== "GET" || !["/qr", "/barcode", "/pattern"].includes(url.pathname)) return;
  let text = url.searchParams.get("text") ?? "";
  let svg;
  if (url.pathname === "/pattern") {
    text = text.slice(0, 80);
    if (!text) throw new RequestError("text_required");
    let bits = "";
    for (let i = 0; i < text.length; i++) bits += text.charCodeAt(i).toString(2).padStart(16, "0");
    const rects = Array.from(bits, (bit, i) => bit === "1" ? `<rect x="${i * 2}" y="0" width="2" height="70"/>` : "").join("");
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bits.length * 2}" height="70" viewBox="0 0 ${bits.length * 2} 70">${rects}</svg>`;
  } else {
    const qr = url.pathname === "/qr";
    if (!text || new TextEncoder().encode(text).byteLength > (qr ? 512 : 80) ||
        (!qr && !/^[\x20-\x7e]+$/.test(text))) throw new RequestError("invalid_text");
    svg = qr ? qrSvg(text) : barcodeSvg(text);
  }
  return new Response(svg, { headers: {
    "content-type": "image/svg+xml", "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
  } });
});
