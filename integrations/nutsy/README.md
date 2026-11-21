# NUTSY the RESOLUTE RACCOON

Ubuntu runs the Conductor and owns the local queue. GitHub preserves source and runs CI. Cloudflare supplies edge services and bounded compute. The catalog records each project's existing evidence and next verification step. The authenticated health endpoint reports queue totals, while a successful receipt requires a write and an independent read-back by ID.

| Owner rule | Binary | Meaning |
|---|---|---|
| BUILD · 1+1=2 | `1 + 1 = 10₂` | The low bit is zero and the carry is one. Add a derived result linked to the preserved input. |
| CLEAR · 1-1=0 | `1 - 1 = 0₂` | The difference and borrow are zero. Clear the active derived state while retaining the source and audit history. |

On the Ubuntu host or a review checkout, use the repository directory as the working directory.

```sh
python3 integrations/nutsy/anchor.py > nutsy-anchor-receipt.json
python3 integrations/nutsy/anchor.py --verify nutsy-anchor-receipt.json
```

The verifier recalculates the result and the SHA-256 fingerprints from the checked-out catalog. The ID is stable for the same normalized catalog and result. The digest checks consistency, while authenticity depends on the trusted checkout and the authenticated Conductor receipt.

For the first private D1 check, use the existing Conductor review to approve one `D1_WRITE` containing the receipt ID and data. After the owner selects **GO**, check queue completion and read the row from the bound D1 destination. Compare its ID and content with the local output before marking it verified. The probe writes no personal records and needs no new daemon, queue, runtime dependencies or access keys in this repository.

The [cockpit handoff](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues/540) tracks the existing HEAR YE / HEAR YA interface.
