import test from 'node:test';
import assert from 'node:assert/strict';
import { Arena, boundary, targetPositions } from '../site/physics.mjs';
import { maxBalls } from '../site/policy.mjs';
import main from '../dist/main.mjs';
import slubber from '../dist/slubber.mjs';
import sos from '../dist/sos.mjs';

const env = Object.fromEntries(Object.entries({ SLUBBER: slubber, SOS: sos }).map(([key, service]) =>
  [key, { fetch: url => service.fetch(new Request(url)) }]));
const request = (path, init, bindings = env) => main.fetch(new Request('https://flubber.test' + path, init), bindings);

test('placements, count, walls and temporary grants respect lab boundaries', () => {
  const arena = new Arena();
  const events = [];
  arena.onEvent = (...event) => events.push(event);
  assert.equal(arena.spawn(4, 730, 150), 0);
  assert.equal(arena.placeWall(730, 150), false);
  assert(events.every(event => event[0] === 'SLUBBER'));
  assert.equal(arena.spawn(2.5, 88, 90), 0);
  assert.equal(arena.spawn(maxBalls + 1, 88, 90), 0);
  arena.grantVault(true);
  assert.equal(arena.spawn(4, 730, 150), 4);
  assert.equal(arena.placeWall(730, 150), true);
  arena.grantVault(false);
  assert.equal(arena.balls.length, 1);
  assert.equal(arena.walls.length, 0);
  assert.equal(arena.spawn(maxBalls, 100, 150), maxBalls - 1);
  assert.equal(arena.spawn(1, 100, 150), 0);
});

test('protected boundary reflects a crossing and records a Slubber event', () => {
  const arena = new Arena();
  const ball = arena.balls[0], events = [];
  arena.onEvent = (...event) => events.push(event);
  Object.assign(ball, { x: boundary - ball.r - 1, y: 320, vx: 500 });
  arena.step(1 / 180);
  assert(ball.x + ball.r <= boundary);
  assert(ball.vx < 0);
  assert(events.some(([type, zone]) => type === 'SLUBBER' && zone === 'vault'));
});

test('restitution amplifies and kinetic burst spends charge and deforms the ring', () => {
  const arena = new Arena(), ball = arena.balls[0];
  arena.tune('restitution', 1.25);
  arena.tune('burst', 0);
  ball.vy = 100;
  arena.impact(ball, 0, -1);
  assert.equal(ball.vy, -125);
  assert.equal(ball.charge, 1);
  arena.tune('burst', .8);
  ball.vy = 100;
  arena.impact(ball, 0, -1);
  assert(ball.vy < -125);
  assert(ball.charge < 1);
  assert(arena.sparks.length > 0);
  arena.step(1 / 180);
  assert(ball.shape.some(value => value !== 0));
});

test('containment freezes motion and stops placement and reset', () => {
  const arena = new Arena();
  arena.contained = true;
  const ball = arena.balls[0];
  arena.fling(ball, 40, 60);
  arena.step(1 / 180);
  arena.reset();
  assert.equal(arena.balls[0], ball);
  assert.equal(ball.vx, 0);
  assert.equal(arena.spawn(2, 100, 200), 0);
  assert.equal(arena.placeWall(200, 130), false);
});

test('arcade tracks a complete timed round', () => {
  const arena = new Arena();
  arena.reset(true);
  for (const [x, y] of targetPositions) {
    Object.assign(arena.balls[0], { x, y, vx: 0, vy: 0 });
    arena.step(1 / 180);
  }
  assert.equal(arena.target, 3);
  assert(arena.score > 0);
  assert.equal(arena.playing, false);
});

test('pages, icons and PWA assets serve with hardened headers', async () => {
  for (const path of ['/', '/game', '/learn', '/zones', '/sos', '/app.mjs', '/sw.js', '/manifest.webmanifest', '/icon-192.png']) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
    assert(response.headers.get('Content-Length') !== '0');
  }
  const head = await request('/', { method: 'HEAD' });
  assert.equal(await head.text(), '');
  assert.equal((await request('/missing')).status, 404);
  assert.equal((await request('/api/permissions', { method: 'POST' })).status, 405);
});

test('edge denies unknown and Vault scopes regardless of claimed grants', async () => {
  const allowed = await request('/api/permissions?zone=workbench&action=wall');
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).worker, 'slubber');
  for (const path of ['/api/permissions?zone=vault&action=wall&grant=true', '/api/permissions?zone=__proto__&action=ball', '/api/permissions?zone=workbench&action=upload', '/api/permissions']) {
    const response = await request(path, { headers: { 'X-Role': 'owner', Authorization: 'Bearer pretend' } });
    assert.equal(response.status, 403, path);
    assert.equal((await response.json()).response, 'slubber');
  }
});

test('SOS service returns fixed plans and the gateway fails closed on outage', async () => {
  const guidance = await request('/api/sos?scenario=unexpected-access');
  assert.equal((await guidance.json()).steps.length, 3);
  assert.equal((await request('/api/sos?scenario=__proto__')).status, 400);
  assert.equal((await request('/api/health')).status, 200);
  assert.equal((await request('/api/health', {}, {})).status, 503);
  assert.equal((await request('/api/permissions?zone=playground&action=ball', {}, {})).status, 503);
});
