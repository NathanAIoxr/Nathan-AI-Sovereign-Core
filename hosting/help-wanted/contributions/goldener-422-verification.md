# Goldener #422 verification

Prepared by Nathan Tabor and Nathan AI.

- [Maintainer request](https://github.com/goldener-data/goldener/issues/422) was open, unassigned, and labeled `help wanted`, `documentation`, and `ready` on November 16, 2026.
- Upstream base checked: [`d3af9cada8134abcbb4890d3a5eebeed185580e2`](https://github.com/goldener-data/goldener/commit/d3af9cada8134abcbb4890d3a5eebeed185580e2).
- Patch: [goldener-422.patch](goldener-422.patch).
- Terms: upstream repository includes Apache License 2.0. Its README has contribution instructions.

## Checks performed

- Two file sections checked.
- Docs/posts/GOLD_DENSITY_WEIGHING.md hunk counts checked.
- Docs/posts/GOLD_DENSITY_WEIGHING.md preimage at declared position checked.
- README.md hunk counts checked.
- README.md preimage at declared position checked.
- No upstream overwrite checked.
- README links to added guide checked.
- Heading link 1-introduction checked.
- Heading link 2-components checked.
- Heading link 3-working-example checked.
- Heading link 4-using-weights-in-training checked.
- All three relative links resolve checked.
- Documented public methods present checked.
- Upstream numerical tests present checked.
- Independent documented expected weights checked.

An in-memory JavaScript check compared the patch's declared preimage against the original README and applied the two hunks. The weighted sample calculation was independently checked in JavaScript using Float32 inputs. It produced approximately `0.1443375684`, `0.1443375684`, and `1.0` for IDs `20`, `50`, and `90`.

## Pending

Run `git apply --check` against the pinned upstream commit and execute the documentation's Python example and relevant upstream tests in an isolated checkout. Delivery and upstream merge remain pending.

## November 17 recheck

- Rebased and regenerated the patch against upstream [`d6e7040`](https://github.com/goldener-data/goldener/commit/d6e7040dbe751266d8ee5843306a0329c9c64f61). The prior patch needed `git apply --recount` because a hunk count was incorrect. The replacement passes Git's application check without it.
- Verified the Markdown links and parsed the embedded Python example.
- The upstream weighing suite passed 49 checks. Its 45 PixelTable integration checks and the full example were blocked when the execution environment denied PostgreSQL's local socket initialization.
- The contribution remains a draft pending the runtime example and upstream delivery.
