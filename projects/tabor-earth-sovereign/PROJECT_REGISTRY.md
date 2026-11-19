# Tabor Earth — Sovereign Application Registry
Status: architecture and build backlog; this document does not indicate deployed applications.

## Governing requirement
Protection of innocence is the first priority. Preserve exact source wording and attribution; label observations, interpretations, contested claims and unknowns separately. No automatic claims of lineage, cultural equivalence, misconduct, or suppression.

## Independent applications
| ID | Project | Purpose | Data boundary |
| --- | --- | --- | --- |
| tabor-earth | Tabor Earth | Geological time, paleogeography, archaeology, human history | Public research sources |
| dine-research | Diné Research | Diné history, languages, kinship and cultural research | Respect community protocols and restricted knowledge |
| ancestry-trace | Find Your Real Ancestry | Consent-based genealogy, evidence, family branches | Private by default |
| name-roots | Find Your Name | Surname etymology, variants, phonetics, historical records | Public name reference; private personal searches |
| innocence-guardian | Innocence Protection | Safeguarding resources, consent, privacy, evidence handling | Sensitive reports isolated, minimal retention |
| tabor-atlas | Tabor Earth Master Atlas | Cross-project discovery and sourced links | No copying restricted personal data |

## Shared interface contracts
Each app owns its own source, tests, deployment configuration, API and storage access policy. Shared links use opaque identifiers and citations, not replicated private records.

Suggested APIs:
- /api/earth/regions and /api/earth/evidence
- /api/dine/sources
- /api/ancestry/records (authenticated)
- /api/names/variants
- /api/safety/resources
- /api/atlas/links

## Cloudflare deployment design (not yet provisioned)
- One Cloudflare Worker and independently deployable website per app.
- Separate D1 databases for each app's structured records.
- Separate R2 buckets for authorized documents, with access controls and encryption.
- Queues or Workflows for opted-in indexing and evidence review.
- Shared atlas only indexes public, permissioned references.
- Authentication and authorization before any personal ancestry record is accessible.
- No bulk collection of private genetic or children's information.

## Evidence requirements
For every assertion store: exact wording, author/source, date, evidence type, method, confidence, competing explanations, review status, and permission to publish.
Distinguish physical measurements from reconstructions, oral histories, genealogical hypotheses and verified family connections.

## Implementation order
1. Audit existing repositories and deployments; avoid overwriting current apps.
2. Create independent project directories and test scaffolds.
3. Implement source and provenance schemas.
4. Implement private genealogy and safeguarding access controls.
5. Implement public Diné research and name reference datasets with citations.
6. Implement master atlas cross-links.
7. Deploy each app separately and verify URLs and tests.
