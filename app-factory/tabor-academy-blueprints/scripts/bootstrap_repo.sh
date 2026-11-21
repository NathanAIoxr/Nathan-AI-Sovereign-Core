#!/bin/sh
set -eu
cd "$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
command -v node >/dev/null
command -v npm >/dev/null
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("Node.js 22 or later is required"); process.exit(1); }'
npm ci
npm run validate
node --test tests/determinism.test.js
node scripts/export_integrity.mjs
npm run pages:build
printf '%s\n' 'Academy local validation and Pages build complete.'
