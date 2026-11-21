# HEAR YA! HEAR YA! 🦝🚀

Nathan Tabor identifies his TheConservativeVoice.com email-to-template trigger as the ancestor of NUTSY's **Two Ears, One Mouth**. He describes emailing daily updates while away from his desk. The server received the email, prepared a newsletter from a template, and handled distribution. Recovered public material documents the newsletter, subscription and unsubscribe interfaces, and an RSS edition. The original trigger code, mail configuration, and production dispatch queue have yet to be recovered. Postfix and procmail describe one possible historical implementation.

| Stage | TheConservativeVoice.com, as described by Nathan | NUTSY |
|---|---|---|
| Remote trigger | Send an email while away from the desk. | Speak or type on the phone, or send email to a dedicated private address. |
| Ear 1, capture | Extract the newsletter draft from the email. | The email Worker checks the configured recipient, sender and Cloudflare's DMARC result. Ubuntu extracts plain text from MIME and preserves the full received message and the extracted text with separate SHA-256 digests. |
| Ear 2, template and audit | Place the draft into the HTML or text newsletter template and check the structure. | Captured email appears automatically in the private Ubuntu Ear 2 inbox. The reviewer sees the source text, digest, selected destination, and exact Conductor request. |
| One Mouth, GO | Hand off the newsletter for distribution. | A confirmed owner GO sends the exact reviewed request to the existing local Conductor for GitHub, Cloudflare D1 or R2. |

## Exact Ubuntu email contract

The Worker POSTs to the verified HTTPS tunnel URL ending in `/ear1/hear`. The request contains `Authorization: Bearer <dedicated email intake token>`, `Content-Type: message/rfc822`, and the received MIME bytes. The loopback Ubuntu sidecar listens on port 8791. It returns HTTP 201 with a receipt for a new capture, HTTP 200 with the same receipt for identical MIME bytes, or an error if it cannot stage the message. Mail transport can rewrite headers between deliveries, so bytewise retry detection depends on receiving the same MIME bytes.

Intake writes to its own SQLite inbox. The raw MIME preserves headers, alternatives, and attachments for provenance. The text used for review comes from a decoded plain-text body. Signatures, line endings returned by the MIME decoder, spaces, and Markdown are kept in that source text. Apply formatting only in the derived template. The email's subject and body are data. The Ubuntu Ear 2 inbox reads directly from that SQLite inbox. Email capture, opening a review, and selecting a destination make no calls to the Conductor. The owner reviews the original text and exact JSON, checks confirmation, and selects GO. The owner interface signs the review against the packet and records one dispatch attempt per receipt before calling the local Conductor. A transport failure or restart during the attempt requires checking the Conductor ledger before considering a retry. HTTP acceptance only records the Conductor response. Verify the destination separately.

The hosted NUTSY cockpit has its own review flow. This implementation runs the email review on Ubuntu. It formats a D1 JSON record, an R2 text object, or a GitHub text file. HTML newsletter rendering, KDP packaging, arbitrary email-command interpretation and external publishing require their own destination adapters.

## Host and routing

Install `ear1.py` and `review.py` under `/opt/nutsy-email-intake/` and the provided unit under `/etc/systemd/system/`. Create a root-readable mode-0600 environment file `/etc/nutsy-email-intake.env` with `NUTSY_EMAIL_TOKEN` and `NUTSY_EMAIL_SENDER`. Use a randomly generated dedicated token and the owner's actual mailbox. In the same protected environment file set `NUTSY_REVIEW_PASSWORD` to a distinct random password of at least 32 characters and `CONDUCTOR_BEARER_TOKEN` to the existing local Conductor secret. The review uses the existing service at `http://127.0.0.1:8000/dispatch`. Omitting both review variables leaves email capture enabled. From the checked-out repository on `nathan-1`, run `sudo bash integrations/nutsy/email-intake/install.sh` to install and start the service. The service keeps its data under the systemd state directory for `nutsy-email-intake`.

On Ubuntu, open `http://127.0.0.1:8792/ear2/inbox`. From a trusted computer use the private SSH connection to forward the loopback port.

```bash
ssh -N -L 127.0.0.1:8792:127.0.0.1:8792 YOUR_UBUNTU_USERNAME@nathan-1.tail76d8f2.ts.net
```

Open the same loopback URL and sign in as `owner` with the configured review password. Keep port 8792 private. Route only Ear 1 through Cloudflare.

Give the existing private tunnel an HTTPS route for `/ear1/hear` to `http://127.0.0.1:8791`. The Worker needs the same token as a secret, the allowed sender, the dedicated inbound recipient as `NUTSY_TRIGGER_ADDRESS`, and that exact HTTPS URL as `NUTSY_EAR1_URL`. Configure the recipient only in an owned Email Routing zone. If the tunnel route uses an extra access policy, supply and verify the approved Worker service identity before routing mail. The restoration site and its newsletter or subscriber data need no changes.

Send a synthetic plain-text email and check that the sender is accepted, the receipt and hashes match Ubuntu's inbox, and no dispatch happened before an explicit GO. Replay the same MIME bytes and verify that the receipt stays the same. See [Cloudflare's Email Workers API](https://developers.cloudflare.com/email-service/api/route-emails/email-handler/).

Run the local integration test from this directory with `python3 -m unittest -v test_email_review`. It uses a loopback Conductor stand-in and does not write to any cloud destination.
