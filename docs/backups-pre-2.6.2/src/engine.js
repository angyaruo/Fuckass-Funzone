/** Bird Brain's small, dependency-free deterministic gameplay core.
 * No Lumiverse state, network, timers, canvas or DOM dependencies.
 */
export const WORLD = Object.freeze({ width: 360, height: 452, floor: 413, playerX: 92 });
export const MODE = Object.freeze({ BIRD: 'bird', GABI: 'gabi' });
export const DIFFICULTY = Object.freeze({ chill: 0.83, normal: 1, chaos: 1.28 });
/** Smooth, capped acceleration. Score drives the progression, with a smaller
 * distance component so even a cautious run gets gradually faster. */
export function progressSpeed(mode, difficulty, score = 0, distance = 0) {
  const base = (mode === MODE.GABI ? 166 : 153) * (DIFFICULTY[difficulty] ?? 1);
  const s = Number.isFinite(score) ? Math.max(0, score) : 0;
  const d = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  return base * (1 + Math.min(0.72, s * 0.028 + d / 16000));
}

export const DEFAULT_SETTINGS = Object.freeze({
  autoOpen: true,
  mode: MODE.GABI,
  difficulty: 'normal',
  sound: false,
  reduceMotion: false,
  autoHideIdle: false,
  gabuReactions: true,
});

export function sanitizeSettings(value) {
  const obj = value && typeof value === 'object' ? value : {};
  return {
    autoOpen: typeof obj.autoOpen === 'boolean' ? obj.autoOpen : DEFAULT_SETTINGS.autoOpen,
    mode: obj.mode === MODE.BIRD ? MODE.BIRD : MODE.GABI,
    difficulty: Object.prototype.hasOwnProperty.call(DIFFICULTY, obj.difficulty) ? obj.difficulty : 'normal',
    sound: obj.sound === true,
    reduceMotion: obj.reduceMotion === true,
    autoHideIdle: obj.autoHideIdle === true,
    gabuReactions: obj.gabuReactions !== false,
  };
}

export function lifecycleTransition(state, event, generationId) {
  const next = { activeIds: [...(state?.activeIds ?? [])], ready: !!state?.ready };
  const id = typeof generationId === 'string' && generationId.trim() ? generationId : 'unknown';
  if (event === 'start') {
    if (!next.activeIds.includes(id)) next.activeIds.push(id);
    next.ready = false;
  } else if (event === 'end' || event === 'stop') {
    if (id === 'unknown') next.activeIds = [];
    else next.activeIds = next.activeIds.filter(x => x !== id && x !== 'unknown');
    if (next.activeIds.length === 0) next.ready = true;
  }
  return next;
}

export class ArcadeEngine {
  constructor({ random = Math.random, onEvent = () => {}, mode = MODE.GABI, difficulty = 'normal', recordTarget = 0 } = {}) {
    this.random = random;
    this.onEvent = onEvent;
    this.mode = mode === MODE.BIRD ? MODE.BIRD : MODE.GABI;
    this.difficulty = Object.hasOwn(DIFFICULTY, difficulty) ? difficulty : 'normal';
    this.recordTarget = Math.max(0, Math.floor(Number(recordTarget) || 0));
    this.reset();
  }

  reset(mode = this.mode, difficulty = this.difficulty, recordTarget = this.recordTarget) {
    this.mode = mode === MODE.BIRD ? MODE.BIRD : MODE.GABI;
    this.difficulty = Object.hasOwn(DIFFICULTY, difficulty) ? difficulty : 'normal';
    // Snapshot the record ONCE per run. A newly earned best never moves the
    // existing rooftop landmark forward while you're playing.
    this.recordTarget = Math.max(0, Math.floor(Number(recordTarget) || 0));
    this.newBest = false;
    this.newBestFlash = 0;
    this.obstacleNumber = 0;
    this.status = 'idle';
    this.y = 194;
    this.velocity = 0;
    this.holding = false;
    this.age = 0;
    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.health = this.mode === MODE.GABI ? 3 : 1;
    this.invulnerable = 0;
    this.pipes = [];
    this.particles = [];
    // Obstacle spawn clock is measured in world pixels, not seconds; as the
    // game accelerates, gaps don't drift farther apart.
    this.spawnClock = progressSpeed(this.mode, this.difficulty, 0, 0) * 1.1;
    this.deathReason = null;
    this.onEvent('reset', { mode: this.mode });
  }

  start() {
    if (this.status === 'playing') return;
    if (this.status === 'paused') { this.status = 'playing'; this.onEvent('resume'); return; }
    if (this.status === 'dead') this.reset();
    this.status = 'playing';
    this.velocity = this.mode === MODE.BIRD ? -220 : -80;
    this.onEvent('start', { mode: this.mode });
  }

