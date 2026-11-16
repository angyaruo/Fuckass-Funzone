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

test('Cake Tower sloppy drops wobble, misses cost hearts, and only misses end the run', () => {
  const events = [], g = new CakeTowerGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  dropAt(g, 180); g.swayPhase = 0;
  dropAt(g, g.topX() + 40); assert.equal(g.combo, 0); assert.ok(g.sway > 5); assert.equal(g.tiers.length, 2);
  // Landing is judged against the swaying top at that moment, so these tiers are placed directly.
  const place = dx => { g.drop = { x: g.topX() + dx, y: 0, vx: 0, vy: 0, flavor: g.flavor }; g.land(g.drop.x); };
  for (let i = 0; i < 6; i++) place(i % 2 ? -45 : 45);
  assert.equal(g.tiers.length, 8, 'a wobbly cake keeps every tier it caught'); assert.equal(g.hearts, 3);
  assert.ok(g.sway <= 34, 'sway is capped, so wobble only makes aiming harder'); assert.ok(events.includes('wobble'));
  for (let i = 0; i < 3; i++) dropAt(g, g.topX() + LAYER_W * 2);
  assert.equal(g.hearts, 0); assert.equal(g.status, 'dead'); assert.equal(g.endReason, 'miss');
  assert.equal(events.filter(e => e === 'miss').length, 3); assert.ok(events.includes('death'));
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

test('Cake Tower renderer draws idle, swinging, falling and finished states', () => {
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new CakeTowerGame({ random: () => .5 });
  drawCakeTower(canvas, g, {}); g.start(); drawCakeTower(canvas, g, {}); g.release(); g.update(.05); drawCakeTower(canvas, g, {});
  g.finish('miss'); drawCakeTower(canvas, g, {});
  assert.ok(text.includes('OUT OF CAKE')); assert.ok(text.includes('CAKE TOWER')); assert.ok(!text.includes('IT TOPPLED!'));
});

test('Cake Tower: a tier stays only over its support, misses tumble off screen gently, and the rope swings on a pendulum', () => {
  const g = new CakeTowerGame({ random: () => .5 }); g.start();
  dropAt(g, 180 + 80); assert.equal(g.tiers.length, 0, 'a first tier centered past the plate edge falls off'); assert.equal(g.hearts, 2);
  dropAt(g, 180 + 70); assert.equal(g.tiers.length, 1, 'a first tier centered over the plate stays');
  g.phase = 'swing'; g.release(); g.drop.x = g.topX() + 80; g.drop.vx = 0;
  let maxTilt = 0;
  for (let i = 0; i < 240; i++) { g.update(1 / 60); for (const c of g.crumbs) maxTilt = Math.max(maxTilt, Math.abs(c.spin)); }
  assert.equal(g.hearts, 1); assert.equal(g.crumbs.length, 0, 'the missed tier has fallen off the bottom of the screen');
  assert.ok(maxTilt < 1.2, `a missed tier tips gently and never flips over (max ${maxTilt.toFixed(2)} rad)`);
  const p = new CakeTowerGame({ random: () => .5 }), points = [];
  for (const swing of [0, Math.PI / 2, Math.PI * 1.5]) { p.swing = swing; points.push([p.hookX(), p.hookY()]); }
  assert.deepEqual(points.map(([x]) => Math.round(x)), [180, 298, 62], 'the hook swings 118 pixels each way');
  assert.ok(points[1][1] < points[0][1] && Math.abs(points[1][1] - points[2][1]) < 1e-9, 'the hook rises equally at both ends of its arc');
});
