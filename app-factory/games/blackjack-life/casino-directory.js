/* Nathan Tabor — CASINO FLOOR DIRECTORY. Author's received source, 1–13 complete, 14 partial.
 * Positions 15–21 explicitly unprovided. This is an indexed reference, not a game launcher or money service.
 * Rule descriptions are preserved as supplied; actual casino variants may have house-dependent rules.
 */
(function(root){"use strict";
const ENTRIES=Object.freeze([
  {
    "number": 1,
    "title": "Blackjack (Twenty-One)",
    "section": "Table & Card",
    "mechanics": "A structured player-versus-dealer card value optimization loop. Cards carry precise face weights (Aces fluctuate dynamically between 1 or 11; face cards lock at 10).",
    "rule": "The cumulative numerical total of the hand must approach but never breach the absolute ceiling of 21. Breaching 21 results in an immediate automatic clearing of the stake.",
    "status": "provided"
  },
  {
    "number": 2,
    "title": "Texas Hold'em Bonus Poker",
    "section": "Table & Card",
    "mechanics": "A variant layout where players compete exclusively against the house hand rather than other players. Players use two hole cards and five community board cards to construct a premier five-card layout.",
    "rule": "Folding at specific structural check-points eliminates the primary ante, while hitting optimal card sets activates fixed side-bet payout multipliers.",
    "status": "provided"
  },
  {
    "number": 3,
    "title": "Baccarat (Punto Banco)",
    "section": "Table & Card",
    "mechanics": "A high-speed, binary card-value tracking game. Participants wager capital on one of two primary pathways: the \"Player\" hand or the \"Banker\" hand.",
    "rule": "The hand closest to a total value of 9 conquers the round. Multi-digit values discard the tens digit entirely (e.g., a total of 15 operates strictly as a 5).",
    "status": "provided"
  },
  {
    "number": 4,
    "title": "Three Card Poker",
    "section": "Table & Card",
    "mechanics": "A fast-paced proprietary card variant designed for rapid resolution. Players receive exactly three cards to match against a dealer's hidden three-card set.",
    "rule": "Hand value rankings shift away from traditional rules: a Straight ranks higher than a Flush due to the mathematical probability of a three-card distribution.",
    "status": "provided"
  },
  {
    "number": 5,
    "title": "Caribbean Stud Poker",
    "section": "Table & Card",
    "mechanics": "A five-card stud game structured specifically for table play against the casino dealer.",
    "rule": "The dealer's hand must hold at least an Ace and a King or higher to qualify. If the dealer fails to qualify, player wagers are returned via specific ante-payout protocols.",
    "status": "provided"
  },
  {
    "number": 6,
    "title": "Pai Gow Poker",
    "section": "Table & Card",
    "mechanics": "A dual-axis strategy game using a 53-card deck, including a single wildcard. Players are dealt seven cards to construct two separate hands simultaneously: a 5-card hand and a 2-card hand.",
    "rule": "The 5-card hand must hold a higher rank than the 2-card hand. To sweep the house, both individual hand arrays must defeat the dealer's corresponding hands.",
    "status": "provided"
  },
  {
    "number": 7,
    "title": "Let It Ride",
    "section": "Table & Card",
    "mechanics": "A player-paced card game where bettors do not compete against a hand; instead, they wager on the strength of their own three cards integrated with two community cards.",
    "rule": "As community cards are progressively turned face up, the player retains absolute authority to pull back or \"Let Ride\" one-third of their initial three-part wager based on real-time confidence metrics.",
    "status": "provided"
  },
  {
    "number": 8,
    "title": "Craps (Bank Craps)",
    "section": "Dice, Wheels & Chance",
    "mechanics": "A high-energy multi-player dice matrix operated on a sunken felt table layout. Players wager capital on the outcomes of two rolled hexahedral dice.",
    "rule": "The initial roll (Come-Out) establishes a structural numeric anchor point (The Point). The shooter must replicate that exact number before rolling a 7, which instantly clears the board.",
    "status": "provided"
  },
  {
    "number": 9,
    "title": "American Roulette (Double Zero Grid)",
    "section": "Dice, Wheels & Chance",
    "mechanics": "A physical kinetic wheel tracking system containing 38 numbered layout slots (1 through 36, plus 0 and 00 green house markers).",
    "rule": "A localized physical ball is launched counter-clockwise into the spinning wheel. Wagers are divided into inside arrays (exact numbers) and outside arrays (binary variables like Red/Black or Odd/Even).",
    "status": "provided"
  },
  {
    "number": 10,
    "title": "European Roulette (Single Zero Invariant)",
    "section": "Dice, Wheels & Chance",
    "mechanics": "A classic wheel tracking system containing exactly 37 numbered slots, utilizing a single green 0 marker.",
    "rule": "Removing the 00 pocket alters the systemic house edge metrics instantly, cutting the casino's mathematical advantage down to 2.70% compared to the American variant's 5.26%.",
    "status": "provided"
  },
  {
    "number": 11,
    "title": "Sic Bo (The Triple Matrix)",
    "section": "Dice, Wheels & Chance",
    "mechanics": "An ancient Chinese game of pure chance utilizing three distinct dice sealed inside an automated shaking chamber.",
    "rule": "Players place wagers on a dense table interface mapping diverse geometric outcomes, ranging from specific single-number frequencies to total structural point values.",
    "status": "provided"
  },
  {
    "number": 12,
    "title": "Big Six Wheel (The Money Wheel)",
    "section": "Dice, Wheels & Chance",
    "mechanics": "A vertical, large-scale segmented wooden or acrylic wheel divided into 54 separate slots separated by physical peg buffers.",
    "rule": "A dealer spins the wheel against a fixed leather indicator. Slots are pre-populated with currency denominations ($1, $2, $5, $10, $20) or high-multiplier symbols that dictate the fixed payout.",
    "status": "provided"
  },
  {
    "number": 13,
    "title": "Chuck-a-Luck (The Birdcage)",
    "section": "Dice, Wheels & Chance",
    "mechanics": "A simplified, high-velocity variant of Sic Bo using three dice houses inside a wire-frame cage that rotates vertically around a central pivot axis.",
    "rule": "Wagers are restricted to simple single-number appearances or specific high-low attributes determined the moment the cage stops movement and the dice rest on the bottom plate.",
    "status": "provided"
  },
  {
    "number": 14,
    "title": "Hazard (The Ancestral Roll)",
    "section": "Dice, Wheels & Chance",
    "mechanics": "An intricate, historical dice game dating back to the Crusades that served as the structural blueprint for modern Craps.",
    "rule": null,
    "status": "incomplete"
  },
  {
    "number": 15,
    "title": null,
    "section": null,
    "mechanics": null,
    "rule": null,
    "status": "awaiting-original-source"
  },
  {
    "number": 16,
    "title": null,
    "section": null,
    "mechanics": null,
    "rule": null,
    "status": "awaiting-original-source"
  },
  {
    "number": 17,
    "title": null,
    "section": null,
    "mechanics": null,
    "rule": null,
    "status": "awaiting-original-source"
  },
  {
    "number": 18,
    "title": null,
    "section": null,
    "mechanics": null,
    "rule": null,
    "status": "awaiting-original-source"
  },
  {
    "number": 19,
    "title": null,
    "section": null,
    "mechanics": null,
    "rule": null,
    "status": "awaiting-original-source"
  },
  {
    "number": 20,
    "title": null,
    "section": null,
    "mechanics": null,
    "rule": null,
    "status": "awaiting-original-source"
  },
  {
    "number": 21,
    "title": null,
    "section": null,
    "mechanics": null,
    "rule": null,
    "status": "awaiting-original-source"
  }
].map(r=>Object.freeze(r)));
const API=Object.freeze({ENTRIES,provided:13,partial:1,reserved:7});
root.NathanCasinoDirectory=API;
if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof globalThis!=="undefined"?globalThis:this);
