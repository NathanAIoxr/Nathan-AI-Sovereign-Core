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
