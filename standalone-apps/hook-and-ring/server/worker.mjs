const SECOND = 1000;
const tokenPattern = /^[a-f0-9]{32}$/;
const reply = (body, status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail = (error,status=400) => reply({error},status);
function aliasFor(input) {
  if(typeof input!=='string') return '';
  return input.normalize('NFKC').trim().replace(/\s+/gu,' ');
}
function verifyShots(shots, seed, elapsed) {
  if(!Array.isArray(shots)||!shots.length||shots.length>DAILY_SHOTS) return null;
  let minimum = 1500, score = 0, durationMs = 0;
  for(const [index,item] of shots.entries()){
    if(!item||typeof item!=='object') return null;
    const {pull,aim,flick,releasedMs}=item;
    if(![pull,aim,flick].every(Number.isFinite)||pull<0||pull>1||Math.abs(aim)>1||Math.abs(flick)>1) return null;
    if(!Number.isInteger(releasedMs)||releasedMs<minimum-30||releasedMs>=DAILY_MS||releasedMs>elapsed+400) return null;
    const result=simulateShot(item,breezeFor(seed,index).lateral);
    if(result.outcome==='catch') score++;
    durationMs=releasedMs+result.ms;
    minimum=durationMs+1500+850;
  }
  return durationMs<=elapsed+700 ? {score,durationMs} : null;
}
async function board(db,day) {
  const {results}=await db.prepare(
    'SELECT alias, score, duration_ms AS durationMs FROM ranked_rounds WHERE day=? AND score IS NOT NULL ORDER BY score DESC, duration_ms ASC, submitted_ms ASC LIMIT 20'
  ).bind(day).all();
  return {day:day.replace(/^yard:/,''),scores:results};
}
async function tournament(request, db, now=Date.now()) {
  const url=new URL(request.url);
  const yard=url.pathname.startsWith('/api/yard-darts/');
  const pathname=yard?url.pathname.replace('/yard-darts',''):url.pathname;
  const {origin}=url;
  const calendarDay=dayKey(new Date(now));
  const day=yard?'yard:'+calendarDay:calendarDay;
  const limitMs=yard?YARD_LIMIT_MS:DAILY_MS;
  const maxShots=yard?YARD_SHOTS:DAILY_SHOTS;
  if(!db) return fail('The tournament database is unavailable. The other game modes are ready.',503);
  if(pathname==='/api/board'&&request.method==='GET') return reply(await board(db,day));
  if(!['/api/start','/api/submit'].includes(pathname)) return fail('Route unavailable.',404);
  if(request.method!=='POST') return fail('Use POST.',405);
  if(request.headers.get('Origin') && request.headers.get('Origin')!==origin) return fail('Origin unavailable.',403);
  if(Number(request.headers.get('Content-Length'))>8192) return fail('Submission too large.',413);
  if(pathname==='/api/start'){
    const token=crypto.randomUUID().replaceAll('-','');
    await db.prepare('INSERT INTO ranked_rounds(token,day,started_ms,expires_ms) VALUES(?,?,?,?)')
      .bind(token,day,now,now+(limitMs+15*60*SECOND)).run();
    if(token.startsWith('0')) await db.prepare('DELETE FROM ranked_rounds WHERE token IN (SELECT token FROM ranked_rounds WHERE expires_ms < ? AND score IS NULL LIMIT 100)').bind(now).run().catch(()=>{});
    return reply({token,seed:day,day:calendarDay,limitMs,maxShots},201);
  }
  const body=await request.text();
  if(body.length>8192) return fail('Submission too large.',413);
  let parsed;
  try{parsed=JSON.parse(body);}catch{return fail('Invalid submission.');}
  const {token,shots}=parsed??{};
  const alias=aliasFor(parsed?.alias);
  if(typeof token!=='string'||!tokenPattern.test(token)||!alias||[...alias].length>24||!/[\p{L}\p{N}]/u.test(alias)||/[\p{Cc}\p{Cf}]/u.test(alias)) {
    return fail('Enter a leaderboard name of 1–24 characters and start a ranked round.');
  }
  const round=await db.prepare('SELECT day,started_ms,expires_ms,score FROM ranked_rounds WHERE token=?').bind(token).first();
  if(!round||round.day.startsWith('yard:')!==yard||round.expires_ms<now) return fail('This ranked round has expired.',410);
  if(round.score!==null) return reply({...await board(db,round.day),accepted:round.score});
  const verify=yard?verifyYardShots:verifyShots;
  const verified=verify(shots,round.day,now-round.started_ms);
  if(!verified) return fail('The server could not verify those throws.',422);
  if(shots.length<maxShots&&now-round.started_ms<limitMs-400) return fail('Complete all ten throws or wait for the round to end.',422);
  const change=await db.prepare('UPDATE ranked_rounds SET alias=?,score=?,duration_ms=?,submitted_ms=? WHERE token=? AND score IS NULL')
    .bind(alias,verified.score,verified.durationMs,now,token).run();
  const committed=change.meta.changes?verified.score:(await db.prepare('SELECT score FROM ranked_rounds WHERE token=?').bind(token).first()).score;
  return reply({...await board(db,round.day),accepted:committed});
}


const eventLifetime = 14 * 86400000;
const codePattern = /^[a-f0-9]{10}$/;
const ticketPattern = /^[a-f0-9]{32}$/;
const eventReply = (data, status = 200) => Response.json(data, {status, headers:{'Cache-Control':'no-store'}});
const eventError = (message, status = 400) => eventReply({error:message}, status);
const newTicket = () => crypto.randomUUID().replaceAll('-','');
const cleanLabel = value => typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/gu, ' ') : '';
const validLabel = (value, limit) => value.length > 0 && [...value].length <= limit && !/[\p{C}]/u.test(value);
const seat = (name, key) => ({name, key});
const eventMatch = (first, second) => ({players:[first,second], scores:[0,0], turn:0, last:null, winner:null});

