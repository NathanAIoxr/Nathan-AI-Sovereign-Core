# TTFES&BTP · The Tabor Finger Electric Slide and Button Tapping Process

**Creator:** Nathan Tabor · **Parent:** TABOR 1-2-3 FACTORY · **Status:** additive, offline-capable prototype for preparing Kickstarter campaigns. The content and workflow are the owner's, not an official Kickstarter product.

## What is working

Open \`index.html\` inside the complete Factory checkout/site.

- Draft a Kickstarter campaign with title, subtitle, story, duration, funding goal, currency, risk disclosures, milestones, and three optional reward tiers.
- Preserve a separately supplied original source transcript, rather than silently replacing it with the generated campaign.
- Export a real local ZIP using the existing DUMMIE \`publisher.js\` ZIP engine. ZIP contains original source, JSON, Markdown story, HTML preview, status receipt and handoff instructions.
- Copy complete campaign JSON or campaign story with click actions. Import locally saved JSON drafts.
- Display a universal destination registry with honest statuses. **Only Kickstarter local packaging is implemented in this module.** It does not silently claim support for unbuilt destinations.
- Open the official Kickstarter creator start page **after explicit local review checkboxes** (rights, rewards, costs). Opening that page is never reported as publication.

## Optional browser companion

\`kickstarter-companion.user.js\` is a source-inspectable user script for compatible userscript managers. Inspect and review its code before installing.

1. Copy the prepared campaign JSON in the Factory.
2. On a Kickstarter page, press **Alt+Shift+S** to open/close the companion.
3. Paste the JSON into the companion and choose **LOAD JSON**.
4. Choose a field from the dropdown. Click the **actual corresponding Kickstarter text field**.
5. Press **Alt+Shift+V** to fill only the last focused permitted field, or click **FILL LAST FOCUSED FIELD**. The companion also offers **COPY SELECTED** as a manual fallback.
6. Verify every value displayed on Kickstarter. Save, submit for review, and launch using the platform's own controls and decisions.

The companion **does not** try to discover hidden selectors or automatically click submission, launch, pledge, checkout, or bank fields. It rejects password/payment/verification-like fields. It does **not** read credentials, store campaign data persistently or send data over the network. It runs locally in the page, subject to browser restrictions and Kickstarter's rules. Platform markup and editable-widget behavior can still change, so each transfer requires visual verification.

## Validation and state

- Structured campaign schema: \`tabor.ttfes-btp.kickstarter.v1\`.
- Goal and reward amount must be positive integers; duration 1–60 days.
- Campaign status stays \`local-preparation-only\` / \`not-submitted\` / \`not-launched\`, and no remote outcome is fabricated.
- HTML preview escapes campaign content. ZIP metadata contains no passwords or API tokens.
- This is a **draft**, not a live Kickstarter integration. Financial/identity verification, platform approval, shipping arrangements, intellectual-property permission, truthful project claims and actual launch must be completed on the official site.
- Kickstarter and Amazon Kindle Direct Publishing are distinct products. The separate [Tabor Transcript Transporter](../one/tabor-transcript-transporter/README.md) handles KDP-oriented draft packaging where available; this project is its sibling, not a replacement.

## Extending TTFES&BTP

Create one typed canonical source package and separate authorized destination adapters. For each new destination:

1. Prefer documented provider APIs or supported CSV/bulk imports where they exist.
2. Define a versioned input/output schema, required permissions, supported fields and provenance.
3. Provide mapping previews with explicit per-field selection. Never assume selectors based only on placeholder text.
4. Validate destination-specific required disclosures, copyrights, costs and constraints.
5. Require explicit owner approval for irreversible or public changes.
6. Record verified destination receipt/status; retry safely without duplicate submissions.
7. Preserve unmodified originals, revision history and independent backups outside public source repositories.

### Intended adapters (not yet built)

ONE Library, GitHub/Vercel, Airtable/Notion/Drive, metadata/ISBN cataloging, Indiegogo/BackerKit, commerce, app stores, podcast/audiobooks, evidence archives and other authorized form-driven dashboards. The registry reports each stage accurately.

## Test

\`\`\`sh
node --test app-factory/electric-slide/engine.test.cjs
node --test app-factory/dummie-publisher/publisher.test.cjs
\`\`\`

**No secrets, creator financial information, private manuscripts or actual bank details should be committed to this PUBLIC GitHub repository.**
