import test from 'node:test';
import assert from 'node:assert/strict';
import { FroggyGame, FROGGY_HOME_COLUMNS } from '../src/froggy.js';
import { drawFroggy, froggyControlAt } from '../src/froggy-render.js';

const create = () => new FroggyGame({ random: () => .5 });
const hopReady = game => { game.hopCooldown = 0; };

test('Froggy starts safely and accepts only bounded, playing-state hops', () => {
  const game = create();
  assert.equal(game.hop('up'), false); assert.equal(game.lives, 3);
  game.start(); assert.equal(game.hop('left'), true); assert.deepEqual(game.frog, { x: 3, y: 10 });
  assert.equal(game.hop('left'), false, 'cooldown prevents a held input from jumping across the field');
  hopReady(game); game.frog.x = 0;
  assert.equal(game.hop('left'), false); assert.equal(game.hop('banana'), false); assert.equal(game.hop('__proto__'), false);
  assert.equal(game.hop('down'), false);
  game.pause(); assert.equal(game.hop('right'), false);
});

test('only fresh forward progress scores; hopping back and forth cannot farm points', () => {
  const game = create(); game.start();
  for (const lane of game.lanes.filter(lane => lane.type === 'road')) lane.offset = 2;
  game.hop('up'); assert.equal(game.score, 10); assert.equal(game.frog.y, 9);
  hopReady(game); game.hop('down'); hopReady(game); game.hop('up'); assert.equal(game.score, 10);
  hopReady(game); game.hop('up'); assert.equal(game.score, 20);
});

test('traffic consumes one life, resets to the bank, then ends at zero lives', () => {
  const events = [], game = new FroggyGame({ random: () => .5, onEvent: (name, detail) => events.push([name, detail]) });
  game.start(); game.lanes.find(lane => lane.row === 9).offset = .4;
  for (let i = 0; i < 3; i++) {
    hopReady(game); assert.equal(game.hop('up'), true);
    assert.equal(game.lives, 2 - i); assert.deepEqual(game.frog, { x: 4, y: 10 });
  }
  assert.equal(game.status, 'dead'); assert.equal(game.score, 0);
  assert.equal(events.filter(([name]) => name === 'death').length, 1);
  game.update(1); assert.equal(game.lives, 0);
  game.start(); assert.equal(game.lives, 3); assert.equal(game.status, 'playing');
});

test('river logs carry the frog and uncovered water drowns it', () => {
  const game = create(); game.start(); const lane = game.lanes.find(lane => lane.row === 4);
  lane.offset = 0; game.frog = { x: 3.9, y: 4 }; game.progressRow = 4;
  game.update(.1);
  assert.ok(Math.abs(game.frog.x - (3.9 + lane.speed * .1)) < 1e-9);
  assert.equal(game.lives, 3);
  game.frog = { x: 1.9, y: 4 }; game.update(.01);
  assert.equal(game.lives, 2); assert.equal(game.message, 'SPLASH');
});

test('a log can carry a frog off the edge; oversized time steps stay bounded', () => {
  const game = create(); game.start(); const lane = game.lanes.find(lane => lane.row === 1);
  lane.offset = .95; game.frog = { x: 8.24, y: 1 }; game.progressRow = 1;
  game.update(100); assert.equal(game.lives, 2); assert.equal(game.message, 'SWEPT AWAY');
  assert.equal(game.elapsed, .12);
});

test('homes are unique, invalid home gaps cost a life, and five homes advance the pond', () => {
  const game = create(); game.start();
  game.frog = { x: 0, y: 1 }; game.progressRow = 1;
  game.hop('up'); assert.equal(game.homes[0], true); assert.equal(game.score, 150);
  hopReady(game); game.frog = { x: 0, y: 1 }; game.progressRow = 1;
  game.hop('up'); assert.equal(game.lives, 2); assert.equal(game.score, 150);
  hopReady(game); game.frog = { x: 1, y: 1 }; game.progressRow = 1;
  game.hop('up'); assert.equal(game.lives, 1); assert.equal(game.message, 'MISSED THE LILY');
  game.homes = [true, true, true, true, false];
  hopReady(game); game.frog = { x: FROGGY_HOME_COLUMNS[4], y: 1 }; game.progressRow = 1;
  game.hop('up'); assert.equal(game.level, 2); assert.equal(game.score, 600);
  assert.deepEqual(game.homes, [false, false, false, false, false]);
  assert.equal(game.lanes[0].speed, .65 * 1.09);
});

