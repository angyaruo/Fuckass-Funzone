/** Cake Tower: swing a tier on its ribbon, drop it, and stack the tallest wobbly cake in the bakery.
 * Pure rules: no DOM or Spindle APIs. World y grows upward from the top of the cake stand.
 */
export const CAKE_FLAVORS = Object.freeze(['strawberry', 'vanilla', 'matcha', 'chocolate', 'blueberry', 'lemon', 'ube']);
// One export per line: the bundler lifts each exported name into the shared scope.
export const CAKE_W = 360;
export const CAKE_H = 452;
// The stand sits high enough that Gabu's reaction bubble only ever covers tablecloth.
export const CAKE_GROUND = 340;
// The ribbon hangs from a pivot far above the screen, so the hook swings on a real pendulum arc.
// HOOK_Y is the bottom of that arc; the ends rise about 20px and still clear the scoreboard.
export const ROPE_PIVOT_Y = -260;
export const HOOK_Y = 98;
export const LAYER_W = 104;
export const LAYER_H = 26;
export const PLATE_W = 150;
export const CAKE_PACES = Object.freeze(['chill', 'normal', 'chaos']);
// Sway never grows past SWAY_MAX, so a wobbly cake is harder to aim at but never falls apart on its own.
const GRAVITY = 1500, SWAY_MAX = 34, WOBBLE = 24, HEARTS = 3, ROPE = HOOK_Y - ROPE_PIVOT_Y, SWING_ANGLE = Math.asin(118 / ROPE);
// Pace changes real swing speed, the perfect window and how much a sloppy drop shakes the tower.
const PACE = Object.freeze({ chill: { swing: .8, perfect: 8, shake: .15 }, normal: { swing: 1, perfect: 6, shake: .2 }, chaos: { swing: 1.3, perfect: 4.5, shake: .26 } });
const pace = value => CAKE_PACES.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;

