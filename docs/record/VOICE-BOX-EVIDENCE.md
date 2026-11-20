# Nathan AI Voice Box evidence index

Evidence recovery completed on November 19, 2026 (Eastern Time). The exact exports are archived in the private Cloudflare Holding Vault. This index records the artifact hashes and results of the integrity and source-coverage checks.

| Archived artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `Nathan-AI-Voice-Box-Evidence.zip` | 152,110 | `4a21f1d87191d9b9398d129d9d45e786a8c874b7ffa31eaf823590d086542846` |
| `Nathan-AI-Crypto-Source-Audit.json` | 55,857 | `888d724a165e46b4c896ac5d231af6ef1b841317f2100ae08d9f88de747c5f40` |
| `Nathan-AI-Crypto-History-Recovery.zip` | 66,542 | `f7b372686e3e08e9ec7513fd48ebfd11984808d76348dff44d8ed07484b86250` |

Cloudflare R2 returned the archived objects with exact content. Authorized account members can locate them in `tabor-holding-vault` under `evidence/voice-box/<sha256>/<filename>`.

## Verified evidence

- All 65 Cloudflare Holding Vault project snapshots matched their stored SHA-256 digests. The export includes the original snapshot JSON strings, capture timestamps, and source references.
- All 23 files listed by the two recovery archives matched their embedded manifests. The bundle preserves both original ZIPs. It includes the registry reference for `NT-VOICE-001` / *The Drum Beater*.
- The [November 5 Time Scroll](RECORD.md) matched its [published checksum](RECORD.sha256). It documents repository and publication actions.
- The crypto coverage audit preserves 36 records from the Cloudflare snapshots. Their record IDs match the live Airtable bases. One is a portfolio coverage report. The other 35 are mining dashboard specifications, implementation plans, and monitoring rules. The checked bases had no wallet, asset, exchange, transaction, mining reward, or mining payout entries. A balance could not be established from these sources.

## Crypto history recovery

The crypto history ZIP preserves 13 source artifacts with SHA-256 hashes and source locators, including the historical SHA-256d Mirror, Tabor World ledger, mining scripts and coin definitions. The bundle also records the scope and sources of the private Bitcoin address check. A separately located Voicebox catalog row records a user-reported valuation and unverified custody. The sealed Voice Box originals and asset allocation remain unlocated.

## Source boundaries

The reserve is described as a proposed design target in the [project notes](../../app-factory/nathan-ai/sovereign-conductor-bridge/README.md). The recovery did not locate the sealed originals. SHA-256 establishes the byte integrity of the source files. The records do not establish independent timestamp certification, custody, or asset value.

To verify the Voice Box bundle, extract it and run `sha256sum -c SHA256SUMS.txt` inside the extracted directory. The bundle's `verification.json` lists the source references and the checks against the pre-existing manifests.
