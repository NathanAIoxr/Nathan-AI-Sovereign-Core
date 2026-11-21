import api from "./index.js";

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    return path === "/api/lessons" || path.startsWith("/api/diagram/")
      ? api.fetch(request, env)
      : new Response(null, { status: 404 });
  },
};
