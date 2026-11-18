INSERT INTO archive_sources(work_id,provider,external_id,material,holding,dating,shelfmark,snapshot)
SELECT id,'gutenberg',CASE id WHEN 'king-james-bible' THEN '10'
  WHEN 'alice-in-wonderland' THEN '11' ELSE '1342' END,'book','Project Gutenberg','','',
  'Project Gutenberg · source editions archived in release 1'
FROM archive_works WHERE id IN ('king-james-bible','alice-in-wonderland','pride-and-prejudice')
ON CONFLICT(work_id) DO NOTHING;
