# HEAR YA! HEAR YA! 🦝🚀

Nathan Tabor identifies his TheConservativeVoice.com email-to-template trigger as the ancestor of NUTSY's **Two Ears, One Mouth**. He describes emailing daily updates while away from his desk. The server received the email, prepared a newsletter from a template, and handled distribution. Recovered public material documents the newsletter, subscription and unsubscribe interfaces, and an RSS edition. The original trigger code, mail configuration, and production dispatch queue have yet to be recovered. Postfix and procmail describe one possible historical implementation.

| Stage | TheConservativeVoice.com, as described by Nathan | NUTSY |
|---|---|---|
| Remote trigger | Send an email while away from the desk. | Speak or type on the phone, or send email to a dedicated private address. |
| Ear 1, capture | Extract the newsletter draft from the email. | The email Worker checks the configured recipient, sender and Cloudflare's DMARC result. Ubuntu extracts plain text from MIME and preserves the full received message and the extracted text with separate SHA-256 digests. |
| Ear 2, template and audit | Place the draft into the HTML or text newsletter template and check the structure. | Use the extracted draft in the existing NUTSY readback. Resolve exceptions before GO. Locked JSON, HTML and KDP templates are destinations for this step. |
| One Mouth, GO | Hand off the newsletter for distribution. | Use the existing owner-reviewed dispatch for GitHub, Cloudflare D1 and R2. Additional external destinations require their own verified integrations. |

## Exact Ubuntu email contract

The Worker POSTs to the verified HTTPS tunnel URL ending in `/ear1/hear`. The request contains `Authorization: Bearer <dedicated email intake token>`, `Content-Type: message/rfc822`, and the received MIME bytes. The loopback Ubuntu sidecar listens on port 8791. It returns HTTP 201 with a receipt for a new capture, HTTP 200 with the same receipt for identical MIME bytes, or an error if it cannot stage the message. Mail transport can rewrite headers between deliveries, so bytewise retry detection depends on receiving the same MIME bytes.

Intake writes to its own SQLite inbox. The raw MIME preserves headers, alternatives, and attachments for provenance. The text used for review comes from a decoded plain-text body. Signatures, line endings returned by the MIME decoder, spaces, and Markdown are kept in that source text. Apply formatting only in the derived template. The email's subject and body are data. Copy the extracted text into the existing [private NUTSY cockpit](https://nathan-ai-conductor.nathantabor.chatgpt.site/nutsy/) for Ear 2 and owner GO. The email capture path never calls the deployment queue. An automated handoff into Ear 2 requires a verified staging API for that cockpit.

## Host and routing

Install `ear1.py` at `/opt/nutsy-email-intake/ear1.py` and the provided unit under `/etc/systemd/system/`. Create a root-readable mode-0600 environment file `/etc/nutsy-email-intake.env` with `NUTSY_EMAIL_TOKEN` and `NUTSY_EMAIL_SENDER`. Use a randomly generated dedicated token and the owner's actual mailbox. Reload systemd, enable and start the unit, and verify its state on `nathan-1`. The service keeps its data under the systemd state directory for `nutsy-email-intake`.

Give the existing private tunnel an HTTPS route for `/ear1/hear` to `http://127.0.0.1:8791`. The Worker needs the same token as a secret, the allowed sender, the dedicated inbound recipient as `NUTSY_TRIGGER_ADDRESS`, and that exact HTTPS URL as `NUTSY_EAR1_URL`. Configure the recipient only in an owned Email Routing zone. If the tunnel route uses an extra access policy, supply and verify the approved Worker service identity before routing mail. The restoration site and its newsletter or subscriber data need no changes.

Send a synthetic plain-text email and check that the sender is accepted, the receipt and hashes match Ubuntu's inbox, and no dispatch happened before an explicit GO. Replay the same MIME bytes and verify that the receipt stays the same. See [Cloudflare's Email Workers API](https://developers.cloudflare.com/email-service/api/route-emails/email-handler/).