function nextRound(event) {
  const current = event.rounds.at(-1);
  if (!current.every(match => match.winner !== null)) return;
  const winners = current.map(match => match.winner);
  if (winners.length === 1) {
    event.champion = winners[0];
    return;
  }
  const next = [];
  for (let index = 0; index < winners.length; index += 2) next.push(eventMatch(winners[index],winners[index+1]));
  event.rounds.push(next);
}

function moveCompetition(event, action, input, key, now) {
  const position = event.players.findIndex(player => player.key === key);
  if (action === 'join') {
    if (position >= 0) return {key, changed:false};
    const name = cleanLabel(input.name);
    if (!ticketPattern.test(key) || !validLabel(name,24)) return {error:'Enter a player name of 1–24 characters.'};
    if (event.rounds.length || event.players.length >= event.capacity) return {error:'All seats are taken.', status:409};
    if (event.players.some(player=>player.name.toLowerCase()===name.toLowerCase())) return {error:'Choose a different player name.',status:409};
    event.players.push(seat(name,key));
    if (event.capacity === 2 && event.players.length === 2) event.rounds.push([eventMatch(0,1)]);
    return {key, changed:true};
  }
  if (position < 0) return {error:'Join the event first.', status:403};
  if (action === 'start') {
    if (position !== 0) return {error:'Only the host can start the bracket.', status:403};
    if (event.rounds.length) return {changed:false};
    if (event.players.length !== event.capacity) return {error:'Fill all the seats before starting.', status:409};
    const pairs=[];
    for(let i=0;i<event.capacity;i+=2)pairs.push(eventMatch(i,i+1));
    event.rounds.push(pairs);
    return {changed:true};
  }
  if (action !== 'toss') return {error:'Unknown event action.',status:404};
  if (!Number.isInteger(input.round) || !Number.isInteger(input.turn) ||
      ![input.pull,input.aim].every(Number.isFinite) || input.pull < 0 || input.pull > 1 || Math.abs(input.aim) > 1) {
    return {error:'Invalid toss.'};
  }
  const currentRound = event.rounds.at(-1);
  if (!currentRound || input.round !== event.rounds.length) return {error:'This round changed. Refresh the board.',status:409};
  if (event.champion !== null) return {error:'This event is finished.',status:409};
  const match = currentRound.find(item => item.players.includes(position));
  if (!match || match.winner !== null) return {error:'Wait for the next bracket round.',status:409};
  if (input.turn !== match.turn || match.players[match.turn%2] !== position) return {error:'The board has changed or it is the other player’s turn.',status:409};
  const last = match.last;
  if (last && now - last.at < 500) return {error:'Wait for the previous toss to settle.',status:409};
  // A narrow seeded drift makes successive turns different with identical conditions for both seats.
  const drift = competitionWind(event.code,event.rounds.length,match.turn);
  const {outcome,detail} = simulateShot({pull:input.pull,aim:input.aim,flick:0},drift);
  if (outcome === 'catch') match.scores[match.players.indexOf(position)]++;
  match.last={position,outcome,detail,at:now};
  match.turn++;
  const [one,two] = match.scores;
  if (match.turn % 2 === 0) {
    if (one !== two && Math.max(one,two)>=event.goal)match.winner=match.players[Number(two>one)];
  }
  nextRound(event);
  return {changed:true, outcome, detail};
}

function publicEvent(row,event,key) {
  return {code:row.code,revision:row.revision,expires:row.expires_ms,name:event.name,capacity:event.capacity,goal:event.goal,
    players:event.players.map(player=>player.name),rounds:event.rounds.map(round=>round.map(match=>({
      players:match.players,scores:match.scores,winner:match.winner,
      turn:match.turn,last:match.last??null,
    }))),champion:event.champion,me:event.players.findIndex(player=>player.key===key)};
}

