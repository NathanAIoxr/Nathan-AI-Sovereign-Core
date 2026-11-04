# ChristmasToyDrive.com — Built Website + Operations Platform

**Additive development version 0.2 — November 4, 2026.** Original Nathan AI, Christmas Toy Drive, and pending Cash App giving gateway source are untouched. This working addition turns the three departments and 24 price tiers into a functional responsive app, with a private operations API.

## Run the full application

```bash
cd platform
python -m pip install -r requirements.txt
export CTD_ADMIN_KEY='replace-with-32-plus-random-characters'  # local development only
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000/**. Select **Staff** to inspect development inventory and campaigns. Do not use the included example secret for anything real. The SQLite database is created on startup and ignored by version control. `CTD_DATABASE_PATH` can override its location. Run `pytest -q` for the API tests. A standalone `preview.html` also opens without installing Python and is clearly marked as a preview; no backend data is saved in that copy.

## Built interface — what each element does

| Experience | Interactive frontend | Backend / data |
|---|---|---|
| Home and mission | Responsive illustrated hero, navigation, department cards, year-round story | Content constants and original mission taxonomy |
| Giving plan | Five designations, 6 quick amounts, custom amounts, 3 cadences, live summary, validation | `POST /api/plans` persists a non-payment, idempotent planning record |
| Gift catalog | All 24 tiers, search, group filter, direct select → plan | `GET /api/catalog` from versioned `catalog.json` |
| Christmas / birthday / learning / emergency / 365 circle / logistics | Six detailed program panels | Concept taxonomy; no invented partner arrangements |
| Honor card | Live greeting editing, print, copy | **Browser only**; no honoree data transmitted |
| Get involved | Interactive checklists for in-kind goods, volunteers, organizers and assistance | **Browser only**; no sensitive intake |
| Impact | Evidence-gated public transparency indicators | `GET /api/impact` deliberately reports unavailable metrics, not fake zeroes |
| Staff console | Secret entry, plan overview, inventory register, draft campaigns, recent audit | `GET /api/admin/overview`, `/inventory`, `/audit`; `POST /api/admin/inventory`, `/campaigns` |
| Inventory workflow | Development SKU entry and register | SQLite inventory, inspection state, controlled stock movements and auditable events |
| Partner handoff | Operations endpoint; no public recipient identities | `POST /api/admin/batches`, optional reviewed handoff flag |
| FAQs and safeguards | Explicit status explanations | No live payment, family database or tax assertions |

### API endpoints

Public: `GET /`, `GET /api/health`, `GET /api/catalog`, `GET /api/impact`, `POST /api/plans`.

Staff-only: `GET /api/admin/overview`, `GET /api/admin/inventory`, `GET /api/admin/audit`; `POST /api/admin/inventory`, `POST /api/admin/inventory/{id}/safety`, `POST /api/admin/movements`, `POST /api/admin/campaigns`, `POST /api/admin/batches`. These require the `X-Admin-Key` header and a **server-side** `CTD_ADMIN_KEY` of at least 16 characters. This header is a development interface, not production authentication.

### Data tables

`giving_plans`, `inventory`, `movements`, `campaigns`, `batches`, `audit`. Inventory starts at zero, and cannot be distributed before safety clearance or beyond available units. Batch records require a non-identifying partner reference. Idempotency prevents duplicate planned gift IDs on retries.

## Release blockers (not fabricated)

**This build does not collect money.** It has no live payment processor, Cash App verification, subscriptions, account-linked donors, receipt mailer, inventory suppliers, nonprofit eligibility verification, state solicitation approval, family intake, verified partner distribution, or public impact data. The $5–$100,000 tiers are proposed budgets and have not been validated against vendor quotations. The 2011/2012 legacy project history does not establish current operations.

Before production, implement: verified legal payee/charitable status, merchant processor with signed webhooks and refund reconciliation; secured donor portal, cancellation and receipts; managed MFA/role-based access; encrypted child-safe referral infrastructure and retention limits; approved inventory and food safety procedure; partner agreements; double-entry fund accounting and independent controls; monitored jobs/backups, penetration tests, accessibility and browser/device QA; approved domain routing. Deploying this development server publicly with a single admin key is **not** recommended.

## Original project linkage

Repository: https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core

Existing pages: `app-factory/christmas-toy-drive/index.html` and the review-only pull request #75 giving gateway. This new package is independent and additive; no previously merged or draft work was overwritten and no connection to the real christmastoydrive.com domain was made.
