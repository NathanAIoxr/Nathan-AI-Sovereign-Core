import { ipipItems } from "./ipip.mjs";

export const traits = ["Extraversion", "Agreeableness", "Conscientiousness", "Emotional Stability", "Intellect / Imagination"];
export const providers = [
  { id: "ipip", name: "IPIP Big Five", category: "Personality", format: "In-app questionnaire", detail: "50 public-domain items and five trait scores.", url: "https://ipip.ori.org/New_IPIP-50-item-scale.htm" },
  { id: "hexaco", name: "HEXACO-PI-R", category: "Personality", format: "Publisher inventory", detail: "Six personality dimensions, including Honesty–Humility.", url: "https://hexaco.org/hexaco-inventory" },
  { id: "mbti", name: "Myers–Briggs Type Indicator", category: "Personality", format: "Publisher assessment", detail: "Four preference pairs summarized as a type.", url: "https://www.myersbriggs.org/my-mbti-personality-type/take-the-mbti-instrument/" },
  { id: "rheti", name: "Enneagram RHETI", category: "Personality", format: "Publisher assessment", detail: "A profile of scores across nine types.", url: "https://www.enneagraminstitute.com/rheti/" },
  { id: "disc", name: "Everything DiSC Workplace", category: "Personality", format: "Publisher assessment", detail: "Workplace behavior and communication styles.", url: "https://wiley-corp.my.site.com/everythingdisc/s/article/Everything-DiSC-Workplace" },
  { id: "via", name: "VIA Character Strengths", category: "Strengths", format: "Publisher survey", detail: "A personal ordering of 24 character strengths.", url: "https://www.viacharacter.org/Survey/Account/Register" },
  { id: "clifton", name: "CliftonStrengths", category: "Strengths", format: "Publisher assessment", detail: "Gallup’s Top 5 and full 34-theme reports.", url: "https://www.gallup.com/cliftonstrengths/en/253868/cliftonstrengths-assessment.aspx" },
  { id: "eqi", name: "EQ-i 2.0", category: "Strengths", format: "Provider assessment", detail: "MHS’s emotional intelligence assessment with a provider report.", url: "https://mhs.com/eq-i-2-0/" },
  { id: "wais", name: "WAIS-5", category: "IQ & reasoning", format: "Professional assessment", detail: "Pearson’s adult cognitive assessment.", url: "https://www.pearsonassessments.com/en-us/Store/Professional-Assessments/Cognition-%26-Neuro/Wechsler-Adult-Intelligence-Scale-%7C-Fifth-Edition/p/P100071002" },
  { id: "raven", name: "Raven’s 2", category: "IQ & reasoning", format: "Professional assessment", detail: "Pearson’s nonverbal matrix-reasoning assessment.", url: "https://www.pearsonassessments.com/en-us/Store/Professional-Assessments/Cognition-%26-Neuro/Raven%27s-Progressive-Matrices-Second-Edition-%7C-Raven%27s-2/p/100001960" },
  { id: "wisc", name: "WISC-V", category: "IQ & reasoning", format: "Professional assessment", detail: "Pearson’s cognitive assessment for children.", url: "https://www.pearsonassessments.com/store/usd/p/100000771.html" },
  { id: "sb5", name: "Stanford–Binet 5", category: "IQ & reasoning", format: "Professional assessment", detail: "Publisher catalog for the Stanford–Binet Intelligence Scales, Fifth Edition.", url: "https://publications.proedsoftware.com/view/1000385236" },
  { id: "mensa", name: "Mensa IQ Challenge", category: "IQ & reasoning", format: "Online practice", detail: "An online reasoning challenge for practice.", url: "https://www.mensa.org/mensa-iq-challenge/" },
];