async function competition(request,db,now=Date.now()) {
  const url=new URL(request.url);
  if (!db) return eventError('Online events are temporarily unavailable.',503);
  if (request.headers.get('Origin') && request.headers.get('Origin')!==url.origin) return eventError('Origin unavailable.',403);
  let body={};
  if (request.method==='POST') {
    if (Number(request.headers.get('Content-Length'))>4096) return eventError('Request too large.',413);
    const raw=await request.text();
    if (raw.length>4096) return eventError('Request too large.',413);
    try {body=JSON.parse(raw);} catch {return eventError('Could not read the event action.');}
    if (!body || typeof body!=='object' || Array.isArray(body)) return eventError('Could not read the event action.');
  } else if (request.method!=='GET') return eventError('Use GET or POST.',405);
  const key=request.headers.get('X-Player-Key')??'';
  const name=cleanLabel(body.name);
  if (url.pathname==='/api/events' && request.method==='POST') {
    const title=cleanLabel(body.title);
    if (!validLabel(name,24)||!validLabel(title,40)||![2,4,8,16,32].includes(body.capacity)||![3,5,11].includes(body.goal) ||
        !ticketPattern.test(key)) return eventError('Enter a title, a player name, and valid event rules.');
    const code=newTicket().slice(0,10);
    const event={name:title,capacity:body.capacity,goal:body.goal,code,players:[seat(name,key)],rounds:[],champion:null};
    const expires=now+eventLifetime;
    await db.prepare('INSERT INTO arcade_events(code, expires_ms,body) VALUES(?,?,?)').bind(code,expires,JSON.stringify(event)).run();
    if(code.startsWith('0')) await db.prepare('DELETE FROM arcade_events WHERE code IN (SELECT code FROM arcade_events WHERE expires_ms < ? LIMIT 30)').bind(now).run().catch(()=>{});
    return eventReply(publicEvent({code,revision:0,expires_ms:expires},event,key),201);
  }
  const [, , , code, action]=url.pathname.split('/');
  if (!codePattern.test(code??'') || url.pathname!==('/api/events/'+code+(action?'/'+action:''))) return eventError('Enter a valid invite code.',404);
  if (request.method==='GET' && action) return eventError('Use POST for event actions.',405);
  for(let retry=0;retry<4;retry++) {
    const row=await db.prepare('SELECT code,revision,expires_ms,body FROM arcade_events WHERE code=?').bind(code).first();
    if(!row || row.expires_ms<=now) return eventError('This event is unavailable or has expired.',404);
    if(request.method==='GET' && url.searchParams.get('revision')===String(row.revision)){
      return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
    }
    const event=JSON.parse(row.body);
    if(action==='cancel'&&request.method==='POST'){
      if(key!==event.players[0].key)return eventError('Only the host can cancel an open lobby.',403);
      if(event.rounds.length)return eventError('This event has already started.',409);
      const change=await db.prepare('DELETE FROM arcade_events WHERE code=? AND revision=?').bind(code,row.revision).run();
      if(change.meta.changes)return eventReply({cancelled:true});
      continue;
    }
    if(request.method==='GET') return eventReply(publicEvent(row,event,key));
    const move=moveCompetition(event,action,body,key,now);
    if(move.error) return eventError(move.error,move.status);
    if(!move.changed) return eventReply(publicEvent(row,event,key));
    const change=await db.prepare('UPDATE arcade_events SET body=?,revision=revision+1 WHERE code=? AND revision=?')
      .bind(JSON.stringify(event),code,row.revision).run();
    if(change.meta.changes) return eventReply({...publicEvent({...row,revision:row.revision+1},event,key),outcome:move.outcome,detail:move.detail});
  }
  return eventError('Another player moved at the same time. Try again.',409);
}


function createWorker(assets) {
  return {
    async fetch(request, env) {
      const {pathname}=new URL(request.url);
      if(pathname.startsWith('/api/')){
        try {
          if(pathname==='/api/status'){
            if(request.method!=='GET')return Response.json({error:'Use GET.'},{status:405});
            const row=await env.DB.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name IN ('arcade_events','ranked_rounds')").first();
            const ready=row?.count===2;
            return Response.json({service:'hook-and-ring',release:'2026-11-17.1',onlinePlay:ready},{status:ready?200:503,headers:{'Cache-Control':'no-store'}});
          }
          if(pathname==='/api/events'||pathname.startsWith('/api/events/'))return await competition(request,env.DB);
          return await tournament(request,env.DB);
        }
        catch(error){
          console.error('Game API request failed',String(error));
          return Response.json({error:'Online play temporarily unavailable.'},{status:503});
        }
      }
      if(request.method!=='GET'&&request.method!=='HEAD') return new Response('Method not allowed',{status:405});
      const asset=assets.get(pathname);
      if(!asset) return new Response('Page not found',{status:404});
      return new Response(request.method==='HEAD'?null:asset.bytes(),{
        headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff',
          'Permissions-Policy':'accelerometer=(self), gyroscope=(self)',
          'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self'; frame-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'"}
      });
    }
  };
}
