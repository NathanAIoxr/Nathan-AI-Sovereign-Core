import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { render } from "./render.mjs";

export const root = new URL("./", import.meta.url);
const appsDirectory = new URL("apps/", root);
const order = ["catalog", "staff-of-moses", "cleopatra-staff", "holy-grail", "ark-of-the-covenant", "nature-human-body", "elemental-charge", "end-that-war"];
const folders = await readdir(appsDirectory);
if (folders.length !== order.length || order.some(id => !folders.includes(id))) {
  throw new Error("The app manifest folders must match the catalog order");
}
export const apps = await Promise.all(order.map(async id => {
  const app = JSON.parse(await readFile(new URL(id + "/app.json", appsDirectory), "utf8"));
  if (app.id !== id) throw new Error("App ID must match its folder: " + id);
  return app;
}));
export const original = await readFile(new URL("original.txt", root), "utf8");
const namedArtifacts = apps.slice(1, 5).map(({ id, title }, index) => ({ position: index + 1, id, title }));
export const catalog = {
  author: "Nathan Tabor",
  original: "/original.txt",
  artifactCount: { provisional: 16, named: namedArtifacts.length, scope: "unresolved" },
  artifactRegister: Array.from({ length: 16 }, (_, i) =>
    namedArtifacts[i] ?? { position: i + 1, id: null, title: null }),
  apps: apps.slice(1).map(({ id, title, platform, origin }) => ({ id, title, platform, origin }))
};

export async function build(id) {
  const app = apps.find(entry => entry.id === id);
  if (!app) throw new Error("Unknown app: " + id);
  const isCatalog = id === "catalog";
  const html = render(app, apps, original.trimEnd());
  const files = {
    "/": ["text/html; charset=utf-8", html],
    "/api/health": ["application/json; charset=utf-8", JSON.stringify({ id, name: app.name, ok: true })],
    [isCatalog ? "/api/catalog" : "/api/record"]: [
      "application/json; charset=utf-8", JSON.stringify(isCatalog ? catalog : app)
    ],
    ...(isCatalog ? { "/original.txt": ["text/plain; charset=utf-8", original] } : {})
  };
  const worker = `const files = ${JSON.stringify(files, null, 2)};
export default {
  fetch(request) {
    const { pathname } = new URL(request.url);
    const path = pathname.length > 1 ? pathname.replace(/\\/$/, "") : pathname;
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {status:405,headers:{allow:"GET, HEAD"}});
    }
    if (!Object.hasOwn(files, path)) {
      return new Response(request.method === "HEAD" ? null : "Page not found", {
        status:404,headers:{"content-type":"text/plain; charset=utf-8"}
      });
    }
    const [contentType, body] = files[path];
    return new Response(request.method === "HEAD" ? null : body, {
      headers: {
        "content-type": contentType,
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"
      }
    });
  }
};
`;
  const folder = new URL("dist/" + id + "/", root);
  await mkdir(folder, { recursive: true });
  const entry = "_worker.js";
  await writeFile(new URL(entry, folder), worker);
  return { app, folder, entry, worker };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (process.argv[2]) {
    await build(process.argv[2]);
  } else {
    await Promise.all(apps.map(app => build(app.id)));
  }
}
