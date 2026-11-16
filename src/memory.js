/** Gacha Match: open gacha capsules two at a time and find every pair of matching charms.
 * Pure rules: no DOM or Spindle APIs. Capsules run row-major from the top-left.
 */
export const CHARMS = Object.freeze(['star', 'moon', 'rainbow', 'cloud', 'mushroom', 'flower', 'planet', 'ghost', 'cherry', 'sun']);
export const MEMORY_SIZES = Object.freeze({ cozy: [4, 3], classic: [4, 4], busy: [5, 4] });
const SIZE_BONUS = Object.freeze({ cozy: 100, classic: 200, busy: 320 });
// Seconds to memorize the open capsules before they close. Bigger trays get more time but less per capsule, so Busy stays the hardest.
export const MEMORY_PREVIEW = Object.freeze({ cozy: 3, classic: 3.5, busy: 4 });
const PEEK = .9;
const size = value => Object.hasOwn(MEMORY_SIZES, value) ? value : 'classic';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;

export class GachaMatchGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, pace: chosen = 'classic' } = {}) {
    this.random = random; this.onEvent = onEvent; this.size = size(chosen); this.reset(); if (saved) this.restore(saved);
  }
  /** `pace` is the shared preset name the arcade passes; for this game it is the board size. */
  get pace() { return this.size; }
  reset(chosen = this.size) {
    this.size = size(chosen); const [cols, rows] = MEMORY_SIZES[this.size], pairs = cols * rows / 2;
    const kinds = CHARMS.slice(0, pairs).flatMap((_, i) => [i, i]);
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(unit(this.random) * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    this.cards = kinds.map(kind => ({ kind, up: false, matched: false, seen: false, turn: 0 }));
    this.status = 'idle'; this.score = 0; this.moves = 0; this.misses = 0; this.matches = 0; this.streak = 0; this.bestStreak = 0;
    this.elapsed = 0; this.hide = 0; this.preview = 0; this.cursor = 0; this.won = false; this.onEvent('reset');
  }
  get cols() { return MEMORY_SIZES[this.size][0]; }
  get rows() { return MEMORY_SIZES[this.size][1]; }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing';
    if (!resumed) this.preview = MEMORY_PREVIEW[this.size];
    this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  moveCursor(dx, dy) {
    const col = Math.max(0, Math.min(this.cols - 1, this.cursor % this.cols + dx)), row = Math.max(0, Math.min(this.rows - 1, Math.floor(this.cursor / this.cols) + dy));
    this.cursor = row * this.cols + col;
  }
  faceUp() { return this.cards.flatMap((c, i) => c.up && !c.matched ? [i] : []); }
  /** A third tap while a missed pair is still showing turns that pair back down first. */
  flip(index = this.cursor) {
    if (this.status === 'idle') { this.start(); return false; }
    if (this.status !== 'playing' || !Number.isInteger(index) || !this.cards[index]) return false;
    this.cursor = index;
    // A tap during the memorize countdown just ends it early.
    if (this.preview > 0) { this.preview = 0; this.onEvent('preview_end'); return false; }
    if (this.faceUp().length === 2) this.coverMisses();
    const card = this.cards[index]; if (card.up || card.matched) return false;
    const open = this.faceUp();
    card.up = true; card.seen = true; this.onEvent('flip', { index });
    if (!open.length) return true;
    const other = this.cards[open[0]]; this.moves++;
    if (other.kind === card.kind) {
      other.matched = card.matched = true; this.matches++; this.streak++; this.bestStreak = Math.max(this.bestStreak, this.streak);
      const earned = 20 + 10 * Math.min(5, this.streak - 1); this.score = Math.min(999999999, this.score + earned);
      this.onEvent('score', { score: this.score, earned }); this.onEvent(this.streak >= 3 ? 'streak' : 'match', { streak: this.streak, kind: card.kind });
      if (this.cards.every(c => c.matched)) this.finish();
      return true;
    }
    // A miss where either partner had already been seen is a memory lapse, which Gabu notices.
    const partnerSeen = kind => this.cards.some((c, i) => c.kind === kind && i !== index && i !== open[0] && c.seen);
    this.misses++; this.streak = 0; this.hide = PEEK;
    this.onEvent(partnerSeen(card.kind) || partnerSeen(other.kind) ? 'forgot' : 'miss', { misses: this.misses });
    return true;
  }
  coverMisses() { for (const i of this.faceUp()) this.cards[i].up = false; this.hide = 0; }
  finish() {
    const bonus = SIZE_BONUS[this.size] + Math.max(0, 200 - this.misses * 10);
    this.score = Math.min(999999999, this.score + bonus); this.won = true; this.status = 'dead';
    this.onEvent('score', { score: this.score, earned: bonus }); this.onEvent('win', { score: this.score, misses: this.misses });
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    for (const c of this.cards) c.turn = Math.max(0, Math.min(1, c.turn + (c.up || c.matched || this.preview > 0 ? dt : -dt) * 7));
    if (this.status !== 'playing') return;
    // The clock waits while the capsules are open for memorizing.
    if (this.preview > 0) { this.preview = Math.max(0, this.preview - dt); if (this.preview === 0) this.onEvent('preview_end'); return; }
    this.elapsed = Math.min(99999, this.elapsed + dt);
    if (this.hide > 0) { this.hide -= dt; if (this.hide <= 0) this.coverMisses(); }
  }
  snapshot() {
    return { version: 1, size: this.size, kinds: this.cards.map(c => c.kind), matched: this.cards.map(c => c.matched), seen: this.cards.map(c => c.seen),
      score: this.score, moves: this.moves, misses: this.misses, matches: this.matches, streak: this.streak, bestStreak: this.bestStreak,
      elapsed: Math.round(this.elapsed * 10) / 10, preview: Math.round(this.preview * 10) / 10, cursor: this.cursor, status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !Object.hasOwn(MEMORY_SIZES, data.size)) return false;
    const [cols, rows] = MEMORY_SIZES[data.size], count = cols * rows;
    if (!Array.isArray(data.kinds) || data.kinds.length !== count || !Array.isArray(data.matched) || data.matched.length !== count ||
      !Array.isArray(data.seen) || data.seen.length !== count || data.matched.some(v => typeof v !== 'boolean') || data.seen.some(v => typeof v !== 'boolean') ||
      !whole(data.score, 999999999) || !whole(data.moves, 1000000) || !whole(data.misses, 1000000) || !whole(data.streak, 1000) || !whole(data.bestStreak, 1000) ||
      !Number.isFinite(data.elapsed) || data.elapsed < 0 || data.elapsed > 99999 || !whole(data.cursor, count - 1) ||
      !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    // Every charm appears exactly twice, and pairs are matched together.
    for (let k = 0; k < count / 2; k++) {
      const where = data.kinds.flatMap((v, i) => v === k ? [i] : []);
      if (where.length !== 2 || data.matched[where[0]] !== data.matched[where[1]]) return false;
    }
    const matches = data.matched.filter(Boolean).length / 2, done = matches === count / 2;
    if (data.matches !== matches || done !== (data.status === 'dead')) return false;
    Object.assign(this, { size: data.size, score: data.score, moves: data.moves, misses: data.misses, matches, streak: data.streak, bestStreak: data.bestStreak,
      elapsed: data.elapsed, cursor: data.cursor, won: done, hide: 0 });
    this.preview = Number.isFinite(data.preview) && data.preview > 0 && !done ? Math.min(data.preview, MEMORY_PREVIEW[data.size]) : 0;
    this.cards = data.kinds.map((kind, i) => ({ kind, up: false, matched: data.matched[i], seen: data.seen[i], turn: data.matched[i] ? 1 : 0 }));
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
