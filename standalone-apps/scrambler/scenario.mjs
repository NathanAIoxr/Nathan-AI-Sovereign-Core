import { duration } from './timeline.mjs';

const maxStages = 16;
const maxStageSeconds = 6 * 60 * 60;
const maxRouteSeconds = 24 * 60 * 60;
export const maxImportBytes = 32_768;

export function normalizeScenario(stages) {
  if (!Array.isArray(stages) || stages.length < 1 || stages.length > maxStages) {
    throw new RangeError('Enter between 1 and 16 stages.');
  }
  const route = stages.map((stage, index) => {
    const label = typeof stage?.label === 'string' ? stage.label.trim() : '';
    if (!label || label.length > 55 || /[\u0000-\u001f\u007f]/u.test(label)) {
      throw new RangeError('Stage ' + (index + 1) + ' needs a name of 1–55 characters.');
    }
    const { seconds, mph } = stage;
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > maxStageSeconds) {
      throw new RangeError(label + ' needs a duration from 1 second to 6 hours.');
    }
    if (!Number.isInteger(mph) || mph < 0 || mph > 200) {
      throw new RangeError(label + ' needs a simulated speed from 0 to 200 mph.');
    }
    return { id: 'stage-' + (index + 1), label, seconds, mph };
  });
  if (duration(route) > maxRouteSeconds) throw new RangeError('Keep the full route at 24 hours or less.');
  return route;
}

function parseDuration(text) {
  const clock = text.match(/^(\d{1,2}):([0-5]\d):([0-5]\d)$/u);
  if (clock) return Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  const parts = [...text.matchAll(/(\d+)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/giu)];
  const remainder = text.replace(/\d+\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/giu, '').trim();
  if (!parts.length || remainder) throw new Error('Use a duration such as “10 min”, “1 hour 37 min” or “00:02:00”.');
  const units = { h: 3600, m: 60, s: 1 };
  return parts.reduce((sum, [, number, unit]) => sum + Number(number) * units[unit[0].toLowerCase()], 0);
}

export function draftScenario(text) {
  if (typeof text !== 'string' || text.length > 3000) throw new RangeError('Keep the route draft under 3,000 characters.');
  const lines = text.split(/\n|;|\s+then\s+/iu).map(line => line.trim()).filter(Boolean);
  const stages = lines.map((line, i) => {
    const match = line.match(/^(.+)\s+for\s+(.+?)[.!]?$/iu);
    if (!match) throw new Error('Stage ' + (i + 1) + ' needs “for” and a duration.');
    const [, description, time] = match;
    const speed = description.match(/\s+(?:at\s+)?(\d+)\s*mph$/iu);
    const label = speed ? description.slice(0, speed.index) : description;
    return { label, seconds: parseDuration(time), mph: speed ? Number(speed[1]) : 0 };
  });
  return normalizeScenario(stages);
}

export function describeScenario(stages) {
  return stages.map(({ label, seconds, mph }) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = seconds % 60;
    const time = [h, m, s].map(part => String(part).padStart(2, '0')).join(':');
    return label + (mph ? ' at ' + mph + ' mph' : '') + ' for ' + time;
  }).join('\n');
}

export function importScenario(text) {
  if (new TextEncoder().encode(text).length > maxImportBytes) throw new RangeError('Choose a Scrambler file under 32 KB.');
  const data = JSON.parse(text);
  if (data?.type !== 'scrambler-simulation' || data.simulated !== true) {
    throw new Error('Choose a labeled Scrambler simulation file.');
  }
  if (data.version !== undefined && data.version !== 2) throw new Error('This file uses an unsupported version.');
  const route = normalizeScenario(data.route);
  if (data.totalSeconds !== duration(route)) throw new Error('The file’s total duration does not match its stages.');
  return route;
}

export function routeMetrics(route) {
  const travelSeconds = route.reduce((sum, stage) => sum + (stage.mph ? stage.seconds : 0), 0);
  const miles = route.reduce((sum, stage) => sum + stage.mph * stage.seconds / 3600, 0);
  return { travelSeconds, stopSeconds: duration(route) - travelSeconds, miles };
}
