# Nathan AI · Fixed-Anchor Binary Encoding

[Original submission](ORIGINAL.md) · [Conductor handoff and downloads](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/handoffs/fixed-anchor-binary) · [Conductor ledger receipt](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/handoffs/fixed-anchor-binary)

## The two rails

Each rail is five ASCII characters carried as five octets (40 bits), with no compression or token encoding. The table pairs the exact ASCII decimal and binary values by column.

| Column | Rail 1 · Generative Addition | Rail 2 · Absolute Clearing | XOR |
| ---: | --- | --- | --- |
| 0 | `1` · 49 · `00110001` | `1` · 49 · `00110001` | `00000000` |
| 1 | `+` · 43 · `00101011` | `-` · 45 · `00101101` | `00000110` |
| 2 | `1` · 49 · `00110001` | `1` · 49 · `00110001` | `00000000` |
| 3 | `=` · 61 · `00111101` | `=` · 61 · `00111101` | `00000000` |
| 4 | `2` · 50 · `00110010` | `0` · 48 · `00110000` | `00000010` |

```text
1+1=2   00110001 00101011 00110001 00111101 00110010
1-1=0   00110001 00101101 00110001 00111101 00110000
1-1+0   00110001 00101101 00110001 00101011 00110000
```

The alternate `1-1+0` is retained as a reference vector. The v1 gate requires `1-1=0` at byte offsets 10 through 14.

## Structural locks

1. **SOF and EOF sentinels.** `AA 55 FF` starts the frame and `00 F0` ends it. Bit reversal within each octet changes `AA 55` to `55 AA`. Reversal across those 16 bits returns `AA 55`. Validate the start, stop and intervening bytes as one ordered frame.
2. **Parallel alignment and spine.** Stack the entire first rail before `7E` and the second rail after it. Compare each rail's columns 0–4 in parallel. Columns 0, 2 and 3 agree, and 1 and 4 carry the switches. The five-byte XOR is `00 06 00 00 02`.
3. **Direction and bit order.** `01` specifies increasing byte offset, left to right, with the most significant bit sent first within each byte. Its bit reversal is `80`. Byte ordering and the order of bits within a byte are separate concepts.
4. **Parity seal.** The first rail XORs to `24` and the second to `20`, giving the transmitted `04`. This field implements bytewise XOR. A CRC-8 would use its own defined algorithm. XOR detects every single-bit change in the covered rail bytes, and paired changes can cancel.
5. **Complete frame comparison.** The gate compares all 18 received bytes, in order, against the canonical frame. The checksums and XOR columns give diagnostic information. The exact comparison decides acceptance. This processing rule adds no bytes.

## Master frame

```text
[SOF CLOCK]     10101010 01010101 11111111
[DIR LOCK]      00000001
[RAIL 1: 1+1=2] 00110001 00101011 00110001 00111101 00110010
[SPINE LOCK]    01111110
[RAIL 2: 1-1=0] 00110001 00101101 00110001 00111101 00110000
[XOR SEAL]      00000100
[EOF STOP]      00000000 11110000
```

```text
101010100101010111111111000000010011000100101011001100010011110100110010011111100011000100101101001100010011110100110000000001000000000011110000
AA 55 FF 01 31 2B 31 3D 32 7E 31 2D 31 3D 30 04 00 F0
```

## Use the Conductor gate

| Method | Path under `/tabor-sites/conductor` | Response |
| --- | --- | --- |
| GET, HEAD | `/handoffs/fixed-anchor-binary` | Human-readable frame, rails, locks and downloads |
| GET, HEAD | `/api/handoffs/fixed-anchor-binary` | Source-pinned handoff from the existing D1 ledger |
| GET, HEAD | `/fixed-anchor/spec.json` | Offsets, ASCII, binary, layout and checksum vectors |
| GET, HEAD | `/fixed-anchor/frame.bin` | Canonical 18 raw bytes |
| GET, HEAD | `/fixed-anchor/diagram.svg` | Parallel rails and XOR matrix |
| POST | `/fixed-anchor/verify` | `200 / bit: 1` for an exact frame or `422 / bit: 0` for a mismatch |

```sh
origin=https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/fixed-anchor
curl --fail --silent --show-error "$origin/frame.bin" --output fixed-anchor.bin
python3 verify_144bit_anchor.py fixed-anchor.bin
curl --fail --silent --show-error -H 'Content-Type: application/octet-stream' \
  --data-binary @fixed-anchor.bin "$origin/verify"
```

Use the Python check where firmware or an OS delivers the raw frame to software. Use the HTTP gate before consuming a raw frame in a Worker or node. An application can store the verified frame as an 18-byte SQL BLOB. The Conductor uses its existing D1 ledger for the launch receipt and performs validation in memory. AI prompts can describe or expose the contract, while the calling application enforces it before delivering any bytes to a model. The frame is public. Authentication and authorization follow the consuming system's existing policy.

```sh
node --test deployments/conductor/fixed-anchor/anchor.test.mjs
```
