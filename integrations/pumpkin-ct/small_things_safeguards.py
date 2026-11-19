"""Small-things safeguards manifest: planning/configuration, not proof of deployment."""
SMALL_THINGS_SAFEGUARDS_PATCH = {
 "money": "Use integer cents and balanced, transactional ledger entries; reconcile provider settlement.",
 "idempotency": "Unique provider event IDs + durable outbox and provider-side idempotency for charges and fulfillment.",
 "timezone": "Store IANA timezone; compute quiet hours in tenant local time, handle DST and emergency opt-ins.",
 "offline": "IndexedDB queues signed delivery evidence and cash sales; payment intents remain PENDING until provider confirmation. Encrypt sensitive data, expire local caches.",
 "onboarding": "Require two verified admins for activation; short-lived one-use SMS/email links with rate limits, MFA for privileged actions.",
 "subdomains": "Provision only under a domain the organization owns/controls; custom domains optional and verified.",
 "receipts": "Separate taxable merchandise sales from qualified donations; review jurisdiction-specific tax treatment and FMV.",
 "renewals": "Use clear statement descriptors within provider limits; consent-based reminder messaging before recurring gifts.",
 "delivery": "Verify unloading equipment and crew 24 hours ahead; weather holds and pre/post evidence, with consent for location.",
 "voice": "Read back amount, recipient, frequency, and date; require explicit authenticated confirmation before writes.",
}
