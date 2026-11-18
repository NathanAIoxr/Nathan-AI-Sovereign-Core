import { DurableObject } from 'cloudflare:workers'
import { digest, replicas } from './workloads.mjs'

const day = 86_400_000
export const archiveRetentionDays = 90
export const archiveFor = (env, slot) => env.ARCHIVE.getByName('receipt-' + (Math.floor(slot / day) % 16))

export async function matchesReceipt(slot, receipt, result) {
  const id = 'cycle-' + slot
  return result?.manifest?.id === id &&
    receipt?.manifest?.id === id &&
    JSON.stringify(result.manifest) === JSON.stringify(receipt.manifest) &&
    typeof result.sha256 === 'string' &&
    result.sha256 === receipt.sha256 &&
    replicas.every(name => receipt.copies?.[name] === receipt.sha256) &&
    await digest({ manifest: result.manifest, results: result.results }) === receipt.sha256
}

export class ReceiptArchive extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.db = ctx.storage.sql
    this.db.exec(`CREATE TABLE IF NOT EXISTS archived_cycles (
      slot INTEGER PRIMARY KEY, record TEXT NOT NULL
    )`)
  }

  async store(slot, receipt, result) {
    if (!await matchesReceipt(slot, receipt, result)) throw new Error('Archive source did not match the receipt')
    const contents = { receipt, result }
    const record = { ...contents, archive_sha256: await digest(contents) }
    this.db.exec('INSERT OR IGNORE INTO archived_cycles VALUES (?, ?)', slot, JSON.stringify(record))
    this.db.exec('DELETE FROM archived_cycles WHERE slot < ?', Date.now() - archiveRetentionDays * day)
    const stored = await this.read(slot)
    if (stored?.archive_sha256 !== record.archive_sha256) throw new Error('Conflicting archived generation')
  }

  async read(slot) {
    if (slot < Date.now() - archiveRetentionDays * day) return null
    const row = this.db.exec('SELECT record FROM archived_cycles WHERE slot = ?', slot).toArray()[0]
    if (!row) return null
    const { receipt, result, archive_sha256 } = JSON.parse(row.record)
    if (archive_sha256 !== await digest({ receipt, result }) || !await matchesReceipt(slot, receipt, result)) {
      throw new Error('Archive integrity check failed')
    }
    return { receipt, result, archive_sha256 }
  }
}
