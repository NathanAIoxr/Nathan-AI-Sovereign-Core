const DRAFTS = `
  INSERT INTO repair_handoff_outbox(job_id, job_status, source_updated_at, source_receipt, note, draft_at)
  SELECT candidate.job_id, candidate.job_status, candidate.source_updated_at,
         candidate.source_receipt, candidate.note, ?1
  FROM repair_handoff_candidate AS candidate
  LEFT JOIN repair_handoff_outbox AS prior ON prior.job_id=candidate.job_id
  WHERE prior.job_id IS NULL OR prior.job_status<>candidate.job_status OR
    prior.source_updated_at<>candidate.source_updated_at OR prior.source_receipt<>candidate.source_receipt OR
    prior.note<>candidate.note
  ORDER BY candidate.source_updated_at,candidate.job_id LIMIT 100
  ON CONFLICT(job_id) DO UPDATE SET
    job_status=excluded.job_status,
    source_updated_at=excluded.source_updated_at,
    source_receipt=excluded.source_receipt,
    note=excluded.note,
    draft_at=excluded.draft_at
`;

const PRUNE = `
  DELETE FROM repair_handoff_outbox
  WHERE job_id IN (
    SELECT draft.job_id FROM repair_handoff_outbox AS draft
    LEFT JOIN repair_jobs AS job ON job.id=draft.job_id
    WHERE job.id IS NULL OR job.status NOT IN ('PATCH_READY','VERIFIED') OR
      job.status<>draft.job_status OR job.updated_at<>draft.source_updated_at OR
      job.receipt IS NULL OR job.receipt<>draft.source_receipt
    LIMIT 100
  )
`;

export async function runHandoff(db, scheduledAt) {
  const [drafts] = await db.batch([
    db.prepare(DRAFTS).bind(scheduledAt),
    db.prepare(PRUNE),
    db.prepare(`INSERT INTO repair_handoff_runs(scheduled_at,refreshed_drafts)
      SELECT ?1, count(*) FROM repair_handoff_outbox WHERE draft_at=?1
      ON CONFLICT(scheduled_at) DO UPDATE SET refreshed_drafts=max(refreshed_drafts,excluded.refreshed_drafts)`)
      .bind(scheduledAt),
    db.prepare("DELETE FROM repair_handoff_runs WHERE scheduled_at < ?").bind(scheduledAt - 604800),
  ]);
  return drafts.meta.changes;
}

export default {
  async scheduled(controller, env) {
    await runHandoff(env.HIVE, Math.floor(controller.scheduledTime / 1000));
  },
};
