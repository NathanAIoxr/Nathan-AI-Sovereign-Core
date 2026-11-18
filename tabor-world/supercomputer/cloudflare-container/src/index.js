import { Container, getContainer } from "@cloudflare/containers";
export class TaborServer extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/edge-health") return Response.json({edge:"online",service:"tabor-linux-server",container:"separate Linux runtime"});
    if (url.pathname !== "/health" && url.pathname !== "/compute/sha256") return Response.json({error:"not found"}, {status:404});
    if (url.pathname === "/compute/sha256" && !env.TABOR_SERVER_TOKEN) return Response.json({error:"compute token not configured"}, {status:503});
    if (url.pathname === "/compute/sha256" && request.headers.get("authorization") !== "Bearer " + env.TABOR_SERVER_TOKEN) return Response.json({error:"unauthorized"}, {status:401});
    const server = getContainer(env.TABOR_SERVER, "tabor-world-primary");
    return server.fetch(request);
  }
};
