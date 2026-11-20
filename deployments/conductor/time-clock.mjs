import { DurableObject } from "cloudflare:workers";

const interval = 15 * 60 * 1000;
const projects = [
  ["sovereign-website-core", "WEBSITE", true],
  ["sovereign-book-series", "BOOKS", true],
  ["sovereign-apps", "APPS", true],
  ["sovereign-games", "GAMES", true],
  ["tap-that-command-center", "COMMAND", false],
  ["tap-that-arcade", "ARCADE", false],
  ["collyn-tabor-pumpkin-patch", "PUMPKIN", false]
];

export class ZoneClock extends DurableObject {
  async start() {
    if (await this.ctx.storage.getAlarm() === null) {
      await this.ctx.storage.setAlarm(Date.now() + 100);
    }
    return this.status();
  }

  async status() {
    const receipt = await this.ctx.storage.get("receipt");
    return { next: await this.ctx.storage.getAlarm(),
      last: receipt?.checkedAt ?? null, passed: receipt?.passed ?? 0, total: projects.length };
  }

  async alarm() {
    // TIME sets the next tick before checking the train manifest.
    const now = Date.now();
    await this.ctx.storage.setAlarm((Math.floor(now / interval) + 1) * interval);

    // ALIEN resolves the fixed staging manifest. EMIT sends only read-only checks.
    const results = await Promise.allSettled(projects.map(async ([id, binding, holding]) => {
      const db = this.env["TIME_" + binding];
      const sql = holding ? "SELECT project_id AS project FROM zones_registry WHERE project_id = ?" :
        "SELECT project FROM zone_manifest WHERE project = ? AND phase = 'REHEARSAL'";
      const row = await db.prepare(sql).bind(id).first();
      if (row?.project !== id) throw new Error("Zone manifest missing");
    }));

    // NEILA records the verification and any projects that need attention.
    const failed = projects.filter((_, index) => results[index].status === "rejected").map(([id]) => id);
    const receipt = { checkedAt: now, passed: projects.length - failed.length, failed };
    await this.ctx.storage.put("receipt", receipt);
    console.info(JSON.stringify({ component: "conductor", event: "TIME", ...receipt }));
  }
}