export class CakeTowerGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, pace: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.pace = pace(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.pace) {
    this.pace = pace(chosen); this.status = 'idle'; this.tiers = []; this.score = 0; this.hearts = HEARTS; this.combo = 0; this.bestCombo = 0;
    this.sway = 0; this.swayPhase = 0; this.swing = unit(this.random) * Math.PI * 2; this.camera = 0;
    this.phase = 'swing'; this.drop = null; this.crumbs = []; this.wait = 0; this.wobbleWarned = false; this.endReason = null; this.perfectFlash = 0;
    this.onEvent('reset');
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  get flavor() { return CAKE_FLAVORS[this.tiers.length % CAKE_FLAVORS.length]; }
  topY() { return this.tiers.length * LAYER_H; }
  /** The swing speeds up as the cake climbs, then levels off so it stays catchable. */
  swingSpeed() { return (1.75 + Math.min(1.5, this.tiers.length * .045)) * PACE[this.pace].swing; }
  ropeAngle() { return SWING_ANGLE * Math.sin(this.swing); }
  hookX() { return CAKE_W / 2 + ROPE * Math.sin(this.ropeAngle()); }
  /** How fast the rope is swinging, in radians per second; the renderer bows the ribbon behind this. */
  ropeSpeed() { return SWING_ANGLE * Math.cos(this.swing) * this.swingSpeed(); }
  /** The hook rises a little at either end of its swing, like any pendulum. */
  hookY() { return ROPE_PIVOT_Y + ROPE * Math.cos(this.ropeAngle()); }
  /** Where the top tier is drawn right now, including the tower's sway. */
  topX() {
    if (!this.tiers.length) return CAKE_W / 2;
    return this.tiers[this.tiers.length - 1].x + this.sway * Math.sin(this.swayPhase);
  }
  tierX(index) { return this.tiers[index].x + this.sway * Math.sin(this.swayPhase) * (index + 1) / this.tiers.length; }
  release() {
    if (this.status === 'idle') { this.start(); return false; }
    if (this.status !== 'playing' || this.phase !== 'swing') return false;
    // A little of the swing carries into the fall, so timing matters without turning every drop into a guess.
    const vx = ROPE * Math.cos(this.ropeAngle()) * SWING_ANGLE * Math.cos(this.swing) * this.swingSpeed() * .12;
    this.drop = { x: this.hookX(), y: CAKE_GROUND + this.camera - (this.hookY() + 12 + LAYER_H), vx, vy: 0, flavor: this.flavor };
    this.phase = 'fall'; this.onEvent('drop', { tier: this.tiers.length + 1 }); return true;
  }
  addScore(points) {
    this.score = Math.min(999999999, this.score + points); this.onEvent('score', { score: this.score, earned: points });
  }
  land(x) {
    const below = this.topX(), dx = x - below, offset = Math.abs(dx), first = !this.tiers.length;
    const perfect = offset <= PACE[this.pace].perfect;
    this.tiers.push({ x: perfect ? (first ? CAKE_W / 2 : this.tiers[this.tiers.length - 1].x) : (first ? x : this.tiers[this.tiers.length - 1].x + dx), flavor: this.drop.flavor });
    this.drop = null; this.phase = 'wait'; this.wait = .28;
    if (perfect) {
      this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo); this.sway *= .6; this.perfectFlash = .6;
      this.addScore(10 + 15 * this.combo);
      this.onEvent(this.combo >= 3 ? 'combo' : 'perfect', { combo: this.combo, tiers: this.tiers.length });
    } else {
      this.combo = 0; this.sway = Math.min(SWAY_MAX, this.sway + offset * PACE[this.pace].shake);
      this.addScore(10); this.onEvent('land', { offset, tiers: this.tiers.length });
    }
    if (this.tiers.length % 10 === 0) this.onEvent('milestone', { tiers: this.tiers.length });
    if (this.sway >= WOBBLE && !this.wobbleWarned) { this.wobbleWarned = true; this.onEvent('wobble', { sway: this.sway }); }
    if (this.sway < WOBBLE * .7) this.wobbleWarned = false;
  }
  miss() {
    const d = this.drop; this.drop = null; this.combo = 0; this.hearts--;
    const away = d.x < this.topX() ? -1 : 1;
    this.crumbs.push({ x: d.x, y: d.y, vx: d.vx + away * 60, vy: d.vy, spin: 0, spinRate: away * .9, flavor: d.flavor, age: 0 });
    this.phase = 'wait'; this.wait = .55;
    this.onEvent('miss', { hearts: this.hearts });
    if (this.hearts <= 0) this.finish('miss');
  }
  finish(reason) {
    this.status = 'dead'; this.endReason = reason; this.phase = 'over'; this.drop = null;
    this.onEvent('death', { score: this.score, tiers: this.tiers.length, reason });
  }
  /** A missed tier tips gently and falls off the bottom of the screen, like any tower arcade game. */
  fallCrumbs(dt) {
    for (const c of this.crumbs) { c.age += dt; c.vy -= GRAVITY * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.spin += c.spinRate * dt; }
    this.crumbs = this.crumbs.filter(c => c.age < 3 && c.y > this.camera - CAKE_H);
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    this.fallCrumbs(dt);
    if (this.status !== 'playing') return;
    this.perfectFlash = Math.max(0, this.perfectFlash - dt);
    this.swing += dt * this.swingSpeed(); this.swayPhase += dt * 2.3;
    this.sway = Math.max(0, this.sway - dt * .9);
    const target = Math.max(0, this.topY() - 98); this.camera += (target - this.camera) * Math.min(1, dt * 3);
    if (this.phase === 'wait') { this.wait -= dt; if (this.wait <= 0) this.phase = 'swing'; return; }
    if (this.phase !== 'fall' || !this.drop) return;
    const d = this.drop; d.vy -= GRAVITY * dt; d.y += d.vy * dt; d.x += d.vx * dt;
    const top = this.topY();
    if (d.y <= top) {
      // A tier only stays where its center sits over what is under it: the plate for the first tier, the top tier after that.
      const reach = this.tiers.length ? LAYER_W / 2 : PLATE_W / 2;
      if (Math.abs(d.x - this.topX()) <= reach) this.land(d.x);
      else if (d.y <= top - LAYER_H * 1.5) this.miss();
    }
  }
  snapshot() {
    return { version: 1, tiers: this.tiers.map(t => ({ x: Math.round(t.x * 100) / 100, flavor: t.flavor })), score: this.score, hearts: this.hearts,
      combo: this.combo, bestCombo: this.bestCombo, sway: Math.round(this.sway * 100) / 100, endReason: this.endReason, pace: this.pace,
      status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.tiers) || data.tiers.length > 5000 ||
      data.tiers.some((t, i) => !t || !Number.isFinite(t.x) || t.x < -400 || t.x > 760 || t.flavor !== CAKE_FLAVORS[i % CAKE_FLAVORS.length]) ||
      !whole(data.score, 999999999) || !whole(data.hearts, HEARTS) || !whole(data.combo, 5000) || !whole(data.bestCombo, 5000) ||
      !Number.isFinite(data.sway) || data.sway < 0 || data.sway > 200 || !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    const savedPace = data.pace === undefined ? 'normal' : data.pace;
    if (!CAKE_PACES.includes(savedPace)) return false;
    // Older saves could end by toppling; any ending is now shown as running out of cake.
    const dead = data.status === 'dead', reason = ['topple', 'miss'].includes(data.endReason) ? 'miss' : null;
    if (dead !== !!reason || !dead && data.hearts === 0) return false;
    this.pace = savedPace; this.tiers = data.tiers.map(t => ({ x: t.x, flavor: t.flavor })); this.score = data.score; this.hearts = data.hearts;
    this.combo = data.combo; this.bestCombo = data.bestCombo; this.sway = Math.min(SWAY_MAX, data.sway); this.endReason = reason;
    this.status = data.status === 'playing' ? 'paused' : data.status; this.phase = dead ? 'over' : 'swing'; this.drop = null; this.crumbs = [];
    this.camera = Math.max(0, this.topY() - 98); this.wobbleWarned = this.sway >= WOBBLE; return true;
  }
}
