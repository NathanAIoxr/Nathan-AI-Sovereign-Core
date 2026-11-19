# TA DA + The Tabor Almanac

Original buildless web interface. No framework or paid API dependency.
Serve dist/ using a local static HTTP server. The live site is hosted by Sites.
Original JavaScript, CSS, and HTML are MIT licensed; see LICENSE.

## Features
- 175 neutral adult preference labels across 14 expandable categories.
- Personal buttons: create, edit, remove, custom categories, audience preview.
- Profiles, sample discovery, draft conversations, boundaries, demo reporting.
- TTA date dashboard, editable plans and tasks, local command shortcuts.
- Gregorian calendar and custom equal-period calendar views, including 13/17/21.
- TORMO personal library with custom 101–901 shelves, literal/figurative/mythological
  labels, positive/negative/neutral labels, Above/Middle/Below layers, source context.
- Opt-in browser storage, export and deletion. No tokens or payments.

## Scope
This is a browser-local demo, not a production dating service. Profiles are
fictional. It has no live messaging, server-side profile sharing, staffed moderation,
identity verification, external booking, or AI command service. Visibility controls
filter local previews; they are not server authorization. Never place secrets in
client files or use browser storage as secure storage for sensitive member data.

Custom calendars split each Gregorian year into n nearly equal periods starting
January 1. They are personal organization systems, not historical conversions.
TTA shelves are custom library categories, not official Dewey classes.
Commands support explicit dates, today/tomorrow, tasks, notes, calendar views,
interest search and navigation. Unknown commands return examples without acting.

## Validation
Run node check.cjs. Tests cover routes, search, filters, blocking, escaping,
opt-in persistence, audience separation, button arithmetic, calendar boundaries,
and local commands. No visual browser QA was available in the build environment.

## Research
NCSF: https://ncsfreedom.org/resource-library/
Consent: https://www.plannedparenthood.org/learn/relationships/sexual-consent
AVEN: https://www.asexuality.org/?q=general.html
Accessible buttons: https://www.w3.org/WAI/ARIA/apg/patterns/button/
No third-party adult-site code, branding, images or catalog was copied.


## International and advisor update
- 184 ISO language preferences; 24 bundled navigation packs, not full localized pages.
- Unicode input, RTL layouts, locale-aware Gregorian date labels.
- Optional on-device Translator API, detected at runtime with explicit user initiation.
- Machine translation is not professionally reviewed. Unsupported browsers/languages
  retain English details; selecting a locale does not imply full translation coverage.
- Renameable Nathan AI persona with local message templates and editable saved drafts.
- Optional on-device LanguageModel API, no cloud credentials or model endpoint.
- Current-intent cards expire and respect preview visibility; discovery can be paused.
- The persona is inspired by founder values, not a digital reconstruction of a person.
- AI browser APIs require compatible hardware, browser, policies and language support.
  They were not run end-to-end in this environment. No universal mobile AI claim.
- AI processing is separate from local template mode; neither sends messages to users.

Browser API references:
https://developer.chrome.com/docs/ai/translator-api
https://developer.chrome.com/docs/ai/prompt-api

## Dating-first visual release
The root URL now opens the interest library. Discovery and the advisor are prominent,
and the Almanac/TORMO are secondary sidebar tools. Original CSS fan, heart and potato
artwork and colorful category tiles provide imagery without human likenesses.
