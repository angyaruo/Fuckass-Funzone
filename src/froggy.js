/** Original road-and-river hopping game. Pure rules; no DOM or host APIs. */
export const FROGGY_COLS = 9;
export const FROGGY_ROWS = 11;
export const FROGGY_HOME_COLUMNS = Object.freeze([0, 2, 4, 6, 8]);

const boundedRandom = random => Math.max(0, Math.min(.999999, Number(random()) || 0));
const finite = (n, low, high) => Number.isFinite(n) && n >= low && n <= high;
const integer = (n, low, high) => Number.isSafeInteger(n) && n >= low && n <= high;
const wrap = (n, period) => ((n % period) + period) % period;
const LANE_CONFIG = Object.freeze([
  [1, 'river', .65, 2.5, 3.6], [2, 'river', -.85, 2.8, 4],
  [3, 'river', .95, 2.35, 3.55], [4, 'river', -.65, 2.8, 3.9],
  [6, 'road', 1.2, 1.25, 3.7], [7, 'road', -1.55, 1.15, 3.8],
  [8, 'road', .95, 1.8, 4.5], [9, 'road', -1.15, 1.25, 3.6],
]);

export class FroggyGame {
  constructor({ random = Math.random, onEvent = () => {}, saved } = {}) {
    this.random = random; this.onEvent = onEvent;
    this.reset(); if (saved) this.restore(saved);
  }
  makeLanes() {
    const pace = Math.min(1.8, 1 + (this.level - 1) * .09);
    this.lanes = LANE_CONFIG.map(([row, type, speed, size, period]) => ({
      row, type, speed: speed * pace, size, period, offset: boundedRandom(this.random) * period,
    }));
  }
  reset() {
    this.status = 'idle'; this.score = 0; this.lives = 3; this.level = 1;
    this.homes = Array(5).fill(false); this.elapsed = 0; this.message = '';
    this.makeLanes(); this.resetFrog(); this.onEvent('reset');
  }
  resetFrog() { this.frog = { x: 4, y: 10 }; this.progressRow = 10; this.hopCooldown = 0; this.hopFlash = 0; }
  start() {
    if (this.status === 'dead') this.reset();
    if (this.status === 'playing') return;
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  /** Centers for an endlessly repeating row; include the two off-board objects. */
  objects(lane) {
    const xs = [];
    for (let x = lane.offset - lane.period * 4; x < FROGGY_COLS + lane.period; x += lane.period) {
      if (x + lane.size / 2 >= -.5 && x - lane.size / 2 <= FROGGY_COLS - .5) xs.push(x);
    }
    return xs;
  }
  supported(lane) { return this.objects(lane).some(x => Math.abs(this.frog.x - x) <= lane.size / 2 - .22); }
  addScore(points) { this.score = Math.min(100000000, this.score + points); this.onEvent('score', { score: this.score }); }
  loseLife(reason) {
    if (this.status !== 'playing') return;
    this.lives--; this.message = reason;
    this.resetFrog();
    // A brief safe-bank interval prevents held keys from spending several lives at once.
    this.hopCooldown = .35;
    if (this.lives <= 0) this.status = 'dead';
    this.onEvent('hit', { reason, lives: this.lives });
    if (this.status === 'dead') this.onEvent('death', { score: this.score, reason });
  }
  checkPosition() {
    if (this.status !== 'playing') return;
    if (this.frog.x < -.25 || this.frog.x > FROGGY_COLS - .75) { this.loseLife('SWEPT AWAY'); return; }
    if (this.frog.y === 0) {
      const home = FROGGY_HOME_COLUMNS.findIndex(x => Math.abs(this.frog.x - x) <= .48);
      if (home < 0 || this.homes[home]) { this.loseLife(home < 0 ? 'MISSED THE LILY' : 'LILY ALREADY FULL'); return; }
      this.homes[home] = true; this.message = 'HOME SAFE';
      const completedLevel = this.level;
      let points = 150, nextLevel = false;
      if (this.homes.every(Boolean)) {
        points += 300; this.level++; this.homes.fill(false); this.makeLanes(); this.message = 'NEXT POND'; nextLevel = true;
      }
      this.resetFrog(); this.hopCooldown = .2;
      // Event listeners may save immediately: publish only after the frog is back on a valid row.
      this.addScore(points); this.onEvent('home', { home, level: completedLevel });
      if (nextLevel) this.onEvent('level', { level: this.level });
      return;
    }
    const lane = this.lanes.find(item => item.row === this.frog.y);
    if (!lane) return;
    if (lane.type === 'river' && !this.supported(lane)) this.loseLife('SPLASH');
    else if (lane.type === 'road' && this.objects(lane).some(x => Math.abs(this.frog.x - x) < lane.size / 2 + .24)) this.loseLife('TRAFFIC TROUBLE');
  }
  hop(direction) {
    const moves = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    if (!Object.hasOwn(moves, direction) || this.status !== 'playing' || this.hopCooldown > 0) return false;
    const [dx, dy] = moves[direction];
    const nextX = this.frog.x + dx, nextY = this.frog.y + dy;
    if (nextX < -.25 || nextX > FROGGY_COLS - .75 || nextY < 0 || nextY >= FROGGY_ROWS) return false;
    this.frog.x = nextX; this.frog.y = nextY; this.hopCooldown = .11; this.hopFlash = .12;
    this.message = '';
    const previousLives = this.lives;
    this.checkPosition();
    if (this.lives === previousLives && this.frog.y < this.progressRow) {
      this.progressRow = this.frog.y; this.addScore(10);
    }
    this.onEvent('hop', { direction }); return true;
  }
  update(delta) {
    if (this.status !== 'playing' || !Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12); this.elapsed += dt;
    this.hopCooldown = Math.max(0, this.hopCooldown - dt); this.hopFlash = Math.max(0, this.hopFlash - dt);
    const ridden = this.lanes.find(lane => lane.type === 'river' && lane.row === this.frog.y && this.supported(lane));
    for (const lane of this.lanes) lane.offset = wrap(lane.offset + lane.speed * dt, lane.period);
    if (ridden) this.frog.x += ridden.speed * dt;
    this.checkPosition();
  }
  snapshot() {
    return { version: 1, status: this.status === 'dead' ? 'dead' : 'paused', score: this.score,
      lives: this.lives, level: this.level, homes: [...this.homes], frog: { ...this.frog },
      progressRow: this.progressRow, elapsed: this.elapsed, lanes: this.lanes.map(lane => ({ ...lane })) };
  }
  restore(data) {
    if (!data || data.version !== 1 || !['paused', 'dead'].includes(data.status) ||
      !integer(data.score, 0, 100000000) || !integer(data.level, 1, 100000) || !integer(data.lives, 0, 3) ||
      (data.status === 'dead') !== (data.lives === 0) || !Array.isArray(data.homes) || data.homes.length !== 5 ||
      Array.from(data.homes).some(value => typeof value !== 'boolean') || data.homes.every(Boolean) ||
      !data.frog || !finite(data.frog.x, -.25, FROGGY_COLS - .75) || !integer(data.frog.y, 1, 10) ||
      !integer(data.progressRow, 1, 10) || data.progressRow > data.frog.y || !finite(data.elapsed, 0, 1e10) ||
      !Array.isArray(data.lanes) || data.lanes.length !== LANE_CONFIG.length) return false;
    const pace = Math.min(1.8, 1 + (data.level - 1) * .09);
    for (let i = 0; i < LANE_CONFIG.length; i++) {
      const lane = data.lanes[i], [row, type, speed, size, period] = LANE_CONFIG[i];
      if (!lane || lane.row !== row || lane.type !== type || lane.size !== size || lane.period !== period ||
        !finite(lane.offset, 0, period) || lane.offset === period || lane.speed !== speed * pace) return false;
    }
    this.status = data.status; this.score = data.score; this.level = data.level; this.lives = data.lives;
    this.homes = [...data.homes]; this.frog = { ...data.frog }; this.progressRow = data.progressRow;
    this.elapsed = data.elapsed; this.lanes = data.lanes.map(lane => ({ ...lane }));
    this.hopCooldown = .15; this.hopFlash = 0; this.message = ''; return true;
  }
}
