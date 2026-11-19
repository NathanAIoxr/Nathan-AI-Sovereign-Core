import { readFileSync, writeFileSync } from 'node:fs'

const [output, ...inputFiles] = process.argv.slice(2)
if (!output || !inputFiles.length) throw new Error('Provide output and audit shards.')
const shards = inputFiles.map(path => JSON.parse(readFileSync(path, 'utf8')))
const expected = shards[0].expected
const distinctShards = new Set(shards.map(shard => shard.shard))
if (distinctShards.size !== shards.length ||
    shards.some(shard => shard.expected !== expected || shard.shardCount !== shards.length ||
      !Number.isInteger(shard.shard) || shard.shard < 0 || shard.shard >= shards.length)) {
  throw new Error('Audit shards disagree about the assigned backlog.')
}
const results = shards.flatMap(shard => shard.results).sort((a, b) => a.app_id.localeCompare(b.app_id))
if (results.length !== expected || new Set(results.map(row => row.app_id)).size !== expected) {
  throw new Error('Audit results do not cover the backlog exactly once.')
}
const counts = Object.fromEntries([...new Set(results.map(row => row.source_state))]
  .map(state => [state, results.filter(row => row.source_state === state).length]))
writeFileSync(output, JSON.stringify({ count: results.length, counts, results }, null, 2) + '\n')
console.log(JSON.stringify({ count: results.length, counts }, null, 2))
