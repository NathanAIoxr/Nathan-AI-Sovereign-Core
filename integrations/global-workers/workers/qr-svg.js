// MIT · source: https://github.com/rossjrw/qrcode-worker/blob/aeee84b5d8ac5f625f32d3f48fdde9e783c97678/src/index.js
// License and copyright notices: ../licenses/rossjrw-worker.txt
// Adapted from rossjrw/qrcode-worker (MIT). Responses are generated locally.
import QRCode from "qrcode";
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const allowedParams = ["url", "errorCorrectionLevel", "color.dark", "color.light", "margin"];
    const options = { type:"svg", margin:1, errorCorrectionLevel:"L" };
    const text=url.searchParams.get("url");
    if (!text || new TextEncoder().encode(text).byteLength > 512) {
      return Response.json({usage:"GET /?url=TEXT", maxBytes:512},{status:400});
    }
    for (const param of allowedParams) {
      if (param==="url") continue;
      const value=url.searchParams.get(param);
      if (value===null) continue;
      if (param==="margin" && /^[0-9]$/.test(value)) options.margin=Number(value);
      else if (param==="errorCorrectionLevel" && /^[LMQH]$/.test(value)) options.errorCorrectionLevel=value;
      else if (param.startsWith("color.") && /^#[0-9a-f]{6}$/i.test(value)) {
        options.color ??= {};
        options.color[param.slice(6)]=value;
      } else {
        return Response.json({error:"Invalid QR option"},{status:400});
      }
    }
    return new Response(await QRCode.toString(text,options),{headers:{"content-type":"image/svg+xml; charset=utf-8","content-security-policy":"default-src 'none'","x-content-type-options":"nosniff"}});
  },
};
