import test from 'node:test';
import assert from 'node:assert/strict';
import { CakeTowerGame, CAKE_FLAVORS, CAKE_PACES, LAYER_W } from '../src/cake.js';
import { drawCakeTower } from '../src/cake-render.js';

// Drops straight down onto `x` so a test controls exactly where the tier lands.
function dropAt(g, x) {
  g.phase = 'swing'; assert.equal(g.release(), true); g.drop.x = x; g.drop.vx = 0;
  for (let i = 0; i < 200 && g.drop; i++) g.update(1 / 60);
  for (let i = 0; i < 40 && g.phase === 'wait'; i++) g.update(1 / 60);
}

test('Cake Tower perfect drops align, build a streak and steady the tower', () => {
  const events = [], g = new CakeTowerGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  dropAt(g, 182); assert.equal(g.tiers.length, 1); assert.equal(g.tiers[0].x, 180, 'a perfect first tier snaps to the stand');
  dropAt(g, g.topX() + 2); dropAt(g, g.topX() - 3); dropAt(g, g.topX());
  assert.equal(g.combo, 4); assert.ok(g.tiers.every(t => t.x === 180), 'perfect tiers stack exactly');
  // Landing is judged against where the swaying top is at that moment, so place this tier directly.
  g.sway = 10; g.swayPhase = Math.PI / 2; g.drop = { x: g.topX() + 1, y: 0, vx: 0, vy: 0, flavor: g.flavor }; g.land(g.drop.x);
  assert.equal(g.combo, 5); assert.equal(g.sway, 6, 'a perfect drop calms the wobble');
  assert.ok(events.includes('perfect') && events.includes('combo'));
  assert.deepEqual(g.tiers.map(t => t.flavor), CAKE_FLAVORS.slice(0, 5), 'flavors follow the recipe order');
});

test('Cake Tower sloppy drops wobble, misses cost hearts, and the run ends by miss or topple', () => {
  const events = [], g = new CakeTowerGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  dropAt(g, 180); g.swayPhase = 0;
  dropAt(g, g.topX() + 40); assert.equal(g.combo, 0); assert.ok(g.sway > 5); assert.equal(g.tiers.length, 2);
  for (let i = 0; i < 3; i++) dropAt(g, g.topX() + LAYER_W * 2);
  assert.equal(g.hearts, 0); assert.equal(g.status, 'dead'); assert.equal(g.endReason, 'miss');
  assert.equal(events.filter(e => e === 'miss').length, 3); assert.ok(events.includes('death'));
  const t = new CakeTowerGame({ random: () => .5, onEvent: e => events.push(e) }); t.start();
  dropAt(t, 180); t.sway = 39; t.swayPhase = 0; dropAt(t, t.topX() + 50);
  assert.equal(t.status, 'dead'); assert.equal(t.endReason, 'topple'); assert.ok(t.fallen > 0);
});

test('Cake Tower pace changes the real swing speed and perfect window', () => {
  const [chill, normal, chaos] = CAKE_PACES.map(pace => new CakeTowerGame({ pace, random: () => .5 }));
  assert.ok(chill.swingSpeed() < normal.swingSpeed() && normal.swingSpeed() < chaos.swingSpeed());
  for (const g of [chill, chaos]) { g.start(); dropAt(g, 180); g.sway = 0; dropAt(g, g.topX() + 7); }
  assert.equal(chill.combo, 2, 'a 7px drop is perfect on Chill'); assert.equal(chaos.combo, 0, 'but not on Chaos');
  const pausedSwing = normal.swing; normal.start(); normal.pause(); normal.update(1); assert.equal(normal.swing, pausedSwing, 'pause freezes the swing');
});

test('Cake Tower saves restore paused and reject tampered stacks', () => {
  const g = new CakeTowerGame({ pace: 'chaos', random: () => .5 }); g.start(); dropAt(g, 180); dropAt(g, g.topX() + 20);
  const saved = g.snapshot(), back = new CakeTowerGame({ saved });
  assert.equal(back.status, 'paused'); assert.equal(back.pace, 'chaos'); assert.equal(back.tiers.length, 2); assert.equal(back.score, g.score);
  const bad = patch => new CakeTowerGame().restore({ ...saved, ...patch });
  assert.equal(bad({ tiers: [{ x: 180, flavor: 'ube' }] }), false, 'flavor order is fixed');
  assert.equal(bad({ hearts: 0 }), false, 'a living cake has hearts left');
  assert.equal(bad({ status: 'dead' }), false, 'a dead cake needs a reason');
  assert.equal(bad({ pace: 'turbo' }), false);
  const { pace, ...older } = saved; assert.equal(new CakeTowerGame().restore(older), true, 'saves without a pace load as Normal');
});

test('Cake Tower renderer draws idle, swinging, falling and toppled states', () => {
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new CakeTowerGame({ random: () => .5 });
  drawCakeTower(canvas, g, {}); g.start(); drawCakeTower(canvas, g, {}); g.release(); g.update(.05); drawCakeTower(canvas, g, {});
  g.finish('topple'); drawCakeTower(canvas, g, {});
  assert.ok(text.includes('IT TOPPLED!')); assert.ok(text.includes('CAKE TOWER'));
});
