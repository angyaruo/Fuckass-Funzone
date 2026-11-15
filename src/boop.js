/** Boop-a-Bun: bunnies pop out of garden burrows; boop them before they duck back down.
 * Golden bunnies are a bonus. Gabu's little robot decoys cost points. Pure rules: no DOM or Spindle APIs.
 */
export const BOOP_HOLES = 9;
export const BOOP_DURATION = 45;
export const BOOP_PACES = Object.freeze(['chill', 'normal', 'chaos']);
// Pace changes real pop-up time, spawn rate and how many bunnies can be up at once.
const PACE = Object.freeze({ chill: { up: 1.35, spawn: 1.3, crowd: 2 }, normal: { up: 1, spawn: 1, crowd: 3 }, chaos: { up: .72, spawn: .7, crowd: 4 } });
const pace = value => BOOP_PACES.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const RISE = .16;

export class BoopGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, pace: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.pace = pace(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.pace) {
    this.pace = pace(chosen); this.status = 'idle'; this.score = 0; this.combo = 0; this.bestCombo = 0; this.boops = 0;
    this.timeLeft = BOOP_DURATION; this.clock = .6; this.cursor = 4; this.effects = [];
    this.holes = Array.from({ length: BOOP_HOLES }, () => null); this.onEvent('reset');
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  /** Bunnies stay up a little less and arrive a little faster as the round goes on. */
  progress() { return 1 - this.timeLeft / BOOP_DURATION; }
  spawn() {
    const open = this.holes.flatMap((h, i) => h ? [] : [i]);
    if (!open.length || this.holes.filter(Boolean).length >= PACE[this.pace].crowd) return;
    const index = open[Math.floor(unit(this.random) * open.length)], roll = unit(this.random);
    const kind = roll < .08 ? 'gold' : roll < .08 + .1 + this.progress() * .08 ? 'bot' : 'bun';
    const life = (1.25 - this.progress() * .45) * PACE[this.pace].up * (kind === 'gold' ? .75 : 1);
    this.holes[index] = { kind, age: 0, life, booped: false, after: 0 };
  }
  moveCursor(dx, dy) {
    const col = Math.max(0, Math.min(2, this.cursor % 3 + dx)), row = Math.max(0, Math.min(2, Math.floor(this.cursor / 3) + dy));
    this.cursor = row * 3 + col;
  }
  /** How far out of its burrow a critter is, 0..1, for drawing and fair hit tests. */
  height(index) {
    const h = this.holes[index]; if (!h) return 0;
    if (h.booped) return Math.max(0, 1 - h.after / .22);
    return Math.max(0, Math.min(1, h.age / RISE, (h.life - h.age) / RISE));
  }
  boop(index = this.cursor) {
    if (this.status === 'idle') { this.start(); return false; }
    if (this.status !== 'playing' || !Number.isInteger(index) || index < 0 || index >= BOOP_HOLES) return false;
    this.cursor = index;
    const h = this.holes[index];
    if (!h || h.booped || this.height(index) < .35) {
      this.combo = 0; this.effects.push({ index, kind: 'whiff', age: 0 }); this.onEvent('whiff', { index }); return false;
    }
    h.booped = true; h.after = 0;
    if (h.kind === 'bot') {
      this.combo = 0; this.score = Math.max(0, this.score - 20); this.effects.push({ index, kind: 'bot', age: 0, points: -20 });
      this.onEvent('score', { score: this.score, earned: -20 }); this.onEvent('bot', { index }); return true;
    }
    this.combo++; this.boops++; this.bestCombo = Math.max(this.bestCombo, this.combo);
    const earned = (h.kind === 'gold' ? 50 : 10) + Math.min(20, Math.floor(this.combo / 5) * 5);
    this.score = Math.min(999999999, this.score + earned); this.effects.push({ index, kind: h.kind, age: 0, points: earned });
    this.onEvent('score', { score: this.score, earned });
    this.onEvent(h.kind === 'gold' ? 'gold' : this.combo % 10 === 0 ? 'combo' : 'boop', { combo: this.combo, index });
    return true;
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    for (const e of this.effects) e.age += dt;
    this.effects = this.effects.filter(e => e.age < .7);
    if (this.status !== 'playing') return;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    for (let i = 0; i < BOOP_HOLES; i++) {
      const h = this.holes[i]; if (!h) continue;
      if (h.booped) { h.after += dt; if (h.after >= .22) this.holes[i] = null; continue; }
      h.age += dt;
      if (h.age >= h.life) {
        this.holes[i] = null;
        if (h.kind !== 'bot') { this.combo = 0; this.onEvent('escape', { index: i, kind: h.kind }); }
      }
    }
    this.clock -= dt;
    if (this.clock <= 0) { this.spawn(); this.clock = (.75 - this.progress() * .3) * PACE[this.pace].spawn * (.7 + unit(this.random) * .6); }
    if (this.timeLeft <= 0) {
      this.status = 'dead'; this.holes = this.holes.map(() => null);
      this.onEvent('death', { score: this.score, boops: this.boops, reason: 'time' });
    }
  }
  snapshot() {
    return { version: 1, score: this.score, combo: this.combo, bestCombo: this.bestCombo, boops: this.boops, timeLeft: Math.round(this.timeLeft * 1000) / 1000,
      cursor: this.cursor, pace: this.pace, status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !whole(data.score, 999999999) || !whole(data.combo, 100000) || !whole(data.bestCombo, 100000) || !whole(data.boops, 1000000) ||
      !Number.isFinite(data.timeLeft) || data.timeLeft < 0 || data.timeLeft > BOOP_DURATION || !whole(data.cursor, BOOP_HOLES - 1) ||
      !BOOP_PACES.includes(data.pace) || !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    if ((data.status === 'dead') !== (data.timeLeft === 0)) return false;
    Object.assign(this, { score: data.score, combo: data.combo, bestCombo: data.bestCombo, boops: data.boops, timeLeft: data.timeLeft, cursor: data.cursor, pace: data.pace });
    // Critters in their burrows are not saved; a resumed round starts with an empty garden.
    this.holes = this.holes.map(() => null); this.effects = []; this.clock = .5;
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
