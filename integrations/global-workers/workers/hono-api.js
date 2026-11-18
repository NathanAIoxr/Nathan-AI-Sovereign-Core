// MIT · source: https://github.com/honojs/hono/blob/a8ae5b1d6e8502ce61cd9e7b853d8107e377fc7b/README.md
// License and copyright notices: ../licenses/hono.txt
// Adapted from the honojs/hono README example (MIT).
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => c.text("Hello Hono!"));
app.get("/api/status", (c) => c.json({ status: "ok", runtime: "Hono on Cloudflare Workers" }));
export default app;
