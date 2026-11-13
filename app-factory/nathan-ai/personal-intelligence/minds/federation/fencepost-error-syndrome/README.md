# FENCEPOST ERROR SYNDROME — by Nathan Tabor

**NATHAN AI 🚀 · ONE Federation · Eight boundary-audit worker bots · 2026-11-13**

Source author attribution: **“google has fencepost error syndrome by Nathan Tabor”** is preserved as the creator's allegation/name for this work. The model has **not** examined Google's production source code or established an intentional Google defect.

**[Run the local simulation](./fencepost_workers.py)** · **[Review the 19 tests](./test_fencepost_workers.py)** · **[ONE Families 65–75](../families-v75/README.md)** · **[ONE Family 21](../families-v40/README.md)**

## Implementation: eight specialist workers

| Worker | Actual bounded functionality | External action |
| --- | --- | --- |
| Roster Sentinel | Validates family IDs, nine-member ranges, duplicates, nonexistent IDs and omitted daily role-slots. | None |
| Code Sentinel | Parses **Python AST** and flags literal range-stop mistakes relative to a separately supplied inclusive specification. Suggests reviewable correction. | No automatic patch |
| Calendar Synchronizer | Reports start-inclusive/end-exclusive dates, touched endpoints, dates strictly between, and last covered date. | None |
| Subscription Guard | Calculates seven-day trial expiry and the first eligible billing date (no charges). | None |
| Hotel Stay Guard | Derives nights from check-in and checkout; checkout is not a charged night. | None |
| Material Count Guard | Calculates open/closed fence panels and posts with decimal arithmetic. Rejects non-divisible spacing. | None |
| Array Index Guard | Checks zero-based array indexing and last valid index. | None |
| Family 21 — ONE | Enforces a local-only permission gate and flags external action requests for human authorization. | No execution |

Each worker is an implemented deterministic rule-based bot, **not a connected generative AI model**. An independent AI model adapter would require a separately approved configuration, tests, credentials and actions. Python source is statically parsed, never executed as an audit input.

## Demonstration assumptions

One simulated assignment per registered member per day across **11 families × 9 members × 7 calendar days = 693 valid role-days**.

| Scheduler | Valid role-days | Omitted | Duplicated | Invalid |
| --- | ---: | ---: | ---: | ---: |
| Defective exclusive end for each family | 616 | 77 | 0 | 0 |
| Defective extra endpoint for each family | 693 | 0 | 70 | 7 |
| Fixed inclusive member ID range | 693 | 0 | 0 | 0 |

Other synthetic examples: 1,000 seven-day trials with a deliberately early charge date, 200 hotel reservations with a deliberately billed checkout night, 25 open straight fences with one missing endpoint post, and 500 arrays with one invalid last index access. The verified corrected logic removes **these assumed defects**, but no actual subscription provider, hotel, construction site, or application has been fixed or measured.

### The 7 / 6 / 8 counting distinction

For dates 2026-11-15 to 2026-11-22:

- **Seven scheduled dates**: Nov 15–21 inclusive, expressed as the interval `[Nov 15, Nov 22)`.
- **Eight named endpoint dates**: Nov 15 through Nov 22 inclusive.
- **Six named dates strictly between** Nov 15 and Nov 22: Nov 16–21.

These counts are different quantities; the software error is using one quantity in a field that needs another. The program names each type explicitly rather than inventing new arithmetic.

## Run and reproduce

Requires Python 3.10+ and only the standard library.

```bash
F=app-factory/nathan-ai/personal-intelligence/minds/federation/fencepost-error-syndrome
python3 "$F/fencepost_workers.py" --days 7 --output /tmp/nathan-fencepost-simulation.json
python3 -m unittest discover -s "$F" -p 'test_fencepost_workers.py' -v
```

An optional Python code-review example (after importing the module in a trusted local script):

```python
from fencepost_workers import CodeSentinel
print(CodeSentinel.scan_python("for x in range(65, 163): pass", first=65, last=163))
# Suggestion: range(65, 164). Never applies patches without review.
```

Output includes a SHA-256 digest of the canonical JSON report for repeatable audit checks; the original inputs are preserved. **A digest proves content integrity against a copy, not that a claim about another company's system is true.**

## Safety, performance, and limits

- Local and read-only. No network crawling, dark-web access, service probes, payments, credential access, or changes to Google or any other third party.
- Not a general-purpose security analyzer. The AST scanner only checks constant Python ranges against a separately supplied target. It cannot prove all loops are safe or eliminate all buffer overflows.
- No automatic alteration of source, contracts, calendars or construction plans.
- Calendar day counts do not guarantee elapsed hours around daylight-saving transitions.
- No prediction of real money saved, real breaches prevented or real labor productivity is implied by synthetic cases.
- Family names and member IDs are separate namespaces; source roles 65–163 remain anchored to the earlier v75 registry.
- Missing earlier family definitions remain unresolved and are never fabricated.
- The ONE human-authorization gate is present in the test module; a production adapter must enforce separate authentication, scopes, and auditing before any external action.

**Original words preserved. Boundaries specified. Errors demonstrated. Fixes verified in the bounded simulation.**
