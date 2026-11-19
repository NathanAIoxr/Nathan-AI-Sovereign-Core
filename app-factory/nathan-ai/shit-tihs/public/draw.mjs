import { HEIGHT, WIDTH } from './game.mjs?v=2';

export function draw(ctx, game, reducedMotion = false) {
  const { stage, player } = game;
  const px = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const label = (words, x, y, font, color) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(words, x, y);
  };
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  stage.colors.forEach((color, index) => gradient.addColorStop(index / 2, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 88; i++) {
    const x = (i * 151 + i * i * 7) % WIDTH;
    const y = (i * 79 + i * i * 3) % 190;
    px(x, y, i % 9 ? 1 : 2, i % 9 ? 1 : 2, i % 6 ? '#eeb99855' : '#ffe6ba');
  }
  px(39, 30, 24, 24, '#ffd28b');
  px(43, 26, 16, 32, '#ffd28b');
  px(35, 34, 32, 16, '#ffd28b');
  px(47, 29, 12, 3, '#fff0ba');
  px(38, 43, 11, 2, '#eda17f');

  ctx.fillStyle = '#4e354e';
  ctx.beginPath();
  ctx.moveTo(0, 211);
  ctx.lineTo(81, 186);
  ctx.lineTo(153, 215);
  ctx.lineTo(275, 174);
  ctx.lineTo(377, 201);
  ctx.lineTo(WIDTH, 172);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.fill();

  ctx.fillStyle = '#2d2235';
  ctx.beginPath();
  ctx.moveTo(64, 289);
  ctx.lineTo(64, 148);
  ctx.lineTo(215, 48);
  ctx.lineTo(215, 24);
  ctx.lineTo(240, 4);
  ctx.lineTo(265, 24);
  ctx.lineTo(265, 48);
  ctx.lineTo(430, 139);
  ctx.lineTo(430, 289);
  ctx.closePath();
  ctx.fill();
  px(78, 144, 341, 132, '#62464f');
  for (let y = 151; y < 277; y += 7) {
    px(79, y, 340, 1, '#342738');
    for (let x = 82 + (y % 2) * 9; x < 415; x += 19) px(x, y + 1, 1, 6, '#503743');
  }
  px(222, 36, 36, 96, '#4d3949');
  px(226, 32, 28, 5, '#aa745e');
  for (const x of [93, 170, 229, 295, 367]) {
    px(x, 150, 19, 101, '#322538');
    px(x + 3, 141, 13, 12, '#221a2b');
    px(x + 3, 155, 13, 84, '#a76959');
    px(x + 8, 153, 2, 88, '#4b3041');
    for (let y = 164; y < 235; y += 15) px(x + 4, y, 11, 2, '#d79367');
  }
  px(233, 50, 15, 23, '#dbea99');
  px(231, 57, 18, 2, '#f0fabe');
  px(239, 50, 2, 24, '#756042');

  for (const [x, y, width] of stage.platforms.slice(1)) {
    for (const post of [x + 6, x + width - 9]) {
      px(post, y - 16, 4, HEIGHT - y, '#38243a');
      px(post + 1, y - 10, 1, HEIGHT - y, '#9c735d');
      for (let r = y + 12; r < 275; r += 16) px(post - 3, r, 10, 1, '#95736a');
    }
    px(x, y, width, 7, '#282033');
    px(x, y, width, 2, '#f0ab6f');
    for (let plank = x + 8; plank < x + width - 4; plank += 12) px(plank, y + 3, 4, 2, '#825151');
  }
  px(0, 276, WIDTH, 24, '#241b2d');
  px(0, 276, WIDTH, 2, '#c5816b');
  for (let x = 0; x < WIDTH; x += 16) px(x, 284 + x % 3, 10, 2, '#795162');

  for (const bay of game.bays) {
    const { x, y, step } = bay;
    px(x - 11, y - 28, 22, 22, '#302535');
    px(x - 10, y - 27, 20, 20, ['#b87e68', '#81566c', '#d3ad8c', '#d9f681'][step]);
    px(x - 7, y - 24, 14, 14, ['#654150', '#b9787b', '#e1c6a7', '#72985b'][step]);
    label(step === 3 ? '✓' : 'X', x - 3, y - 14, 'bold 8px monospace', step === 3 ? '#fff9cf' : '#fff1da');
  }

  if (!game.sticker) {
    const [x, y] = stage.sticker;
    px(x - 21, y - 21, 42, 13, '#2c1430');
    px(x - 20, y - 20, 40, 11, '#fff1bc');
    label('SHIT HAPPENS', x - 18, y - 13, 'bold 5px monospace', '#2d1c31');
  }
  if (!game.relic) {
    const [x, y] = stage.relic;
    px(x - 8, y - 20, 16, 12, '#2c1e39');
    px(x - 7, y - 19, 14, 10, '#f4b878');
    px(x - 5, y - 18, 3, 8, '#793d57');
    label('KJV', x - 1, y - 12, 'bold 5px monospace', '#2d1c31');
  }

  const [sx, sy] = stage.star;
  const ready = game.sticker && game.bays.every(bay => bay.step === 3);
  const gleam = ready ? '#eaff9a' : '#f3b67a';
  px(sx - 2, sy - 34, 4, 24, gleam);
  px(sx - 12, sy - 24, 24, 4, gleam);
  px(sx - 6, sy - 28, 12, 12, gleam);
  px(sx - 2, sy - 24, 4, 4, '#fff6cd');

  for (const drip of game.drips) {
    px(drip.x - 1, drip.y - 3, 3, 9, '#81995a');
    px(drip.x - 3, drip.y + 3, 7, 5, '#c9de78');
    px(drip.x - 1, drip.y + 4, 2, 3, '#f2f8a6');
  }
  for (const mote of game.motes) {
    px(mote.x - 2, mote.y, 5, 5, '#ffeea0');
  }
  if (game.wave > 0 && !reducedMotion) {
    const radius = (1 - game.wave / .62) * 360 + 10;
    ctx.strokeStyle = '#ffe7a5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 11, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  const wiggle = reducedMotion ? 0 : Math.floor(game.elapsed * 12) % 2;
  const ratCount = Math.ceil(game.rats / 22);
  for (let i = 0; i < ratCount; i++) {
    const x = player.x - player.facing * (19 + i * 10);
    const y = player.y + (i % 2) * 2 - wiggle;
    px(x - 3, y - 6, 7, 4, '#39213e');
    px(x + 4, y - 7, 3, 2, '#f48a94');
    px(x - 7, y - 5, 4, 1, '#d17e9c');
  }

  const { x, y, facing } = player;
  px(x - 6, y - 22, 12, 19, '#271b33');
  px(x - 5, y - 20, 10, 3, '#f3c17b');
  px(x - 4, y - 17, 8, 5, '#e5a88d');
  px(x - 5, y - 12, 10, 7, '#deef91');
  px(x - 5, y - 5, 4, 5, '#8cb1d2');
  px(x + 2, y - 5, 4, 5, '#8cb1d2');
  px(x + facing * 8 - 2, y - 11, 4, 3, '#fff0b1');
  px(x + facing * 8 - 1, y - 8, 2, 5, '#b27b5d');
}
