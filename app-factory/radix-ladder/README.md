# TABOR GOLDEN LADDER — Universal Multibase Radix Engine

**Creator:** Nathan Tabor · **Parent:** TABOR 1-2-3 FACTORY · **Canonical module:** `T123-RADIX-001`

## What is built

- Exact signed arbitrary-size integer conversion **to and from bases 2 through 69**, plus bounded unary base 1 (maximum 10,000 marks). BigInt avoids unsafe JavaScript 53-bit integer rounding.
- Required display ladder: 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 17, 21, 33, 69, plus unary.
- Base 12: ↊ represents ten and ↋ represents eleven. All other bases draw from `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*`, taking only the first `radix` symbols. The complete alphabet has **70** characters; base 69 uses the first 69.
- Original, fully interactive responsive mobile browser page, exact reversible decoding, one visual Sovereign Box per digit, and explicit disconnected connector display.
- No API credentials, third-party runtime, server, trained model or external outbound requests.

## Verified decimal 33

| Radix | Representation |
| --- | --- |
| 2 | 100001 |
| 3 | 1020 |
| 4 | 201 |
| 5 | 113 |
| 6 | 53 |
| 7 | 45 |
| 8 | 41 |
| 9 | 36 |
| 10 | 33 |
| 12 | 29 |
| 13 | 27 |
| 17 | 1G |
| 21 | 1C |
| **33** | **10** |
| **69** | **X** |

The source text accidentally listed `10` with base 33 but did not clearly distinguish it from base 69 `X`. Both entries are correct as shown here.

## Absolute mathematical and authority boundaries

**1 + 1 = 2** and **1 − 1 = 0** are ordinary mathematical statements. The Sovereign Box metaphor treats connected records as individually identified entities and handles *removal of a relationship* separately from destruction of historical data.

A positional **base 0** does not exist. It is modeled only as `connector('disconnected')`, which returns `canSend:false`. The client-side `connected` setting does not authorize any network request. An authenticated, audited backend gateway must enforce actual egress, consent, token scope, rate budgets and tenant isolation.

The visual Golden Ladder bridges two different directional interpretations. **Genesis 28:12 (KJV)** describes Jacob's ladder/stairway toward heaven, with angels ascending and descending; the image of a stairway to hell is creative interpretation, not a statement that a biblical verse defines a mechanical connection. No claim of physically mapping supernatural realms is made.

## Reuse — do not redevelop

The radix engine is a *format/serialization adapter* for:
- Sovereign Boxes and character-index math
- Tabor Universal Node / rotating X axis overlays
- Optional ACT / PPL / cipher representations, when their owner-approved vocabularies are imported
- Game IDs, puzzle rules and backend bridge display codes
- Cross-platform adapters without substituting encoded digits for immutable UUIDs

Codes in different bases can represent the **same integer** and therefore are not collision-proof project identities by themselves. Preserve all original namespaced IDs and distinguish source records from newly generated identifiers.

Run tests with:

```sh
node --test app-factory/radix-ladder/engine.test.cjs
```

The public GitHub Actions Factory workflow runs these as part of its normal quality checks. This is a tested browser-local demonstrator, not a production key-management or network firewall.
