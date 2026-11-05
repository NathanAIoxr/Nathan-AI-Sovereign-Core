#!/usr/bin/env node
'use strict';
// Repository-wide, read-only source signal scanner.
// Usage: node tools/capability-atlas/scan.cjs --output /tmp/nathan-capability-audit.json
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const engine = require(path.join(ROOT, 'app-factory/nathan-ai/capability-atlas/engine.js'));
const snapshotPath = path.join(ROOT, 'app-factory/nathan-ai/capability-atlas/inventory.json');
const inventory = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
if (inventory.schema !== 'nathan-ai.capability-atlas.inventory.v1')
  throw Error('Unsupported inventory schema');
const tracked = cp.execFileSync('git', ['ls-files', '-z', '--cached'], {cwd: ROOT, maxBuffer: 16 * 1024 * 1024})
  .toString('utf8').split('\0').filter(Boolean);
const pathEntries = new Map(inventory.entries.map(item => [item.p, item]));
const CODE = /\.(?:js|mjs|cjs|ts|tsx|jsx|py|swift|ino|sql|sh|html|css|yml|yaml)$/i;
const MAX_BYTES = 450000;
const report = {
  schema: 'nathan-ai.capability-atlas.source-scan.v1',
  repository: inventory.repo, baselineTree: inventory.baseCommit,
  source: 'git ls-files plus local read-only static source scan',
  semantics: 'Signals indicate source constructs, not execution, consciousness, verified results, or deployed features',
  formulas: engine.FORMULAS,
  trackedFiles: tracked.length, baselineFiles: inventory.fileCount,
  skipped: [], rows: []
};
for (const p of tracked) {
  const absolute = path.join(ROOT, p);
  const stats = fs.statSync(absolute);
  const original = pathEntries.get(p) || {p, t:'f', b: stats.size, s:''};
  const entry = {...original, b: stats.size};
  if (stats.size > MAX_BYTES || !CODE.test(p)) {
    const row = engine.fromPath(entry);
    row.reviewStatus = stats.size > MAX_BYTES ? 'size-limit-not-scanned' : 'not-executable-source-type';
    report.rows.push(row);
    if (stats.size > MAX_BYTES) report.skipped.push({path:p, reason:'size-limit', bytes:stats.size});
    continue;
  }
  const body = fs.readFileSync(absolute, 'utf8');
  if (body.includes('\uFFFD')) {
    report.skipped.push({path:p, reason:'possible-non-utf8'});
    report.rows.push(engine.fromPath(entry));
    continue;
  }
  report.rows.push(engine.analyzeText(entry, body));
}
report.summary = engine.summary(report.rows);
report.unindexedTrackedFiles = tracked.filter(p => !pathEntries.has(p));
report.missingBaselineFiles = inventory.entries.filter(x=>x.t==='f'&&!tracked.includes(x.p)).map(x=>x.p);
// No contents or matched secret values are copied into the report.
report.inventoryHash = crypto.createHash('sha256').update(fs.readFileSync(snapshotPath)).digest('hex');
const args = process.argv.slice(2);
const outputAt = args.indexOf('--output');
if (outputAt >= 0) {
  const dest = args[outputAt + 1];
  if (!dest || !dest.endsWith('.json')) throw Error('Provide a .json output path');
  fs.mkdirSync(path.dirname(path.resolve(dest)), {recursive:true});
  fs.writeFileSync(path.resolve(dest), JSON.stringify(report, null, 2) + '\n');
}
const m = report.summary;
process.stdout.write(JSON.stringify({
  trackedFiles: report.trackedFiles, baselineFiles: report.baselineFiles,
  sourceScanned: m.sourceScanned, runtimeVerified: m.runtimeVerified,
  unindexedTrackedFiles: report.unindexedTrackedFiles.length,
  missingBaselineFiles: report.missingBaselineFiles.length,
  observedCounts: m.observedCounts
}, null, 2) + '\n');
