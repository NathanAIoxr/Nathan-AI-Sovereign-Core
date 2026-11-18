INSERT INTO tabor_imagination_engines (release_sha256, number, entry)
SELECT ?1, CAST(json_extract(value, '$.number') AS INTEGER), value
FROM json_each(?2)
WHERE 1
ON CONFLICT (release_sha256, number) DO NOTHING;
