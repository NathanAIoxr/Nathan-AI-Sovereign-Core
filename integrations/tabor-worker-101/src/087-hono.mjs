import { Hono } from "hono";

const app = new Hono();
app.get("/", context => context.json({ name: "Tabor Hono Worker", routes: ["/health", "/api/hello"] }));
app.get("/health", context => context.json({ id: 87, ready: true }));
app.get("/api/hello", context => {
  const name = context.req.query("name")?.trim() || "world";
  if (name.length > 80) return context.json({ error: "name_too_long" }, 400);
  return context.json({ greeting: `Hello, ${name}.` });
});
export default app;
