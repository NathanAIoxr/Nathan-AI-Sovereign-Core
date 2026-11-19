# Church Supply / Money-Off Money-Back / Collyn Handoff
Source: latest user-provided conversation message, Nov 19, 2026. Keep source unchanged; this is a derived engineering layer.

## All church supply categories to preserve
Weekly communion cups, prefilled juice/wafer sets, cup fillers, unleavened bread, white wafers, gluten-free; taper and Advent candles, altar candles, LED candles, liquid wax; anointing oils/stocks, baptismal garments/certificates; weekly and seasonal bulletins, children's activity bulletins, inserts and printable shells; numbered offering envelopes, visitor envelopes, plates/baskets, prayer and visitor cards, attendance books, marriage/dedication/confirmation/membership certificates; choir/youth robes, stoles, pulpit robes, clergy shirts, collars, baptismal robes, usher badges, security polos, lanyards, VBS shirts; indoor banners, outdoor feather flags, altar linens, paraments, communion trays, bread plates, podiums, pew cushions; KJV/ESV/NLT Bibles, large-print/outreach Bibles, literature, Bible covers, study guides, VBS kits, devotionals, bookmarks, engraved pens, congregation giveaways; nursery through adult quarterly student/teacher Sunday school guides, crafts, stickers, flannelgraphs, memory verse cards, coloring, attendance pins, star charts, prizes, whiteboards, chairs, rugs, crayons, bulk Bibles, VBS manuals/media/decorations.

## Catalog research names supplied by user
Cokesbury; Concordia Supply; Christianbook.com; Lifeway; Concordia Publishing House; Patrick Baker Church Goods; Swanson Christian Products; The Church Shoppe; Church Supplies NY; Christian Art Gifts. These are research leads, not suppliers integrated or prices verified.

## Two independent economic flows
- Money-Off: church buys wholesale directly; immediate discount, possible separately accounted loyalty credit.
- Money-Back: member buys fundraising goods; church receives approved rebate or supply credits; sponsor-a-classroom can fund needed supplies.
- Proposed cash vs supply credit enhancement; never treat credits as cash or claim 'free' before settlement.
- Track-specific five-level schedules in fundraising_ecosystem_core.py exactly match the user's supplied illustrative thresholds and rates. All remain unapproved until actual margins and contracts are confirmed.
- Four seasonal sell/buy pairings: fall pumpkin/cookbooks vs curriculum/bulletins/communion; winter trees/wrap/toys vs Advent/candles/robes; spring flowers/mulch/Easter wrap/seeds vs VBS/baptismal robes/literature; summer produce/games/merch vs youth/classroom/pew Bibles.

## App and architecture handoff
Preserve separately: CT Inc. church OS; church admin account and catalog; Collyn driver app with voice chat, invoicing, delivery proof, reorder, dispatch and backhauls; lot kiosk; 1980s take-home catalog and POD; sorting teams; community aid; white-label optional apps including adult dating and community support. White-label requires per-organization opt-in, separate app identity, configuration and review. No automatic copying or rebranding of third-party material.

Target Cloudflare Workers + D1 + R2 + KV + Pages; GitHub existing repo, no submodules; no secrets in repo. D1 migrations applied explicitly, not automatically on every Worker request. Use D1 for durable ledger, KV for non-authoritative cache, R2 for approved artwork and PDFs. Never claim that Cloudflare Pro itself implies unlimited usage or configured bindings.

## Implementation status
Python calculator and product catalog authored; unit tests authored but not executed through GitHub; additive schema authored but not applied; no live API, payment, driver or storefront deployment claimed. Preserve user's full raw message separately if a verbatim archival tool is available.
