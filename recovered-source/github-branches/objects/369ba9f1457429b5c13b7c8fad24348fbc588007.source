# Christmas Toy Drive giving gateway — integration and release guide

This additive browser-only module is a public **planning interface and external Cash App link**. It is not an integrated payment service, donor database, email delivery system or verified nonprofit checkout.

- The project's owner supplied Cash App profile name **DOG GOD** and public cashtag **$DOGGODjnt** via screenshots. Verify the destination matches the intended receiving account before approving publication. Never publish private keys, banking data or account session tokens.
- Direct profile route: `https://cash.app/$DOGGODjnt`. This is external; no server callback or amount prefill is assumed. Verify live behavior on multiple devices before launch.
- Only show a "planned" donation and an optional printable tribute card. Never state "paid" because a user clicked a payment link.
- For automatic email receipts a secure backend must store consented emails, verify payment status through the provider, link reference IDs, handle duplicates/refunds, respect unsubscribe/deletion requests, and send proper acknowledgments. An ordinary Cash App personal transfer is not sufficient for automatic reconciliation through this static GitHub Pages site.
- Donation receipts **must not claim federal tax deductibility** until organization eligibility, EIN, donation payee and applicable legal requirements have been verified.
- Physical toy donation and purchasing inventory are not enabled without shipping/drop-off logistics, transparent fulfillment and privacy protections for children.
- The visible default card is **not a donation receipt**. No contact details are stored, posted, or embedded in public source by the frontend.
- Release gates: review account identity, legal/tax status, privacy, accessibility, provider rules, tested payment receipt workflow, verified website links, owner authorization. Leave this PR as a reviewable change; merging into main/public deployment requires an explicit launch approval.

## Test
`node --test app-factory/christmas-toy-drive/give/giving.test.cjs`

## Next integration steps
1. Add private database and service with event log, donor email vault, privacy consent, immutable reconciliation references, refunds, and role separation.
2. Connect a real checkout provider that supports Cash App Pay and verifiable payment webhooks; do not treat cashtag page opens as completed charges.
3. Implement accurate electronic acknowledgments, honor cards, donor preferences and fulfillment tracking.
