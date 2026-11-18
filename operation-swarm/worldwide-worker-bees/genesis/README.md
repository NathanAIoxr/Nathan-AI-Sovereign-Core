# OPERATION GENESIS — runnable logic, inert offspring

- `breed-worker.ts`: TypeScript pure functions `clone`, `breed`, `examine`, `canGraduate`.
- `lineage.sql`: D1/SQLite schema for genomes, parent links, examinations and audit receipts.
- `ORIGINS-INDEX.md`: original creation/evolution/ancestry metaphor taxonomy.

All child workers remain **sandbox records**. No network access, secrets, code execution, dynamic deployment or autonomous recursive spawning is implemented. Deployment is a separate explicitly authorized workflow.

Example:
```ts
const child = breed(parentA, parentB, "child-001");
const exams = examine(child, [parentA,parentB], 10);
const readyForReview = canGraduate(exams, false); // false until approved
```
