# Glassbeetle #341 patch handoff

Prepared by Nathan Tabor and Nathan AI.

- [Upstream issue](https://github.com/Open-Glassbeetle/glassbeetle/issues/341) was open, unassigned, and labeled Help Wanted at the time of review. The public issue timeline contained label and type events and showed no linked fix.
- [Exact base](https://github.com/Open-Glassbeetle/glassbeetle/commit/83d66d3d8cbf3a3d5106f1ab55cf1f76e4fa5f95) was the tip of upstream `main` at verification. [Contribution instructions](https://github.com/Open-Glassbeetle/glassbeetle/blob/83d66d3d8cbf3a3d5106f1ab55cf1f76e4fa5f95/CONTRIBUTING.md) specify MIT terms and ask contributors to claim an issue by commenting before submission.
- [Patch](glassbeetle-341.patch) changes one end-to-end test. It uses the existing `fs` import to resolve the temporary directory, storage root, and SQLite database path before testing containment.
- Verified that the complete original hunk matched the pinned upstream file at the line in the patch header. Exercised the resulting assertion body with three JavaScript fixtures using mocked filesystem and database calls. The macOS alias and ordinary temporary path passed. The lookalike sibling path was correctly rejected.
- **Status** Prepared and checked against the exact source with fixture validation. The actual macOS integration test remains pending. No upstream comment, pull request, or issue state change was made.

On macOS with the project toolchain installed, apply the patch to the pinned checkout and run the maintainer's verification command.

```sh
npm ci
npm run test:e2e -w @glassbeetle/api -- test/projects-artifacts.e2e-spec.ts
```
