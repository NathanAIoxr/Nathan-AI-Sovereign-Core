# Linguistic Epenthesis Engine — NATHAN AI Wordplay Matrix

Complete, additive implementation of the four-axis / twelve-node user-supplied matrix, the Python engine, JavaScript Cloudflare Worker, tests, Wrangler configuration and GitHub Actions deployment.

**Exact axes:** W_axis (Will, Wheel, Way); M_axis (Mill, Mheel, May); 3_axis (3ill, 3heel, 3ay); chevron_axis (<<ill, <<heel, <<ay). The `<<` text represents **two vertically stacked left-facing chevrons** in the original visual glyph, not horizontal characters.

**Two operations:** intrusive-R orthographic bridge on specified open endings before vowel-initial tokens; paragogic-S morphological suffix with duplicate prevention. Original mechanism, themes, orientations, names and SYSTEM_AXIOM ZERO_COINCIDENCES preserved. The phonetic analogy to routing is a metaphor; this code does **not** reduce Cloudflare networking collisions or guarantee zero wasted motion. The spelling rules are an illustrative approximation, not a complete dialect-sensitive IPA engine.

## Run
```sh
python3 build_epenthesis_matrix.py
node --test test.mjs
npx wrangler deploy --config wrangler.toml
```

## API
`/` or `/api/axis?axis=M_axis&next=over`: three nodes and rules.
`/api/node?axis=chevron_axis&index=2&next=always`: individual node.
`/api/bridge?first=Way&second=always`: arbitrary text pair.
`/api/matrix`, `/api/rules`, `/health`: introspection.
GET only, no user text stored, no D1/KV binding or writes. The generator copies canonical source to an independent project directory without overwriting existing GitHub modules. CI workflow is installed at repository root `.github/workflows/deploy-epenthesis-matrix.yml` (the source-local copy is also retained).

## Integration
Lives alongside existing W/M/3/chevron engines and Rotational Agent Mesh; no destructive renaming, no substitution for existing agent functions, and no credentials in source. D1/KV audit logging can be added as an opt-in, authenticated extension, not silently activated.
