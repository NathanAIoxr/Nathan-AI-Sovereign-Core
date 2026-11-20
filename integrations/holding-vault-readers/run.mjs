import { execFileSync } from 'node:child_process';
import { makeQuery } from './storage.mjs';
import { REPOSITORY, manifestRows, validManifest, githubCandidates, cloudflareCandidates, persist } from './readers.mjs';

const reader = process.argv[2];
const runId = process.env.GITHUB_RUN_ID ? 'github-actions-'+process.env.GITHUB_RUN_ID+'-'+process.env.GITHUB_RUN_ATTEMPT : crypto.randomUUID();
const query = makeQuery();
if (reader === 'github') {
  if (process.env.GITHUB_REPOSITORY !== REPOSITORY) throw Error('This reader is scoped to the owner repository');
  const commit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const rows = await manifestRows(query);
  const tracked = new Map();
  const tree = execFileSync('git',['ls-tree','-rz',commit],{encoding:'utf8',maxBuffer:32*1024*1024});
  for (const line of tree.split('\0')) {
    const match = /^100(?:644|755) blob ([a-f0-9]{40})\t(.+)$/.exec(line);
    if (match && validManifest(match[2])) tracked.set(match[2],match[1]);
  }
  const verified = new Map();
  for (const path of new Set(rows.map((row)=>row.source_ref))) {
    const sha = tracked.get(path);
    if (!sha) continue;
    try {
      const body = JSON.parse(execFileSync('git',['cat-file','blob',sha],{encoding:'utf8',maxBuffer:128*1024}));
      if (body && typeof body === 'object' && !Array.isArray(body)) verified.set(path,sha);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  console.log(JSON.stringify(await persist(query,reader,runId,REPOSITORY+'@'+commit,rows.length,githubCandidates(rows,verified,commit))));
} else if (reader === 'cloudflare') {
  const {rowsRead,candidates}=await cloudflareCandidates(query);
  console.log(JSON.stringify(await persist(query,reader,runId,'D1 tabor-autonomous-builds and tabor-holding-vault',rowsRead,candidates)));
} else {
  throw Error('Choose github or cloudflare');
}
