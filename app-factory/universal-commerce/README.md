# TABOR UNIVERSAL COMMERCE & LAUNCH CONNECTOR

**Owner:** Nathan Tabor. **Parent:** TABOR 1-2-3 FACTORY™. **Status:** tested local prototype, not a live Shopify integration.

A private conversation ZIP named `TABOR_UNIVERSAL_COMMERCE_SHOPIFY_KICKSTARTER_WORK_BUILD.zip` contains an executable FastAPI + SQLite + responsive browser application, JSON schema, Docker setup, Shopify GraphQL templates and HMAC signature verification, a 20-item production gap register, and **13 passing tests**.

## Product purpose

**CREATE ONCE → CONNECT TO A DESTINATION → REVIEW → LAUNCH WITH APPROVAL**.

Preserve each product, source image, account and project ID separately. Generate independent release packages for Shopify, Kickstarter, Indiegogo, WooCommerce, Etsy, Amazon Seller, eBay, own website, App Store, Google Play and social promotional exports. The connected root only carries authorized source assets and shared contracts.

## Current verified features
- Local master product creation, listing, single-product lookup and storage.
- Exact decimal currency to integer cents conversion and stable product IDs.
- Channel-specific **PREVIEW-only** packages; Kickstarter includes risk, funding and reward placeholders separate from Shopify draft product fields.
- Shopify Storefront Cart API request template that would return a Shopify-hosted checkout URL when executed with a properly configured merchant integration.
- Shopify Admin product-draft mutation template **not yet executed**.
- Webhook HMAC-SHA256 verification of raw request body and deduplicated receipt records.
- No live checkout, charges, product publications or Shopify/Kickstarter service connections.
- The local demo uses a forgeable `X-Demo-Workspace` header; **it is not safe to deploy publicly** and blocks nondevelopment environment startup.

## Critical correction to previous commerce proposal

Shopify Cart API `cartCreate` can direct the buyer to its returned hosted checkout URL. An Admin Draft Order API action **must not** be treated as a universal way to charge saved cards invisibly, bypass checkout, or mark an order paid without actual authorized payment. GraphQL Admin app tokens are server-side and merchant-scoped. Shopify's current merchant app authentication generally uses embedded token exchange, standalone authorization code, or client credentials only for one's own organization. Required privacy webhooks and data deletion policies must be implemented before submitting a public Shopify app. Kickstarter requires separate creator eligibility, campaign review and platform-specific action; never claim cross-posting automatically until officially supported.

Official references:
- https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate
- https://shopify.dev/docs/apps/build/authentication-authorization
- https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderComplete

## ChatGPT Work next steps

Open the private ZIP and read `WORK_START_HERE.md`; run `pytest -q` and launch `uvicorn commerce.api:app --host 127.0.0.1 --port 8000` on a local development environment. Finish real authentication + per-tenant authorization, migrations, merchant OAuth, Shopify Product/variant/media adapters, scoped rate limits, privacy webhooks, real provider receipt verification, audit/retry, rights, media linking, test storefront, staged release and publishing approvals. Implement other adapters using permitted API documentation only; manual export where publishing API does not exist.

Do not publicly push private media, developer keys, payment data or unreviewed content. Keep every product separate at TABOR ROOT.
