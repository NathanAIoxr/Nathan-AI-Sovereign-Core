import {checkDailyReplay,utcDate,MEDALS} from './public/daily-replay.mjs';
import {PHYSICS_HZ} from './public/fixed-clock.mjs';

const MAX_BYTES = 6144;
const reply = (body, status=200) => Response.json(body, {status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const error = (message,status) => reply({error:message},status);
const display = row => ({alias:row.alias, medal:MEDALS[row.grade-1], ms:Math.round(row.ticks/PHYSICS_HZ*1000)});

async function readBody(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES || !request.body) return null;
  const decoder = new TextDecoder();
  const reader = request.body.getReader();
  let bytes=0, text='';
  for (;;) {
    const {done,value} = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) { await reader.cancel(); return null; }
    text += decoder.decode(value,{stream:true});
  }
  try { return JSON.parse(text+decoder.decode()); } catch { return null; }
}
export async function dailyApi(request, env, date = new Date()) {
  const url = new URL(request.url);
  const day = utcDate(date);
  if (url.pathname !== '/api/daily') return error('Not found.',404);
  if (request.method !== 'GET' && request.method !== 'POST') return error('Use GET or POST.',405);
  if (!env.DB) return error('The online board is unavailable. You can still play locally.',503);
  const posting=request.method==='POST';
  if (posting && (request.headers.get('Origin')!==url.origin || !request.headers.get('Content-Type')?.startsWith('application/json'))) {
    return error('Use the same-origin Daily Grapple form.',403);
  }
  const ip=request.headers.get('CF-Connecting-IP')??'unknown';
  const limiter=posting?env.DAILY_POST:env.DAILY_READ;
  if (limiter && !(await limiter.limit({key:ip})).success) return error('Too many requests. Try again in a minute.',429);
  if (!posting) {
    const {results}=await env.DB.prepare('SELECT alias, grade, ticks FROM daily_scores WHERE day=? ORDER BY grade DESC, ticks, posted_at, player LIMIT 20').bind(day).all();
    return reply({day, scores:results.map(display)});
  }
  const data=await readBody(request);
  const alias=typeof data?.alias==='string'?data.alias.normalize('NFKC').trim().replace(/\s+/gu,' '):'';
  if (!data || data.day!==day) return error('Start a new run for today’s UTC challenge.',400);
  if (typeof data.player!=='string' || !/^[a-f0-9]{32}$/.test(data.player) || !/^[\p{L}\p{N}][\p{L}\p{N} _.-]{0,23}$/u.test(alias)) {
    return error('Use a display name of 1–24 letters or numbers, with spaces, dots, underscores or hyphens.',400);
  }
  const score=checkDailyReplay(day,data.moves);
  if (!score) return error('This run could not be replayed to completion.',422);
  const result=await env.DB.prepare(`INSERT INTO daily_scores (day, player, alias, grade, ticks, posted_at)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (day, player) DO UPDATE SET
    alias=excluded.alias, grade=excluded.grade, ticks=excluded.ticks, posted_at=excluded.posted_at
    WHERE excluded.grade > daily_scores.grade OR (excluded.grade = daily_scores.grade AND excluded.ticks < daily_scores.ticks)`)
    .bind(day,data.player,alias,score.grade,score.ticks,date.getTime()).run();
  return reply({day,accepted:display({alias,...score}),improved:Boolean(result.meta.changes)});
}
