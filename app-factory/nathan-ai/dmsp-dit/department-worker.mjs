export default {
  async fetch(request, env) {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/build") {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const { departmentId, deliverable, input, evidence } = env.DEPARTMENT;
    const snapshot = await request.json().catch(() => null);
    if (snapshot?.departmentId !== departmentId || !snapshot.title ||
        snapshot.runbookId !== "rb-" + departmentId + "-baseline" ||
        snapshot.approvalRequired !== 1 || snapshot.enabled !== 0) {
      return Response.json({ error: "invalid_baseline" }, { status: 422 });
    }

    return Response.json({
      version: 1,
      departmentId,
      runbookId: snapshot.runbookId,
      build: {
        state: "PENDING_INPUT",
        deliverable,
        input,
        evidence,
      },
    });
  },
};
