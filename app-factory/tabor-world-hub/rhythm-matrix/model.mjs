export const referenceYear = 2024;
export const minYear = -10000;
export const maxYear = 10000;

const phases = (year, period) => ((year - referenceYear) % period + period) % period;

export function cycleAt(year) {
  if (!Number.isSafeInteger(year) || year < minYear || year > maxYear) {
    throw new RangeError("Enter a whole year from −10000 to 10000.");
  }
  const broods = [
    { name: "Brood XIX", cycleYears: 13 },
    { name: "Brood XIII", cycleYears: 17 }
  ].map(brood => {
    const phase = phases(year, brood.cycleYears);
    const lastYear = year - phase;
    return { ...brood, phase, scheduled: phase === 0, lastYear, nextYear: lastYear + brood.cycleYears };
  });
  const phase221 = phases(year, 221);
  return {
    year, broods, recurrenceYears: 221, shared: phase221 === 0,
    sharedAtOrBefore: year - phase221,
    nextSharedYear: year - phase221 + 221
  };
}

export const score = [
  ["May I remind you how smart Americans used to be", 10, "F♯", "C♯"],
  ["They could take ashes out of their fireplace", 8, "G♯", "D♯"],
  ["Put it in a bed warmer", 6, "A♯", "F♯"],
  ["Put it between their mattresses", 5, "C♯", "G♯"],
  ["And not burn themselves", 4, "D♯", "A♯"],
  ["Some of them even had candles on their Christmas trees", 10, "F♯", "C♯"],
  ["So if you think we’re smart today, we ain’t", 9, "G♯", "D♯"],
  ["Just sayin’", 2, "A♯", "F♯"]
];

export const pulseCount = score.reduce((total, phrase) => total + phrase[1], 0);
export const heartbeatQuote = "up down up down left right left right left right left left. Left right left left left.";
export const heartbeat = heartbeatQuote.toLowerCase().match(/\b(?:up|down|left|right)\b/g);
export const pitchMultiplier = Math.PI * 1.618 * 1;
export const frequencyPresets = [423, 202.8, 10, 13, 7.83, 110];

export function scaleValue(input) {
  if (!Number.isFinite(input) || input < 0 || input > 1e9) {
    throw new RangeError("Enter a number from 0 to 1,000,000,000.");
  }
  return input * pitchMultiplier;
}
