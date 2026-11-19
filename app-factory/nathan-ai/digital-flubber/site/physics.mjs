import { authorize, maxBalls } from './policy.mjs';

export const width = 840;
export const height = 440;
export const boundary = 648;
export const targetPositions = [[214, 220], [462, 115], [570, 315]];
const pointCount = 20;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const zoneAt = x => x >= boundary ? 'vault' : x >= 326 ? 'workbench' : 'playground';
export const tuningDefaults = { restitution: 1.17, stiffness: 48, burst: 0.35 };
export const limits = { restitution: [0.45, 1.5], stiffness: [20, 85], burst: [0, 1] };

export class Arena {
  balls = [];
  walls = [];
  sparks = [];
  tuning = { ...tuningDefaults };
  grant = false;
  contained = false;
  target = 0;
  elapsed = 0;
  playing = false;
  score = null;
  hits = 0;
  nextId = 1;
  onEvent = () => {};
  constructor() { this.spawn(1, 130, 242); }

  tune(key, value) {
    if (Number.isFinite(value) && Object.hasOwn(limits, key)) this.tuning[key] = clamp(value, ...limits[key]);
  }

  spawn(count, x, y) {
    if (!Number.isInteger(count) || count < 1 || count > maxBalls) return 0;
    const zone = zoneAt(x);
    const decision = authorize(zone, 'ball', this);
    if (!decision.allowed) {
      this.onEvent('SLUBBER', zone, decision.reason);
      return 0;
    }
    const available = Math.min(count, maxBalls - this.balls.length);
    const [left, right] = zone === 'vault' ? [boundary, width] : zone === 'workbench' ? [326, boundary] : [0, 326];
    for (let i = 0; i < available; i++) {
      const radius = this.balls.length ? 13 : 22;
      const angle = i * 2.39996;
      const spread = 18 * Math.sqrt(i);
      this.balls.push({
        id: this.nextId++, r: radius, x: clamp(x + Math.cos(angle) * spread, left + radius, right - radius),
        y: clamp(y + Math.sin(angle) * spread, radius, height - radius),
        vx: Math.cos(angle) * (i ? 38 : 0), vy: Math.sin(angle) * 40,
        charge: 1, shape: new Float32Array(pointCount), velocity: new Float32Array(pointCount)
      });
    }
    if (available) this.onEvent('FLUBBER', zone, `${available} ball${available === 1 ? '' : 's'} added`);
    return available;
  }

  placeWall(x, y) {
    const zone = zoneAt(x);
    const decision = authorize(zone, 'wall', this);
    if (!decision.allowed) {
      this.onEvent('SLUBBER', zone, decision.reason);
      return false;
    }
    if (this.walls.length === 16) return false;
    this.walls.push({ x: clamp(x, 20, zone === 'vault' ? width - 20 : boundary - 31), y: clamp(y, 55, height - 55) });
    this.onEvent('FLUBBER', zone, 'Wall placed');
    return true;
  }

  fling(ball, dx, dy) {
    if (this.contained || !ball) return;
    const length = Math.hypot(dx, dy);
    if (!length) return;
    const velocity = Math.min(725, length * 5.6);
    ball.vx = dx / length * velocity;
    ball.vy = dy / length * velocity;
  }

  grantVault(grant) {
    this.grant = grant;
    if (!grant) {
      this.balls = this.balls.filter(ball => zoneAt(ball.x) !== 'vault');
      this.walls = this.walls.filter(wall => zoneAt(wall.x) !== 'vault');
      for (const ball of this.balls) ball.x = Math.min(ball.x, boundary - ball.r);
    }
    this.onEvent('POLICY', 'vault', grant ? 'Practice grant enabled' : 'Practice grant revoked');
  }

  reset(challenge = false) {
    if (this.contained) return;
    this.balls = []; this.walls = []; this.sparks = [];
    this.target = 0; this.elapsed = 0; this.playing = challenge; this.score = null; this.hits = 0;
    this.spawn(1, 130, 242);
  }

  impact(ball, nx, ny, blocked = false) {
    const normalSpeed = ball.vx * nx + ball.vy * ny;
    if (normalSpeed >= 0) return;
    const energy = this.tuning.burst * ball.charge;
    const burst = normalSpeed < -70 && !blocked ? energy * 45 : 0;
    const e = blocked ? 0.58 : Math.abs(normalSpeed) < 27 ? Math.min(0.45, this.tuning.restitution) : this.tuning.restitution;
    const impulse = -(1 + e) * normalSpeed + burst;
    ball.vx += impulse * nx;
    ball.vy += impulse * ny;
    ball.charge = Math.max(0, ball.charge - burst / 180);
    if (normalSpeed < -35) this.hits++;
    const angle = Math.atan2(-ny, -nx);
    for (let i = 0; i < pointCount; i++) {
      const alignment = Math.max(0, Math.cos(i / pointCount * Math.PI * 2 - angle));
      ball.velocity[i] -= Math.min(270, -normalSpeed * 0.82) * alignment ** 3;
    }
    if (burst > 2 || blocked) {
      for (let i = 0; i < 6 && this.sparks.length < 160; i++) {
        const direction = Math.atan2(ny, nx) + (Math.random() - .5) * 2.2;
        const speed = 45 + Math.random() * 100;
        this.sparks.push({ x: ball.x - nx * ball.r, y: ball.y - ny * ball.r,
          vx: Math.cos(direction) * speed, vy: Math.sin(direction) * speed, life: .36, blocked });
      }
    }
  }

