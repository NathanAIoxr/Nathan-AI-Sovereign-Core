export const WIDTH = 480;
export const HEIGHT = 300;
export const workSteps = ['Scrape', 'Prime', 'Paint'];
export const runNames = { classic: 'Original Run', mirror: 'Mirror Run' };

export const stages = [
  {
    title: 'The Paint Crew Scaffolds',
    time: 64,
    colors: ['#2c1d3c', '#78475a', '#d68b73'],
    platforms: [[0, 276, 480], [64, 224, 205], [211, 171, 216], [113, 118, 190], [255, 63, 188]],
    bays: [[119, 224], [349, 171], [283, 63]],
    sticker: [211, 224],
    relic: [370, 171, '1 John 1:7', '“But if we walk in the light, as he is in the light”'],
    star: [407, 63],
    drips: [158, 297, 388]
  },
  {
    title: 'The Inside-Out Test',
    time: 59,
    colors: ['#222042', '#544376', '#c18181'],
    platforms: [[0, 276, 480], [190, 223, 235], [79, 169, 224], [189, 115, 230], [61, 59, 225]],
    bays: [[382, 223], [133, 169], [337, 115], [125, 59]],
    sticker: [264, 169],
    relic: [365, 115, 'Ephesians 5:11', '“but rather reprove them.”'],
    star: [82, 59],
    drips: [116, 217, 309, 397]
  },
  {
    title: 'THE STAR U R',
    time: 54,
    colors: ['#131b3d', '#433579', '#8a6c97'],
    platforms: [[0, 276, 480], [57, 223, 175], [163, 167, 235], [271, 112, 168], [101, 55, 236]],
    bays: [[109, 223], [223, 167], [395, 112], [175, 55]],
    sticker: [293, 167],
    relic: [361, 112, 'Matthew 5:16', '“Let your light so shine before men”'],
    star: [126, 55],
    drips: [87, 160, 249, 326, 410]
  }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const near = (player, x, y, dx = 17, dy = 12) => Math.abs(player.x - x) <= dx && Math.abs(player.y - y) <= dy;

function mirrorStage(stage) {
  const point = ([x, ...rest]) => [WIDTH - x, ...rest];
  return {
    ...stage,
    platforms: stage.platforms.map(([x, y, width]) => [WIDTH - x - width, y, width]),
    bays: stage.bays.map(point),
    sticker: point(stage.sticker),
    relic: point(stage.relic),
    star: point(stage.star),
    drips: stage.drips.map(x => WIDTH - x)
  };
}

export function createGame(stageIndex = 0, score = 0, run = 'classic') {
  const original = stages[stageIndex];
  const mirror = run === 'mirror';
  const stage = mirror ? mirrorStage(original) : original;
  return {
    stage, stageIndex, run, score, time: stage.time, elapsed: 0, rats: 0, charges: 0,
    player: { x: mirror ? WIDTH - 37 : 37, y: 276, vy: 0, facing: mirror ? -1 : 1, grounded: true },
    bays: stage.bays.map(([x, y]) => ({ x, y, step: 0 })),
    sticker: false, relic: false, drips: [], motes: [], nextDrip: 1.3, dripIndex: 0,
    hitShield: 0, wave: 0, ending: '', message: '', messageTime: 0, events: []
  };
}

function tell(game, message, seconds = 2.2) {
  game.message = message;
  game.messageTime = seconds;
}

function flip(game, sticker = false) {
  const { player } = game;
  game.score += (sticker ? 350 : 100) + game.drips.length * 35;
  game.motes.push(...game.drips.map(drip => ({ x: drip.x, y: drip.y, life: .65 })));
  game.drips.length = 0;
  game.rats = Math.max(0, game.rats - 32);
  game.wave = .62;
  game.hitShield = 1.1;
  player.vy = -293;
  player.grounded = false;
  tell(game, 'TIHS WAVE  •  SLUDGE → GOLD');
  game.events.push('flip');
}

function move(game, input, dt) {
  const { player, stage } = game;
  const direction = Number(input.right || false) - Number(input.left || false);
  if (direction) player.facing = direction;
  player.x = clamp(player.x + direction * 112 * dt, 8, WIDTH - 8);

  if (input.jump && player.grounded) {
    player.vy = -266;
    player.grounded = false;
    game.events.push('jump');
  }

  const previousY = player.y;
  player.vy += 460 * dt;
  player.y += player.vy * dt;
  if (player.vy >= 0) {
    const platform = stage.platforms.find(([x, y, width]) =>
      previousY <= y && player.y >= y && player.x >= x && player.x <= x + width);
    player.grounded = Boolean(platform);
    if (platform) {
      player.y = platform[1];
      player.vy = 0;
    }
  }
  if (player.y < 17) {
    player.y = 17;
    player.vy = Math.max(0, player.vy);
  }
  return direction;
}

function collect(game) {
  const { player, stage } = game;
  if (!game.sticker && near(player, ...stage.sticker, 15, 17)) {
    game.sticker = true;
    flip(game, true);
  }
  if (!game.relic && near(player, ...stage.relic.slice(0, 2), 15, 14)) {
    game.relic = true;
    game.charges += 1;
    game.score += 250;
    tell(game, `${stage.relic[2]} KJV  ${stage.relic[3]}`, 5);
    game.events.push('relic');
  }
}

function work(game) {
  const bay = game.bays.find(item => item.step < workSteps.length && near(game.player, item.x, item.y, 22));
  if (!bay) {
    tell(game, 'Move beside an unfinished work bay.');
    return;
  }
  const step = workSteps[bay.step++];
  game.score += bay.step === 3 ? 125 : 35;
  game.rats = Math.max(0, game.rats - 9);
  tell(game, `${step.toUpperCase()} COMPLETE`, 1.25);
  game.events.push(bay.step === 3 ? 'paint' : 'brush');
}

function useStarOrFlip(game) {
  if (near(game.player, ...game.stage.star, 25, 18)) {
    const unfinished = game.bays.filter(bay => bay.step < 3).length;
    if (unfinished || !game.sticker) {
      const remaining = [];
      if (unfinished) remaining.push(`paint ${unfinished} more ${unfinished === 1 ? 'bay' : 'bays'}`);
      if (!game.sticker) remaining.push('grab the sticker');
      tell(game, `Before the star, ${remaining.join(' and ')}.`);
      return;
    }
    game.score += Math.ceil(game.time) * 10 + 500;
    game.ending = game.stageIndex === stages.length - 1 ? 'win' : 'clear';
    game.events.push('clear');
    return;
  }
  if (game.charges > 0) {
    game.charges -= 1;
    flip(game);
  } else {
    tell(game, 'Find a KJV relic to charge a spare flip.');
  }
}

function updateHazards(game, direction, dt) {
  const { player, stage } = game;
  game.rats = clamp(game.rats + (direction ? -13 : 9) * dt, 0, 100);
  if (game.elapsed >= game.nextDrip) {
    const lane = stage.drips[game.dripIndex++ % stage.drips.length];
    game.drips.push({ x: lane, y: 3, vy: 87 + game.stageIndex * 24 });
    game.nextDrip += 1.36 - game.stageIndex * .19;
  }
  for (const drip of game.drips) {
    drip.y += drip.vy * dt;
    if (game.hitShield <= 0 && near(player, drip.x, drip.y + 10, 11, 11)) {
      game.rats = clamp(game.rats + 22, 0, 100);
      game.hitShield = .9;
      drip.y = HEIGHT + 1;
      tell(game, 'GRIME HIT  •  KEEP MOVING');
      game.events.push('hit');
    }
  }
  game.drips = game.drips.filter(drip => drip.y < HEIGHT);
}

export function advance(game, input, dt) {
  game.events.length = 0;
  if (game.ending) return;
  game.elapsed += dt;
  game.time = Math.max(0, game.time - dt);
  game.messageTime -= dt;
  game.hitShield -= dt;
  game.wave = Math.max(0, game.wave - dt);
  for (const mote of game.motes) {
    mote.life -= dt;
    mote.y -= 39 * dt;
  }
  game.motes = game.motes.filter(mote => mote.life > 0);
  const direction = move(game, input, dt);
  collect(game);
  if (input.brush) work(game);
  if (input.flip) useStarOrFlip(game);
  if (game.ending) return;
  updateHazards(game, direction, dt);
  if (game.rats >= 100 || game.time <= 0) {
    game.ending = game.rats >= 100 ? 'rats' : 'time';
    game.events.push('hit');
  }
}

export function objective(game) {
  if (game.messageTime > 0) return game.message;
  const bay = game.bays.find(item => item.step < 3 && near(game.player, item.x, item.y, 22));
  if (bay) return `${workSteps[bay.step]} this bay  •  BRUSH / X`;
  const painted = game.bays.filter(item => item.step === 3).length;
  if (painted === game.bays.length && game.sticker) return 'Reach THE STAR U R and press TIHS / STAR.';
  return `BAYS ${painted}/${game.bays.length}  •  ${game.sticker ? 'Sticker found' : 'Find the bumper sticker'}  •  FLIPS ${game.charges}`;
}
