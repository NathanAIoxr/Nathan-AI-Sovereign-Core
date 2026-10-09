# 1420: THE CROWNING JEWEL
## TABOR 1-2-3 FACTORY™ — GAME MODULE

Status: working browser-game prototype with two original campaigns, not commercially released.

## Creative premise
1420: the Hussite settlement of Tábor in Bohemia; Jan Žižka; protected wagon formations; resource pooling and civic courage during the Hussite Wars.

1872: Moses Dickson and the African American International Order of Twelve of Knights and Daughters of Tabor, established in Independence, Missouri. Their fraternal service and shared governance inspire a separate civic-building campaign.

1899: Dickson's elaborate International 777 Order of Twelve 333 title becomes an archive-puzzle motif. The two organizations existed in separate centuries. Their meeting in the story is a **fictional time-bridge**, not a historical alliance.

## Implemented prototype
* Play: `crowning-jewel.html` within this folder.
* Logic: `crowning-jewel.js`, self-tested with 11 checks.
* Mode A: ten-turn 5×5 Tábor defense-and-rescue puzzle. Protect the center, shelter four of six residents, coordinate timber, supplies and community cohesion. Options: fortify with an abstract protective wagon, rescue, gather, council and scout.
* Mode B: eight-turn 1872 fraternal civic challenge. Establish mutual-aid, education and community-care programs; serve members and preserve trust.
* Each campaign has restart, event log, outcomes and local scores.
* This is strategic abstraction, not an accurate battlefield reenactment.

## Historical references and accuracy
* [Hussite Museum: Tábor fortified settlement](https://www.husitskemuzeum.cz/expozice-tabor-pevnost/)
* [Hussite Wars and Jan Žižka overview](https://www.worldhistory.org/Hussite_Wars/)
* [Scottish Rite Masonic Museum: International Order of Twelve](https://www.srmml.org/international-order-of-twelve/)
* [African American Fraternal Orders research index](https://african-american-fraternal-orders.org/fraternal-order/independent-order-of-the-twelve-knights-and-daughters-of-tabor/)
* [Moses Dickson's 1899 publication, bibliographic record](https://books.google.com/books/about/International_777_Order_of_Twelve_333_of.html?id=_7xnLDOPHF8C)

Tábor was founded around 1420. Hussite forces employed protective wagon formations, agricultural tools and early firearms in historic campaigns. Some precise military claims in the creator's draft, including universal communal-wealth estimates or standardized engineering dimensions, require further research. Do not publish them as verified measurements.

The Scottish Rite Masonic Museum records that the Order was founded in 1872, that its name refers to **biblical Mount Tabor**, and that members received sickness and death benefits. Its Mississippi jurisdiction later operated Taborian Hospital in Mound Bayou, starting in 1942. The association was African American and formed in the United States, not a military organization arriving from Africa in medieval Bohemia.

The game uses the creator's faith-driven moral framework as a fictional viewpoint. Historical papal-authorized crusades and intra-Hussite divisions may be described; the story should never suggest every Catholic person, past or present, represents moral evil.

## Expansion campaign
1. Spring 1420: establish the community and recruit defenders, artisans and mediators.
2. Sudoměř: history-informed survival and refugee-relief puzzle.
3. Vítkov Hill: defense, geography and critical cooperation.
4. Kutná Hora: community logistics, evacuation and changing historical circumstances.
5. Leadership transition after 1424.
6. Lipany 1434: civic fragmentation, diplomacy and consequences.
7. 1872: expand mutual-aid governance, women's leadership and member protection.
8. 1899: archive research and symbolic 777/12/333 manuscript clues.
9. 1942: care institutions and the Taborian Hospital story.
10. The Crowning Jewel: cross-century fictional knowledge exchange and durable protection of innocent people.

## Technical production backlog
- Browser acceptance tests and deterministic seeded replay.
- Event and scenario files separate from engine; TypeScript port.
- Original artwork, 2D/3D maps, dialogue and cutscenes.
- Accessible touch controls, keyboard play, sound settings and screen reader cues.
- Persistent versioned local saves, then secure optional user cloud sync.
- Integrate saved characters and artwork from each owner's Universal Creator Vault.
- Integrate with Factory Projects, Story Blueprint and historical Role Atlas.
- Native iPhone/Android packaging after cloud-build and developer-account setup.
- Progress, analytics, localization and consent-based multiplayer.
- Explicit publishing approval; no publishing credentials inside this public repo.

## QA
Engine self-tests: `CrowningJewelEngine.runTests()`; Node test command will be added separately. Both chapters must remain playable by touch and keyboard. Medieval and nineteenth-century actors should not be represented as literal contemporaries outside clearly named fictional scenes.