  enforceBoundary(ball) {
    if (ball.x + ball.r <= boundary || authorize('vault', 'enter', this).allowed) return;
    ball.x = boundary - ball.r;
    if (ball.vx > 0) {
      this.impact(ball, -1, 0, true);
      this.onEvent('SLUBBER', 'vault', 'Unauthorized entry blocked');
    }
  }

  separateBalls(heldId) {
    for (let i = 0; i < this.balls.length; i++) {
      const a = this.balls[i];
      for (let j = i + 1; j < this.balls.length; j++) {
        const b = this.balls[j];
        const dx = b.x - a.x, dy = b.y - a.y, span = a.r + b.r;
        if (Math.abs(dx) >= span || Math.abs(dy) >= span) continue;
        const distance = Math.hypot(dx, dy);
        if (distance >= span) continue;
        const nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
        const weightA = a.id === heldId ? 0 : b.r ** 2;
        const weightB = b.id === heldId ? 0 : a.r ** 2;
        const weight = weightA + weightB;
        const push = span - distance;
        const speed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        const impulse = Math.max(0, speed) * 1.76;
        for (const [ball, ratio] of [[a, -weightA / weight], [b, weightB / weight]]) {
          if (!ratio) continue;
          ball.x = clamp(ball.x + nx * push * ratio, ball.r, width - ball.r);
          ball.y = clamp(ball.y + ny * push * ratio, ball.r, height - ball.r);
          ball.vx += nx * impulse * ratio;
          ball.vy += ny * impulse * ratio;
          this.enforceBoundary(ball);
        }
      }
    }
  }

  step(dt, heldId) {
    if (this.contained) return;
    if (this.playing) this.elapsed += dt;
    for (const ball of this.balls) {
      if (ball.id === heldId) continue;
      ball.vy += 425 * dt;
      ball.vx *= 1 - dt * .06;
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 780) { ball.vx *= 780 / speed; ball.vy *= 780 / speed; }
      const previousX = ball.x, previousY = ball.y;
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.x < ball.r) { ball.x = ball.r; this.impact(ball, 1, 0); }
      if (ball.x > width - ball.r) { ball.x = width - ball.r; this.impact(ball, -1, 0); }
      if (ball.y < ball.r) { ball.y = ball.r; this.impact(ball, 0, 1); }
      if (ball.y > height - ball.r) { ball.y = height - ball.r; this.impact(ball, 0, -1); }
      for (const wall of this.walls) {
        if (Math.abs(ball.x - wall.x) >= ball.r + 7 || Math.abs(ball.y - wall.y) >= ball.r + 47) continue;
        // Resolve a corner along the side crossed in this fixed step.
        if (Math.abs(previousY - wall.y) >= ball.r + 47) {
          const sign = previousY < wall.y ? -1 : 1;
          ball.y = wall.y + sign * (ball.r + 47); this.impact(ball, 0, sign);
        } else {
          const sign = previousX < wall.x ? -1 : 1;
          ball.x = wall.x + sign * (ball.r + 7); this.impact(ball, sign, 0);
        }
      }
      this.enforceBoundary(ball);
      const mean = ball.shape.reduce((sum, value) => sum + value, 0) / pointCount;
      for (let i = 0; i < pointCount; i++) {
        const left = ball.shape[(i + pointCount - 1) % pointCount];
        const right = ball.shape[(i + 1) % pointCount];
        const spring = -this.tuning.stiffness * ball.shape[i] + 37 * (left + right - 2 * ball.shape[i]);
        ball.velocity[i] += (spring - 48 * mean - 6 * ball.velocity[i]) * dt;
      }
      for (let i = 0; i < pointCount; i++) ball.shape[i] = clamp(ball.shape[i] + ball.velocity[i] * dt, -.51 * ball.r, .65 * ball.r);
      if (this.playing && this.target < targetPositions.length) {
        const [x, y] = targetPositions[this.target];
        if (Math.hypot(x - ball.x, y - ball.y) <= ball.r + 23) {
          this.target++;
          if (this.target === targetPositions.length) {
            this.score = this.elapsed; this.playing = false;
            this.onEvent('GAME', 'playground', 'Three targets cleared');
          }
        }
      }
    }
    this.separateBalls(heldId);
    for (const spark of this.sparks) { spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.life -= dt; }
    this.sparks = this.sparks.filter(spark => spark.life > 0);
  }
}
