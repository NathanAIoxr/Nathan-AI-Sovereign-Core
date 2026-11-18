CREATE INDEX IF NOT EXISTS platform_jobs_verified_cache
ON platform_jobs(project,kind,input_sha256,finished DESC)
WHERE state='succeeded' AND backend='workers-ai-bge';