  pause() {
    if (this.status !== 'playing') return;
    this.status = 'paused'; this.holding = false; this.onEvent('pause');
  }

  togglePause() {
    if (this.status === 'playing') this.pause();
    else if (this.status === 'paused') this.start();
  }

  press() {
    if (this.status === 'idle' || this.status === 'dead' || this.status === 'paused') this.start();
    if (this.status !== 'playing') return;
    if (this.mode === MODE.BIRD) {
      this.velocity = -285;
      this.onEvent('flap');
    } else {
      if (!this.holding) this.onEvent('thrust');
      this.holding = true;
    }
  }

  release() { this.holding = false; }

  spawn() {
    const diff = DIFFICULTY[this.difficulty];
    const number = ++this.obstacleNumber;
    const gap = this.mode === MODE.BIRD ? 158 / Math.sqrt(diff) : 169 / Math.sqrt(diff);
    const minCenter = 105 + gap / 2;
    const maxCenter = WORLD.floor - 45 - gap / 2;
    const center = minCenter + Math.max(0, maxCenter - minCenter) * this.random();
    this.pipes.push({
      x: WORLD.width + 30, width: 63, center, gap, passed: false, coinTaken: false,
      number, landmark: this.mode === MODE.GABI && this.recordTarget > 0 && number === this.recordTarget,
    });
  }

  hit(reason) {
    if (this.status !== 'playing' || this.invulnerable > 0) return;
    this.health--;
    this.onEvent('hit', { health: this.health, reason });
    if (this.health <= 0) {
      this.status = 'dead'; this.holding = false; this.deathReason = reason;
      this.onEvent('death', { score: this.score, coins: this.coins, mode: this.mode });
    } else {
      this.invulnerable = 1.35;
      this.velocity = -210;
      this.y = Math.min(WORLD.floor - 75, Math.max(60, this.y - 14));
    }
  }

  update(delta) {
    if (this.status !== 'playing') return;
    if (!Number.isFinite(delta) || delta <= 0) return;
    // Fixed maximum dt protects physics when switching tabs or waking from sleep.
    let remaining = Math.min(delta, 0.12);
    while (remaining > 0 && this.status === 'playing') {
      const dt = Math.min(remaining, 1 / 120);
      this.step(dt);
      remaining -= dt;
    }
  }

  step(dt) {
    const diff = DIFFICULTY[this.difficulty];
    const isGabi = this.mode === MODE.GABI;
    this.age += dt;
    this.newBestFlash = Math.max(0, this.newBestFlash - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.velocity += (isGabi ? (this.holding ? -900 : 730) : 880) * dt;
    this.velocity = Math.max(-340, Math.min(405, this.velocity));
    this.y += this.velocity * dt;
    if (this.y < 20) { this.y = 20; this.velocity = Math.max(40, this.velocity); }
    const size = isGabi ? { rx: 23, ry: 25 } : { rx: 19, ry: 17 };
    if (this.y + size.ry >= WORLD.floor - 3) {
      this.y = WORLD.floor - size.ry - 3;
      this.hit('floor');
    }
    if (this.status !== 'playing') return;

    const speed = progressSpeed(this.mode, this.difficulty, this.score, this.distance);
    this.distance += speed * dt;
    this.spawnClock -= speed * dt;
    if (this.spawnClock <= 0) {
      this.spawn();
      this.spawnClock += (isGabi ? 291 : 270) / Math.sqrt(diff);
    }

    for (const pipe of this.pipes) {
      pipe.x -= speed * dt;
      const overlapsX = WORLD.playerX + size.rx > pipe.x + 5 && WORLD.playerX - size.rx < pipe.x + pipe.width - 5;
      const upper = pipe.center - pipe.gap / 2;
      const lower = pipe.center + pipe.gap / 2;
      if (overlapsX && (this.y - size.ry < upper + 4 || this.y + size.ry > lower - 4)) {
        this.hit('obstacle');
      }
      if (!pipe.passed && pipe.x + pipe.width < WORLD.playerX - size.rx) {
        pipe.passed = true;
        this.score += 1;
        this.onEvent('score', { score: this.score });
        if (!this.newBest && this.score > this.recordTarget) {
          this.newBest = true;
          this.newBestFlash = 3.0;
          this.onEvent('new_best', { score: this.score, previousBest: this.recordTarget });
        }
      }
      if (isGabi && !pipe.coinTaken) {
        const cx = pipe.x + pipe.width / 2;
        const cy = pipe.center;
        if (Math.abs(cx - WORLD.playerX) < 23 && Math.abs(cy - this.y) < 27) {
          pipe.coinTaken = true;
          this.coins++;
          this.onEvent('coin', { coins: this.coins });
        }
      }
    }
    this.pipes = this.pipes.filter(pipe => pipe.x + pipe.width > -12);
  }
}
