# NATHAN AI: 111-Year Historical Sports Universe

This is a **historical reference and provenance filter**, not automatic legal immunity. In the fixed reference year **2026**, 111 completed calendar years gives the frozen historical cutoff **1915**. A founding date known only to the year cannot prove that the exact 111th anniversary has passed: use full dates if day-level precision matters.

## Classification / labels
* VERIFIED HISTORICAL: known historical founding year AND citation; source presence alone is not independent verification.
* HISTORICAL — GAPS: actual/hypothesized historic team with one or more unresolved details. Keep unknown facts null.
* GENERATED FILL-IN: simulation reconstruction or generated future expansion. Always visibly label it.
* FICTIONAL: newly invented original team or league, not presented as history.

## Two separate gates
1. Historical reference: record_kind=historical, provenance=VERIFIED HISTORICAL, founding_year<=1915, source URL present. Record-specific fact checking still required.
2. Branding/IP clearance: requires independent counsel/rights-holder/territorial review of team names, logos, uniform designs, photographs, type treatments, namesakes, sponsorships, and licensing terms. Do not infer public-domain, abandonment or a free commercial license from historical founding year, a defunct league or a database label. Website code cannot establish legal immunity.

Trademarks can be maintained indefinitely while in use and renewed; nonuse for three consecutive years gives U.S. prima facie evidence of abandonment, not a blanket public-domain result. Historical *facts* are not copyrightable, but actual visual works may have copyright considerations. Trademark protections depend on markets and jurisdiction, with additional state and foreign claims. Review by qualified counsel before release.

## Source checking
- MLB history of the Braves describes the 1871 Boston Red Stockings as the forerunner of an active franchise: https://www.mlb.com/braves/history/story-of-the-braves
- Brooklyn Tip-Tops in Baseball-Reference historical notes: https://www.baseball-reference.com/bullpen/Brooklyn_Tip-Tops
- USPTO, trademark duration: https://www.uspto.gov/trademarks/basics/why-register-your-trademark
- Trademark abandonment, 15 USC 1127: https://www.law.cornell.edu/uscode/text/15/1127
- Trademark confusion/clearance: https://www.uspto.gov/trademarks/search/likelihood-confusion
- Copyright distinction: https://www.copyright.gov/help/faq/faq-protect/

## What was NOT fabricated
No 101 North American + 101 Central/South American league roster was available in the linked repository; no unverified teams were invented to fill slots. The three historical-status source examples and one creative demo are examples only. A name such as "Panama Isthmian ICC League" in user-supplied prose is NOT self-verifying; hold until sourced.

## Code
- engine.js: pure Node/browser-compatible data validator and report builder
- examples.json: explicitly labeled, cited sample records
- schema.sql: optional non-destructive PostgreSQL schema and separate review views; NOT automatically applied to any live database
- index.html: mobile-friendly viewer / generator for clearly labeled sample simulation records
- Tests: node --test app-factory/historical-sports/engine.test.cjs

Commercial release requires human IP clearance, not automatic rule-based release.
