import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collectWikipedia } from './wikimedia.mjs';
import { intakeStatements, prepareIntake } from './intake.mjs';

const first = (flag) => {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  if (!process.argv[i+1] || process.argv[i+1].startsWith('--')) throw Error('Missing value for '+flag);
  return process.argv[i+1];
};
const snapshots = first('--snapshot');
const output = first('--output');
const token = process.env.WIKIMEDIA_ACCESS_TOKEN || '';
const run = await prepareIntake(snapshots ? JSON.parse(await readFile(snapshots,'utf8')) : await collectWikipedia({token}));
const statements = await intakeStatements(run);
if (output) {
  const root = resolve(output);
  await mkdir(root,{recursive:true});
  await Promise.all([
    writeFile(resolve(root,'intake-receipt.json'),JSON.stringify(run.receipt,null,2)+'\n'),
    writeFile(resolve(root,'build-backlog.json'),JSON.stringify(run.backlog,null,2)+'\n'),
  ]);
}
if (process.argv.includes('--write-sql-json')) {
  if (!output) throw Error('Provide an output directory for the transport manifest');
  const {schema,chunks,receipt} = statements;
  await writeFile(resolve(output,'d1-intake.json'),JSON.stringify([schema,...chunks,receipt]));
}
if (process.argv.includes('--d1')) {
  const {CLOUDFLARE_ACCOUNT_ID:account,CLOUDFLARE_API_TOKEN:cloudToken} = process.env;
  const {database,publicUrl} = JSON.parse(await readFile(new URL('../cloudflare.json',import.meta.url),'utf8'));
  if (!account || !cloudToken) throw Error('Cloudflare D1 credentials are missing');
  const url = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(account) + '/d1/database/' + database + '/query';
  async function query(sql) {
    const r = await fetch(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{
      authorization:'Bearer '+cloudToken,'content-type':'application/json',
    },body:JSON.stringify({sql})});
    if (!r.ok) throw Error('D1 import returned HTTP '+r.status);
    const data = await r.json();
    if (!data.success || data.result.some((item)=>!item.success)) throw Error('D1 import batch failed');
  }
  await query(statements.schema);
  for (const sql of statements.chunks) await query(sql);
  await query(statements.receipt);
  const health = new URL('api/references/summary',publicUrl);
  health.searchParams.set('verify',run.receipt.correlationId);
  const status = await fetch(health,{signal:AbortSignal.timeout(15000),cache:'no-store'});
  if (!status.ok) throw Error('Live card research endpoint returned HTTP '+status.status);
  const data = await status.json();
  if (data.refresh?.id !== run.receipt.correlationId) throw Error('Live card research receipt differs from the current run');
}
console.log(JSON.stringify({receipt:run.receipt.correlationId,...run.evidence,backlog:run.backlog.length}));
