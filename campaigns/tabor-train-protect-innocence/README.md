# The Tabor Train of Truth — TEK: Protect Innocence

An independent, public-awareness project using a mythological Matrix-style train as a symbol for child protection, transparent institutional accountability, and lawful reporting.

## Live deployment

- Cloudflare Worker: `tabor-train-protect-innocence`
- Intended public URL: https://tabor-train-protect-innocence.nathantaboract.workers.dev/
- Health check: https://tabor-train-protect-innocence.nathantaboract.workers.dev/health
- Source: `worker.js` (this folder)
- Host: Cloudflare Workers (no database, no accounts, no tracking, no user submissions)

## Message

- **TEK — PROTECT INNOCENCE**
- **John 14:12 (KJV)** — a call to greater works.
- **James 1:27 (KJV)** — care for the vulnerable.
- A challenge to all institutions, religious and secular, to make child safety and independent accountability concrete.
- Symbolic fiction about AI scale and the mythological train is explicitly differentiated from live deployment claims.

## Immediate reporting routes

- NCMEC CyberTipline: https://report.cybertip.org/
- FBI tips: https://tips.fbi.gov/
- Emergency in the U.S.: 911

This Worker is an awareness signpost, not a hotline or evidence repository. Do not send child sexual abuse material or personal allegations to this project. Preserve only lawful details such as dates, usernames, URLs, and firsthand observations; make reports to appropriate agencies rather than confronting or threatening suspects.

**Safety boundaries:** The Worker neither scans nor connects to third-party machines. It does not attack, hack, stalk, identify, harass, or surveil any person, religion, website, or organization. It does not collect reports or private information.

## Deployment notes

The standalone ES module Worker contains the HTML, CSS, and inline SVG, and exposes only `/`, `/index.html`, and `/health`.

Use an authorized deployment flow to update it. The original previously generated poster is a separate ChatGPT image and is **not** embedded in this Worker; this release uses an original vector locomotive illustration.

