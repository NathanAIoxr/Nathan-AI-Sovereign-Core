const SIGNATURE = "All my best,\nNathan Tabor\nSovereign Architect\nNathan AI 🚀";

const DRAFTS = `
  INSERT INTO repair_handoff_outbox(job_id, job_status, source_updated_at, source_receipt, note, draft_at)
  SELECT job.id, job.status, job.updated_at, job.receipt,
         CASE job.status
           WHEN 'VERIFIED' THEN 'A patch with passing checks is ready for review for '
           ELSE 'A draft patch is prepared for '
         END || job.repository || '#' || job.number || '. ' || job.title ||
         char(10) || char(10) || 'Upstream base: ' || json_extract(job.receipt,'$.base') ||
         CASE job.status WHEN 'PATCH_READY'
           THEN char(10) || 'The full runtime check is pending.' ELSE '' END ||
         char(10) || char(10) || ?1,
         ?2
  FROM repair_jobs AS job
  LEFT JOIN repair_handoff_outbox AS prior ON prior.job_id=job.id
  WHERE job.status IN ('PATCH_READY','VERIFIED')
    AND json_type(job.receipt,'$.base')='text'
    AND length(json_extract(job.receipt,'$.base')) IN (40,64)
    AND json_extract(job.receipt,'$.base') NOT GLOB '*[^0-9a-fA-F]*'
    AND json_type(job.receipt,'$.patch')='text'
    AND substr(json_extract(job.receipt,'$.patch'),1,11)='diff --git '
    AND length(json_extract(job.receipt,'$.patch'))<=50000
    AND (job.status='PATCH_READY' OR (
      json_type(job.receipt,'$.tests')='array'
      AND json_array_length(job.receipt,'$.tests')>0
      AND NOT EXISTS (
        SELECT 1 FROM json_each(job.receipt,'$.tests')
        WHERE CASE WHEN type<>'object' THEN 1
          WHEN json_type(value,'$.command') IS NOT 'text' OR trim(json_extract(value,'$.command'))=''
            OR json_type(value,'$.exitCode') IS NOT 'integer' OR json_extract(value,'$.exitCode')<>0
          THEN 1 ELSE 0 END
      )
    ))
    AND (prior.job_id IS NULL OR prior.job_status<>job.status OR
      prior.source_updated_at<>job.updated_at OR prior.source_receipt<>job.receipt)
  ORDER BY job.updated_at,job.id LIMIT 100
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
    db.prepare(DRAFTS).bind(SIGNATURE, scheduledAt),
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
