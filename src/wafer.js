/** Wobbly Wafers: take turns with Gabu pulling wafer cookies from a tower and stacking them on top.
 * A steady-hand meter decides how cleanly each wafer comes out. Whoever topples the tower loses the round.
 * Pure rules: no DOM or Spindle APIs. Layers run bottom to top; each holds a left, middle and right wafer.
 */
export const WAFER_LEVELS = Object.freeze(['chill', 'normal', 'sharp']);
export const WAFER_START_LAYERS = 12;
// How steady Gabu's own paws are at each level: the worst pull quality it can roll.
const GABU_HAND = Object.freeze({ chill: .3, normal: .55, sharp: .8 });
const LEVEL_BONUS = Object.freeze({ chill: 60, normal: 120, sharp: 220 });
const TOPPLE = 100;
const level = value => WAFER_LEVELS.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const full = layer => layer.every(Boolean);
/** A layer that holds anything up needs its middle wafer or both edges; a lone edge tips over. */
export const supports = layer => layer[1] || layer[0] && layer[2];

/** Layers you are allowed to pull from: never the unfinished top or the full layer just under it. */
export function pullableLayers(layers) {
  const blocked = full(layers[layers.length - 1]) ? 1 : 2;
  return Math.max(0, layers.length - blocked);
}
/** Wobble one pull adds before hand steadiness, or Infinity when the layer could no longer hold the tower. */
export function pullRisk(layers, row, slot) {
  if (!Number.isInteger(row) || row < 0 || row >= pullableLayers(layers) || !layers[row]?.[slot]) return Infinity;
  const after = [...layers[row]]; after[slot] = false;
  if (!after.some(Boolean) || !supports(after)) return Infinity;
  const base = slot === 1 ? 5 : full(layers[row]) ? 6 : 4;
  return base + layers.length * .15 + (row < 3 ? 2 : 0);
}
export class WobblyWafersGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, level: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.level = level(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.level) {
    this.level = level(chosen); this.status = 'idle'; this.score = 0; this.wins = 0; this.round = 1;
    this.onEvent('reset'); this.newTower(1);
  }
  newTower(starter) {
    this.layers = Array.from({ length: WAFER_START_LAYERS }, () => [true, true, true]);
    this.wobble = 0; this.starter = starter; this.turn = starter; this.phase = 'turn'; this.result = null;
    this.selected = null; this.meter = 0; this.meterClock = 0; this.cursor = { row: 4, slot: 1 }; this.crumbs = []; this.sway = 0; this.lastPull = null;
    this.thinking = starter === 2 ? .8 : 0;
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  nextRound() {
    if (this.status !== 'playing' || this.phase !== 'over') return false;
    this.round++; this.newTower(this.round % 2 ? 1 : 2); this.onEvent('round', { round: this.round, starter: this.starter }); return true;
  }
  /** The meter sweeps faster as the tower grows. Quality is 1 at the center and 0 at either end. */
  meterSpeed() { return 1 + this.layers.length * .035; }
  quality() { return 1 - Math.abs(this.meter - .5) * 2; }
  moveCursor(dx, dy) {
    const top = Math.max(0, pullableLayers(this.layers) - 1);
    this.cursor = { row: Math.max(0, Math.min(top, this.cursor.row + dy)), slot: Math.max(0, Math.min(2, this.cursor.slot + dx)) };
  }
  /** First tap picks a wafer and starts the meter. Another pullable wafer switches; any other tap pulls. */
  choose(row = this.cursor.row, slot = this.cursor.slot) {
    if (this.status !== 'playing') return false;
    if (this.phase === 'over') return this.nextRound();
    if (this.turn !== 1) return false;
    const valid = Number.isInteger(row) && row >= 0 && row < pullableLayers(this.layers) && !!this.layers[row]?.[slot];
    if (this.selected && !(valid && (this.selected.row !== row || this.selected.slot !== slot))) return this.pull();
    if (!valid) return false;
    this.selected = { row, slot }; this.cursor = { row, slot }; this.meterClock = unit(this.random) * 2; this.onEvent('select', { row, slot }); return true;
  }
  cancel() { this.selected = null; }
  pull() {
    if (!this.selected || this.turn !== 1 || this.phase !== 'turn' || this.status !== 'playing') return false;
    const { row, slot } = this.selected; this.selected = null;
    this.take(1, row, slot, this.quality()); return true;
  }
  take(who, row, slot, quality) {
    const risk = pullRisk(this.layers, row, slot), mine = who === 1;
    this.lastPull = { who, row, slot, age: 0 };
    // The tower is left as it stood when it fell, so a finished game still saves a valid tower.
    if (risk === Infinity) { this.topple(who, 'support'); return; }
    this.layers[row][slot] = false;
    this.wobble += risk + (1 - quality) * 30;
    const perfect = quality >= .92;
    this.onEvent(mine ? 'pull' : 'gabu_pull', { row, slot, quality, wobble: this.wobble });
    if (this.wobble >= TOPPLE) { this.topple(who, 'wobble'); return; }
    const top = this.layers[this.layers.length - 1];
    if (full(top)) this.layers.push([true, false, false]); else top[top.indexOf(false)] = true;
    // A fresh wafer on top lets the tower settle, so clean pulls roughly break even and sloppy ones add up.
    this.wobble = Math.max(0, this.wobble - 9);
    if (mine) {
      const earned = 10 + (perfect ? 10 : 0);
      this.score = Math.min(999999999, this.score + earned); this.onEvent('score', { score: this.score, earned });
      if (perfect) this.onEvent('perfect', { quality });
      if (this.wobble >= 70) this.onEvent('risky', { wobble: this.wobble });
    } else if (this.wobble >= 70) this.onEvent('gabu_risky', { wobble: this.wobble });
    this.turn = 3 - who;
    if (this.turn === 2) this.thinking = .7 + unit(this.random) * .5;
  }
  topple(who, reason) {
    this.phase = 'over'; this.selected = null;
    this.layers.forEach((layer, row) => layer.forEach((on, slot) => { if (on && row > 1) this.crumbs.push({ row, slot, x: 0, y: 0, vx: (slot - 1) * 40 + (unit(this.random) - .5) * 120, vy: -40 - unit(this.random) * 60, spin: 0, age: 0 }); }));
    if (who === 2) {
      this.result = 'win'; this.wins++;
      const earned = 100 + LEVEL_BONUS[this.level]; this.score = Math.min(999999999, this.score + earned);
      this.onEvent('score', { score: this.score, earned }); this.onEvent('win', { score: this.score, wins: this.wins, reason });
    } else { this.result = 'loss'; this.status = 'dead'; this.onEvent('death', { score: this.score, wins: this.wins, reason }); }
  }
  /** Gabu takes the safest wafer it sees; lower levels sometimes misjudge, and every level has shakier paws. */
  gabuChoice() {
    const options = [];
    for (let row = 0; row < pullableLayers(this.layers); row++) for (let slot = 0; slot < 3; slot++) {
      const risk = pullRisk(this.layers, row, slot); if (this.layers[row][slot]) options.push({ row, slot, risk });
    }
    const safe = options.filter(o => o.risk !== Infinity), pool = safe.length ? safe : options;
    if (this.level === 'chill' && unit(this.random) < .12) return options[Math.floor(unit(this.random) * options.length)];
    const noise = this.level === 'sharp' ? 1 : this.level === 'normal' ? 4 : 8;
    return pool.map(o => ({ ...o, score: o.risk + unit(this.random) * noise })).sort((a, b) => a.score - b.score)[0];
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    for (const c of this.crumbs) { c.age += dt; c.vy += 700 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.spin += dt * (c.vx >= 0 ? 3 : -3); }
    this.crumbs = this.crumbs.filter(c => c.age < 2.2);
    if (this.lastPull) this.lastPull.age += dt;
    if (this.status !== 'playing') return;
    this.sway += dt;
    if (this.phase !== 'turn') return;
    if (this.turn === 1 && this.selected) {
      this.meterClock += dt * this.meterSpeed(); this.meter = (1 - Math.cos(this.meterClock * Math.PI)) / 2; return;
    }
    if (this.turn !== 2) return;
    this.thinking -= dt; if (this.thinking > 0) return;
    const pick = this.gabuChoice(); if (!pick) return;
    const hand = GABU_HAND[this.level]; this.take(2, pick.row, pick.slot, hand + unit(this.random) * (1 - hand));
  }
  snapshot() {
    return { version: 1, layers: this.layers.map(l => [...l]), wobble: Math.round(this.wobble * 100) / 100, turn: this.turn, starter: this.starter, round: this.round,
      score: this.score, wins: this.wins, level: this.level, phase: this.phase, result: this.result, cursor: { ...this.cursor },
      status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.layers) || data.layers.length < 2 || data.layers.length > 80 ||
      data.layers.some(l => !Array.isArray(l) || l.length !== 3 || l.some(v => typeof v !== 'boolean') || !l.some(Boolean)) ||
      !Number.isFinite(data.wobble) || data.wobble < 0 || data.wobble > TOPPLE * 2 || ![1, 2].includes(data.turn) || ![1, 2].includes(data.starter) ||
      !whole(data.round, 100000) || data.round < 1 || !whole(data.score, 999999999) || !whole(data.wins, 100000) || !WAFER_LEVELS.includes(data.level) ||
      !['turn', 'over'].includes(data.phase) || !['idle', 'paused', 'playing', 'dead'].includes(data.status) ||
      !data.cursor || !whole(data.cursor.row, 79) || !whole(data.cursor.slot, 2)) return false;
    const over = data.phase === 'over';
    if (!over && (data.wobble >= TOPPLE || data.layers.slice(0, -1).some(l => !supports(l)))) return false;
    if ((data.status === 'dead') !== (over && data.result === 'loss') || over && !['win', 'loss'].includes(data.result)) return false;
    this.layers = data.layers.map(l => [...l]); this.wobble = data.wobble; this.turn = data.turn; this.starter = data.starter; this.round = data.round;
    this.score = data.score; this.wins = data.wins; this.level = data.level; this.phase = data.phase; this.result = over ? data.result : null;
    this.cursor = { row: Math.min(data.cursor.row, Math.max(0, pullableLayers(this.layers) - 1)), slot: data.cursor.slot };
    this.selected = null; this.meter = 0; this.meterClock = 0; this.crumbs = []; this.sway = 0; this.lastPull = null; this.thinking = this.turn === 2 ? .7 : 0;
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
