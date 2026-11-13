/** Three lightweight, saveable mini-games. Pure rules: no DOM or Spindle APIs. */
const coinFlip = rng => Math.max(0, Math.min(.999999999, Number(rng()) || 0));
const whole = (value, max, fallback = 0) => Number.isSafeInteger(value) && value >= 0 && value <= max ? value : fallback;
export const SIMON_COLORS = Object.freeze(['rose', 'mint', 'gold', 'blue']);
export class SimonGame {
  constructor({ random = Math.random, onEvent = () => {}, saved } = {}) {
    this.random = random; this.onEvent = onEvent; this.reset(); if (saved) this.restore(saved);
  }
  reset() { this.status = 'idle'; this.phase = 'show'; this.sequence = []; this.level = 0; this.score = 0; this.cursor = 0; this.timer = 0; this.demoIndex = -1; this.lit = -1; this.onEvent('reset'); }
  nextRound() {
    this.sequence.push(Math.floor(coinFlip(this.random) * 4));
    this.level = this.sequence.length; this.phase = 'show'; this.timer = .65; this.demoIndex = -1; this.lit = -1; this.cursor = 0;
    this.onEvent('round', { level: this.level });
  }
  start() {
    if (this.status === 'dead') this.reset();
    if (this.status === 'playing') return;
    if (this.status === 'paused') { this.status = 'playing'; this.onEvent('resume'); return; }
    this.status = 'playing'; if (!this.sequence.length) this.nextRound(); this.onEvent('start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  update(delta) {
    if (this.status !== 'playing' || !Number.isFinite(delta) || delta <= 0) return;
    if (this.phase === 'input' || this.phase === 'dead') { this.lit = -1; return; }
    this.timer -= Math.min(delta, .12);
    if (this.phase === 'next') { if (this.timer <= 0) this.nextRound(); return; }
    if (this.timer > 0) return;
    this.demoIndex++;
    if (this.demoIndex >= this.sequence.length * 2) { this.phase = 'input'; this.lit = -1; this.cursor = 0; this.onEvent('your_turn', { level: this.level }); return; }
    this.lit = this.demoIndex % 2 === 0 ? this.sequence[this.demoIndex / 2] : -1;
    this.timer = this.lit >= 0 ? Math.max(.26, .53 - this.level * .012) : .18;
    if (this.lit >= 0) this.onEvent('note', { color: this.lit });
  }
  press(index) {
    if (!Number.isInteger(index) || index < 0 || index > 3) return false;
    if (this.status === 'idle') { this.start(); return false; }
    if (this.status !== 'playing' || this.phase !== 'input') return false;
    this.onEvent('tap', { color: index });
    if (this.sequence[this.cursor] !== index) {
      this.status = 'dead'; this.phase = 'dead'; this.lit = index;
      this.onEvent('death', { score: this.score, level: this.level }); return false;
    }
    this.cursor++;
    if (this.cursor === this.sequence.length) {
      this.score = this.level; this.onEvent('score', { score: this.score });
      this.phase = 'next'; this.timer = .85;
    }
    return true;
  }
  snapshot() { return { status: this.status === 'dead' ? 'dead' : 'paused', sequence: this.sequence.slice(), score: this.score, level: this.level }; }
  restore(data) {
    if (!data || !Array.isArray(data.sequence) || data.sequence.length > 100 || data.sequence.some(n => !Number.isInteger(n) || n < 0 || n > 3)) return false;
    if (whole(data.score, 100, -1) < 0 || data.score > data.sequence.length) return false;
    this.sequence = data.sequence.slice(); this.score = data.score; this.level = this.sequence.length;
    this.status = data.status === 'dead' ? 'dead' : 'paused'; this.phase = 'show'; this.demoIndex = -1; this.timer = .5; this.lit = -1; this.cursor = 0;
    return true;
  }
}
export const DUCK_DURATION = 45;
export class DuckGame {
  constructor({ random = Math.random, onEvent = () => {}, saved } = {}) { this.random = random; this.onEvent = onEvent; this.reset(); if (saved) this.restore(saved); }
  reset() { this.status = 'idle'; this.score = 0; this.misses = 0; this.shots = 0; this.timeLeft = DUCK_DURATION; this.ducks = []; this.nextId = 0; this.spawnClock = .3; this.flash = null; this.onEvent('reset'); }
  start() { if (this.status === 'dead') this.reset(); if (this.status === 'playing') return; this.status = 'playing'; this.onEvent('start'); }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  spawn() {
    const fromLeft = coinFlip(this.random) < .5;
    this.ducks.push({ id: ++this.nextId, x: fromLeft ? -28 : 388, y: 110 + coinFlip(this.random) * 200,
      vx: (fromLeft ? 1 : -1) * (75 + Math.min(100, this.score * 3) + coinFlip(this.random) * 40),
      phase: coinFlip(this.random) * 6.28, flap: 0 });
    this.onEvent('spawn');
  }
  update(delta) {
    if (this.status !== 'playing' || !Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12); this.timeLeft = Math.max(0, this.timeLeft - dt); this.spawnClock -= dt;
    if (this.spawnClock <= 0 && this.ducks.length < 3) { this.spawn(); this.spawnClock = Math.max(.65, 1.45 - this.score * .023); }
    for (const duck of this.ducks) { duck.x += duck.vx * dt; duck.flap += dt * 12; duck.phase += dt * 3; }
    const escaped = this.ducks.filter(d => d.x < -45 && d.vx < 0 || d.x > 405 && d.vx > 0).length;
    this.ducks = this.ducks.filter(d => !(d.x < -45 && d.vx < 0 || d.x > 405 && d.vx > 0));
    if (escaped) this.onEvent('escape', { count: escaped });
    if (this.timeLeft <= 0) { this.status = 'dead'; this.ducks = []; this.onEvent('death', { score: this.score }); }
  }
  shoot(x, y) {
    if (this.status === 'idle') { this.start(); return false; }
    if (this.status !== 'playing') return false;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    this.shots++;
    let hit = -1;
    for (let i = this.ducks.length - 1; i >= 0; i--) {
      const d = this.ducks[i], dy = y - (d.y + Math.sin(d.phase) * 9);
      if (Math.abs(x - d.x) < 34 && Math.abs(dy) < 26) { hit = i; break; }
    }
    if (hit >= 0) { const d = this.ducks.splice(hit, 1)[0]; this.score++; this.flash = { x: d.x, y: d.y, hit: true }; this.onEvent('score', { score: this.score }); return true; }
    this.misses++; this.flash = { x, y, hit: false }; this.onEvent('miss', { misses: this.misses });
    if (this.misses >= 8) { this.status = 'dead'; this.ducks = []; this.onEvent('death', { score: this.score }); }
    return false;
  }
  snapshot() { return { score: this.score, misses: this.misses, shots: this.shots, timeLeft: this.timeLeft, status: this.status === 'dead' ? 'dead' : 'paused' }; }
  restore(data) {
    if (!data || whole(data.score, 100000, -1) < 0 || whole(data.misses, 8, -1) < 0 || !Number.isFinite(data.timeLeft) || data.timeLeft < 0 || data.timeLeft > DUCK_DURATION) return false;
    this.score = data.score; this.misses = data.misses; this.shots = whole(data.shots, 1000000);
    this.timeLeft = data.timeLeft; this.status = data.status === 'dead' ? 'dead' : 'paused'; this.ducks = []; this.spawnClock = .15; return true;
  }
}
export const SLOT_SYMBOLS = Object.freeze(['fish', 'cherry', 'heart', 'gem', 'star', 'seven']);
const SLOT_WEIGHTS = [25, 23, 19, 15, 12, 6];
export function spinSymbols(random = Math.random) {
  return Array.from({ length: 3 }, () => {
    const roll = coinFlip(random) * 100; let sum = 0;
    for (let i = 0; i < SLOT_WEIGHTS.length; i++) { sum += SLOT_WEIGHTS[i]; if (roll < sum) return SLOT_SYMBOLS[i]; }
    return 'fish';
  });
}
export function slotMultiplier(reels) {
  if (!Array.isArray(reels) || reels.length !== 3 || reels.some(r => !SLOT_SYMBOLS.includes(r))) return 0;
  if (reels.every(r => r === reels[0])) return ({ fish: 3, cherry: 4, heart: 6, gem: 9, star: 14, seven: 40 })[reels[0]];
  if (new Set(reels).size === 2) return 1;
  return 0;
}
export class SlotGame {
  constructor({ random = Math.random, onEvent = () => {}, saved } = {}) { this.random = random; this.onEvent = onEvent; this.reset(); if (saved) this.restore(saved); }
  reset() { this.status = 'idle'; this.reels = ['fish', 'cherry', 'star']; this.pending = null; this.time = 0; this.spins = 0; this.score = 0; this.lastPayout = 0; this.lastMultiplier = 0; this.onEvent('reset'); }
  start() { if (this.status === 'dead') this.reset(); if (this.status === 'paused') { this.status = 'playing'; this.onEvent('resume'); return; } if (this.status !== 'playing') { this.status = 'playing'; this.onEvent('start'); } }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  /** Returns false if already spinning. Stake is removed by the caller once this returns true. */
  spin(stake = 0) {
    if (this.pending || ![0, 1, 3, 5].includes(stake)) return false;
    this.start(); this.pending = { reels: spinSymbols(this.random), stake }; this.time = .95;
    this.spins++; this.onEvent('spin', { stake }); return true;
  }
  update(delta) {
    if (this.status !== 'playing' || !this.pending || !Number.isFinite(delta) || delta <= 0) return;
    this.time = Math.max(0, this.time - Math.min(.12, delta));
    if (this.time > 0) return;
    const { reels, stake } = this.pending; this.pending = null; this.reels = reels;
    this.lastMultiplier = slotMultiplier(reels); this.lastPayout = this.lastMultiplier * stake;
    this.score = Math.max(this.score, this.lastPayout);
    this.onEvent('land', { reels: [...reels], stake, payout: this.lastPayout, multiplier: this.lastMultiplier });
  }
  /** Refund the still-unsettled wager when a spin is manually cancelled. */
  cancel() { const refund = this.pending?.stake || 0; this.reset(); return refund; }
  snapshot() { return { reels: this.reels.slice(), spins: this.spins, score: this.score, lastPayout: this.lastPayout, lastMultiplier: this.lastMultiplier, pending: this.pending ? { reels: [...this.pending.reels], stake: this.pending.stake, remaining: this.time } : null }; }
  restore(data) {
    if (!data || !Array.isArray(data.reels) || data.reels.length !== 3 || data.reels.some(r => !SLOT_SYMBOLS.includes(r))) return false;
    this.reels = data.reels.slice(); this.spins = whole(data.spins, 10000000);
    this.score = whole(data.score, 100000000); this.lastPayout = whole(data.lastPayout, 100000000);
    this.lastMultiplier = whole(data.lastMultiplier, 40); this.pending = null; this.status = 'idle';
    // A paid spin is a prepaid obligation; NEVER discard it on reload.
    // Rehydrate its already-drawn result and finish it after the player resumes.
    if (data.pending && Array.isArray(data.pending.reels) && data.pending.reels.length === 3 &&
        data.pending.reels.every(r => SLOT_SYMBOLS.includes(r)) && [0,1,3,5].includes(data.pending.stake) &&
        Number.isFinite(data.pending.remaining) && data.pending.remaining >= 0 && data.pending.remaining <= .95) {
      this.pending = { reels: data.pending.reels.slice(), stake: data.pending.stake };
      this.time = data.pending.remaining; this.status = 'paused';
    }
    return true;
  }
}
