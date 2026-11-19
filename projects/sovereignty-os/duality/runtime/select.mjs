import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { pathToFileURL } from 'node:url';

const config = JSON.parse(readFileSync(new URL('./profiles.json', import.meta.url), 'utf8'));
const profiles = ['sandbox', 'live'];

export function inventory(paths, policy = config) {
  const bySource = new Map(policy.applications.map(app => [app.source, app]));
  const applications = new Set();
  const deployments = new Set();
  for (const path of paths) {
    if (posix.basename(path) === 'app.json') applications.add(path);
    if (/^wrangler[^/]*\.(?:toml|json|jsonc)$/.test(posix.basename(path))) deployments.add(path);
  }
  for (const app of policy.applications) {
    if (!applications.has(app.source)) throw new Error(`Registered source is missing: ${app.source}`);
  }
  const makeModes = (app) => Object.fromEntries(profiles.map(profile => [
    profile, app?.[profile] ? 'configured' : 'unregistered'
  ]));
  const manifestRows = [...applications].sort().map(path => ({
    path, id: bySource.get(path)?.id ?? null, profiles: makeModes(bySource.get(path))
  }));
  const configRows = [...deployments].sort().map(path => ({
    path, type: 'wrangler',
    applicationManifest: applications.has(posix.join(posix.dirname(path), 'app.json'))
      ? posix.join(posix.dirname(path), 'app.json') : null
  }));
  return {
    applications: manifestRows,
    wranglerConfigurations: configRows,
    counts: {
      applications: manifestRows.length,
      wranglerConfigurations: configRows.length,
      sandboxConfigured: manifestRows.filter(row => row.profiles.sandbox === 'configured').length,
      liveConfigured: manifestRows.filter(row => row.profiles.live === 'configured').length
    }
  };
}

export function select(id, profile, policy = config) {
  if (!profiles.includes(profile)) throw new Error('Choose an explicit profile: sandbox or live.');
  const matches = policy.applications.filter(app => app.id === id);
  if (matches.length !== 1 || !matches[0][profile]) {
    throw new Error(`No unique ${profile} deployment is registered for ${id}.`);
  }
  const app = matches[0];
  if (policy.profiles.sandbox.namespace === policy.profiles.live.namespace) {
    throw new Error('Sandbox and live must have distinct dispatch namespaces.');
  }
  const { namespace } = policy.profiles[profile];
  return { id, profile, namespace, source: app.source, ...app[profile] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command, id, profile] = process.argv.slice(2);
    if (command === 'inventory' && id === undefined) {
      const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }).split('\0');
      console.log(JSON.stringify(inventory(paths), null, 2));
    } else if (command === 'select' && id && profile) {
      console.log(JSON.stringify(select(id, profile), null, 2));
    } else {
      throw new Error('Usage: select.mjs inventory | select.mjs select <app-id> <sandbox|live>');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
