import {execFileSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {writeFile} from 'node:fs/promises';
import {posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {REPOSITORY} from './readers.mjs';
import {externalTarget, references} from './trace-references.mjs';

const git = (args, cwd) => execFileSync('git', args, {
  cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024
});
const decoder = new TextDecoder('utf-8', {fatal: true});
const lfsPointer = 'version https://git-lfs.github.com/spec/v1';

export function resolveReference(target, source, paths, ref, commit) {
  if (target.startsWith('#') || target.startsWith('?')) return null;
  const external = externalTarget(target);
  let path;
  if (external) {
    if (external === 'credential-bearing-reference') return {status: 'boundary', target: external};
    const url = new URL(external);
    if (url.hostname !== 'github.com') return {status: 'boundary', target: external};
    const prefix = '/' + REPOSITORY.toLowerCase() + '/';
    if (!url.pathname.toLowerCase().startsWith(prefix)) return {status: 'boundary', target: external};
    const route = url.pathname.slice(prefix.length);
    const match = [commit, ref].find(value =>
      route.startsWith('blob/' + value + '/') || route.startsWith('tree/' + value + '/'));
    if (!match) return {status: 'boundary', target: external};
    path = route.slice(6 + match.length);
  } else {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) return null;
    path = target.split(/[?#]/, 1)[0];
    if (!path) return null;
  }
  try {
    path = decodeURIComponent(path);
  } catch {
    return {status: 'unresolved', target: '[invalid path encoding]'};
  }
  if (!external) {
    path = path.startsWith('/') ? posix.normalize(path.slice(1)) : posix.join(posix.dirname(source), path);
  }
  if (paths.has(path)) return {status: 'resolved', target: path};
  for (const candidate of [path + '/README.md', path + '/index.html', path + '.js', path + '.mjs', path + '.ts']) {
    if (paths.has(candidate)) return {status: 'resolved', target: candidate};
  }
  return {status: 'unresolved', target: path};
}

async function* gitBlobs(entries, cwd) {
  const process = spawn('git', ['cat-file', '--batch'], {cwd, stdio: ['pipe', 'pipe', 'inherit']});
  const finished = once(process, 'close');
  const writer = (async () => {
    for (const entry of entries) {
      if (!process.stdin.write(entry.oid + '\n')) await once(process.stdin, 'drain');
    }
    process.stdin.end();
  })();
  const chunks = process.stdout[Symbol.asyncIterator]();
  let buffer = Buffer.alloc(0);
  async function ensure(predicate) {
    while (!predicate()) {
      const part = await chunks.next();
      if (part.done) throw Error('Incomplete Git blob stream');
      buffer = buffer.length ? Buffer.concat([buffer, part.value]) : part.value;
    }
  }
  try {
    for (const entry of entries) {
      await ensure(() => buffer.indexOf(10) >= 0);
      const end = buffer.indexOf(10);
      const [oid, type, bytes] = buffer.subarray(0, end).toString().split(' ');
      if (oid !== entry.oid || type !== 'blob' || !/^\d+$/.test(bytes)) throw Error('Unexpected Git object header');
      buffer = buffer.subarray(end + 1);
      let remaining = Number(bytes);
      const size = remaining;
      const digest = createHash('sha256');
      const parts = [];
      // Read and hash large objects in full. Bound the memory reserved for text parsing.
      const parseText = size <= 8 * 1024 * 1024;
      while (remaining) {
        await ensure(() => buffer.length > 0);
        const count = Math.min(remaining, buffer.length);
        const part = buffer.subarray(0, count);
        digest.update(part);
        if (parseText) parts.push(part);
        buffer = buffer.subarray(count);
        remaining -= count;
      }
      await ensure(() => buffer.length > 0);
      if (buffer[0] !== 10) throw Error('Invalid Git blob delimiter');
      buffer = buffer.subarray(1);
      yield {entry, size, digest: digest.digest('hex'), content: parseText ? Buffer.concat(parts) : null};
    }
    await writer;
    const [code] = await finished;
    if (code !== 0) throw Error('Git blob reader exited with status ' + code);
  } finally {
    if (process.exitCode === null) process.kill();
  }
}

export async function traceGit(cwd = '.', ref = 'main') {
  const commit = git(['rev-parse', '--verify', 'HEAD^{commit}'], cwd).trim();
  const entries = git(['ls-tree', '-rz', commit], cwd).split('\0').filter(Boolean).map(item => {
    const tab = item.indexOf('\t');
    const [mode, type, oid] = item.slice(0, tab).split(' ');
    return {mode, type, oid, path: item.slice(tab + 1)};
  });
  const paths = new Set(entries.map(entry => entry.path));
  const nodes = entries.filter(entry => entry.type !== 'blob').map(entry => ({...entry, state: 'submodule'}));
  const edges = [];
  for await (const {entry, size, digest, content} of gitBlobs(entries.filter(entry => entry.type === 'blob'), cwd)) {
    let targets = [];
    let state = 'parse-size-limit';
    if (content) {
      try {
        if (content.includes(0)) throw Error('Binary content');
        const text = decoder.decode(content);
        state = text.startsWith(lfsPointer) ? 'lfs-pointer' : 'text';
        if (state === 'text') {
          targets = entry.mode === '120000' ? [text.trim()] : references(text);
        }
      } catch {
        state = 'binary';
      }
    }
    const links = new Map();
    for (const target of targets) {
      const link = resolveReference(target, entry.path, paths, ref, commit);
      if (link) links.set(link.status + ':' + link.target, link);
    }
    for (const link of links.values()) edges.push({source: entry.path, ...link});
    nodes.push({...entry, size, digest, state, leaf: state === 'text' && links.size === 0});
  }
  const summary = {commit, tracked: entries.length, bytesRead: 0, states: {}, edges: {}, verifiedLeaves: 0};
  const reverse = new Map();
  const reachable = new Set();
  const pending = [];
  for (const node of nodes) {
    summary.bytesRead += node.size ?? 0;
    summary.states[node.state] = (summary.states[node.state] ?? 0) + 1;
    summary.verifiedLeaves += Number(node.leaf ?? false);
    if (node.leaf) {
      reachable.add(node.path);
      pending.push(node.path);
    }
  }
  for (const edge of edges) {
    summary.edges[edge.status] = (summary.edges[edge.status] ?? 0) + 1;
    if (edge.status !== 'resolved') continue;
    const sources = reverse.get(edge.target) ?? [];
    sources.push(edge.source);
    reverse.set(edge.target, sources);
  }
  for (let index = 0; index < pending.length; index++) {
    for (const source of reverse.get(pending[index]) ?? []) {
      if (reachable.has(source)) continue;
      reachable.add(source);
      pending.push(source);
    }
  }
  for (const node of nodes) node.reachesDetectedLeaf = reachable.has(node.path);
  summary.nodesReachingDetectedLeaves = reachable.size;
  return {summary, nodes, edges};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [output, root = '.'] = process.argv.slice(2);
  if (!output) throw Error('Usage: node trace-github.mjs OUTPUT_JSON [REPOSITORY_DIRECTORY]');
  const receipt = await traceGit(root);
  await writeFile(output, JSON.stringify(receipt), {mode: 0o600, flag: 'wx'});
  console.log(JSON.stringify(receipt.summary));
}
