# FENCEPOST ERROR SYNDROME — by Nathan Tabor
## ONE v2: Restore intent · Remove boundary arithmetic from Nathan AI core · Delegate to workers

**User-authored original intent, preserved exactly:**
> restore all my intent and build on it - no ambiguity - make Nathan AI work bots to fix all that while also removing it from Nathan AI -

**User-authored project name, preserved exactly:**
> google has fencepost error syndrome by Nathan Tabor -

These are quotations of user-provided statements. The second statement is a creator-authored allegation/name, not proof of any Google software defect or intent. User-provided reference text and historical anecdotes remain separate from independently verified historical evidence.

### The distinction to preserve

An integer point, a section between two points, an event occurrence, a calendar date, an elapsed second, and a night spent are **six different units**. Giving them the same untyped field `days` or `count` creates the conditions for silent fencepost errors.

- **Forward mistake:** 10 straight open-fence sections require **11 posts**, not 10.
- **Reverse mistake:** 10 posts on that fence create **9 between-post sections**, not 10.
- **Inclusive integer IDs:** members 65 through 163 inclusive = **99** members. In Python use `range(65, 164)`.
- **7 / 6 / 8:** from Nov 15 to Nov 22, 2026: **7** scheduled dates for `[Nov 15, Nov 22)`; **8** named dates with both endpoints included; **6** strictly between the endpoint dates.
- **Hotel nights:** June 1 check-in and June 5 checkout = **4** nights, not 5.
- **Array bounds:** 10 zero-indexed elements have valid indices 0 through 9; position 10 is invalid.
- **Shared music endpoint:** a diatonic third + third = fifth, not sixth; the common middle scale degree is counted once.
- **Recurring monuments / decades:** if event #1 is at time coordinate 1993 and 120 events are spaced by ten years, event #120 is at **3183**, but the end of a full 120 decades is **3193**. The model labels event count versus completed periods; this calculation does not independently verify any particular historical project.
- **Gregorian year-zero caveat:** integer-year math may have zero, while named historical calendars may not. The timeline worker labels it a coordinate model rather than inventing a historical calendar.
- **Clock vs. calendar:** an offset-aware interval across DST can be **23 or 25 hours** while crossing exactly one date boundary. **Do not calculate hotel nights by dividing timestamp differences by 86,400.**

### Removal architecture (the literal requested separation)

```text
Nathan AI / ONE core
    |
    |  EXACT typed request: kind + inputs + optional expected
    v
nathan_ai_boundary_gateway.py  (thin adapter; NO arithmetic, NO fallback)
    |
    v
fencepost-error-syndrome/boundary_engine.py
    ├── Endpoint & Inclusive-Count Worker
    ├── Construction & Marker Worker
    ├── Calendar & Hospitality Worker
    ├── Subscription Boundary Worker
    ├── DST-Safe Duration Worker
    ├── Index & Buffer Bounds Worker
    ├── Decade & Historical Anchor Worker
    ├── Shared-Endpoint Music Worker
    └── Code Range Static-Review Worker
    |
    v
Expected-value validation + fail-closed response + SHA-256 receipt
    |
    v
Nathan AI receives VERIFIED result or BLOCKED + reason
```

**What is removed from the NEW Nathan AI adapter:** counting formulas, date-span inference, endpoint guessing, self-correction by improvisation, and silent fallback if a specialist is missing.

**What remains:** user authorship, verbatim source material, Family 21 ONE, existing federation database, historical versions, and audit records. Neither source texts nor repositories are destructively purged to satisfy the instruction. The adapter does not authorize external patches or changes to other companies' services.

This commit provides the isolated module and main-app adapter. It does **not** prove every existing application path has been redirected: callers must actually import and call the adapter. A system-wide production audit remains necessary before claiming global protection.

### Exact interface

From the repository's federation directory:

```python
from nathan_ai_boundary_gateway import dispatch_boundary_request

result = dispatch_boundary_request({
    "request_id": "member-id-audit-001",
    "kind": "points",
    "inputs": {
        "start": 65,
        "end": 163,
        "include_start": True,
        "include_end": True
    },
    "expected": {"count": 99}
})
assert result["status"] == "verified"
assert result["result"]["count"] == 99
```

There is **no** generic request `"how many days?"`: for `kind="calendar"`, the caller must explicitly choose `half_open_dates`, `both_endpoint_dates`, `strictly_between_dates`, or `hotel_nights`. Missing or extra input keys, invalid types, unknown actions and failed expected-value checks are **blocked** and flagged for review.

### Tests and simulations

```sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation/fencepost-error-syndrome
python3 "$F/boundary_engine.py" --demo --output /tmp/nathan-boundary-v2.json
python3 -m unittest discover -s "$F" -p 'test_boundary_engine.py' -v
```

Locally verified in the creation session: **31 unit tests** and **10,000 seeded property checks** passed. The demo contains 14 contract cases: 13 verified and one deliberately ambiguous `days` request blocked.

**Scope of validation:** deterministic local code + bounded toy examples, not universal mathematical proof, no access to Google's systems, no guaranteed monetary outcomes, no live human workers dispatched, no SQLite owner database changed, no external code patched, and no network activity.

### Integrating with the private ONE SQLite federation

The main source registry and private database are deliberately unchanged. `boundary_routing_manifest.json` describes the new route. Record signed receipts or request/response **only with explicit local owner configuration and privacy review**; do not make public the private master database.

**Safety and integrity:** 0/1/2 edge cases, missing last marker, extra first marker, invalid end, daylight-saving durations, one-based event positions, and shared musical middle notes are all covered by tests. Unknown types are not coerced and are never silently fixed.

**Author's intent:** Preserve original words, install dedicated worker bots, move boundary math OUT of Nathan AI's own decision path, verify before publishing, and leave human approval in charge.
