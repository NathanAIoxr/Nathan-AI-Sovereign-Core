# Tabor Academy Conductor

Use the `tabor-academy` branch and keep Academy work scoped to this directory and its existing Cloudflare resources. The public app is served by the `tabor-academy` Worker in the `tabor-academy` dispatch namespace. Its D1 binding is `LIBRARY` backed by `tabor-academy-library`.

## Workbench backlog

```sql
SELECT t.number, t.title, z.brief, z.namespace_name
FROM academy_techniques AS t
JOIN academy_technique_zones AS z USING (number)
LEFT JOIN academy_field_activities AS a USING (number)
WHERE a.number IS NULL AND t.number <> 47
ORDER BY t.number
LIMIT 5;
```

Technique 47 already has a printable lesson and sandbox. For each selected number, write a concrete finished outcome, a demonstration, and an exercise where the learner replicates and verifies the result. Use a topic-specific practice setup. Keep the existing titles and project briefs verbatim. Use safe models for hazardous tasks.

1. Add a numbered migration for the batch using `INSERT ... ON CONFLICT(number) DO NOTHING`. Run the project's Worker tests and apply the migration to the existing D1 database.
2. Update the `TECHNIQUE` binding in each corresponding `tabor-academy-<NNN>-dev` namespace. Preserve the original record fields and add `field_activity` with `outcome`, `demonstration`, and `verification`. Use `src/technique-zone.mjs` for the individual Workers.
3. Verify the exact activity on `/workbench/zones/<number>/`, and verify the guide's printable edition at `/workbench/?guide=<number>&print=1`. Record the commit, tested paths, Worker updates, and remaining count.

When the Workbench backlog is complete, continue with field guide layouts, Field Companion, and Sandbox milestones. Verify the existing Workbench and Survival catalogs stay at 101 records each. Keep private source text in the private archive and preserve the nine-line homepage opening.
