# Community play, scheduling, classification, and rollout

## Built local behavior

A shared Display panel controls effects and motion. Advanced puzzle rules are opt-in and run in an independent Elemental Workshop; the original app's save keys and mechanics are untouched. The workshop supports bounded diagonal gravity wells, turn-resolved changing tiles, bounded cracking effects, reactive terrain, a connected settlement planner, fictional ingredient ratios, manual weather/device-time ambience, deterministic hints, optional mastery/fatigue with instant free rest, and move/cascade replays. Visual effects never determine game state.

The Community Club provides configurable local match start/duration, scheduled/live/finished windows, a duplicate-resistant score ledger, two human sides sharing a device, an explicit defender response before impact, voluntary collective building with per-member caps, practice quorum/majority voting, twelve optional club roles, and a broad knowledge catalogue alongside base-12 number display. Time windows govern the club event only, never solo access.

## Not deployed as multiplayer

The local ledger is not authenticated or cheat-resistant. Browser storage can be edited. There is no live remote opponent, shared server, global Titan, alliance inventory exchange, trained neural mentor, weather API, account roster, distributed atomic ledger, or automated reminder service. The settings identify service-dependent options as unavailable. A scheduled browser event is not a background server scheduler. Closing the browser does not send invitations or reminders.

## Live service requirements

A production war requires authenticated membership, verified move inputs rather than client scores, server-clock scheduling and move deadlines, authoritative deterministic replay, durable transactions, idempotent action IDs, presence/reconnect handling, anti-replay and action budgets, and auditable dispute resolution. Every submitted action includes match ID, unique action ID, actor identity from the verified session, expected state revision, and move/defense input. The server alone computes damage and rewards. Push updates are projections, not the source of truth.

Phases: draft → registration → ready check → scheduled → live → resolving → final → archived. Quorum and attendance rules are selected in the charter. Distinct human seats must be checked against authenticated accounts; filling ten strings does not prove ten people are connected. No automatic collective penalties for absence or leaving. Optional consequences require explicit, visible agreement and cannot involve purchased resources.

Defensive queue: attacker submits a valid move; server resolves its cascade into a pending volley; defender receives an initiative window and chooses shield/heal/counter/pass; timeout applies the published default; server commits actual damage, clamps health, appends a durable event, increments revision, and broadcasts. Invalid spells must not consume charge. Reward only actual effective defense or damage, not attempted overkill or zero-value healing.

Scheduling: store UTC instants plus an IANA timezone and original local input. Handle daylight-saving gaps and ambiguous times explicitly. Reminders require separate permission and delivery support. Match windows and ties are enforced on the server; exact ties remain draws or invoke a previously published fair tiebreak. Never silently favor team A/B.

Suggested events: room.snapshot, roster.joined, match.scheduled, ready.changed, match.started, turn.submitted, volley.pending, defense.submitted, turn.resolved, score.updated, assembly.contributed, match.finalized, room.resync. Use monotonically increasing revisions. Non-idempotent client retries cannot produce extra score or inventory.

## Club design sources and boundaries

- Robert's Rules official FAQ: https://robertsrules.com/frequently-asked-questions/ — fair deliberation, quorum and vote definitions; the practice widget is not a full RONR implementation. Majority means more than half of votes cast, not automatically 50% of all members. Charter provisions control eligible electronic meetings.
- D&D official SRD: https://www.dndbeyond.com/srd — inspiration for collaborative roles and initiative. No licensed D&D text, artwork, characters, spell catalogue, or brand assets are included in this implementation.
- 1 Corinthians 12:12–27 (KJV): https://www.biblegateway.com/passage/?search=1+Corinthians+12%3A12-27&version=KJV — diverse members working together. Luke 10:25–37 supplies a service and neighbor-care theme. Game charters are original options, not mandatory religious observance.
- OCLC: https://www.oclc.org/en/dewey.html and https://help.oclc.org/Metadata_Services/WebDewey/WebDewey_Linked_Data/Main_classes — broad classes only; no detailed licensed DDC schedule is reproduced. Catalogue strings preserve leading zeroes and precision. Decimal classification remains distinct from existing 101–901 namespaces and base-12 numeric display. Changing number notation does not make arithmetic faster or a system production-ready.

## Artwork and assets remaining

The shared layer is an integration baseline, not a claim that every game now has new painted characters, rigged cut-ins, isometric art, biome destruction assets, or production-grade online services. Existing original artwork is retained. Per-app art requires individual source assets, identity checks, mobile layout QA, and device performance tests.
