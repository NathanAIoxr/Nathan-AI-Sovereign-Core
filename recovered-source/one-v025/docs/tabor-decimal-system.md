# The Tabor Decimal System

**Framework by Nathan Tabor · private ONE v025**

The supplied architecture is implemented in `app-factory/one/trial-matrix/realm/tabor.js` and connected to Rootkeep. The original pasted blueprint is preserved byte-for-byte in `references/tabor-decimal/Nathan_Tabor_supplied_blueprint.txt`.

| Tier | Implemented behavior | Game connection |
|---|---|---|
| Oldowan binary event core | Explicit OR, XOR and AND gates; only 0/1 inputs | Party/enemy presence and affordability gates |
| Hox spatial segment array | One-based positional addresses; exact upward rounding of `base × (1 + position × 0.12)` | New expedition attack stats and roster display |
| Chemical-spatial lookup | Bounded finite vectors, dot-product matching, positional tie-breaking | Find food, iron, attack, healing, shield, mana or a live threat by purpose |
| Tabor capacity limiter | Exact indexed ceiling, optional reserved capacity, conserved overflow receipts | Production, battle loot and inbox claims |

The game’s main flow stays settlement → team → stage → battle → rewards. A closed **The Tabor Decimal System — by Nathan Tabor** section exposes the live mapping, purpose search and JSON export. Opening, searching and exporting do not change game state.

## Exact rules

- New parties apply 12% of base attack per lane position, rounded upward. Base attack 100 gives 112, 124, 136, 148 and 160 across the five lanes. Integer basis points and `BigInt` intermediates avoid accidental floating-point over-rounding.
- Ordinary quantity arithmetic remains ordinary arithmetic: `1 + 1 = 2`. Boolean OR and XOR are explicitly named gate operations. They are not substituted for resource addition or subtraction.
- Signal matching is a local weighted lookup over known asset properties, with matching vector dimensions required. Zero or unmatched purpose queries have no result. It does not remove stable save identifiers or claim an index-free physical database.
- A synchronous, bounded local-cell step implements the supplied neighbor rule (survive with two/three neighbors; birth with three). The inspector shows one derived preview step. It does not secretly change the Match-3 board or simulate a biological mechanism.
- The capacity formula is `floor(base × (1 + inflation + growth))`. Rates use integer basis points. Reserved capacity rounds upward to a whole unit; usable capacity is the ceiling minus the reserve. Reserving capacity does not create stored resources.
- Default growth and reserve rates are zero so the existing Storehouse limits and balances remain intact. The supplied 2%/1% growth and 3% reserve examples are implemented and tested in the core. This is Nathan Tabor’s custom software architecture; the implementation does not apply tax law or legal spending restrictions.
- Incoming units divide exactly into accepted units and diverted units. Surplus remains in the existing 48-hour inbox. The integer distribution helper produces a conserved plan, including remainder units, but does not send resources to unconnected players. There is no live alliance or voter service in this private local build.

An explicit policy change can be applied transactionally in code:

```js
const next = RealmWorld.dispatch(world, {
  type: 'tabor-policy',
  policy: {...TaborDecimal.policy(), inflationBps: 200, growthBps: 100, reserveBps: 300}
});
```

Any existing units above the new usable limit move into the inbox rather than disappearing. Policy changes are blocked while an expedition is active. This API remains outside the simple player-facing controls.

## Compatibility and boundaries

Earlier v025 saves remain valid. An active saved expedition retains its original party stats and exact replay. It adopts positional rules only after that expedition ends. A closed legacy settlement adopts the framework on its next action. Existing balances, completed stages, recruitment and combat receipts are preserved.

The Oldowan, Hox and chemical-spatial names are the supplied framework’s conceptual labels. The software implements the explicit rules above; it does not establish the pasted text’s broader historical, biological or universal-physics claims. The cognitive trials retain their names and mechanics.

## Verification

`tabor.test.cjs` covers gate truth tables, strict inputs, positional rounding, matching/ties, capacity examples, reserve arithmetic, overflow conservation, distribution remainders, local-cell updates, game integration and actual prior-build saves/replays. The full suite also completes all 33 RPG expeditions and the existing cognitive trials.

`validation/tabor-browser-check.cjs` verifies credited optional UI, read-only purpose routing, exported maps, positional combat stats, legacy reload/deferred activation, and mobile layout. Run the existing realm browser check for the complete settlement-to-rewards loop. The standalone Rootkeep package embeds the module and needs no external service.