export const qiItems = [
  { prompt: "What comes next? 2, 6, 12, 20, …", choices: ["26", "28", "30", "32"], answer: 2, why: "The differences are 4, 6, 8 and 10." },
  { prompt: "Every marked envelope is sealed. One envelope is open. What follows?", choices: ["It is unmarked.", "It is marked.", "All envelopes are open.", "Its marking is unknowable."], answer: 0, why: "An open envelope lacks the property every marked envelope has." },
  { prompt: "A tile repeats: circle, square, square. What shape is the eighth tile?", choices: ["Circle", "Square", "Triangle", "The pattern breaks"], answer: 1, why: "The eighth tile is the second position in its three-tile cycle." },
  { prompt: "Four teams each send three files. Two files are duplicates. How many unique files remain?", choices: ["6", "8", "10", "12"], answer: 2, why: "Start with twelve files and remove the two duplicates." },
  { prompt: "A must finish before B. C must finish before A. Which order works?", choices: ["A, B, C", "A, C, B", "B, C, A", "C, A, B"], answer: 3, why: "C precedes A, which precedes B." },
  { prompt: "A drawer has three red and five blue tokens. What fraction are red?", choices: ["3/5", "3/8", "5/8", "1/3"], answer: 1, why: "There are three red tokens out of eight total." },
];

export const qeItems = [
  { prompt: "A friend says, “I’m fine,” but goes quiet after a difficult meeting.", choices: ["Give advice immediately.", "Ask privately whether they want company or space.", "Tell the team they are upset."], answer: 1, why: "A private check-in gives your friend a say in what happens next." },
  { prompt: "A teammate misses a deadline you were relying on.", choices: ["Assume they did not care.", "Absorb the work without talking about it.", "Ask what happened and agree on the next handoff."], answer: 2, why: "Asking for context and making a concrete agreement addresses both needs." },
  { prompt: "Someone corrects your account of what happened.", choices: ["Repeat what you heard and ask what detail you missed.", "Defend your memory before asking.", "Ask someone else to settle it immediately."], answer: 0, why: "Reflecting their account makes it possible to check the disputed detail." },
  { prompt: "A friend tells you something private. Another person asks you about it.", choices: ["Share enough to explain the situation.", "Ask the friend before sharing their information.", "Give a hint and ask the other person to guess."], answer: 1, why: "Your friend gets to choose whether their information is shared." },
];

export function scoreBigFive(answers) {
  if (answers.length !== ipipItems.length || ipipItems.some((_, index) => !Number.isInteger(answers[index]) || answers[index] < 1 || answers[index] > 5)) {
    throw new RangeError("Answer all 50 items before scoring.");
  }
  const totals = traits.map(() => 0);
  ipipItems.forEach(([, trait, reverse], index) => { totals[trait] += reverse ? 6 - answers[index] : answers[index]; });
  return traits.map((measure, index) => ({ measure, value: totals[index] })).sort((a, b) => b.value - a.value);
}

export function scorePractice(items, answers) {
  if (answers.length !== items.length || items.some((item, index) => !Number.isInteger(answers[index]) || !Object.hasOwn(item.choices, answers[index]))) {
    throw new RangeError("Answer each prompt before viewing the result.");
  }
  return items.filter((item, index) => item.answer === answers[index]).length;
}

export const units = {
  label: "Type or label",
  raw: "Raw score",
  iq: "Reported IQ score",
  standard: "Standard score",
  percentile: "Reported percentile",
  rank: "Reported rank",
};

export function parseValue(value, unit) {
  const input = String(value).trim();
  if (!Object.hasOwn(units, unit) || !input || input.length > 120) throw new RangeError("Enter a result of 1 to 120 characters.");
  if (unit === "label") return input;
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(input)) throw new RangeError("Enter a numeric result for the selected scale.");
  const result = Number(input);
  if (!Number.isFinite(result) || (unit === "percentile" && (result < 0 || result > 100)) ||
    (unit === "rank" && (!Number.isSafeInteger(result) || result < 1))) {
    throw new RangeError("Percentiles range from 0 to 100. A rank must be a positive whole number.");
  }
  return result;
}

export function comparisonKey(record) {
  if (!record.comparison || typeof record.value !== "number" || record.unit === "label") return null;
  return JSON.stringify([record.instrument, record.edition, record.measure, record.unit, record.comparison]);
}

export function rankAttempts(records, selected) {
  const key = comparisonKey(selected);
  if (key === null) return [];
  const direction = selected.unit === "rank" ? 1 : -1;
  const sorted = records.filter(record => comparisonKey(record) === key)
    .sort((a, b) => direction * (a.value - b.value) || b.at.localeCompare(a.at));
  let rank = 0;
  return sorted.map((record, index) => {
    if (index === 0 || record.value !== sorted[index - 1].value) rank = index + 1;
    return { ...record, rank };
  });
}