test('pause freezes all motion and restore preserves lanes and progress without auto-playing', () => {
  const game = create(); game.start(); game.hop('left'); game.update(.1); game.pause();
  const before = game.snapshot(); game.update(.1); assert.deepEqual(game.snapshot(), before);
  const restored = new FroggyGame({ saved: before, random: () => .1 });
  assert.equal(restored.status, 'paused'); assert.deepEqual(restored.snapshot(), before);
  restored.start(); restored.update(.1); assert.notEqual(restored.lanes[0].offset, before.lanes[0].offset);
  game.update(NaN); game.update(-1); assert.deepEqual(game.snapshot(), before);
});

test('score, home and death observers always see a restorable snapshot', () => {
  let game;
  game = new FroggyGame({ random: () => .5, onEvent: event => {
    if (!game || !['score', 'home', 'level', 'hit', 'death'].includes(event)) return;
    const verifier = create(); assert.equal(verifier.restore(game.snapshot()), true, `${event} exposes coherent save state`);
  } });
  game.start(); game.homes = [true, true, true, true, false]; game.frog = { x: 8, y: 1 }; game.progressRow = 1;
  game.hop('up');
  game.lives = 1; game.lanes.find(lane => lane.row === 9).offset = .4; hopReady(game); game.hop('up');
});

test('corrupt saves are rejected without mutating a valid run', () => {
  const game = create(), before = game.snapshot();
  const corrupt = [null, {}, { ...before, frog: { x: Infinity, y: 10 } }, { ...before, lives: 0 },
    { ...before, homes: Array(5).fill(true) }, { ...before, homes: [false, false] },
    { ...before, lanes: before.lanes.map((lane, i) => i ? lane : { ...lane, speed: 200 }) },
    { ...before, score: -10 }, { ...before, frog: { x: 4, y: 1 }, progressRow: 10 }];
  for (const save of corrupt) { assert.equal(game.restore(save), false); assert.deepEqual(game.snapshot(), before); }
  const sparse = structuredClone(before); delete sparse.homes[1];
  assert.equal(game.restore(sparse), false); assert.deepEqual(game.snapshot(), before);
});

test('touch controls have distinct hit areas and render every state inside the cabinet', () => {
  assert.equal(froggyControlAt(60, 424), 'left'); assert.equal(froggyControlAt(140, 424), 'up');
  assert.equal(froggyControlAt(220, 424), 'down'); assert.equal(froggyControlAt(300, 424), 'right');
  assert.equal(froggyControlAt(100, 424), null); assert.equal(froggyControlAt(60, 390), null);
  assert.equal(froggyControlAt(NaN, 424), null);
  const text = [], transforms = [], ctx = new Proxy({}, { get(target, key) {
    if (key === 'fillText') return value => text.push(String(value));
    if (key === 'setTransform') return (...values) => transforms.push(values);
    return target[key] || (() => {});
  }, set(target, key, value) { target[key] = value; return true; } });
  const game = create(), canvas = { width: 720, height: 904, getContext: () => ctx };
  for (const status of ['idle', 'playing', 'paused', 'dead']) { game.status = status; drawFroggy(canvas, game, { best: 500, reduced: true }); }
  assert.ok(text.includes('FROGGY')); assert.ok(text.includes('BEST 500')); assert.ok(text.includes('OUT OF HOPS'));
  assert.deepEqual(transforms[0], [2, 0, 0, 2, 0, 0], 'fills the actual high-DPI cabinet canvas');
});
