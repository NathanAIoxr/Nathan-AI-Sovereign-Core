import { createServer } from "node:http";
import worker from "../src/worker.mjs";

const origin = "http://127.0.0.1:" + (process.env.PORT || 8787);
createServer(async (request, response) => {
  try {
    const result = await worker.fetch(new Request(new URL(request.url, origin), { method: request.method }));
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    response.writeHead(500).end("Local Worker error");
  }
}).listen(new URL(origin).port, "127.0.0.1", () => console.log(origin));
