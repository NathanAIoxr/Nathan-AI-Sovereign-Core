CREATE VIEW IF NOT EXISTS repair_handoff_candidate AS
  SELECT job.id AS job_id, job.status AS job_status, job.updated_at AS source_updated_at, job.receipt AS source_receipt,
         CASE job.status
           WHEN 'VERIFIED' THEN 'A patch with passing checks is ready for review for '
           ELSE 'A draft patch is prepared for '
         END || job.repository || '#' || job.number || '. ' || job.title ||
         char(10) || char(10) || 'Upstream base: ' || json_extract(job.receipt,'$.base') ||
         CASE job.status WHEN 'PATCH_READY'
           THEN char(10) || 'The full runtime check is pending.' ELSE '' END ||
         char(10) || char(10) || 'All my best,' || char(10) || 'Nathan Tabor' || char(10) ||
         'Sovereign Architect' || char(10) || 'Nathan AI 🚀' AS note
  FROM repair_jobs AS job
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
    ));

CREATE TRIGGER IF NOT EXISTS repair_handoff_after_insert
AFTER INSERT ON repair_jobs
WHEN NEW.status IN ('PATCH_READY','VERIFIED')
BEGIN
  INSERT INTO repair_handoff_outbox(job_id, job_status, source_updated_at, source_receipt, note, draft_at)
  SELECT job_id, job_status, source_updated_at, source_receipt, note, unixepoch()
  FROM repair_handoff_candidate WHERE job_id=NEW.id
  ON CONFLICT(job_id) DO UPDATE SET
    job_status=excluded.job_status,
    source_updated_at=excluded.source_updated_at,
    source_receipt=excluded.source_receipt,
    note=excluded.note,
    draft_at=excluded.draft_at
  WHERE repair_handoff_outbox.job_status<>excluded.job_status
    OR repair_handoff_outbox.source_updated_at<>excluded.source_updated_at
    OR repair_handoff_outbox.source_receipt<>excluded.source_receipt
    OR repair_handoff_outbox.note<>excluded.note;
END;

CREATE TRIGGER IF NOT EXISTS repair_handoff_after_update
AFTER UPDATE OF status, receipt, updated_at, title, repository, number ON repair_jobs
WHEN OLD.status IN ('PATCH_READY','VERIFIED') OR NEW.status IN ('PATCH_READY','VERIFIED')
BEGIN
  DELETE FROM repair_handoff_outbox
  WHERE job_id=NEW.id AND NOT EXISTS (
    SELECT 1 FROM repair_handoff_candidate WHERE job_id=NEW.id
  );
  INSERT INTO repair_handoff_outbox(job_id, job_status, source_updated_at, source_receipt, note, draft_at)
  SELECT job_id, job_status, source_updated_at, source_receipt, note, unixepoch()
  FROM repair_handoff_candidate WHERE job_id=NEW.id
  ON CONFLICT(job_id) DO UPDATE SET
    job_status=excluded.job_status,
    source_updated_at=excluded.source_updated_at,
    source_receipt=excluded.source_receipt,
    note=excluded.note,
    draft_at=excluded.draft_at
  WHERE repair_handoff_outbox.job_status<>excluded.job_status
    OR repair_handoff_outbox.source_updated_at<>excluded.source_updated_at
    OR repair_handoff_outbox.source_receipt<>excluded.source_receipt
    OR repair_handoff_outbox.note<>excluded.note;
END;

CREATE TRIGGER IF NOT EXISTS repair_handoff_before_delete
BEFORE DELETE ON repair_jobs
BEGIN
  DELETE FROM repair_handoff_outbox WHERE job_id=OLD.id;
END;
