# TABOR Dynamic Pricing & Audience Router
**Module:** T123-PRICING-ROUTER-001 | **State:** working static preview, not real billing.

The original design tied Max Apex to individual spending/wealth and used a Swift enum with invalid stored properties. This implementation routes by product/audience **purpose** and scope, never by someone's inferred means. Use one source to configure new games: policy.json (ordered rules, first wins), catalog.json (product templates, eligible audiences/categories, example preview pricing), engine.js (isomorphic Node/browser decision function), and index.html (iPhone-friendly interactive preview with JSON export).

- WHO = target audience (children, families, general, educators, professionals).
- WHAT = content/game category, complexity, delivery costs, ongoing services, free core, and declared features.
- Social Flow = free-first; children always receive it, without ads, recurring billing, or direct child checkout.
- Core Pipeline = a defined ongoing-content or multiplayer product can offer time passes, subscriptions or durable packs.
- Max Apex = advanced game/creative-product functionality, not individual whale extraction.
- Pricing bands are **product-wide** design examples; actual platform pricing comes from a separately configured and approved SKU and a localized native billing query.
- A proposal cannot collect payments, verify ownership or publish without human approval.

Run tests: node --test app-factory/pricing-router/engine.test.cjs

See the browser preview in index.html. For production: protect an owner-approved catalog on the server; register platform products and price schedules; implement StoreKit 2 / Play Billing, signed purchase verification, tenant-bound entitlements, idempotent ledger, refunds, parent gates, platform review, privacy and real devices. The public repository MUST NOT contain private customer profiles, keys, payment identifiers, or unreleased source content.

Platform references:
- https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.android.com/google/play/billing
- See ../RELEASE_GATES.md for Factory release requirements.

Mixed-age and family apps default to the child-directed safeguards. A general-audience app with a known child audience must declare includesChildren=true; the planner does not itself establish age or consent.

Native iOS: FactoryPricingRouter.swift decodes the same policy and catalog structures; it is a **pricing-plan evaluator**, not a replacement for verified StoreKit payments or a security boundary.

## Automatic per-game manifests
Each game can carry a simple JSON metadata profile. Run: node app-factory/pricing-router/build-manifests.cjs app-factory/pricing-router/manifests.example.json
The batch generator returns separate deterministic pricing proposals for every app ID; an app can use the same engine at build time. The sample has five PUBLIC generic demos (not unpublished owner titles). Replace it with each app's real metadata inside its own repository. Real payment SKUs, owner review and native price lookups remain separate.
- manifests.example.json: five illustrative WHO+WHAT app profiles.
- build-manifests.cjs: CLI/library batch planner with duplicate-ID safety.
- build-manifests.test.cjs: batch acceptance tests.
